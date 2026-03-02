const tursoConfig = require('../turso.config.js');
const { createClient } = require('@libsql/client');

(async () => {
  const client = createClient({
    url: tursoConfig.TURSO_DB_URL,
    authToken: tursoConfig.TURSO_DB_TOKEN,
  });
  await client.execute('DELETE FROM recipes');
  console.log('Tutti i record cancellati');
})();