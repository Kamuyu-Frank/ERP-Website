import { DatabaseSync } from 'node:sqlite';
import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';

let database: DatabaseSync | undefined;
export function nodeDatabase() {
  if (database) return database;
  const filename = process.env.SNAPERP_DATABASE;
  if (!filename) throw new Error('SNAPERP_DATABASE must point to the persistent SQLite database');
  mkdirSync(dirname(filename), { recursive: true, mode: 0o700 });
  database = new DatabaseSync(filename);
  database.exec('PRAGMA journal_mode=WAL; PRAGMA busy_timeout=5000;');
  return database;
}
// The two methods used by the demo form match its existing D1 statement API.
// Migrations are applied separately before activating a release.
export function bindings() {
  return { HF_ENV: 'production', DB: {
    prepare(sql: string) {
      function statement(values: (string | number | null)[] = []) {
        return {
          bind: (...parameters: (string | number | null)[]) => statement(parameters),
          async first<T = Record<string, unknown>>() { return (nodeDatabase().prepare(sql).get(...values) ?? null) as T | null; },
          async run() { return nodeDatabase().prepare(sql).run(...values); },
        };
      }
      return statement();
    },
  } };
}
