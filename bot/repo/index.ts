import { Database } from 'bun:sqlite';
import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { MESSAGE_RETENTION } from '../assets/constants';
import { pipe } from '../assets/utils';

export var IN_MEMORY = ':memory:';

var _SCHEMA = `
  CREATE TABLE IF NOT EXISTS chats (
    id INTEGER PRIMARY KEY,
    chat_id INTEGER UNIQUE,
    username TEXT
  );
  CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY,
    message TEXT,
    created_at TEXT
  );
`;

var _addCreatedAt = (db: Database): void =>
  void (
    db
      .query<{ name: string }, []>(
        "SELECT name FROM pragma_table_info('messages')"
      )
      .all()
      .some((_) => _.name === 'created_at') ||
    db.transaction(
      () => (
        db.run('ALTER TABLE messages ADD COLUMN created_at TEXT'),
        db.run("UPDATE messages SET created_at = datetime('now')")
      )
    )()
  );

export var openDatabase = (path: string): Database =>
  pipe<string, Database>(
    (_: string) => (
      _ === IN_MEMORY || mkdirSync(dirname(_), { recursive: true }), _
    ),
    (_: string) => new Database(_, { create: true, strict: true })
  )(path);

var _limit = (value: number): number =>
  Math.max(0, Math.trunc(Number(value)) || 0);

export var defineRepo = (db: Database) => {
  db.run('PRAGMA journal_mode = WAL;');
  db.run(_SCHEMA);
  _addCreatedAt(db);

  const statements = {
    addChat: db.prepare<null, [number, string | null]>(
      `INSERT INTO chats (chat_id, username) VALUES (?1, ?2)
       ON CONFLICT(chat_id) DO UPDATE SET username = excluded.username`
    ),
    hasChat: db.prepare<{ found: number }, [number]>(
      'SELECT 1 AS found FROM chats WHERE chat_id = ?1'
    ),
    chatIds: db.prepare<{ chat_id: number }, []>('SELECT chat_id FROM chats'),
    removeChat: db.prepare<null, [number]>(
      'DELETE FROM chats WHERE chat_id = ?1'
    ),
    removeByUsername: db.prepare<null, [string]>(
      'DELETE FROM chats WHERE username = ?1 COLLATE NOCASE'
    ),
    addMessage: db.prepare<null, [string]>(
      "INSERT INTO messages (message, created_at) VALUES (?1, datetime('now'))"
    ),
    pruneMessages: db.prepare<null, [string]>(
      "DELETE FROM messages WHERE created_at < datetime('now', ?1)"
    ),
    lastMessages: db.prepare<{ message: string }, [number]>(
      'SELECT message FROM messages ORDER BY id DESC LIMIT ?1'
    ),
    allMessages: db.prepare<{ message: string }, []>(
      'SELECT message FROM messages ORDER BY id DESC'
    ),
  };

  const _prune = (): number =>
    statements.pruneMessages.run(MESSAGE_RETENTION).changes;

  _prune();

  return {
    chats: {
      add: (chatId: number, username?: string | null): void =>
        void statements.addChat.run(chatId, username ?? null),
      has: (chatId: number): boolean => Boolean(statements.hasChat.get(chatId)),
      ids: (): number[] => statements.chatIds.all().map((_) => _.chat_id),
      remove: (chatId: number): number =>
        statements.removeChat.run(chatId).changes,
      removeByUsername: (username: string): number =>
        statements.removeByUsername.run(username).changes,
    },
    messages: {
      add: (message: string): void =>
        void (_prune(), statements.addMessage.run(message)),
      last: (limit: number): string[] => (
        _prune(),
        statements.lastMessages.all(_limit(limit)).map((_) => _.message)
      ),
      all: (): string[] => (
        _prune(), statements.allMessages.all().map((_) => _.message)
      ),
      prune: _prune,
    },
  };
};

export type Repo = ReturnType<typeof defineRepo>;
