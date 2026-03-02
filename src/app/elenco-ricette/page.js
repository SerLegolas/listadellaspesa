"use client";
import React, { useEffect, useState } from "react";
import { useNotification } from '../notification/NotificationProvider';
import { useRouter } from "next/navigation";
import navStyles from "../default/default.module.css";
import styles from "./elenco-ricette.module.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { icons } from "../icons";

export default function ElencoRicettePage() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const notify = useNotification();
  const [formData, setFormData] = useState({ title: '', ingredients: '', instructions: '' });
  const [activeCat, setActiveCat] = useState('');
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [linkValue, setLinkValue] = useState('');
  const [recipes, setRecipes] = useState([]);
  const [showRecipeDetails, setShowRecipeDetails] = useState(false);
  const [selectedRecipe, setSelectedRecipe] = useState(null);

  // helper to load recipes for a category (used when selecting and after adding)
  const loadRecipes = (cat) => {
    const uid = sessionStorage.getItem('user_token');
    if (!uid || !cat) return;
    fetch(`/api/recipes?uid=${uid}&categoria=${encodeURIComponent(cat)}`)
      .then(r => r.json())
      .then(d => {
        const recs = (d.recipes || []).map(r => ({
          ...r,
          ingredients: typeof r.ingredients === 'string' ? JSON.parse(r.ingredients) : r.ingredients,
          instructions: typeof r.instructions === 'string' ? JSON.parse(r.instructions) : r.instructions,
        }));
        setRecipes(recs);
      });
  };

  // predefinizioni per categorie note
  const categoryDetails = {
    'antipasti': {
      title: 'Antipasti',
      // immagine trovata con ricerca "appetizer" su Unsplash
      image: 'https://images.unsplash.com/photo-1551218808-94e220e084d2?auto=format&fit=crop&w=800&q=80',
      description: 'Piccoli assaggi per iniziare il pasto.'
    },
    'primi piatti': {
      title: 'Primi',
      // immagine trovata con ricerca "pasta dish" su Unsplash
      image: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=800&q=80',
      description: 'Piatti a base di pasta, riso e zuppe.'
    },
    'secondi piatti': {
      title: 'Secondi',
      // immagine trovata con ricerca "meat" su Unsplash
      image: 'https://images.unsplash.com/photo-1511690743698-d9d85f2fbf38?auto=format&fit=crop&w=800&q=80',
      description: 'Carni e pesci per il pasto principale.'
    },
    'dolci': {
      title: 'Dolci',
      // immagine trovata con ricerca "dessert" su Unsplash
      image: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=800&q=80',
      description: 'Dessert e dolcezze per concludere il pasto.'
    }
  };

  useEffect(() => {
    const token = sessionStorage.getItem("user_token");
    if (!token) {
      router.push("/login");
      return;
    }
    fetch(`/api/recipes/categories?uid=${token}`)
      .then((res) => res.json())
      .then((data) => {
        setCategories(data.categories || []);
      })
      .finally(() => setLoading(false));
  }, [router]);

  return (
    <main className={navStyles.main}>
      <nav className={navStyles.navbar}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <img src="/icon.svg" alt="Logo" style={{ height: 32, width: 32 }} />
            <span className={navStyles.logo}>Ricettario</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
            <FontAwesomeIcon
              icon={icons.home}
              title="Torni alla lista"
              style={{ cursor: "pointer" }}
              onClick={() => {
                if (typeof window !== 'undefined') window.location.href = "/default";
              }}
            />
            <FontAwesomeIcon
              icon={icons.logout}
              title="Logout"
              style={{ cursor: "pointer" }}
              onClick={() => {
                sessionStorage.removeItem("user_token");
                window.location.href = "/login";
              }}
            />
          </div>
        </div>
      </nav>
      <div className={navStyles.corpo}>
        {loading ? (
          <div style={{ textAlign: "center" }}>Caricamento...</div>
        ) : (
          <>
            <div className="pageTitle" style={{ textAlign: 'center', margin: '16px 0', fontWeight: 700, color: '#888', textTransform: 'uppercase' }}>
              Categorie ricette
            </div>
            <div className={styles.cardContainer}>
              {Object.keys(categoryDetails).map(k => {
                // find count from categories array
                const found = categories.find(c => c.categoria === k);
                const cat = { categoria: k, count: found ? found.count : 0 };
                const key = cat.categoria || 'senza';
                const details = categoryDetails[key.toLowerCase()] || {};
                return (
                  <div
                    key={key}
                    className={styles.card}
                    onClick={() => {
                      if (activeCat === key) {
                        setActiveCat('');
                        setRecipes([]);
                        return;
                      }
                      setActiveCat(key);
                      const uid = sessionStorage.getItem('user_token');
                      if (uid) {
                        fetch(`/api/recipes?uid=${uid}&categoria=${encodeURIComponent(key)}`)
                          .then(r => r.json())
                          .then(d => {
                            const recs = (d.recipes || []).map(r => ({
                              ...r,
                              ingredients: typeof r.ingredients === 'string' ? JSON.parse(r.ingredients) : r.ingredients,
                              instructions: typeof r.instructions === 'string' ? JSON.parse(r.instructions) : r.instructions,
                            }));
                            setRecipes(recs);
                          });
                      }
                    }}
                    style={{ cursor: 'pointer' }}
                  >
                    {details.image && <img src={details.image} alt={key} className={styles.cardImage} />}
                    <div className={styles.cardBody}>
                      <h3>{details.title || key}</h3>
                      <p>{(details.description || '').substring(0, 100)}</p>
                      <span>{cat.count} {cat.count === 1 ? 'ricetta' : 'ricette'}</span>
                    </div>
                    <div className={styles.cardFooter}>
                      <FontAwesomeIcon
                        icon={icons.save}
                        title="Aggiungi ricetta"
                        onClick={e => {
                          e.stopPropagation();
                          setActiveCat(key);
                          setFormData({ title: '', ingredients: '', instructions: '' });
                          setShowForm(true);
                      // load existing recipes for this category when opening form
                      loadRecipes(key);
                        }}
                      />
                      <FontAwesomeIcon
                        icon={icons.link}
                        title="Aggiungi link"
                        onClick={e => {
                          e.stopPropagation();
                          setActiveCat(key);
                          setLinkValue('');
                          setShowLinkModal(true);
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
            {activeCat && recipes.length === 0 && !loading && (
              <div style={{ textAlign: 'center', marginTop: 16, color: '#888' }}>
                Non ci sono ricette {categoryDetails[activeCat]?.title || activeCat}
              </div>
            )}
            {showForm && (
              <div className={styles.modalOverlay} onClick={() => setShowForm(false)}>
                <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
                  <h2>Nuova ricetta - {activeCat}</h2>
                  <input
                    type="text"
                    placeholder="Titolo"
                    value={formData.title}
                    onChange={e => setFormData({ ...formData, title: e.target.value })}
                  />
                  <textarea
                    placeholder="Ingredienti"
                    value={formData.ingredients}
                    onChange={e => setFormData({ ...formData, ingredients: e.target.value })}
                    rows={3}
                  />
                  <textarea
                    placeholder="Preparazione"
                    value={formData.instructions}
                    onChange={e => setFormData({ ...formData, instructions: e.target.value })}
                    rows={4}
                  />
                  <button
                    onClick={async () => {
                      const uid = sessionStorage.getItem('user_token');
                      if (!uid) return;
                      if (!formData.title.trim() || !formData.ingredients.trim()) return;
                      console.log('sending recipe', {
                        uid,
                        title: formData.title,
                        categoria: activeCat,
                        ingredients: formData.ingredients.split('\n'),
                        instructions: formData.instructions
                      });
                      await fetch('/api/recipes', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          uid,
                          title: formData.title,
                          categoria: activeCat,
                          ingredients: formData.ingredients.split('\n'),
                          instructions: formData.instructions
                        })
                      });
                      setShowForm(false);
                      // refresh categories count
                      fetch(`/api/recipes/categories?uid=${uid}`)
                        .then(res => res.json())
                        .then(data => setCategories(data.categories || []));
                      // refresh list display to include newly added recipe
                      loadRecipes(activeCat);
                    }}
                  >
                    Salva
                  </button>
                </div>
              </div>
            )}
            {showLinkModal && (
              <div className={styles.modalOverlay} onClick={() => setShowLinkModal(false)}>
                <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
                  <h2>Inserisci link - {activeCat}</h2>
                  <div style={{ fontSize: '0.8em', fontStyle: 'italic', textAlign: 'center', marginBottom: '8px' }}>
                    Puoi inserire solo le ricette prese da www.giallozafferano.it
                  </div>
                  <input
                    type="text"
                    placeholder="URL ricetta"
                    value={linkValue}
                    onChange={e => setLinkValue(e.target.value)}
                  />
                  <button
                    onClick={async () => {
                      const uid = sessionStorage.getItem('user_token');
                      if (!uid || !linkValue.trim()) return;
                      // controlla dominio consentito
                      if (!linkValue.includes('giallozafferano.it')) {
                        notify('Non puoi salvare questa ricetta');
                        return;
                      }
                      // verifica duplicato nella lista caricata (normalizzo stringhe)
                      const normalizedLink = linkValue.trim().toLowerCase();
                      if (recipes.some(r => {
                        const t1 = (r.title || '').trim().toLowerCase();
                        const t2 = (r.link || '').trim().toLowerCase();
                        return t1 === normalizedLink || t2 === normalizedLink;
                      })) {
                        notify('Ricetta già presente');
                        return;
                      }
                      const title = linkValue;
                      try {
                        const res = await fetch('/api/recipes', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({
                            uid,
                            title,
                            categoria: activeCat,
                            ingredients: [],
                            instructions: linkValue
                          })
                        });
                        const data = await res.json();
                        if (data && data.success === false) {
                          notify(data.error || 'Errore salvataggio');
                          return;
                        }
                        // notification for link save (no products added)
                        notify('Ricetta aggiunta');
                        setShowLinkModal(false);
                        fetch(`/api/recipes/categories?uid=${uid}`)
                          .then(res => res.json())
                          .then(data => setCategories(data.categories || []));
                        // after successfully saving link, reload recipes for category
                        loadRecipes(activeCat);
                      } catch (e) {
                        notify('Errore di rete');
                      }
                    }}
                  >
                    Salva link
                  </button>
                </div>
              </div>
            )}
          </>
        )}
        {recipes.length > 0 && (
          <div style={{ marginTop: 24 }}>
            <h3 style={{ textAlign: 'center', color: '#888', textTransform: 'uppercase', fontSize: '16px', fontWeight: 700, margin: '16px 0' }}>
              Le tue ricette
            </h3>
            <div className={styles.cardContainer}>
              {recipes.map((r, idx) => {
                const isNew = idx === 0; // primo elemento è l'ultima aggiunta
                const fallbackImg = categoryDetails[activeCat]?.image;
                // assicuriamoci che la card nuova abbia sempre almeno una foto
                let imgSrc = r.image || fallbackImg;
                if (isNew && !imgSrc) {
                  imgSrc = 'https://via.placeholder.com/300x120?text=Ricetta';
                }
                return (
                  <div
                    key={r.id}
                    className={`${styles.card} ${isNew ? styles.newCard : ''}`}
                    style={{ cursor: 'pointer' }}
                    onClick={() => {
                      setSelectedRecipe(r);
                      setShowRecipeDetails(true);
                    }}
                  >
                    {imgSrc && <img src={imgSrc} alt={r.title} className={styles.cardImage} />}
                    <div className={styles.cardBody} style={{ justifyContent: 'center' }}>
                      <strong style={{ textAlign: 'center' }}>{r.title}</strong>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      {showRecipeDetails && selectedRecipe && (
        <div className={styles.modalOverlay} onClick={() => setShowRecipeDetails(false)}>
          <div
            className={styles.modalContent}
            onClick={e => e.stopPropagation()}
            style={{
              width: '80vw',
              height: '80vh',
              maxWidth: '90vw',
              maxHeight: '90vh',
              overflow: 'auto'
            }}
          >
            <h2>{selectedRecipe.title}</h2>
            {selectedRecipe.image && (
              <img src={selectedRecipe.image} alt={selectedRecipe.title} style={{ width: '100%', maxHeight: 200, objectFit: 'cover', marginBottom: 12 }} />
            )}
            {selectedRecipe.ingredients && selectedRecipe.ingredients.length > 0 && (
              <div>
                <h3>Ingredienti</h3>
                <ul>
                  {selectedRecipe.ingredients.map((ing, i) => <li key={i}>{ing}</li>)}
                </ul>
              </div>
            )}
            {selectedRecipe.instructions && (
              <div>
                <h3>Istruzioni</h3>
                <div style={{ whiteSpace: 'pre-wrap' }}>{selectedRecipe.instructions}</div>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 12 }}>
              <button
                onClick={async () => {
                  // add ingredients to shopping list
                  const uid = typeof window !== 'undefined' ? sessionStorage.getItem('user_token') : null;
                  if (uid && selectedRecipe.ingredients && selectedRecipe.ingredients.length > 0) {
                    try {
                      const recipeName = selectedRecipe.title || '';
                      await Promise.all(
                        selectedRecipe.ingredients.map(ing => {
                          // use a delimiter so we can render recipe name separately
                          const nomeConFonte = recipeName ? `${ing}|||${recipeName}` : ing;
                          return fetch('/api/prodotti', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ uid, nome: nomeConFonte })
                          });
                        })
                      );
                      // alert success with count
                      const addedCount = selectedRecipe.ingredients.length;
                      notify(`Aggiunti ${addedCount} prodotti alla lista`);
                    } catch (e) {
                      // ignore failures
                    }
                  } else {
                    // no ingredients to add, but still notify
                    notify('Nessun ingrediente da aggiungere');
                  }
                  setShowRecipeDetails(false);
                }}
              >
                Aggiungi alla lista
              </button>
              <button onClick={() => setShowRecipeDetails(false)}>Chiudi</button>
            </div>
          </div>
        </div>
      )}
      </div>
    </main>
  );
}
