"use client";
import styles from "./default.module.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { icons } from "../icons";
import QRModal from "../QRModal";
import React, { useEffect, useState } from "react";
import { useRouter } from 'next/navigation';
import { useNotification } from '../notification/NotificationProvider';


export default function DefaultPage() {

  const [prodotti, setProdotti] = useState([]);
  const [loading, setLoading] = useState(true);
  const [nuovoProdotto, setNuovoProdotto] = useState("");
  const [showAlert, setShowAlert] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [showDownload, setShowDownload] = useState(false);
  const [selectAll, setSelectAll] = useState(false);
  const notify = useNotification();

  const router = useRouter();

  useEffect(() => {
    let token = sessionStorage.getItem('user_token');
    async function fetchProdotti(uid) {
      setLoading(true);
      try {
        const res = await fetch(`/api/prodotti?uid=${uid}`);
        const data = await res.json();
        setProdotti(data.prodotti || []);
      } catch {
        // ignore
      }
      setLoading(false);
    }

    async function tryAutoLogin() {
      // cerca cookie con credenziali
      const stored = document.cookie.split(';').map(c => c.trim()).find(c => c.startsWith('creds='));
      if (stored) {
        const enc = stored.split('=')[1];
        try {
          const dec = await decryptText(enc);
          const [u, p] = dec.split('||');
          if (u && p) {
            // esegui login API
            const res = await fetch('/api/login', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ username: u, password: p })
            });
            const data = await res.json();
            if (data.success) {
              sessionStorage.setItem('user_token', data.user.uid);
              return data.user.uid;
            }
          }
        } catch (e) {
          // ignore
        }
      }
      return null;
    }

    (async () => {
      if (!token) {
        // prova a fare auto-login
        token = await tryAutoLogin();
      }
      if (!token) {
        router.push('/login');
        return;
      }
      await fetchProdotti(token);
    })();

    // determiniamo se mostrare download (client-only)
    if (!window.matchMedia('(display-mode: standalone)').matches) {
      setShowDownload(true);
    }
  }, []);

  const handleCheck = async (id, checked) => {
    const token = typeof window !== 'undefined' ? sessionStorage.getItem('user_token') : null;
    if (!token) return;
    await fetch('/api/prodotti', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ uid: token, id, checked: checked ? 1 : 0 })
    });
    fetch(`/api/prodotti?uid=${token}`)
      .then(res => res.json())
      .then(data => {
        const list = data.prodotti || [];
        setProdotti(list);
        // update selectAll state based on returned data
        setSelectAll(list.length > 0 && list.every(p => p.checked === 1));
      });
  };

  const handleSelectAll = async (checked) => {
    const token = typeof window !== 'undefined' ? sessionStorage.getItem('user_token') : null;
    if (!token) return;
    setLoading(true);
    // send update for each product
    await Promise.all(
      prodotti.map(p =>
        fetch('/api/prodotti', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ uid: token, id: p.id, checked: checked ? 1 : 0 })
        })
      )
    );
    // refresh list
    fetch(`/api/prodotti?uid=${token}`)
      .then(res => res.json())
      .then(data => setProdotti(data.prodotti || []))
      .finally(() => {
        setLoading(false);
        setSelectAll(checked);
      });
  };

  return (
    <main className={styles.main}>
      <nav className={styles.navbar}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <img src="/icon.svg" alt="Logo" style={{ height: 32, width: 32 }} />
            <span className={styles.logo}>Lista Spesa</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
            <FontAwesomeIcon
              icon={icons.download}
              title="Download"
              style={{ cursor: 'pointer', display: showDownload ? 'inline-block' : 'none' }}
              onClick={() => setShowQR(true)}
            />
            <FontAwesomeIcon
              icon={icons.table}
              title="Elenco ricette"
              style={{ cursor: 'pointer' }}
              onClick={() => {
                if (typeof window !== 'undefined') {
                  window.location.href = '/elenco-ricette';
                }
              }}
            />
            <FontAwesomeIcon
              icon={icons.logout}
              title="Logout"
              style={{ cursor: 'pointer' }}
              onClick={() => {
                if (typeof window !== 'undefined') {
                  sessionStorage.removeItem('user_token');
                  window.location.href = '/login';
                }
              }}
            />
          </div>
        </div>
      </nav>
      <div className={styles.corpo}>
        <div className="pageTitle">
          Inserisci nuovo prodotto
        </div>
        <form
          className={styles['form-container']}
          onSubmit={async e => {
            e.preventDefault();
            const nome = nuovoProdotto.trim();
            if (!nome) {
              setShowAlert(true);
              setTimeout(() => setShowAlert(false), 3000);
              return;
            }
            const token = typeof window !== 'undefined' ? sessionStorage.getItem('user_token') : null;
            if (!token) return;
            setLoading(true);
            await fetch('/api/prodotti', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ uid: token, nome })
            });
            notify('Aggiunto prodotto nella lista');
            setNuovoProdotto("");
            setTimeout(() => {
              fetch(`/api/prodotti?uid=${token}`)
                .then(res => res.json())
                .then(data => setProdotti(data.prodotti || []))
                .finally(() => setLoading(false));
            }, 2000);
          }}
        >
          <input
            type="text"
            placeholder="Aggiungi prodotto..."
            value={nuovoProdotto}
            onChange={e => setNuovoProdotto(e.target.value)}
          />
          <button type="submit">Aggiungi</button>
        </form>
        {showAlert && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            pointerEvents: 'none',
          }}>
            <div style={{
              background: '#fff',
              border: '2px solid #d32f2f',
              color: '#d32f2f',
              fontWeight: 600,
              fontSize: 18,
              padding: '24px 32px',
              borderRadius: 8,
              boxShadow: '0 2px 16px rgba(0,0,0,0.18)',
              display: 'flex',
              alignItems: 'center',
              gap: 16,
            }}>
              <FontAwesomeIcon icon={icons.times} style={{ color: '#d32f2f', width: 24, height: 24 }} />
              Inserisci un prodotto
            </div>
          </div>
        )}
        {/* heading above product list */}
        <div style={{ textAlign: 'center', fontWeight: 700, fontSize: 'inherit', margin: '12px 0', color: '#888', textTransform: 'uppercase' }}>
          La tua lista della spesa
        </div>
        {loading && (
          <div className={styles.tabella} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 120 }}>
            <span className={styles.spinner}></span>
          </div>
        )}
        {!loading && prodotti.length === 0 && (
          <div style={{ textAlign: 'center', color: '#d32f2f', textTransform: 'uppercase', margin: '40px 0' }}>
            LISTA VUOTA
          </div>
        )}
        {!loading && prodotti.length > 0 && (
          <>
            <div style={{ marginBottom: 8 }}>
              <label style={{ fontSize: 14, display: 'flex', alignItems: 'center', gap: 4 }}>
                <input
                  type="checkbox"
                  checked={selectAll}
                  onChange={e => handleSelectAll(e.target.checked)}
                />
                Selezione tutti
              </label>
            </div>
            <div className={styles.tabella}>
              <table className={styles.tabella_table}>
                <tbody>
                {prodotti.map(prod => (
                  <tr key={prod.id} className={prod.checked === 1 ? styles.checkedRow : ''}>
                    <td className={styles.tabella_td}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-start", width: '100%' }}>
                        <input
                          type="checkbox"
                          checked={prod.checked === 1}
                          onChange={e => handleCheck(prod.id, e.target.checked)}
                          style={{ marginRight: 12 }}
                        />
                        <span
                          style={
                            prod.checked === 1
                              ? { textDecoration: "line-through", color: "#888" }
                              : {}
                          }
                        >
                          {(() => {
                            const parts = prod.nome.split('|||');
                            const base = parts[0] || '';
                            const source = parts[1] || '';
                            return (
                              <>
                                {base}
                                {source && (
                                  <div style={{ fontSize: '0.8em', fontStyle: 'italic', color: '#555' }}>
                                    {source}
                                  </div>
                                )}
                              </>
                            );
                          })()}
                        </span>
                        <FontAwesomeIcon
                          icon={icons.trash}
                          style={{
                            color: '#d32f2f',
                            cursor: 'pointer',
                            marginLeft: 'auto',
                            width: 14,
                            height: 14
                          }}
                          title="Elimina"
                          onClick={async () => {
                            const token = typeof window !== 'undefined' ? sessionStorage.getItem('user_token') : null;
                            if (!token) return;
                            setLoading(true);
                            await fetch('/api/prodotti', {
                              method: 'DELETE',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ uid: token, id: prod.id })
                            });
                            notify('Prodotto eliminato');
                            setTimeout(() => {
                              fetch(`/api/prodotti?uid=${token}`)
                                .then(res => res.json())
                                .then(data => setProdotti(data.prodotti || []))
                                .finally(() => setLoading(false));
                            }, 2000);
                          }}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          </>
        )}
        {prodotti.some(p => p.checked === 1) && (
          <div style={{ display: 'flex', justifyContent: 'center', marginTop: 24 }}>
            <button
              style={{
                background: '#28a745',
                color: '#fff',
                border: 'none',
                borderRadius: 4,
                fontWeight: 600,
                fontSize: 16,
                padding: '12px 32px',
                cursor: 'pointer',
                boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
              }}
              onClick={async () => {
                const token = typeof window !== 'undefined' ? sessionStorage.getItem('user_token') : null;
                if (!token) return;
                setLoading(true);
                const checkedIds = prodotti.filter(p => p.checked === 1).map(p => p.id);
                await Promise.all(
                  checkedIds.map(id =>
                    fetch('/api/prodotti', {
                      method: 'PUT',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ uid: token, id, checked: 2 })
                    })
                  )
                );
                setTimeout(() => {
                  fetch(`/api/prodotti?uid=${token}`)
                    .then(res => res.json())
                    .then(data => setProdotti(data.prodotti || []))
                    .finally(() => setLoading(false));
                }, 2000);
              }}
            >
              Spesa finita
            </button>
          </div>
        )}
      </div>
      <QRModal
        show={showQR}
        onClose={() => setShowQR(false)}
        qrUrl="https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=https://listadellaspesa-sigma.vercel.app/"
      />
    </main>
  );
}
