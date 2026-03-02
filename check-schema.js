const tursoConfig = require('./turso.config.js');
const { createClient } = require('@libsql/client');
(async () => {
  const client = createClient({
    url: tursoConfig.TURSO_DB_URL,
    authToken: tursoConfig.TURSO_DB_TOKEN,
  });
  const res = await client.execute("PRAGMA table_info(recipes);");
  console.log(res.rows);
})();
