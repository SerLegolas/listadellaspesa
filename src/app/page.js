"use client";
import React, { useState, useEffect } from 'react';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { icons } from './icons';
import { iconWrapperStyle, iconStyle } from './IconStyle';
import QRModal from './QRModal';
import { useRouter } from 'next/navigation';
import styles from './login/login.module.css';

export default function ListaSpesa() {
    // Funzione per fleggare/sfleggare un prodotto
    const handleCheck = async (id, checked) => {
      const token = typeof window !== 'undefined' ? localStorage.getItem('user_token') : null;
      try {
        await fetch('/api/prodotti', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ uid: token, id, checked: checked ? 1 : 0 })
        });
        fetch(`/api/prodotti?uid=${token}`)
          .then(res => res.json())
          .then(data => {
            setItems(data.prodotti || []);
          });
      } catch (err) {
        console.error('Errore aggiornamento checked:', err);
      }
    };
  const [items, setItems] = useState([]);
  const [newItem, setNewItem] = useState('');
  const [loading, setLoading] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [showEndModal, setShowEndModal] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Controlla se siamo in modalità standalone (PWA installata)
    if (typeof window !== 'undefined') {
      const standalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;
      setIsStandalone(!!standalone);
    }
    const token = typeof window !== 'undefined' ? localStorage.getItem('user_token') : null;
    if (!token) {
      router.push('/login');
      return;
    }
    // Carica prodotti
    fetch(`/api/prodotti?uid=${token}`)
      .then(res => res.json())
      .then(data => {
        setItems(data.prodotti || []);
      })
      .catch(err => {
        console.error('Errore caricamento prodotti:', err);
        setItems([]);
      });
  }, [router]);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!newItem.trim()) return;
    setLoading(true);
    const token = typeof window !== 'undefined' ? localStorage.getItem('user_token') : null;
    try {
      const res = await fetch('/api/prodotti', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uid: token, nome: newItem.trim() })
      });
      const data = await res.json();
      setLoading(false);
      if (data.success) {
        fetch(`/api/prodotti?uid=${token}`)
          .then(res => res.json())
          .then(data => {
            setItems(data.prodotti || []);
          });
        setNewItem('');
      }
    } catch (err) {
      setLoading(false);
      console.error('Errore aggiunta prodotto:', err);
    }
  };


  // Import degli stili PWA
  const { iconWrapperStyle, iconStyle } = require('./IconStyle');
  const { iconWrapperStylePWA, iconStylePWA } = require('./IconStylePWA');
  const wrapperStyle = isStandalone ? iconWrapperStylePWA : iconWrapperStyle;
  const faStyle = isStandalone ? iconStylePWA : iconStyle;

  return (
    <div style={{ minHeight: '100vh', background: '#f5f5f5', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <nav style={{
        width: '100vw',
        background: '#fff',
        boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
        padding: '0.5rem 1rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'fixed',
        top: 0,
        left: 0,
        zIndex: 1000,
        height: '64px',
        minHeight: '64px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
          <FontAwesomeIcon icon={icons.table} style={{ width: 40, height: 40, marginRight: 12, color: '#0070f3' }} />
          <span style={{ fontWeight: 600, fontSize: '1.2rem', color: '#0070f3' }}>Lista Spesa</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', marginRight: 30 }}>
          <span
            onClick={() => {
              localStorage.removeItem('user_token');
              window.location.reload();
            }}
            style={wrapperStyle}
            title="Logout"
            onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.15)'}
            onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
          >
            <FontAwesomeIcon icon={icons.logout} style={faStyle} />
          </span>
          {!isStandalone && (
            <span
              onClick={() => setShowQR(true)}
              style={wrapperStyle}
              title="Scarica App"
              onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.15)'}
              onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
            >
              <FontAwesomeIcon icon={icons.download} style={faStyle} />
            </span>
          )}
        </div>
      </nav>
      <QRModal show={showQR} onClose={() => setShowQR(false)} qrUrl="https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=https://listadellaspesa-sigma.vercel.app/" />
      <main style={{ flex: 1, width: '100vw', minHeight: '90vh', display: 'flex', justifyContent: 'center', alignItems: 'stretch', padding: 0, marginTop: '64px', overflowY: 'auto' }}>
        <section style={{ width: '100vw', minHeight: '90vh', margin: 0, display: 'flex', justifyContent: 'center', alignItems: 'stretch' }}>
          <div className={styles.form} style={{ gap: 24, width: '100vw', maxWidth: '100vw', minHeight: '90vh', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'flex-start' }}>
            <h2>La tua Lista della Spesa</h2>
            <form onSubmit={handleAdd} style={{ display: 'flex', gap: 8 }}>
              <input
                type="text"
                placeholder="Aggiungi un prodotto"
                value={newItem}
                onChange={e => setNewItem(e.target.value)}
                style={{ flex: 1 }}
              />
              <button type="submit">Aggiungi</button>
            </form>
            <ul style={{ margin: 0, padding: 0, listStyle: 'none', width: '100%' }}>
              {items.length === 0 && <li style={{ color: '#888', textAlign: 'center' }}>Nessun prodotto</li>}
              {items.map((item) => (
                  <li key={item.id} style={{ padding: '8px 0', borderBottom: '1px solid #eee', width: '100%' }}>
                    <input
                      type="checkbox"
                      checked={item.checked === 1}
                      onChange={e => handleCheck(item.id, e.target.checked)}
                      style={{ marginRight: 8 }}
                    />
                    {item.nome}
                  </li>
                ))}
            </ul>
            {items.some(item => item.checked === 1) && (
              <button
                style={{
                  marginTop: 24,
                  alignSelf: 'center',
                  minWidth: 120,
                  background: '#2ecc40',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 4,
                  fontWeight: 600,
                  fontSize: 16,
                  padding: '10px 24px',
                  cursor: 'pointer',
                  transition: 'background 0.2s'
                }}
                onClick={() => setShowEndModal(true)}
              >
                Fine spesa
              </button>
            )}
            {showEndModal && (
              <div style={{
                position: 'fixed',
                top: 0,
                left: 0,
                width: '100vw',
                height: '100vh',
                background: 'rgba(0,0,0,0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 3000
              }}>
                <div style={{ background: '#fff', padding: 32, borderRadius: 10, minWidth: 320, boxShadow: '0 2px 16px rgba(0,0,0,0.18)', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <img src="/icon.svg" alt="Logo Lista Spesa" style={{ width: 64, height: 64, marginBottom: 16, display: 'block' }} />
                  <h3 style={{ marginBottom: 16, textAlign: 'center', color: '#222' }}>Confermi la fine della spesa?</h3>
                  <div style={{ display: 'flex', gap: 16, marginTop: 8 }}>
                    <button style={{ padding: '10px 24px', background: '#2ecc40', color: '#fff', border: 'none', borderRadius: 4, fontWeight: 600, fontSize: 16, cursor: 'pointer' }}
                      onClick={async () => {
                        setShowEndModal(false);
                        const token = typeof window !== 'undefined' ? localStorage.getItem('user_token') : null;
                        // Aggiorna tutti i prodotti checked=1 a checked=2
                        const checkedItems = items.filter(item => item.checked === 1);
                        await Promise.all(checkedItems.map(item =>
                          fetch('/api/prodotti', {
                            method: 'PUT',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ uid: token, id: item.id, checked: 2 })
                          })
                        ));
                        // Ricarica la lista
                        fetch(`/api/prodotti?uid=${token}`)
                          .then(res => res.json())
                          .then(data => {
                            setItems(data.prodotti || []);
                          });
                      }}
                    >Sì</button>
                    <button style={{ padding: '10px 24px', background: '#bbb', color: '#222', border: 'none', borderRadius: 4, fontWeight: 600, fontSize: 16, cursor: 'pointer' }}
                      onClick={() => setShowEndModal(false)}
                    >No</button>
                  </div>
                </div>
              </div>
            )}
            {loading && (
              <div style={{ textAlign: 'center', marginTop: 8 }}>
                <span className={styles.spinner}></span>
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
