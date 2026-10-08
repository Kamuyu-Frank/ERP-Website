import { DatabaseSync } from 'node:sqlite';
import { mkdirSync, readdirSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
const filename = process.env.SNAPERP_DATABASE;
if (!filename) throw new Error('Set SNAPERP_DATABASE to a persistent database path');
process.umask(0o077);
mkdirSync(dirname(filename), {recursive: true, mode: 0o700});
const db = new DatabaseSync(filename);
db.exec('PRAGMA journal_mode=WAL; PRAGMA busy_timeout=5000; CREATE TABLE IF NOT EXISTS schema_migrations (name TEXT PRIMARY KEY, applied_at TEXT NOT NULL);');
for (const name of readdirSync(resolve(import.meta.dirname, '../migrations')).filter(name => /^\d+.*\.sql$/.test(name)).sort()) {
  if (db.prepare('SELECT name FROM schema_migrations WHERE name=?').get(name)) continue;
  db.exec('BEGIN IMMEDIATE');
  try {
    db.exec(readFileSync(resolve(import.meta.dirname, '../migrations', name), 'utf8'));
    db.prepare('INSERT INTO schema_migrations VALUES (?,?)').run(name, new Date().toISOString());
    db.exec('COMMIT');
    console.log(`Applied ${name}`);
  } catch (error) { db.exec('ROLLBACK'); throw error; }
}
db.close();
