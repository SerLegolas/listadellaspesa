"use client";
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import styles from './login/login.module.css';

export default function ListaSpesa() {
  const [items, setItems] = useState([]);
  const [newItem, setNewItem] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
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
      });
  }, [router]);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!newItem.trim()) return;
    setLoading(true);
    const token = typeof window !== 'undefined' ? localStorage.getItem('user_token') : null;
    const res = await fetch('/api/prodotti', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ uid: token, nome: newItem.trim() })
    });
    const data = await res.json();
    setLoading(false);
    if (data.success) {
      // Ricarica prodotti
      fetch(`/api/prodotti?uid=${token}`)
        .then(res => res.json())
        .then(data => {
          setItems(data.prodotti || []);
        });
      setNewItem('');
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f5f5f5', display: 'flex', flexDirection: 'column' }}>
      <nav style={{
        width: '100%',
        background: '#fff',
        boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
        padding: '0.5rem 1rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'flex-start',
        position: 'sticky',
        top: 0,
        zIndex: 10
      }}>
        <img src="/icon.svg" alt="Logo Lista Spesa" style={{ width: 40, height: 40, marginRight: 12 }} />
        <span style={{ fontWeight: 600, fontSize: '1.2rem', color: '#0070f3' }}>Lista Spesa</span>
      </nav>
      <main style={{ flex: 1, width: '100vw', minHeight: '90vh', display: 'flex', justifyContent: 'center', alignItems: 'stretch', padding: 0 }}>
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
                  <input type="checkbox" checked={item.checked === 1} readOnly style={{ marginRight: 8 }} />
                  {item.nome}
                </li>
              ))}
            </ul>
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
