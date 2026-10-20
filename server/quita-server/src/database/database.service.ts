import { Injectable, OnModuleDestroy } from '@nestjs/common';
import Database from 'better-sqlite3';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class DatabaseService implements OnModuleDestroy {
  readonly db: Database.Database;

  constructor() {
    const databasePath = process.env.DATABASE_PATH ?? 'database.sqlite';
    const absolutePath = path.resolve(databasePath);
    fs.mkdirSync(path.dirname(absolutePath), { recursive: true });

    this.db = new Database(absolutePath);
    this.db.pragma('journal_mode = WAL');
    this.db.pragma('foreign_keys = ON');
    this.migrate();
  }

  onModuleDestroy() {
    this.db.close();
  }

  private migrate() {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS addictions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        description TEXT NOT NULL DEFAULT '',
        icon TEXT NOT NULL DEFAULT '🌱',
        color TEXT NOT NULL DEFAULT '#0d6efd',
        started_at TEXT NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS questions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        addiction_id INTEGER NOT NULL,
        prompt TEXT NOT NULL,
        type TEXT NOT NULL DEFAULT 'text',
        required INTEGER NOT NULL DEFAULT 0,
        position INTEGER NOT NULL DEFAULT 0,
        FOREIGN KEY (addiction_id) REFERENCES addictions(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS relapses (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        addiction_id INTEGER NOT NULL,
        occurred_at TEXT NOT NULL,
        notes TEXT NOT NULL DEFAULT '',
        answers TEXT NOT NULL DEFAULT '[]',
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        FOREIGN KEY (addiction_id) REFERENCES addictions(id) ON DELETE CASCADE
      );

      CREATE INDEX IF NOT EXISTS idx_questions_addiction
        ON questions(addiction_id, position);
      CREATE INDEX IF NOT EXISTS idx_relapses_addiction
        ON relapses(addiction_id, occurred_at);
    `);
  }
}
