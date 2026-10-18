import { beforeEach, describe, expect, it } from 'bun:test';
import { defineNotify, type TelegramSender } from '../assets/notify';
import { chunkParts } from '../assets/utils';
import { defineRepo, IN_MEMORY, openDatabase, type Repo } from '../repo';

describe('chunkParts', () => {
  it('склеивает части, пока влезают в лимит', () => {
    expect(chunkParts(['aa', 'bb', 'cc'], '|', 5)).toEqual(['aa|bb', 'cc']);
  });

  it('режет часть длиннее лимита', () => {
    expect(chunkParts(['abcdefg'], '', 3)).toEqual(['abc', 'def', 'g']);
  });

  it('пустой вход — пустой выход', () => {
    expect(chunkParts([], '|', 5)).toEqual([]);
  });
});

describe('рассылка', () => {
  let repo: Repo;
  let sent: Array<[number, string]>;

  const _telegram = (fail: (chatId: number, attempt: number) => unknown) => {
    const attempts = new Map<number, number>();
    return {
      sendMessage: (chatId: number, text: string) =>
        ((attempt) => (
          attempts.set(chatId, attempt),
          ((error) =>
            error
              ? Promise.reject(error)
              : ((sent = [...sent, [chatId, text]]), Promise.resolve()))(
            fail(chatId, attempt)
          )
        ))((attempts.get(chatId) ?? 0) + 1),
    } satisfies TelegramSender;
  };

  beforeEach(() => {
    repo = defineRepo(openDatabase(IN_MEMORY));
    sent = [];
  });

  it('во все подписанные чаты', async () => {
    repo.chats.add(1, 'a');
    repo.chats.add(2, 'b');
    const notify = defineNotify({
      repo,
      telegram: _telegram(() => null),
      log: () => {},
    });
    expect(await notify('hello')).toEqual({ sent: 2, failed: 0 });
    expect(sent).toEqual([
      [1, 'hello'],
      [2, 'hello'],
    ]);
  });

  it('ошибка одного чата не мешает остальным', async () => {
    repo.chats.add(1, 'a');
    repo.chats.add(2, 'b');
    const notify = defineNotify({
      repo,
      telegram: _telegram((chatId) =>
        chatId === 1 ? new Error('blocked') : null
      ),
      log: () => {},
    });
    expect(await notify('hello')).toEqual({ sent: 1, failed: 1 });
    expect(sent).toEqual([[2, 'hello']]);
  });

  it('429 — ждёт retry_after и повторяет', async () => {
    repo.chats.add(1, 'a');
    let waited: number[] = [];
    const notify = defineNotify({
      repo,
      telegram: _telegram((_, attempt) =>
        attempt === 1
          ? { response: { error_code: 429, parameters: { retry_after: 2 } } }
          : null
      ),
      sleep: (ms) => ((waited = [...waited, ms]), Promise.resolve()),
      log: () => {},
    });
    expect(await notify('hello')).toEqual({ sent: 1, failed: 0 });
    expect(waited).toEqual([2000]);
  });

  it('длинное сообщение уходит частями', async () => {
    repo.chats.add(1, 'a');
    const notify = defineNotify({
      repo,
      telegram: _telegram(() => null),
      log: () => {},
    });
    await notify('x'.repeat(5000));
    expect(sent.map(({ 1: text }) => text.length)).toEqual([4096, 904]);
  });

  it('без подписчиков — пустой отчёт', async () => {
    const notify = defineNotify({
      repo,
      telegram: _telegram(() => null),
      log: () => {},
    });
    expect(await notify('hello')).toEqual({ sent: 0, failed: 0 });
  });
});
