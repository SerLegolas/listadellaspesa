import React from 'react';

export default function QRModal({ show, onClose, qrUrl }) {
  if (!show) return null;
  return (
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
      zIndex: 1000
    }}>
      <div style={{ background: '#fff', padding: 24, borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.2)', textAlign: 'center' }}>
        <h3>Scarica l'app PWA</h3>
        <img src={qrUrl} alt="QR Code" style={{ width: 200, height: 200, margin: '16px auto' }} />
        <p>Scansiona il QR code con il tuo cellulare per installare l'app.</p>
        <button onClick={onClose} style={{ marginTop: 16, padding: '8px 16px', background: '#0070f3', color: '#fff', border: 'none', borderRadius: 4 }}>Chiudi</button>
      </div>
    </div>
  );
}
