// Test di collegamento a Turso
const tursoConfig = require('../turso.config.js');

async function testTursoConnection() {
  try {
    const { TURSO_DB_URL, TURSO_DB_TOKEN } = tursoConfig;
    if (!TURSO_DB_URL || !TURSO_DB_TOKEN) {
      console.error('Credenziali mancanti.');
      return;
    }
    // Importa il client libsql
    const { createClient } = require('@libsql/client');
    const client = createClient({
      url: TURSO_DB_URL,
      authToken: TURSO_DB_TOKEN,
    });
    // Esegui una query di test
    const result = await client.execute('SELECT 1 as test');
    console.log('Collegamento riuscito:', result.rows);
  } catch (err) {
    console.error('Errore collegamento Turso:', err);
  }
}

// Esegui il test solo se chiamato direttamente
if (require.main === module) {
  testTursoConnection();
}
