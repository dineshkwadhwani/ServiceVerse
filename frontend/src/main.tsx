import React from 'react'
import ReactDOM from 'react-dom/client'
import { App } from './App.tsx'
import './styles/globals.css'

// Global error handler to catch unhandled errors
window.addEventListener('error', (event) => {
  console.error('[CRITICAL] Global unhandled error:', {
    message: event.message,
    filename: event.filename,
    lineno: event.lineno,
    colno: event.colno,
    stack: event.error?.stack,
  });
});

// Unhandled promise rejection handler
window.addEventListener('unhandledrejection', (event) => {
  console.error('[CRITICAL] Unhandled promise rejection:', {
    reason: event.reason,
    stack: event.reason?.stack,
  });
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
