// Uses Node's built-in SQLite module (available unflagged since Node 22.13 / 23.4,
// Release Candidate as of 24.15). No native binary, no node-gyp, no prebuild
// mismatches across Node versions/platforms -- avoids the whole better-sqlite3
// "Could not locate the bindings file" class of problems entirely.
const { DatabaseSync } = require("node:sqlite");
const path = require("path");

const db = new DatabaseSync(path.join(__dirname, "nearby.db"));
db.exec("PRAGMA journal_mode = WAL;");

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    name TEXT NOT NULL,
    account_type TEXT NOT NULL DEFAULT 'explorer', -- 'explorer' | 'organizer'
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS places (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    category TEXT NOT NULL, -- food | event | cafe | activity
    lat REAL NOT NULL,
    lng REAL NOT NULL,
    distance_label TEXT,
    open_now INTEGER NOT NULL DEFAULT 1,
    description TEXT
  );

  CREATE TABLE IF NOT EXISTS friends (
    user_id TEXT NOT NULL,
    friend_id TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    PRIMARY KEY (user_id, friend_id)
  );

  CREATE TABLE IF NOT EXISTS saved_places (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    place_id TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE(user_id, place_id)
  );

  CREATE TABLE IF NOT EXISTS updates (
    id TEXT PRIMARY KEY,
    author_id TEXT NOT NULL,
    author_type TEXT NOT NULL, -- 'explorer' | 'organizer'
    message TEXT NOT NULL,
    place_id TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
`);

module.exports = db;
