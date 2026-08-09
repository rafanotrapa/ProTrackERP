// Harus paling awal: mengalihkan kunci autentikasi ke sessionStorage bila tab
// ini dijalankan dalam mode akun-per-tab, sebelum modul lain membacanya.
import { pasangSessionScope } from './utils/sessionScope';
pasangSessionScope();

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
