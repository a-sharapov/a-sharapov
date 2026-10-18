import { beforeEach, describe, expect, it } from 'bun:test';
import {
  defineHandlers,
  type MessageContext,
  parseCommand,
} from '../assets/handlers';
import { LOCALES } from '../l18n';
import { defineRepo, IN_MEMORY, openDatabase, type Repo } from '../repo';

var _KEYS = ['alpha-key', 'beta-key'];

describe('parseCommand', () => {
  it('отбрасывает имя бота и аргументы', () => {
    expect(parseCommand('/last@my_bot')).toBe('/last');
    expect(parseCommand('  /help extra ')).toBe('/help');
    expect(parseCommand('')).toBe('');
  });
});

describe('обработка сообщений', () => {
  let repo: Repo;
  let replies: string[];
  let handlers: ReturnType<typeof defineHandlers>;

  const _ctx = (
    text: string,
    from: MessageContext['from'] = { language_code: 'ru', username: 'boss' },
    chatId = 42
  ): MessageContext => ({
    chatId,
    text,
    from,
    reply: (_) => ((replies = [...replies, _]), Promise.resolve()),
  });

  beforeEach(() => {
    repo = defineRepo(openDatabase(IN_MEMORY));
    replies = [];
    handlers = defineHandlers({
      repo,
      managerTokens: _KEYS,
      limit: 2,
      log: () => {},
    });
  });

  it('/start — приветствие на языке пользователя', async () => {
    await handlers.onMessage(
      _ctx('/start', { language_code: 'en-US', first_name: 'Ann' })
    );
    expect(replies).toEqual([LOCALES.en.GREETING('Ann')]);
  });

  it('ключ доступа подписывает чат', async () => {
    await handlers.onMessage(_ctx(' beta-key '));
    expect(repo.chats.ids()).toEqual([42]);
    expect(replies).toEqual([LOCALES.ru.SUCCESS_REPLY]);
  });

  it('неверный ключ — отказ без подписки', async () => {
    await handlers.onMessage(_ctx('gamma-key'));
    await handlers.onMessage(_ctx(''));
    expect(repo.chats.ids()).toEqual([]);
    expect(replies).toEqual([LOCALES.ru.ERROR_REPLY, LOCALES.ru.ERROR_REPLY]);
  });

  it('без настроенных ключей подписка невозможна', async () => {
    const closed = defineHandlers({ repo, managerTokens: [], log: () => {} });
    await closed.onMessage(_ctx('alpha-key'));
    expect(repo.chats.ids()).toEqual([]);
    expect(replies).toEqual([LOCALES.ru.ERROR_REPLY]);
  });

  it('бот-отправитель получает отказ', async () => {
    await handlers.onMessage(
      _ctx('alpha-key', { is_bot: true, language_code: 'en' })
    );
    expect(repo.chats.ids()).toEqual([]);
    expect(replies).toEqual([LOCALES.en.CAN_NOT_REPLY]);
  });

  it('/last и /all — только для подписчиков', async () => {
    await handlers.onMessage(_ctx('/last'));
    await handlers.onMessage(_ctx('/all'));
    expect(replies).toEqual([LOCALES.ru.ERROR_REPLY, LOCALES.ru.ERROR_REPLY]);
  });

  it('/last — последние N, /all — все', async () => {
    repo.chats.add(42, 'boss');
    ['one', 'two', 'three'].forEach((_) => {
      repo.messages.add(_);
    });
    await handlers.onMessage(_ctx('/last'));
    await handlers.onMessage(_ctx('/all@my_bot'));
    expect(replies).toEqual([
      'three\n\n----\n\ntwo',
      'three\n\n----\n\ntwo\n\n----\n\none',
    ]);
  });

  it('/last без сообщений — пустой ответ', async () => {
    repo.chats.add(42, 'boss');
    await handlers.onMessage(_ctx('/last'));
    expect(replies).toEqual([LOCALES.ru.EMPTY_REPLY]);
  });

  it('/all режет длинную историю на сообщения в пределах лимита Telegram', async () => {
    repo.chats.add(42, 'boss');
    Array.from({ length: 5 }, () => repo.messages.add('x'.repeat(3000)));
    await handlers.onMessage(_ctx('/all'));
    expect(replies).toHaveLength(5);
    expect(replies.every((_) => _.length <= 4096)).toBe(true);
  });

  it('/unsubscribe — отписывает текущий чат', async () => {
    repo.chats.add(42, 'boss');
    repo.chats.add(7, 'other');
    await handlers.onMessage(_ctx('/unsubscribe'));
    expect(repo.chats.ids()).toEqual([7]);
    expect(replies).toEqual([LOCALES.ru.UNSUBSCRIBE_REPLY]);
  });

  it('/help — список команд с лимитом', async () => {
    await handlers.onMessage(_ctx('/help'));
    expect(replies).toEqual([LOCALES.ru.HELP(2)]);
  });

  it('имена из Object.prototype — не команды', async () => {
    await handlers.onMessage(_ctx('constructor'));
    expect(replies).toEqual([LOCALES.ru.ERROR_REPLY]);
  });
});
