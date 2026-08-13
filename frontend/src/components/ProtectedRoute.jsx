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

const PERAN_BACA_SAJA = ['Super Admin', 'Viewer'];

/**
 * @param {string} [modul] Nama modul untuk halaman bersifat lihat. Peran
 *   lihat-saja hanya boleh masuk ke rute yang ditandai; rute tanpa tanda
 *   dianggap halaman form dan otomatis tertutup bagi mereka — termasuk rute
 *   yang ditambahkan nanti tanpa ingat menutupnya.
 */
const ProtectedRoute = ({ children, allowRoles, modul }) => {
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

  if (PERAN_BACA_SAJA.includes(user?.role)) {
    if (modul) {
      if (user.role === 'Super Admin') return children;
      if ((user.viewModules || []).includes(modul)) return children;
      return <Navigate to="/dashboard" replace />;
    }

    // Rute tanpa allowRoles sekaligus tanpa modul adalah halaman umum — hanya
    // dashboard. Tanpa pengecualian ini dashboard melempar ke dirinya sendiri
    // tanpa henti, dan React Router berhenti merender apa pun: layar putih
    // polos tanpa error yang bisa ditangkap error boundary.
    if (!allowRoles) return children;

    // Sisanya berarti halaman form atau halaman khusus peran tertentu. Tetap
    // ditolak, sehingga rute form yang ditambahkan nanti otomatis tertutup
    // bagi peran lihat-saja tanpa perlu diingat satu per satu.
    return <Navigate to="/dashboard" replace />;
  }

  if (allowRoles) {
    // 'Admin' berganti nama menjadi 'Administrator'; keduanya disamakan supaya
    // daftar allowRoles di App.jsx tidak perlu disunting satu per satu.
    const diizinkan = new Set(allowRoles);
    if (diizinkan.has('Admin') || diizinkan.has('Administrator')) {
      diizinkan.add('Admin');
      diizinkan.add('Administrator');
    }
    if (!diizinkan.has(user?.role)) return <Navigate to="/dashboard" replace />;
  }

  return children;
};

export default ProtectedRoute;
