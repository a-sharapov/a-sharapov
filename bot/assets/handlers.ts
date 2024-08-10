import { session, type Telegraf } from "telegraf";
import {
  getAllChats,
  getAllMessages,
  getLastMessages,
  insertMessage,
  removeChatByUsername,
} from "../repo";
import { DEFAULT_LOCALE } from "./../l18n/index";
import {
  INITIAL_SESSION,
  LIMIT,
  LINE_JOINER,
  MANAGER_TOKENS,
  OK,
} from "./constants";
import { MESSAGE_ENDPOINT, UNSUBSCRIBE_ENDPOINT } from "./endpoints";
import {
  createDictionary,
  extractBody,
  getTimeStamp,
  handleAuth,
  logRequest,
  sendPersistedMessage,
  sendToAllChats,
  unsubscribe,
} from "./utils";

interface Payload {
  path: string;
  method: string;
  body?: unknown;
  bot?: Telegraf;
}

export var handleServiceRequest = async (
  payload: Payload
): Promise<{
  status: number;
  response: { message: string };
}> => {
  const { path, method, bot } = payload;
  const REQUEST = `${method}:${new URL(path).pathname}`;
  const DICTIONARY = createDictionary(DEFAULT_LOCALE);
  let status = 404;
  let response = {
    message: DICTIONARY.NOT_FOUND,
  };

  switch (REQUEST) {
    case UNSUBSCRIBE_ENDPOINT:
      const { username } = await extractBody(payload);

      logRequest(REQUEST, DICTIONARY.UNSUBSCRIBE_REQUEST, username);
      void removeChatByUsername.deferred(username);

      status = 200;
      response.message = OK.description as string;
      break;

    case MESSAGE_ENDPOINT:
      const { message } = await extractBody(payload);

      logRequest(REQUEST, DICTIONARY.NEW_MESSAGE_REQUEST);
      insertMessage.deferred(message);
      bot && sendToAllChats(bot, message);

      status = 200;
      response.message = OK.description as string;
      break;
  }

  return { status, response };
};

const createCommandHandler = (
  ctx: any,
  chats: number[],
  DICTIONARY: Record<string, any>
) => ({
  "/help": async () => await ctx.reply(DICTIONARY.AVAILABLE_OPERATIONS(LIMIT)),
  "/last": async () =>
    await (chats.includes(ctx.message.chat.id)
      ? sendPersistedMessage(ctx, getLastMessages, [LIMIT, LINE_JOINER])
      : ctx.reply(DICTIONARY.ERROR_REPLY)),
  "/all": async () =>
    await (chats.includes(ctx.message.chat.id)
      ? sendPersistedMessage(ctx, getAllMessages, [LINE_JOINER])
      : ctx.reply(DICTIONARY.ERROR_REPLY)),
  "/unsubscribe": async () =>
    await (chats.includes(ctx.message.chat.id)
      ? unsubscribe(ctx)
      : ctx.reply(DICTIONARY.ERROR_REPLY)),
  "/start": async () =>
    (ctx.session = INITIAL_SESSION) &&
    (await ctx.reply(DICTIONARY.INITIALIZE_SESSION(ctx))),
});

const reactOnMessage = async (ctx: any): Promise<void> => {
  const DICTIONARY = createDictionary(ctx.session?.locale || DEFAULT_LOCALE);
  const chats = getAllChats.immediate() as unknown as number[];
  const knownCommands = createCommandHandler(ctx, chats, DICTIONARY);

  if (ctx.message.text in knownCommands) {
    void (await knownCommands[
      ctx.message.text as keyof typeof knownCommands
    ]());
  } else {
    const isAuthComplete =
      MANAGER_TOKENS &&
      Array.isArray(MANAGER_TOKENS) &&
      MANAGER_TOKENS?.includes(ctx.message.text);

    void (await (isAuthComplete
      ? handleAuth(ctx, getTimeStamp())
      : ctx.reply(DICTIONARY.ERROR_REPLY)));
  }
};

export var attachBotHandlers = (bot: Telegraf) =>
  bot
    .use(session())
    .on(
      "message",
      async (ctx: any): Promise<void> =>
        await (ctx.from.is_bot
          ? ctx.reply(createDictionary(ctx.from.language_code).CAN_NOT_REPLY)
          : reactOnMessage(ctx))
    );
