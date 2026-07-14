/**
 * server/db/pool.js
 * MySQL connection pool using mysql2/promise.
 * All queries go through the exported `query` helper so connection
 * management stays in one place.
 */

import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const {
  DB_HOST     = 'localhost',
  DB_PORT     = '3306',
  DB_USER     = 'root',
  DB_PASSWORD = '',
  DB_NAME     = 'social442',
  DB_POOL_SIZE = '10',
} = process.env;

const pool = mysql.createPool({
  host:               DB_HOST,
  port:               Number(DB_PORT),
  user:               DB_USER,
  password:           DB_PASSWORD,
  database:           DB_NAME,
  waitForConnections: true,
  connectionLimit:    Number(DB_POOL_SIZE),
  queueLimit:         0,
  // Return JS Date objects for DATETIME columns
  dateStrings:        false,
  // Bigint as strings to avoid precision loss
  supportBigNumbers:  true,
  bigNumberStrings:   true,
  // Auto-parse JSON columns
  typeCast(field, next) {
    if (field.type === 'JSON') {
      const raw = field.string();
      try { return raw ? JSON.parse(raw) : null; } catch { return raw; }
    }
    return next();
  },
});

/**
 * Execute a parameterised query.
 * @param {string}  sql    - Parameterised SQL with ? placeholders
 * @param {Array}   params - Values to bind
 * @returns {Promise<Array>} rows
 */
export async function query(sql, params = []) {
  const [rows] = await pool.execute(sql, params);
  return rows;
}

/**
 * Execute inside a transaction.
 * @param {(conn: mysql.Connection) => Promise<T>} fn
 * @returns {Promise<T>}
 */
export async function withTransaction(fn) {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const result = await fn(conn);
    await conn.commit();
    return result;
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

export default pool;
