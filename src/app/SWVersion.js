"use client";
import { useEffect, useState } from 'react';

export default function SWVersion() {
  const [version, setVersion] = useState('');

  useEffect(() => {
    if ('caches' in window) {
      caches.keys().then(keys => {
        if (keys && keys.length) {
          // ordinati alfabeticamente, l'ultimo è il più recente
          const filtered = keys.filter(k => k.startsWith('listaspesa-'));
          filtered.sort();
          const idx = filtered.length;
          setVersion(`listadellaspesa V${idx}`);
        }
      }).catch(() => {});
    }
  }, []);

  if (!version) return null;

  return (
    <div style={{
      position: 'fixed',
      bottom: 4,
      right: 4,
      fontSize: 10,
      color: '#666',
      background: 'rgba(255,255,255,0.8)',
      padding: '2px 4px',
      borderRadius: 4,
      zIndex: 9999
    }}>
      SW cache: {version}
    </div>
  );
}
