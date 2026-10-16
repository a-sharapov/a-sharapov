import type { Telegraf } from 'telegraf';
import { type Dictionary, selectDictionary } from '../l18n';
import type { Repo } from '../repo';
import { tokensMatch } from './auth';
import { LIMIT, LINE_JOINER, MAX_MESSAGE_LENGTH } from './constants';
import { chunkParts, log as defaultLog, errorMessage, type Log } from './utils';

export type MessageContext = {
  chatId: number;
  text: string;
  from?: {
    is_bot?: boolean;
    language_code?: string;
    first_name?: string;
    username?: string;
  };
  reply: (text: string) => Promise<unknown>;
};

type Command = (
  ctx: MessageContext,
  dictionary: Dictionary
) => Promise<unknown>;

type HandlersDeps = {
  repo: Repo;
  managerTokens: string[];
  limit?: number;
  log?: Log;
};

export var parseCommand = (text: string): string =>
  ((word) => word.split('@')[0] ?? '')(text.trim().split(/\s+/)[0] ?? '');

export var defineHandlers = ({
  repo,
  managerTokens,
  limit = LIMIT,
  log = defaultLog,
}: HandlersDeps) => {
  const _isManagerKey = (text: string): boolean =>
    managerTokens.reduce<boolean>(
      (found, key) => tokensMatch(text, key) || found,
      false
    );

  const _replyMessages = (
    ctx: MessageContext,
    dictionary: Dictionary,
    messages: string[]
  ): Promise<unknown> =>
    messages.length
      ? chunkParts(messages, LINE_JOINER, MAX_MESSAGE_LENGTH).reduce<
          Promise<unknown>
        >(
          (chain, chunk) => chain.then(() => ctx.reply(chunk)),
          Promise.resolve()
        )
      : ctx.reply(dictionary.EMPTY_REPLY);

  const _subscribersOnly =
    (command: Command): Command =>
    (ctx, dictionary) =>
      repo.chats.has(ctx.chatId)
        ? command(ctx, dictionary)
        : ctx.reply(dictionary.ERROR_REPLY);

  const _subscribe: Command = (ctx, dictionary) => (
    repo.chats.add(ctx.chatId, ctx.from?.username),
    log(`subscribed chat=${ctx.chatId} @${ctx.from?.username ?? '-'}`),
    ctx.reply(dictionary.SUCCESS_REPLY)
  );

  const _unsubscribe: Command = (ctx, dictionary) => (
    repo.chats.remove(ctx.chatId),
    log(`unsubscribed chat=${ctx.chatId}`),
    ctx.reply(dictionary.UNSUBSCRIBE_REPLY)
  );

  const commands: Record<string, Command> = {
    '/start': (ctx, dictionary) =>
      ctx.reply(dictionary.GREETING(ctx.from?.first_name)),
    '/help': (ctx, dictionary) => ctx.reply(dictionary.HELP(limit)),
    '/last': _subscribersOnly((ctx, dictionary) =>
      _replyMessages(ctx, dictionary, repo.messages.last(limit))
    ),
    '/all': _subscribersOnly((ctx, dictionary) =>
      _replyMessages(ctx, dictionary, repo.messages.all())
    ),
    '/unsubscribe': _subscribersOnly(_unsubscribe),
    _: (ctx, dictionary) =>
      _isManagerKey(ctx.text.trim())
        ? _subscribe(ctx, dictionary)
        : ctx.reply(dictionary.ERROR_REPLY),
  };

  const _command = (text: string): Command =>
    ((name) => (Object.hasOwn(commands, name) ? commands[name] : commands._))(
      parseCommand(text)
    );

  const onMessage = (ctx: MessageContext): Promise<unknown> =>
    ((dictionary) =>
      ctx.from?.is_bot
        ? ctx.reply(dictionary.CAN_NOT_REPLY)
        : _command(ctx.text)(ctx, dictionary))(
      selectDictionary(ctx.from?.language_code)
    );

  const attach = (bot: Telegraf): Telegraf =>
    bot
      .on('message', (ctx) =>
        onMessage({
          chatId: ctx.chat.id,
          text: 'text' in ctx.message ? ctx.message.text : '',
          from: ctx.from,
          reply: (text) => ctx.reply(text),
        })
      )
      .catch((error, ctx) =>
        log(`bot error update=${ctx.updateType}:`, errorMessage(error))
      );

  return { onMessage, attach };
};
