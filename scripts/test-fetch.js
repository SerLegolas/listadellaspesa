(async()=>{
  const url = process.argv[2] || 'https://ricette.giallozafferano.it/Lasagne-al-forno.html';
  console.log('testing url', url);
  try {
    const res = await fetch(url);
    console.log('status', res.status);
    const data = await res.text();
    const ldMatch = data.match(/<script[^>]+type=["']application\/ld\+json["'][\s\S]*?<\/script>/i);
    if (ldMatch) {
      try {
        const json = JSON.parse(ldMatch[0].replace(/<script[^>]*>|<\/script>/g,''));
        console.log('ld+json parsed keys', Object.keys(json));
        if (json.recipeIngredient) console.log('ingredients from JSON-LD', json.recipeIngredient);
        if (json.recipeInstructions) console.log('instructions from JSON-LD', json.recipeInstructions);
      } catch(e) {
        console.error('json parse err', e);
      }
    } else {
      console.log('no JSON-LD script found');
    }
  } catch(e) {
    console.error('fetch error', e);
  }
})();
