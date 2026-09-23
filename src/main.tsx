import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { applyTheme } from '@/design-system/themes';
import { AppTheme } from '@/domain/types';

// Apply saved theme & color mode immediately (before React renders) to prevent flash
const savedTheme = (localStorage.getItem('ktt_theme') as AppTheme) || 'cute';
const savedMode = (localStorage.getItem('ktt_color_mode') as any) || 'light';
applyTheme(savedTheme, savedMode);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
