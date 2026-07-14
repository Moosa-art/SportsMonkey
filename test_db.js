import mysql from 'mysql2/promise';

const users = ['root', 'social442', 'dev', 'admin', 'social'];
const passwords = ['', 'social442', 'dev', 'admin', 'social', 'password', 'your_mysql_password'];

async function test() {
  for (const user of users) {
    for (const pw of passwords) {
      try {
        const conn = await mysql.createConnection({
          host: 'localhost',
          port: 3306,
          user: user,
          password: pw,
        });
        console.log(`Success! Connected as User: "${user}" with Password: "${pw}"`);
        const [rows] = await conn.query('SHOW DATABASES');
        console.log('Databases:', rows);
        await conn.end();
        process.exit(0);
      } catch (err) {
        // ignore access denied
      }
    }
  }
  console.log('None of the combinations worked!');
  process.exit(1);
}

test();
