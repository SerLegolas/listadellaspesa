const tursoConfig = require('../turso.config.js');
const { createClient } = require('@libsql/client');

(async () => {
  const client = createClient({ url: tursoConfig.TURSO_DB_URL, authToken: tursoConfig.TURSO_DB_TOKEN });
  const uidArg = process.argv[2] || '';
  let query = 'SELECT * FROM recipes';
  const params = [];
  if (uidArg) {
    query += ' WHERE uid = ?';
    params.push(uidArg);
  }
  const res = await client.execute(query, params);
  console.log(res.rows);
})();