import { readableStreamToJSON } from "bun";
import { session, type Telegraf } from "telegraf";
import {
  getAllChats,
  getAllMessages,
  getLastMessages,
  insertMessage,
} from "../repo";
import { AVAILABLE_LOCALES, DEFAULT_LOCALE } from "./../l18n/index";
import {
  INITIAL_SESSION,
  LIMIT,
  LINE_JOINER,
  MANAGER_TOKENS,
} from "./constants";
import { LOCALES } from "./dictionary";
import { MESSAGE_ENDPOINT } from "./endpoints";
import { getTimeStamp, handleAuth, sendPersistedMessage } from "./utils";

const createDictionary = (locale: string) =>
  LOCALES[
    (locale in AVAILABLE_LOCALES
      ? locale
      : DEFAULT_LOCALE) as keyof typeof LOCALES
  ];

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

  console.log(`${getTimeStamp()} ${DICTIONARY.NEW_MESSAGE_REQUEST}`, REQUEST);

  switch (REQUEST) {
    case MESSAGE_ENDPOINT:
      const { message } = await readableStreamToJSON(
        payload.body as ReadableStream
      );

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
