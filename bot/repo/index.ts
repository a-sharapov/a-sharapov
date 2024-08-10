import { Database } from "bun:sqlite";

const JOINER = "\n\n";

const db = new Database("./.persistance.db", { create: true });
db.exec("PRAGMA journal_mode = WAL;");

export default db;

export var insertChat = db.transaction((id, name) => {
  db.run(`CREATE TABLE IF NOT EXISTS chats (
        id INTEGER PRIMARY KEY,
        chat_id INTEGER UNIQUE,
        username TEXT
    );`);
  db.prepare(`INSERT INTO chats (chat_id, username) VALUES ($id, $name);`).run(
    id,
    name
  );
});

export var getAllChats = db.transaction(() => {
  db.run(`CREATE TABLE IF NOT EXISTS chats (
    id INTEGER PRIMARY KEY,
    chat_id INTEGER UNIQUE,
    username TEXT
  );`);

  return (
    db
      .prepare("SELECT * FROM chats")
      .all()
      // @ts-expect-error
      .map(({ chat_id }) => chat_id)
  );
});

export var removeChatByUsername = db.transaction((username) =>
  db.prepare(`DELETE FROM chats WHERE username = $username;`).run(username)
);

export var insertMessage = db.transaction(
  (message, id = new Date().valueOf()) => {
    db.run(`CREATE TABLE IF NOT EXISTS messages (
        id INTEGER PRIMARY KEY,
        message TEXT
    );`);
    db.prepare(
      `INSERT INTO messages (id, message) VALUES ($id, $message);`
    ).run(id, message);
  }
);

export var getLastMessages = db.transaction((limit: number, joiner = JOINER) =>
  db
    .prepare(`SELECT * FROM messages ORDER BY id DESC LIMIT ${limit}`)
    .all()
    // @ts-expect-error
    .map(({ message }) => message)
    .join(joiner)
);

export var getAllMessages = db.transaction((joiner = JOINER) =>
  db
    .prepare("SELECT * FROM messages ORDER BY id DESC")
    .all()
    // @ts-expect-error
    .map(({ message }) => message)
    .join(joiner)
);
