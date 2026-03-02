# Scraping GialloZafferano

Questo è un piccolo snippet di codice (node.js) utilizzato nell'applicazione
per leggere/analizzare la pagina di una ricetta presa da www.giallozafferano.it.
La funzione effettua una `fetch` dell'URL e poi cerca nel blocco JSON‑LD
(`application/ld+json`) le proprietà `recipeIngredient` e `recipeInstructions`.

```js
// minimale helper per estrarre ingredienti/istruzioni da una pagina Giallo
async function scrapeGZ(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`fetch failed: ${res.status}`);
  const html = await res.text();

  // troviamo il blocco JSON-LD
  const ldMatch = html.match(/<script[^>]+type=["']application\/ld\+json["'][\s\S]*?<\/script>/i);
  if (!ldMatch) {
    return { ingredients: [], instructions: '' };
  }

  let json;
  try {
    json = JSON.parse(ldMatch[0].replace(/<script[^>]*>|<\/script>/g, ''));
  } catch (e) {
    console.error('parsing JSON-LD failed', e);
    return { ingredients: [], instructions: '' };
  }

  const ingredients = Array.isArray(json.recipeIngredient)
    ? json.recipeIngredient
    : typeof json.recipeIngredient === 'string'
      ? json.recipeIngredient.split(/,\s*/)
      : [];

  let instructions = '';
  if (json.recipeInstructions) {
    if (Array.isArray(json.recipeInstructions)) {
      instructions = json.recipeInstructions.join('\n');
    } else if (typeof json.recipeInstructions === 'string') {
      instructions = json.recipeInstructions;
    }
  }

  return { ingredients, instructions };
}
```

Questo frammento viene utilizzato, ad esempio, in `src/app/api/recipes/route.js`
visto che il sito impacchetta l'intera ricetta nel JSON‑LD. In caso di modifiche
alla struttura del sito, è sufficiente aggiornare questa funzione.
