"use client";
import styles from "./default.module.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { icons } from "../icons";
import QRModal from "../QRModal";
import React, { useEffect, useState } from "react";


export default function DefaultPage() {

  const [prodotti, setProdotti] = useState([]);
  const [loading, setLoading] = useState(true);
  const [nuovoProdotto, setNuovoProdotto] = useState("");
  const [showAlert, setShowAlert] = useState(false);
  const [showQR, setShowQR] = useState(false);

  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('user_token') : null;
    if (!token) return;
    setLoading(true);
    setTimeout(() => {
      fetch(`/api/prodotti?uid=${token}`)
        .then(res => res.json())
        .then(data => {
          setProdotti(data.prodotti || []);
          setLoading(false);
        })
        .catch(() => setLoading(false));
    }, 2000);
  }, []);

  const handleCheck = async (id, checked) => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('user_token') : null;
    if (!token) return;
    await fetch('/api/prodotti', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ uid: token, id, checked: checked ? 1 : 0 })
    });
    fetch(`/api/prodotti?uid=${token}`)
      .then(res => res.json())
      .then(data => setProdotti(data.prodotti || []));
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
            <FontAwesomeIcon icon={icons.download} title="Download" style={{ cursor: 'pointer' }} onClick={() => setShowQR(true)} />
            <FontAwesomeIcon
              icon={icons.logout}
              title="Logout"
              style={{ cursor: 'pointer' }}
              onClick={() => {
                if (typeof window !== 'undefined') {
                  localStorage.removeItem('user_token');
                  window.location.href = '/login';
                }
              }}
            />
          </div>
        </div>
      </nav>
      <div className={styles.corpo}>
        <div style={{ textAlign: 'center', fontWeight: 700, fontSize: 24, marginBottom: 24 }}>
          La tua lista della spesa
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
            const token = typeof window !== 'undefined' ? localStorage.getItem('user_token') : null;
            if (!token) return;
            setLoading(true);
            await fetch('/api/prodotti', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ uid: token, nome })
            });
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
        {loading ? (
          <div className={styles.tabella} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 120 }}>
            <span className={styles.spinner}></span>
          </div>
        ) : prodotti.length === 0 ? (
          <div style={{ color: '#d32f2f', textAlign: 'center', fontWeight: 600, fontSize: 18, margin: '40px 0' }}>
            Nessun prodotto da comprare
          </div>
        ) : (
          <div className={styles.tabella}>
            <table className={styles.tabella_table}>
              <tbody>
                {prodotti.map(prod => (
                  <tr key={prod.id}>
                    <td className={styles.tabella_td} style={{ textAlign: 'center', width: 36 }}>
                      <input
                        type="checkbox"
                        checked={prod.checked === 1}
                        onChange={e => handleCheck(prod.id, e.target.checked)}
                      />
                    </td>
                    <td className={styles.tabella_td} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={prod.checked === 1 ? { textDecoration: 'line-through', color: '#888' } : {}}>
                        {prod.nome}
                      </span>
                      <FontAwesomeIcon
                        icon={icons.trash}
                        style={{ color: '#d32f2f', cursor: 'pointer', marginLeft: 12, width: 14, height: 14 }}
                        title="Elimina"
                        onClick={async () => {
                          const token = typeof window !== 'undefined' ? localStorage.getItem('user_token') : null;
                          if (!token) return;
                          setLoading(true);
                          await fetch('/api/prodotti', {
                            method: 'DELETE',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ uid: token, id: prod.id })
                          });
                          setTimeout(() => {
                            fetch(`/api/prodotti?uid=${token}`)
                              .then(res => res.json())
                              .then(data => setProdotti(data.prodotti || []))
                              .finally(() => setLoading(false));
                          }, 2000);
                        }}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
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
                const token = typeof window !== 'undefined' ? localStorage.getItem('user_token') : null;
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
