import { NextResponse } from 'next/server';
import { createClient } from '@libsql/client';
import tursoConfig from '../../../../turso.config.js';

export async function POST(request) {
  try {
    const { username, password } = await request.json();
    if (!username || !password) {
      return NextResponse.json({ error: 'Dati mancanti' }, { status: 400 });
    }
    const client = createClient({
      url: tursoConfig.TURSO_DB_URL,
      authToken: tursoConfig.TURSO_DB_TOKEN,
    });
    const result = await client.execute(
      'SELECT uid, name FROM users WHERE username = ? AND password = ?',
      [username, password]
    );
    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Credenziali non valide' }, { status: 401 });
    }
    // Restituisci uid e nome
    return NextResponse.json({ success: true, user: result.rows[0] });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
