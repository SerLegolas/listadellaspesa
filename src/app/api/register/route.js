import { NextResponse } from 'next/server';
import { createClient } from '@libsql/client';
import tursoConfig from '../../../../turso.config.js';

export async function POST(request) {
  try {
    const { name, username, password, uid } = await request.json();
    if (!name || !username || !password || !uid) {
      return NextResponse.json({ error: 'Dati mancanti' }, { status: 400 });
    }
    const client = createClient({
      url: tursoConfig.TURSO_DB_URL,
      authToken: tursoConfig.TURSO_DB_TOKEN,
    });
    await client.execute(
      'INSERT INTO users (uid, name, username, password) VALUES (?, ?, ?, ?)',
      [uid, name, username, password]
    );
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
