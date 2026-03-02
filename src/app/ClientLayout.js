"use client";
import SWVersion from './SWVersion';

export default function ClientLayout({ children }) {
  return (
    <>
      {children}
      <SWVersion />
    </>
  );
}
