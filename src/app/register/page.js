"use client";
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import styles from './register.module.css';

export default function Register() {
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !username || !password) {
      setError('Compila tutti i campi');
      return;
    }
    // Controllo formato email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(username)) {
      setError('Inserisci una email valida');
      return;
    }
    setError('');
    setLoading(true);
    const uid = crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2);
    try {
      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, username, password, uid })
      });
      const data = await res.json();
      setLoading(false);
      if (data.success) {
        setLoading(true);
        setTimeout(() => {
          setLoading(false);
          router.push('/login');
        }, 3000);
      } else {
        setError(data.error || 'Errore registrazione');
      }
    } catch (err) {
      setLoading(false);
      setError('Errore di rete');
    }
  };

  return (
    <div className={styles.container}>
      <form className={styles.form} onSubmit={handleSubmit}>
        <img src="/icon.svg" alt="Logo Lista Spesa" style={{ width: 64, height: 64, margin: '0 auto 8px auto', display: 'block' }} />
        <h2>Crea il tuo account</h2>
        <input
          type="text"
          placeholder="Nome"
          value={name}
          onChange={e => setName(e.target.value)}
        />
        <input
          type="text"
          placeholder="Username"
          value={username}
          onChange={e => setUsername(e.target.value)}
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={e => setPassword(e.target.value)}
        />
        {error && <div className={styles.error}>{error}</div>}
        <button type="submit" disabled={loading}>
          {loading ? 'Registrazione...' : 'Registrati'}
        </button>
        {loading && (
          <div style={{ textAlign: 'center', marginTop: 8 }}>
            <span className={styles.spinner}></span>
          </div>
        )}
        <div style={{ marginTop: 12, textAlign: 'center', fontSize: 14 }}>
          Hai già un account? <a href="/login" style={{ color: '#0070f3', textDecoration: 'underline' }}>Accedi</a>
        </div>
      </form>
    </div>
  );
}
