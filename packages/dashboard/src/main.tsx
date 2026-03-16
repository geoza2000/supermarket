import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import './styles/globals.css';
import { registerFirebaseMessagingSW, setupServiceWorkerUpdateListeners } from './lib/serviceWorkerManager';

// Register Firebase Messaging service worker early
if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
  setupServiceWorkerUpdateListeners();

  registerFirebaseMessagingSW().then((registration) => {
    if (registration) {
      console.log('Firebase Messaging SW registered on app start');
    }
  }).catch((error) => {
    console.error('Error registering Firebase Messaging SW:', error);
  });
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);
