import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const {
  DB_HOST = 'localhost',
  DB_PORT = '3306',
  DB_USER = 'root',
  DB_PASSWORD = 'root',
  DB_NAME = 'social442',
} = process.env;

async function main() {
  console.log(`Connecting to database ${DB_NAME} to apply schema changes...`);
  const conn = await mysql.createConnection({
    host: DB_HOST,
    port: Number(DB_PORT),
    user: DB_USER,
    password: DB_PASSWORD,
    database: DB_NAME,
  });

  try {
    // Check if column already exists
    const [columns] = await conn.query(
      'SELECT COLUMN_NAME FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? AND COLUMN_NAME = ?',
      [DB_NAME, 'users', 'gender']
    );

    if (columns.length > 0) {
      console.log("Column 'gender' already exists in table 'users'. No changes needed.");
    } else {
      console.log("Adding column 'gender' to table 'users'...");
      await conn.query(
        "ALTER TABLE users ADD COLUMN gender ENUM('male','female','other') DEFAULT NULL AFTER bio"
      );
      console.log("Column 'gender' successfully added.");
    }
  } catch (error) {
    console.error("Error applying column addition:", error);
    process.exit(1);
  } finally {
    await conn.end();
  }
}

main();
