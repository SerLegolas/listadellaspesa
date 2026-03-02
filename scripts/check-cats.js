const tursoConfig = require('../turso.config.js');
const { createClient } = require('@libsql/client');

(async () => {
  const client = createClient({ url: tursoConfig.TURSO_DB_URL, authToken: tursoConfig.TURSO_DB_TOKEN });
  const uid = ''; // mettere un uid reale se vuoi
  const res = await client.execute('SELECT categoria, COUNT(*) as cnt FROM recipes WHERE uid = ? GROUP BY categoria', [uid]);
  console.log(res.rows);
})();