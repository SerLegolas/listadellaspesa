import { NextResponse } from 'next/server';
import { createClient } from '@libsql/client';
import tursoConfig from '../../../../turso.config.js';

export async function POST(request) {
  try {
    let { uid, title, categoria, ingredients, instructions } = await request.json();
    const origInstructions = instructions; // keep original value for url checks
    let image = null;
    // store link separately if the instructions value is a URL
    let link = null;
    if (typeof instructions === 'string' && instructions.startsWith('http')) {
      link = instructions;
    }
    console.log('POST /recipes payload:', { ingredients, title, categoria, instructions, link });
    // basic validation: title and categoria required
    if (!uid || !title || !categoria || !title.trim()) {
      return NextResponse.json({ error: 'Titolo e categoria obbligatori' }, { status: 400 });
    }
    // normalize ingredients if sent as string
    if (typeof ingredients === 'string') {
      ingredients = ingredients.split('\n');
    }
    // if instructions looks like a URL, attempt to fetch page and extract title/meta description
    if (typeof instructions === 'string' && instructions.startsWith('http')) {
      try {
        console.log('fetching URL for scraping:', instructions);
        const res = await fetch(instructions);
        console.log('fetch status', res.status);
        if (res.ok) {
          const html = await res.text();
          console.log('fetched html length', html.length);
          // extract <title>
          const matchTitle = html.match(/<title>([^<]+)<\/title>/i);
          if (matchTitle && matchTitle[1]) {
            title = matchTitle[1].trim();
          }
          // optional: extract meta description
          const matchDesc = html.match(/<meta\s+name=["']description["']\s+content=["']([^"']+)["']/i);
          if (matchDesc && matchDesc[1]) {
            instructions = matchDesc[1].trim();
          }
          // extract recipeInstructions from JSON-LD for GialloZafferano
          if (origInstructions && origInstructions.startsWith('http') && origInstructions.includes('giallozafferano.it')) {
            // look for application/ld+json block
            const jsonMatch = html.match(/<script[^>]+type=["']application\/ld\+json["'][\s\S]*?<\/script>/i);
            if (jsonMatch) {
              try {
                const jobj = JSON.parse(jsonMatch[0].replace(/<script[^>]*>|<\/script>/g, ''));
                if (jobj) {
                  // JSON-LD may contain ingredients as well as instructions
                  if (jobj.recipeIngredient) {
                    console.log('giallo json recipeIngredient', jobj.recipeIngredient);
                    if (Array.isArray(jobj.recipeIngredient)) {
                      ingredients = jobj.recipeIngredient;
                    } else if (typeof jobj.recipeIngredient === 'string') {
                      // sometimes a single string separated by commas
                      ingredients = jobj.recipeIngredient.split(/,\s*/);
                    }
                  }
                  if (jobj.recipeInstructions) {
                    console.log('giallo json recipeInstructions', jobj.recipeInstructions);
                    // recipeInstructions may be array of strings
                    if (Array.isArray(jobj.recipeInstructions)) {
                      instructions = jobj.recipeInstructions.join('\n');
                    } else if (typeof jobj.recipeInstructions === 'string') {
                      instructions = jobj.recipeInstructions;
                    }
                    console.log('instructions overridden to', instructions.substring(0,100));
                  }
                }
              } catch (e) {
                console.error('ld+json parse error', e);
              }
            }
          }
          // attempt to fetch an image (og:image meta)
          const imgMatch = html.match(/<meta[^>]+property=["']og:image["'][^>]*content=["']([^"']+)["']/i);
          if (imgMatch && imgMatch[1]) {
            image = imgMatch[1].trim();
            console.log('scraped image', image);
          }
          // try to scrape ingredients section (Italian site formatting)
          const ingrMatch = html.match(/##\s*INGREDIENTI([\s\S]*?)(?:##|$)/i);
          if (ingrMatch && ingrMatch[1]) {
            // split lines, remove empty and html tags
            let lines = ingrMatch[1].split(/\r?\n/)
              .map(l => l.trim())
              .filter(l => l);
            if (lines.length > 0) {
              // strip markdown-style links [text](url) -> text
              lines = lines.map(l => {
                let txt = l.replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1');
                return txt.trim();
              });
              ingredients = lines;
            }
            console.log('after scrape (markdown), title', title, 'ingredients', ingredients, 'instructions', instructions);
          }
          
          // If we didn't manage to find anything yet, try HTML-specific extraction
          if ((!ingredients || ingredients.length === 0) && html) {
            const headerIdx = html.search(/<h2[^>]*>\s*INGREDIENTI\s*<\/h2>/i);
            if (headerIdx !== -1) {
              const afterHeader = html.slice(headerIdx);
              const ddRegex = /<dd[^>]*>([\s\S]*?)<\/dd>/gi;
              const ddMatches = [...afterHeader.matchAll(ddRegex)];
              if (ddMatches.length) {
                ingredients = ddMatches
                  .map(m => {
                    // m is the array from matchAll; group 1 contains the text
                    let txt = m[1];
                    return txt
                      .replace(/<[^>]+>/g, '')
                      .replace(/\s+/g, ' ')  // collapse whitespace
                      .trim();
                  })
                  .filter(l => l);
                console.log('after scrape (html dd), extracted ingredients', ingredients);
              }
            }
          }
          // final fallback: look for an H4 heading "Ingredienti" followed by <li> items
          if ((!ingredients || ingredients.length === 0) && html) {
            const h4idx = html.search(/<h4[^>]*>\s*Ingredienti\s*<\/h4>/i);
            if (h4idx !== -1) {
              let rest = html.slice(h4idx);
              // if the template includes a marker comment we can stop there
              const endMarker = '<!-- Ingredients row end -->';
              const endPos = rest.indexOf(endMarker);
              if (endPos !== -1) {
                rest = rest.slice(0, endPos);
              }
              const liRegex = /<li[^>]*>([\s\S]*?)<\/li>/gi;
              const liMatches = [...rest.matchAll(liRegex)];
              if (liMatches.length) {
                ingredients = liMatches
                  .map(m => m[1].replace(/<[^>]+>/g, '').trim())
                  .filter(l => l);
                console.log('after scrape (h4+li fallback), ingredients', ingredients);
              }
            }
          }
        }
      } catch (e) {
        console.error('error during scraping:', e);
        // ignore fetch errors, keep original title/instructions
      }
    }
    const client = createClient({
      url: tursoConfig.TURSO_DB_URL,
      authToken: tursoConfig.TURSO_DB_TOKEN,
    });
    // check for duplicate when link is present
    if (link) {
      const dup = await client.execute(
        'SELECT COUNT(*) as cnt FROM recipes WHERE uid = ? AND link = ?',
        [uid, link]
      );
      if (dup.rows && dup.rows[0] && dup.rows[0].cnt > 0) {
        // return success flag false instead of HTTP error so client doesn't log 409
        return NextResponse.json({ success: false, error: 'Ricetta già esistente' });
      }
    }
    await client.execute(
      'INSERT INTO recipes (uid, title, categoria, ingredients, instructions, image, link) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [
        uid,
        title,
        categoria,
        JSON.stringify(ingredients || []),
        JSON.stringify(instructions || ''),
        image,
        link,
      ]
    );
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function GET(request) {
  try {
    const uid = request.nextUrl.searchParams.get('uid');
    const categoria = request.nextUrl.searchParams.get('categoria');
    if (!uid) {
      return NextResponse.json({ error: 'UID mancante' }, { status: 400 });
    }
    const client = createClient({
      url: tursoConfig.TURSO_DB_URL,
      authToken: tursoConfig.TURSO_DB_TOKEN,
    });
    let sql = 'SELECT id, title, categoria, ingredients, instructions, image, link, created_at FROM recipes WHERE uid = ?';
    const params = [uid];
    if (categoria) {
      sql += ' AND categoria = ?';
      params.push(categoria);
    }
    sql += ' ORDER BY created_at DESC';
    const result = await client.execute(sql, params);
    return NextResponse.json({ recipes: result.rows });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
