CREATE TABLE IF NOT EXISTS demo_requests (id TEXT PRIMARY KEY,reference TEXT NOT NULL UNIQUE,name TEXT NOT NULL,business TEXT NOT NULL,email TEXT NOT NULL,phone TEXT NOT NULL DEFAULT '',workflow TEXT NOT NULL,consented_at TEXT NOT NULL,created_at TEXT NOT NULL);
CREATE INDEX IF NOT EXISTS demo_requests_created_idx ON demo_requests(created_at);
CREATE TABLE IF NOT EXISTS demo_rate_limits (bucket TEXT PRIMARY KEY,hits INTEGER NOT NULL,created_at TEXT NOT NULL);
