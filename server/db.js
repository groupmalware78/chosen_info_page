import fs from 'node:fs';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { config } from './config.js';

fs.mkdirSync(config.dataDir, { recursive: true });
fs.mkdirSync(path.join(config.dataDir, 'uploads'), { recursive: true });

export const db = new DatabaseSync(path.join(config.dataDir, 'chosen.db'));

db.exec(`
  PRAGMA journal_mode = WAL;
  PRAGMA foreign_keys = ON;
  PRAGMA busy_timeout = 5000;

  CREATE TABLE IF NOT EXISTS settings (
    key        TEXT PRIMARY KEY,
    value      TEXT NOT NULL,
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS services (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    title       TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    icon        TEXT NOT NULL DEFAULT 'box',
    sort_order  INTEGER NOT NULL DEFAULT 0,
    published   INTEGER NOT NULL DEFAULT 1
  );

  CREATE TABLE IF NOT EXISTS faqs (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    question   TEXT NOT NULL,
    answer     TEXT NOT NULL,
    sort_order INTEGER NOT NULL DEFAULT 0,
    published  INTEGER NOT NULL DEFAULT 1
  );

  CREATE TABLE IF NOT EXISTS rates (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    origin       TEXT NOT NULL,
    destination  TEXT NOT NULL,
    mode         TEXT NOT NULL CHECK (mode IN ('sea','air','road')),
    unit         TEXT NOT NULL CHECK (unit IN ('kg','cbm')),
    price        REAL NOT NULL,
    currency     TEXT NOT NULL DEFAULT 'USD',
    min_charge   REAL NOT NULL DEFAULT 0,
    transit_time TEXT NOT NULL DEFAULT '',
    notes        TEXT NOT NULL DEFAULT '',
    sort_order   INTEGER NOT NULL DEFAULT 0,
    published    INTEGER NOT NULL DEFAULT 1
  );

  CREATE TABLE IF NOT EXISTS messages (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    name       TEXT NOT NULL,
    email      TEXT NOT NULL,
    phone      TEXT NOT NULL DEFAULT '',
    company    TEXT NOT NULL DEFAULT '',
    service    TEXT NOT NULL DEFAULT '',
    message    TEXT NOT NULL,
    ip         TEXT NOT NULL DEFAULT '',
    is_read    INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS users (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    email         TEXT NOT NULL UNIQUE COLLATE NOCASE,
    password_hash TEXT NOT NULL,
    created_at    TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS sessions (
    token_hash TEXT PRIMARY KEY,
    user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    expires_at INTEGER NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
`);

export function getSetting(key) {
  const row = db.prepare('SELECT value FROM settings WHERE key = ?').get(key);
  return row ? JSON.parse(row.value) : null;
}

export function setSetting(key, value) {
  db.prepare(
    `INSERT INTO settings (key, value, updated_at) VALUES (?, ?, datetime('now'))
     ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at`,
  ).run(key, JSON.stringify(value));
}

export function transaction(fn) {
  db.exec('BEGIN');
  try {
    const result = fn();
    db.exec('COMMIT');
    return result;
  } catch (err) {
    db.exec('ROLLBACK');
    throw err;
  }
}
