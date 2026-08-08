/**
 * Loads apps/api/.env.test and refuses to run if it does not point at a local
 * database.
 *
 * The integration suite truncates every table between tests. apps/api/.env
 * points DATABASE_URL at the live Supabase instance, so without this guard a
 * stray `npm test` would wipe production data.
 */
import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';

const envPath = resolve(__dirname, '../.env.test');

if (!existsSync(envPath)) {
  throw new Error(
    `Missing ${envPath}. Copy .env.test.example and start a local Postgres first.`,
  );
}

for (const line of readFileSync(envPath, 'utf8').split('\n')) {
  const match = /^\s*([A-Z0-9_]+)\s*=\s*(.*)$/.exec(line);
  if (!match) continue;
  const [, key, rawValue] = match;
  process.env[key] = rawValue.trim().replace(/^["']|["']$/g, '');
}

const url = process.env.DATABASE_URL ?? '';
const host = /@([^:/?]+)/.exec(url)?.[1] ?? '';
const LOCAL_HOSTS = ['localhost', '127.0.0.1', '::1', 'db', 'postgres'];

if (!url) {
  throw new Error('DATABASE_URL is not set in .env.test');
}

if (!LOCAL_HOSTS.includes(host)) {
  throw new Error(
    `Refusing to run destructive integration tests against non-local host "${host}". ` +
      `Point DATABASE_URL in .env.test at a throwaway local database.`,
  );
}
