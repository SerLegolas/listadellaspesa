"use client";
import React, { createContext, useContext, useState } from 'react';

const NotificationContext = createContext(null);

export const NotificationProvider = ({ children }) => {
  const [message, setMessage] = useState(null);

  const show = (msg) => {
    setMessage(msg);
    setTimeout(() => setMessage(null), 3000);
  };

  return (
    <NotificationContext.Provider value={show}>
      {children}
      {message && (
        <div className="toast">
          {message}
        </div>
      )}
    </NotificationContext.Provider>
  );
};

export const useNotification = () => useContext(NotificationContext);
