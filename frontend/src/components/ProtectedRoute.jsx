import { useEffect } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';

// Token disimpan di localStorage supaya sesi bertahan antar tab, tapi itu juga
// berarti sesi tetap hidup setelah semua tab ditutup. Di komputer kantor yang
// dipakai bergantian, orang berikutnya bisa langsung masuk tanpa password.
// Batas menganggur ini menutupnya dari sisi klien; umur token di server sudah
// dipendekkan jadi 8 jam.
const BATAS_MENGANGGUR_MS = 30 * 60 * 1000;
const KUNCI_AKTIVITAS = 'lastActivityAt';
const PERISTIWA = ['mousedown', 'keydown', 'touchstart', 'scroll'];

export const catatAktivitas = () => {
  localStorage.setItem(KUNCI_AKTIVITAS, String(Date.now()));
};

export const sesiKedaluwarsa = () => {
  const terakhir = Number(localStorage.getItem(KUNCI_AKTIVITAS) || 0);
  return terakhir > 0 && Date.now() - terakhir > BATAS_MENGANGGUR_MS;
};

const ProtectedRoute = ({ children, allowRoles }) => {
  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user') || 'null');

  const kedaluwarsa = sesiKedaluwarsa();

  useEffect(() => {
    if (!token) return;

    const keluar = () => {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem(KUNCI_AKTIVITAS);
      navigate('/', { replace: true });
    };

    if (kedaluwarsa) { keluar(); return; }

    catatAktivitas();
    PERISTIWA.forEach((e) => window.addEventListener(e, catatAktivitas, { passive: true }));
    const timer = setInterval(() => { if (sesiKedaluwarsa()) keluar(); }, 60_000);

    return () => {
      PERISTIWA.forEach((e) => window.removeEventListener(e, catatAktivitas));
      clearInterval(timer);
    };
  }, [token, kedaluwarsa, navigate]);

  if (!token || kedaluwarsa) return <Navigate to="/" replace />;
  if (allowRoles && !allowRoles.includes(user?.role)) return <Navigate to="/dashboard" replace />;

  return children;
};

export default ProtectedRoute;
