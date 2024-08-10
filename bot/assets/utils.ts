import { readableStreamToJSON } from "bun";
import type { Telegraf } from "telegraf";
import { getAllChats, insertChat, removeChatByUsername } from "../repo";
import DICTIONARY, {
  AVAILABLE_LOCALES,
  DEFAULT_LOCALE,
  LOCALES,
} from "./dictionary";

export var createDictionary = (locale: string) =>
  LOCALES[
    (locale in AVAILABLE_LOCALES
      ? locale
      : DEFAULT_LOCALE) as keyof typeof LOCALES
  ];

export var pipe =
  (...fns: Function[]) =>
  (arg: any) =>
    fns.reduce(
      (acc, fn) => (fn instanceof Promise ? fn.then(acc) : fn(acc)),
      arg
    );

export var getTimeStamp = () =>
  `[${new Date().toLocaleString(DEFAULT_LOCALE)}]`;

export var sendPersistedMessage = async (
  ctx: any,
  method: any,
  args: unknown[]
): Promise<void> => {
  try {
    const message =
      method instanceof Function ? method?.immediate?.(...args) : void 0;
    message && (await ctx.reply(message));
  } catch {
    await ctx.reply(
      createDictionary(ctx.session?.locale || DEFAULT_LOCALE).EMPTY_REPLY
    );
  }
};

export var unsubscribe = async (ctx: any): Promise<void> => {
  try {
    removeChatByUsername.immediate(ctx.message.from.username);
    await ctx.reply(
      createDictionary(ctx.session?.locale || DEFAULT_LOCALE).UNSUBSCRIBE_REPLY
    );
  } catch {
    await ctx.reply(
      createDictionary(ctx.session?.locale || DEFAULT_LOCALE).ERROR_REPLY
    );
  }
};

export var handleAuth = async (ctx: any, TIMESTAMP: string): Promise<void> => {
  ctx.session?.messages.push(ctx.message.text);
  ctx.session.isAuth = true;
  insertChat.immediate(ctx.message.chat.id, ctx.message.from.username);
  console.log(
    `${TIMESTAMP} ${DICTIONARY.NEW_AUTH} ${ctx.from.first_name} ${ctx.from.last_name}`
  );
  await ctx.reply(
    createDictionary(ctx.session?.locale || DEFAULT_LOCALE).SUCCESS_REPLY
  );
};

export var sendToAllChats = (bot: Telegraf, message: string) =>
  void (getAllChats.immediate() as unknown as number[]).forEach(
    (chatId: number) => {
      bot.telegram.sendMessage(chatId, message);
    }
  );

export var logRequest = (REQUEST: string, message: string, data?: any) =>
  void console.log(`${getTimeStamp()}`, message, data || "", REQUEST);

export var extractBody = async (payload: any) =>
  await readableStreamToJSON(payload.body as ReadableStream);
