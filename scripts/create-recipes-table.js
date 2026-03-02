// Script per creare la tabella "recipes" su Turso
const tursoConfig = require('../turso.config.js');

async function createRecipesTable() {
  try {
    const { TURSO_DB_URL, TURSO_DB_TOKEN } = tursoConfig;
    const { createClient } = require('@libsql/client');
    const client = createClient({
      url: TURSO_DB_URL,
      authToken: TURSO_DB_TOKEN,
    });
    const sql = `
      CREATE TABLE IF NOT EXISTS recipes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        uid TEXT,
        title TEXT,
        categoria TEXT,
        image TEXT,
        ingredients JSON,
        instructions JSON,
        link TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `;
    await client.execute(sql);
    console.log('Tabella recipes creata o già esistente.');
  } catch (err) {
    console.error('Errore creazione tabella recipes:', err);
  }
}

if (require.main === module) {
  createRecipesTable();
}
