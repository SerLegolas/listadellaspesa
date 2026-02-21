// Script per creare la tabella elencoprodotti su Turso
const tursoConfig = require('../turso.config.js');

async function createProdottiTable() {
  try {
    const { TURSO_DB_URL, TURSO_DB_TOKEN } = tursoConfig;
    const { createClient } = require('@libsql/client');
    const client = createClient({
      url: TURSO_DB_URL,
      authToken: TURSO_DB_TOKEN,
    });
    const sql = `
      CREATE TABLE IF NOT EXISTS elencoprodotti (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        uid TEXT,
        nome TEXT,
        checked INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `;
    await client.execute(sql);
    console.log('Tabella elencoprodotti creata o già esistente.');
  } catch (err) {
    console.error('Errore creazione tabella elencoprodotti:', err);
  }
}

if (require.main === module) {
  createProdottiTable();
}
