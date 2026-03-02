"use client";
import SWVersion from './SWVersion';

export default function ClientLayout({ children }) {
  return (
    <>
      {children}
      <footer className="appFooter">CREATED By Vincenzo</footer>
      <SWVersion />
    </>
  );
} 
