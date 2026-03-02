// Script per aggiungere colonna image a recipes
const tursoConfig = require('../turso.config.js');
const { createClient } = require('@libsql/client');

async function addColumn() {
  try {
    const client = createClient({
      url: tursoConfig.TURSO_DB_URL,
      authToken: tursoConfig.TURSO_DB_TOKEN,
    });
    await client.execute('ALTER TABLE recipes ADD COLUMN image TEXT;');
    console.log('Colonna image aggiunta (o già presente).');
  } catch (err) {
    console.error('Errore aggiunta colonna image:', err.message);
  }
}

if (require.main === module) {
  addColumn();
}
