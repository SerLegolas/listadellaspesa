import { NextResponse } from 'next/server';
import { createClient } from '@libsql/client';
import tursoConfig from '../../../../../turso.config.js';

export async function GET(request) {
  try {
    const uid = request.nextUrl.searchParams.get('uid');
    if (!uid) {
      return NextResponse.json({ error: 'UID mancante' }, { status: 400 });
    }
    const client = createClient({
      url: tursoConfig.TURSO_DB_URL,
      authToken: tursoConfig.TURSO_DB_TOKEN,
    });
    const result = await client.execute(
      'SELECT categoria, COUNT(*) as cnt FROM recipes WHERE uid = ? AND categoria IS NOT NULL GROUP BY categoria',
      [uid]
    );
    // result.rows is array of arrays [categoria, cnt]
    const categories = result.rows.map(r => ({ categoria: r[0], count: r[1] }));
    return NextResponse.json({ categories });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
