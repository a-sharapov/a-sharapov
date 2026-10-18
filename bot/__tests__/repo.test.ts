import { Database } from 'bun:sqlite';
import { beforeEach, describe, expect, it } from 'bun:test';
import { defineRepo, IN_MEMORY, openDatabase, type Repo } from '../repo';

describe('repo: chats', () => {
  let repo: Repo;

  beforeEach(() => {
    repo = defineRepo(openDatabase(IN_MEMORY));
  });

  it('повторная подписка не падает и обновляет username', () => {
    repo.chats.add(10, 'old');
    repo.chats.add(10, 'new');
    expect(repo.chats.ids()).toEqual([10]);
    expect(repo.chats.removeByUsername('old')).toBe(0);
    expect(repo.chats.removeByUsername('NEW')).toBe(1);
    expect(repo.chats.ids()).toEqual([]);
  });

  it('подписка без username', () => {
    repo.chats.add(-100500);
    expect(repo.chats.has(-100500)).toBe(true);
    expect(repo.chats.has(1)).toBe(false);
  });

  it('отписка по chat_id', () => {
    repo.chats.add(1, 'a');
    repo.chats.add(2, 'b');
    expect(repo.chats.remove(1)).toBe(1);
    expect(repo.chats.remove(1)).toBe(0);
    expect(repo.chats.ids()).toEqual([2]);
  });
});

describe('repo: messages', () => {
  let repo: Repo;

  beforeEach(() => {
    repo = defineRepo(openDatabase(IN_MEMORY));
    ['one', 'two', 'three'].forEach((_) => {
      repo.messages.add(_);
    });
  });

  it('last — новые первыми, LIMIT параметром', () => {
    expect(repo.messages.last(2)).toEqual(['three', 'two']);
    expect(repo.messages.last(10)).toEqual(['three', 'two', 'one']);
  });

  it('last — некорректный limit не ломает запрос', () => {
    expect(repo.messages.last(0)).toEqual([]);
    expect(repo.messages.last(-5)).toEqual([]);
    expect(repo.messages.last(Number.NaN)).toEqual([]);
    expect(repo.messages.last('1; DROP TABLE messages' as never)).toEqual([]);
    expect(repo.messages.all()).toHaveLength(3);
  });

  it('сообщения в одну миллисекунду не конфликтуют по ключу', () => {
    Array.from({ length: 50 }, (_, index) => repo.messages.add(`m${index}`));
    expect(repo.messages.all()).toHaveLength(53);
  });

  it('старше срока хранения — удаляются и не отдаются', () => {
    const db = openDatabase(IN_MEMORY);
    const repo = defineRepo(db);
    repo.messages.add('fresh');
    db.run(
      "INSERT INTO messages (message, created_at) VALUES ('stale', datetime('now', '-13 months')), ('kept', datetime('now', '-11 months'))"
    );
    expect(repo.messages.all()).toEqual(['kept', 'fresh']);
    expect(repo.messages.prune()).toBe(0);
    expect(db.query('SELECT COUNT(*) AS count FROM messages').get()).toEqual({
      count: 2,
    });
  });

  it('текст сохраняется как есть (кавычки, SQL)', () => {
    repo.messages.add(`'); DROP TABLE messages; --`);
    expect(repo.messages.last(1)).toEqual([`'); DROP TABLE messages; --`]);
  });
});

describe('repo: схема', () => {
  it('defineRepo на существующей базе не теряет данные', () => {
    const db = openDatabase(IN_MEMORY);
    defineRepo(db).chats.add(7, 'x');
    expect(defineRepo(db).chats.ids()).toEqual([7]);
  });

  it('совместима с прежним форматом .persistance.db', () => {
    const db = new Database(IN_MEMORY);
    db.run(
      'CREATE TABLE chats (id INTEGER PRIMARY KEY, chat_id INTEGER UNIQUE, username TEXT);'
    );
    db.run('CREATE TABLE messages (id INTEGER PRIMARY KEY, message TEXT);');
    db.run(
      "INSERT INTO messages (id, message) VALUES (1723300000000, 'legacy');"
    );
    db.run("INSERT INTO chats (chat_id, username) VALUES (5, 'legacy');");
    const repo = defineRepo(db);
    repo.messages.add('fresh');
    expect(repo.messages.last(2)).toEqual(['fresh', 'legacy']);
    expect(repo.chats.ids()).toEqual([5]);
    expect(
      db
        .query(
          "SELECT COUNT(*) AS count FROM messages WHERE created_at >= datetime('now', '-1 minute')"
        )
        .get()
    ).toEqual({ count: 2 });
  });
});
