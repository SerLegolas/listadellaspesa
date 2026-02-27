"use client";
import React, { useState, useEffect } from 'react';

// helper per gestire cookie
function setCookie(name, value, days) {
  let expires = "";
  if (days) {
    const date = new Date();
    date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
    expires = "; expires=" + date.toUTCString();
  }
  document.cookie = name + "=" + (value || "") + expires + "; path=/";
}

function getCookie(name) {
  const nameEQ = name + "=";
  const ca = document.cookie.split(';');
  for (let i = 0; i < ca.length; i++) {
    let c = ca[i];
    while (c.charAt(0) === ' ') c = c.substring(1, c.length);
    if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
  }
  return null;
}

// semplice cifratura con Web Crypto usando chiave derivata fissa
const SECRET_PASSPHRASE = "ReplaceThisWithYourOwnSecret";
const SALT = "fixed-salt";

async function deriveKey() {
  const enc = new TextEncoder();
  const baseKey = await crypto.subtle.importKey(
    'raw',
    enc.encode(SECRET_PASSPHRASE),
    'PBKDF2',
    false,
    ['deriveKey']
  );
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt: enc.encode(SALT), iterations: 100000, hash: 'SHA-256' },
    baseKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}
async function encryptText(text) {
  const key = await deriveKey();
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const enc = new TextEncoder();
  const cipher = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, enc.encode(text));
  const buffer = new Uint8Array(iv.byteLength + cipher.byteLength);
  buffer.set(iv, 0);
  buffer.set(new Uint8Array(cipher), iv.byteLength);
  return btoa(String.fromCharCode.apply(null, buffer));
}
async function decryptText(data) {
  try {
    const raw = atob(data);
    const buffer = new Uint8Array(raw.length);
    for (let i = 0; i < raw.length; i++) buffer[i] = raw.charCodeAt(i);
    const iv = buffer.slice(0, 12);
    const cipher = buffer.slice(12);
    const key = await deriveKey();
    const plain = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, cipher);
    const dec = new TextDecoder();
    return dec.decode(plain);
  } catch (e) {
    return '';
  }
}
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
  const [swVersion, setSwVersion] = useState('');

  // Focus automatico sul primo box quando si apre il modal
  useEffect(() => {
    if (showCodePanel) {
      setTimeout(() => {
        document.getElementById('code-box-0')?.focus();
      }, 50);
    }
  }, [showCodePanel]);
  const router = useRouter();

  // recupera versione service worker se presente
  useEffect(() => {
    async function fetchVersion() {
      if ('caches' in window) {
        try {
          const keys = await caches.keys();
          if (keys && keys.length) {
            setSwVersion(keys[keys.length - 1]);
          }
        } catch (e) {
          // ignore
        }
      }
    }
    fetchVersion();
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then(fetchVersion);
      navigator.serviceWorker.addEventListener('controllerchange', fetchVersion);
    }

    // leggi cookie credenziali
    const stored = getCookie('creds');
    if (stored) {
      // rinnova scadenza
      setCookie('creds', stored, 30);
      decryptText(stored).then(str => {
        const [u, p] = str.split('||');
        if (u) setEmail(u);
        if (p) setPassword(p);
      });
    }
  }, []);

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
          sessionStorage.setItem('user_token', data.user.uid);
          // salva credenziali criptate in cookie
          encryptText(email + '||' + password).then(enc => {
            setCookie('creds', enc, 30);
          });
        }
          router.push('/default'); // Reindirizza alla pagina default
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
        {swVersion && (
          <div style={{ marginTop: 16, textAlign: 'center', fontSize: 12, color: '#888' }}>
            SW cache: {swVersion}
          </div>
        )}
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
