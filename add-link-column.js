const tursoConfig = require('./turso.config.js');
const { createClient } = require('@libsql/client');
(async () => {
  const client = createClient({
    url: tursoConfig.TURSO_DB_URL,
    authToken: tursoConfig.TURSO_DB_TOKEN,
  });
  try {
    await client.execute('ALTER TABLE recipes ADD COLUMN link TEXT;');
    console.log('Colonna "link" aggiunta con successo.');
  } catch (e) {
    console.error('Errore aggiunta colonna link:', e.message);
  }
  const res = await client.execute("PRAGMA table_info(recipes);");
  console.log(res.rows);
})();
