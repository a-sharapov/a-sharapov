import { Database } from "bun:sqlite";

const JOINER = "\n\n";

const db = new Database("./.persistance.db", { create: true });
db.exec("PRAGMA journal_mode = WAL;");

export default db;

export const insertMessage = db.transaction(
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

export const getLastMessages = db.transaction(
  (limit: number, joiner = JOINER) =>
    db
      .prepare(`SELECT * FROM messages ORDER BY id DESC LIMIT ${limit}`)
      .all()
      .map(({ message }) => message)
      .join(joiner)
);

export const getAllMessages = db.transaction((joiner = JOINER) =>
  db
    .prepare("SELECT * FROM messages ORDER BY id DESC")
    .all()
    .map(({ message }) => message)
    .join(joiner)
);
