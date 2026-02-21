import { NextResponse } from 'next/server';
import { createClient } from '@libsql/client';
import tursoConfig from '../../../../turso.config.js';

export async function POST(request) {
  try {
    const { uid, nome } = await request.json();
    if (!uid || !nome) {
      return NextResponse.json({ error: 'Dati mancanti' }, { status: 400 });
    }
    const client = createClient({
      url: tursoConfig.TURSO_DB_URL,
      authToken: tursoConfig.TURSO_DB_TOKEN,
    });
    await client.execute(
      'INSERT INTO elencoprodotti (uid, nome) VALUES (?, ?)',
      [uid, nome]
    );
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

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
      'SELECT id, nome, checked FROM elencoprodotti WHERE uid = ? ORDER BY created_at DESC',
      [uid]
    );
    return NextResponse.json({ prodotti: result.rows });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
