"use client";
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import styles from './login.module.css';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showCodePanel, setShowCodePanel] = useState(false);
  const [code, setCode] = useState('');
  const [codeError, setCodeError] = useState('');

  // Focus automatico sul primo box quando si apre il modal
  useEffect(() => {
    if (showCodePanel) {
      setTimeout(() => {
        document.getElementById('code-box-0')?.focus();
      }, 50);
    }
  }, [showCodePanel]);
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
          placeholder="👤 Email"
          value={email}
          onChange={e => setEmail(e.target.value)}
        />
        <input
          type="password"
          placeholder="🔒 Password"
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
          Non hai un account? <a href="#" style={{ color: '#0070f3', textDecoration: 'underline' }} onClick={e => { e.preventDefault(); setShowCodePanel(true); }}>Registrati</a>
        </div>
      </form>
      {showCodePanel && (
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
          zIndex: 2000
        }}>
          <div style={{ background: '#eee', padding: 32, borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.15)', minWidth: 280, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <img src="/icon.svg" alt="Logo Lista Spesa" style={{ width: 56, height: 56, margin: '0 auto 12px auto', display: 'block' }} />
            <h3 style={{ marginBottom: 16, textAlign: 'center', color: '#333' }}>CODICE DI REGISTRAZIONE</h3>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginBottom: 12 }}>
              {[0,1,2,3,4,5].map(i => (
                <input
                  key={i}
                  type="text"
                  maxLength={1}
                  value={code[i] || ''}
                  onChange={e => {
                    let val = e.target.value.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
                    let newCode = code.split('');
                    if (val) {
                      newCode[i] = val;
                      setCode(newCode.join('').padEnd(6, ''));
                      // Focus automatico avanti
                      if (i < 5) {
                        document.getElementById('code-box-' + (i+1))?.focus();
                      }
                    } else {
                      newCode[i] = '';
                      setCode(newCode.join('').padEnd(6, ''));
                    }
                  }}
                  onKeyDown={e => {
                    if (e.key === 'Backspace' && !code[i] && i > 0) {
                      document.getElementById('code-box-' + (i-1))?.focus();
                    }
                  }}
                  id={`code-box-${i}`}
                  style={{
                    width: 40,
                    height: 48,
                    fontSize: 28,
                    textAlign: 'center',
                    border: '1.5px solid #bbb',
                    borderRadius: 6,
                    background: '#fff',
                    outline: 'none',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.04)'
                  }}
                  autoFocus={i === 0}
                />
              ))}
            </div>
            {codeError && <div style={{ color: '#d32f2f', fontSize: 14, marginBottom: 8, textAlign: 'center' }}>{codeError}</div>}
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginTop: 30 }}>
              <button type="button" style={{ padding: '8px 16px', borderRadius: 4, border: 'none', background: '#0070f3', color: '#fff', fontWeight: 600, cursor: 'pointer' }}
                onClick={() => {
                  if (code === '270271') {
                    setShowCodePanel(false);
                    setCode('');
                    setCodeError('');
                    router.push('/register');
                  } else {
                    setCodeError('Codice errato');
                  }
                }}
              >Conferma</button>
              <button type="button" style={{ padding: '8px 16px', borderRadius: 4, border: 'none', background: '#bbb', color: '#222', fontWeight: 600, cursor: 'pointer' }}
                onClick={() => { setShowCodePanel(false); setCode(''); setCodeError(''); }}
              >Annulla</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
