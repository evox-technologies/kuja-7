/**
 * Pushes prisma/schema.prisma to the database named in .env.test.
 *
 * Kept separate from `prisma db push` so the integration schema can never be
 * applied to the DATABASE_URL in .env (live Supabase).
 */
const { execSync } = require('child_process');
const { readFileSync, existsSync } = require('fs');
const { resolve } = require('path');

const envPath = resolve(__dirname, '../.env.test');

if (!existsSync(envPath)) {
  console.error(`Missing ${envPath}. Copy .env.test.example first.`);
  process.exit(1);
}

const env = { ...process.env };
for (const line of readFileSync(envPath, 'utf8').split('\n')) {
  const match = /^\s*([A-Z0-9_]+)\s*=\s*(.*)$/.exec(line);
  if (!match) continue;
  env[match[1]] = match[2].trim().replace(/^["']|["']$/g, '');
}

const host = /@([^:/?]+)/.exec(env.DATABASE_URL || '');
const LOCAL_HOSTS = ['localhost', '127.0.0.1', '::1', 'db', 'postgres'];

if (!host || !LOCAL_HOSTS.includes(host[1])) {
  console.error(
    `Refusing to push the schema to non-local host "${host ? host[1] : '(none)'}".`,
  );
  process.exit(1);
}

execSync('npx prisma db push --skip-generate --accept-data-loss', {
  stdio: 'inherit',
  cwd: resolve(__dirname, '..'),
  env,
});
