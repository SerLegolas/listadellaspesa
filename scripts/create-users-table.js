// Script per creare la tabella users su Turso
const tursoConfig = require('../turso.config.js');

async function createUsersTable() {
  try {
    const { TURSO_DB_URL, TURSO_DB_TOKEN } = tursoConfig;
    const { createClient } = require('@libsql/client');
    const client = createClient({
      url: TURSO_DB_URL,
      authToken: TURSO_DB_TOKEN,
    });
    const sql = `
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        uid TEXT UNIQUE,
        name TEXT,
        username TEXT UNIQUE,
        password TEXT
      );
    `;
    await client.execute(sql);
    console.log('Tabella users creata o già esistente.');
  } catch (err) {
    console.error('Errore creazione tabella users:', err);
  }
}

if (require.main === module) {
  createUsersTable();
}
