"use client";
import SWVersion from './SWVersion';

export default function ClientLayout({ children }) {
  return (
    <>
      {children}
      <div style={{ height: '10px', backgroundColor: 'transparent' }}></div>
      <footer className="appFooter">CREATED By Vincenzo</footer>
      <SWVersion />
    </>
  );
} 
