import { readableStreamToJSON } from "bun";
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
} from "./constants";
import { MESSAGE_ENDPOINT, UNSUBSCRIBE_ENDPOINT } from "./endpoints";
import {
  createDictionary,
  getTimeStamp,
  handleAuth,
  sendPersistedMessage,
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
  const logRequest = (message: string, data?: any) =>
    void console.log(`${getTimeStamp()}`, message, data || "", REQUEST);

  switch (REQUEST) {
    case UNSUBSCRIBE_ENDPOINT:
      const { username } = await readableStreamToJSON(
        payload.body as ReadableStream
      );

      logRequest(DICTIONARY.UNSUBSCRIBE_REQUEST, username);

      removeChatByUsername.deferred(username);

      status = 200;
      response.message = "OK";
      break;

    case MESSAGE_ENDPOINT:
      const { message } = await readableStreamToJSON(
        payload.body as ReadableStream
      );

      logRequest(DICTIONARY.NEW_MESSAGE_REQUEST);

      insertMessage.deferred(message);
      if (bot) {
        const activeChats = getAllChats.immediate() as unknown as number[];
        activeChats.forEach((chatId: number) => {
          bot.telegram.sendMessage(chatId, message);
        });
      }

      status = 200;
      response.message = "OK";
      break;
  }

  return { status, response };
};

export var attachBotHandlers = (bot: Telegraf) => {
  bot.use(session());
  bot.on("message", async (ctx: any): Promise<void> => {
    var reactOnMessage = async (ctx: any): Promise<void> => {
      const DICTIONARY = createDictionary(
        ctx.session?.locale || DEFAULT_LOCALE
      );
      const chats = getAllChats.immediate() as unknown as number[];

      switch (ctx.message.text) {
        case "/help":
          await ctx.reply(DICTIONARY.AVAILABLE_OPERATIONS(LIMIT));
          break;

        case "/last":
          await (chats.includes(ctx.message.chat.id)
            ? sendPersistedMessage(ctx, getLastMessages, [LIMIT, LINE_JOINER])
            : ctx.reply(DICTIONARY.ERROR_REPLY));
          break;

        case "/all":
          await (chats.includes(ctx.message.chat.id)
            ? sendPersistedMessage(ctx, getAllMessages, [LINE_JOINER])
            : ctx.reply(DICTIONARY.ERROR_REPLY));
          break;

        case "/unsubscribe":
          await (chats.includes(ctx.message.chat.id)
            ? unsubscribe(ctx)
            : ctx.reply(DICTIONARY.ERROR_REPLY));
          break;

        case "/start":
          ctx.session = INITIAL_SESSION;
          await ctx.reply(DICTIONARY.INITIALIZE_SESSION(ctx));
          break;

        default:
          const isAuthComplete =
            MANAGER_TOKENS &&
            Array.isArray(MANAGER_TOKENS) &&
            MANAGER_TOKENS?.includes(ctx.message.text);

          await (isAuthComplete
            ? handleAuth(ctx, getTimeStamp())
            : ctx.reply(DICTIONARY.ERROR_REPLY));

          break;
      }
    };

    await (ctx.from.is_bot
      ? ctx.reply(createDictionary(ctx.from.language_code).CAN_NOT_REPLY)
      : reactOnMessage(ctx));
  });
};
