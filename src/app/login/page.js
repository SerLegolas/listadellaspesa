"use client";
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import styles from './login.module.css';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Inserisci email e password');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: email, password })
      });
      const data = await res.json();
      setLoading(false);
      if (data.success) {
        // Salva token utente (uid)
        if (typeof window !== 'undefined') {
          localStorage.setItem('user_token', data.user.uid);
        }
        router.push('/');
      } else {
        setError(data.error || 'Credenziali non valide');
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
        <h2>La tua Lista Spesa Smart</h2>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={e => setEmail(e.target.value)}
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={e => setPassword(e.target.value)}
        />
        {error && <div className={styles.error}>{error}</div>}
        <button type="submit" disabled={loading}>
          {loading ? 'Accesso...' : 'Accedi'}
        </button>
        {loading && (
          <div style={{ textAlign: 'center', marginTop: 8 }}>
            <span className={styles.spinner}></span>
          </div>
        )}
        <div style={{ marginTop: 12, textAlign: 'center', fontSize: 14 }}>
          Non hai un account? <a href="/register" style={{ color: '#0070f3', textDecoration: 'underline' }}>Registrati</a>
        </div>
      </form>
    </div>
  );
}
