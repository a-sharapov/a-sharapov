import { readableStreamToJSON } from "bun";
import { session, type Telegraf } from "telegraf";
import { getAllMessages, getLastMessages, insertMessage } from "../repo";
import {
  ACTIVE_CHATS,
  INITIAL_SESSION,
  LIMIT,
  LINE_JOINER,
  MANAGER_TOKENS,
} from "./constants";
import DICTIONARY from "./dictionary";
import { MESSAGE_ENDPOINT } from "./endpoints";
import { getTimeStamp, handleAuth, sendPersistedMessage } from "./utils";

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
      bot &&
        [...ACTIVE_CHATS].forEach((chatId) => {
          bot.telegram.sendMessage(chatId, message);
        });

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
      switch (ctx.message.text) {
        case "/help":
          await ctx.reply(DICTIONARY.AVAILABLE_OPERATIONS(LIMIT));
          break;

        case "/last":
          await (ACTIVE_CHATS.has(ctx.message.chat.id)
            ? sendPersistedMessage(ctx, getLastMessages, [LIMIT, LINE_JOINER])
            : ctx.reply(DICTIONARY.ERROR_REPLY));
          break;

        case "/all":
          await (ACTIVE_CHATS.has(ctx.message.chat.id)
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
            ? handleAuth(ctx, ACTIVE_CHATS, getTimeStamp())
            : ctx.reply(DICTIONARY.ERROR_REPLY));

          break;
      }
    };

    await (ctx.from.is_bot
      ? ctx.reply(DICTIONARY.CAN_NOT_REPLY)
      : reactOnMessage(ctx));
  });
};
