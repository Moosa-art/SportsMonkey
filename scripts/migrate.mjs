/**
 * scripts/migrate.mjs - apply pending SQL migrations using .env credentials.
 *
 * Usage:  npm run migrate
 *
 * Behaviour:
 *  - Tracks applied files in a schema_migrations table so each migration runs
 *    only once and re-running is always safe.
 *  - On the FIRST run against a database that was already set up, it detects the
 *    existing tables and records the base migrations (001-004) as applied
 *    instead of re-running them. The base schema defines triggers and a fixed
 *    foreign-key name (fk_users_club) that are NOT safe to apply twice - that is
 *    exactly what produced the Duplicate foreign key constraint name error.
 *  - Ignores benign already-exists errors.
 *  - After applying, prints a checklist of the columns/tables the app needs.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const MIGRATIONS_DIR = path.resolve(__dirname, '..', 'migrations');

const {
  DB_HOST = 'localhost',
  DB_PORT = '3306',
  DB_USER = 'root',
  DB_PASSWORD = '',
  DB_NAME = 'social442',
} = process.env;

// errno values that mean this object already exists - safe to ignore.
const BENIGN_ERRNOS = new Set([1050, 1060, 1061, 1062, 1826, 1359]);
const isBenign = (err) => !!err && BENIGN_ERRNOS.has(err.errno);

async function tableExists(conn, table) {
  const [rows] = await conn.query(
    'SELECT COUNT(*) AS n FROM information_schema.TABLES WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ?',
    [DB_NAME, table],
  );
  return rows[0].n > 0;
}

async function columnExists(conn, table, column) {
  const [rows] = await conn.query(
    'SELECT COUNT(*) AS n FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? AND COLUMN_NAME = ?',
    [DB_NAME, table, column],
  );
  return rows[0].n > 0;
}

async function main() {
  const files = fs.readdirSync(MIGRATIONS_DIR).filter((f) => f.endsWith('.sql')).sort();
  if (!files.length) {
    console.log('No .sql migrations found in', MIGRATIONS_DIR);
    return;
  }

  console.log('Connecting to ' + DB_USER + '@' + DB_HOST + ':' + DB_PORT + '/' + DB_NAME + ' ...');
  let conn;
  try {
    conn = await mysql.createConnection({
      host: DB_HOST,
      port: Number(DB_PORT),
      user: DB_USER,
      password: DB_PASSWORD,
      database: DB_NAME,
      multipleStatements: true,
    });
  } catch (err) {
    console.error('Could not connect to the database: ' + (err.sqlMessage || err.message));
    console.error('Check DB_HOST / DB_PORT / DB_USER / DB_PASSWORD / DB_NAME in your .env file.');
    process.exit(1);
  }

  try {
    await conn.query(
      'CREATE TABLE IF NOT EXISTS schema_migrations (filename VARCHAR(255) PRIMARY KEY, applied_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP) ENGINE=InnoDB',
    );

    const [appliedRows] = await conn.query('SELECT filename FROM schema_migrations');
    const applied = new Set(appliedRows.map((r) => r.filename));

    if (applied.size === 0) {
      const markers = [
        ['001_create_schema.sql', () => tableExists(conn, 'users')],
        ['002_club_engagement.sql', () => tableExists(conn, 'club_post_stats')],
        ['003_saved_posts.sql', () => tableExists(conn, 'club_post_saves')],
        ['004_media_files.sql', () => tableExists(conn, 'media_files')],
        ['005_enhanced_comments.sql', () => columnExists(conn, 'club_post_comments', 'parent_id')],
      ];
      for (const [name, check] of markers) {
        if (files.includes(name) && (await check())) {
          await conn.query('INSERT IGNORE INTO schema_migrations (filename) VALUES (?)', [name]);
          applied.add(name);
          console.log('  (already present) ' + name + ' - recorded as applied');
        }
      }
    }

    if (!(await tableExists(conn, 'users'))) {
      console.error('Base schema not found in this database.');
      console.error('Create it once with:');
      console.error('  mysql -u ' + DB_USER + ' -p ' + DB_NAME + ' < migrations/001_create_schema.sql');
      console.error('then run: npm run migrate');
      process.exit(1);
    }

    console.log('');
    console.log('Applying migrations:');
    for (const file of files) {
      if (applied.has(file)) {
        console.log('  -- ' + file + ' (skipped, already applied)');
        continue;
      }
      const sql = fs.readFileSync(path.join(MIGRATIONS_DIR, file), 'utf8');
      process.stdout.write('  -> ' + file + ' ... ');
      try {
        await conn.query(sql);
        await conn.query('INSERT IGNORE INTO schema_migrations (filename) VALUES (?)', [file]);
        console.log('ok');
      } catch (err) {
        if (isBenign(err)) {
          await conn.query('INSERT IGNORE INTO schema_migrations (filename) VALUES (?)', [file]);
          console.log('already applied (skipped)');
          continue;
        }
        console.log('FAILED');
        console.error('');
        console.error('Migration ' + file + ' failed: ' + (err.sqlMessage || err.message));
        throw err;
      }
    }

    console.log('');
    console.log('Verifying schema:');
    const checks = [
      ['column', 'club_post_comments', 'parent_id'],
      ['column', 'club_post_comments', 'attachments'],
      ['column', 'club_post_comments', 'mentions'],
      ['column', 'club_post_comments', 'hashtags'],
      ['table', 'club_comment_reactions'],
      ['table', 'club_post_stats'],
      ['table', 'media_files'],
    ];
    let allOk = true;
    for (const c of checks) {
      let ok;
      let label;
      if (c[0] === 'column') {
        ok = await columnExists(conn, c[1], c[2]);
        label = c[1] + '.' + c[2];
      } else {
        ok = await tableExists(conn, c[1]);
        label = 'table ' + c[1];
      }
      if (!ok) allOk = false;
      console.log('  ' + (ok ? '[ OK ]' : '[MISSING]') + '  ' + label);
    }

    console.log('');
    if (allOk) {
      console.log('Done - schema verified. Now restart the server: npm run restart');
    } else {
      console.log('Some objects are still missing. Copy this whole output and send it for help.');
      process.exit(1);
    }
  } finally {
    await conn.end();
  }
}

main().catch(() => {
  console.error('');
  console.error('Migration run aborted. Fix the error above and re-run: npm run migrate');
  process.exit(1);
});
