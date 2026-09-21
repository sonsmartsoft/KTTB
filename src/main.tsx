import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { applyTheme } from '@/design-system/themes';
import { AppTheme } from '@/domain/types';

// Apply saved theme immediately (before React renders) to prevent flash
const savedTheme = (localStorage.getItem('ktt_theme') as AppTheme) || 'cute';
applyTheme(savedTheme);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
