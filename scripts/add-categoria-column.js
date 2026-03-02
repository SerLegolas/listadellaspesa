// Script per aggiungere colonna categoria a recipes
const tursoConfig = require('../turso.config.js');
const { createClient } = require('@libsql/client');

async function addColumn() {
  try {
    const client = createClient({
      url: tursoConfig.TURSO_DB_URL,
      authToken: tursoConfig.TURSO_DB_TOKEN,
    });
    await client.execute('ALTER TABLE recipes ADD COLUMN categoria TEXT;');
    console.log('Colonna categoria aggiunta (o già presente).');
  } catch (err) {
    console.error('Errore aggiunta colonna:', err.message);
  }
}

if (require.main === module) {
  addColumn();
}
