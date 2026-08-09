import { useEffect, useState } from 'react';

const API = 'http://localhost:5000';

/**
 * Akses berkas upload sekarang memerlukan token.
 *
 * Tag <img src> dan <a href> tidak bisa mengirim header Authorization, jadi
 * berkas diambil lewat fetch dengan header lalu dibungkus jadi object URL.
 * Menaruh token di query string sengaja dihindari karena URL ikut tercatat di
 * log server dan riwayat browser.
 */

const authHeader = () => {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

/** Ambil berkas dan kembalikan object URL. Pemanggil wajib merevoke saat selesai. */
export const fetchFileObjectUrl = async (filename) => {
  if (!filename) return null;
  const bersih = String(filename).replace(/^.*[\\/]/, '');
  const res = await fetch(`${API}/api/files/${encodeURIComponent(bersih)}`, { headers: authHeader() });
  if (!res.ok) throw new Error(res.status === 404 ? 'Berkas tidak ditemukan' : 'Gagal memuat berkas');
  return URL.createObjectURL(await res.blob());
};

/** Buka berkas di tab baru. Dipakai menggantikan <a href> yang dulu langsung ke URL. */
export const openSecureFile = async (filename) => {
  try {
    const url = await fetchFileObjectUrl(filename);
    if (!url) return;
    window.open(url, '_blank', 'noopener');
    // Beri jeda supaya tab sempat memuat sebelum object URL dilepas.
    setTimeout(() => URL.revokeObjectURL(url), 60_000);
  } catch (err) {
    alert(err.message);
  }
};

/** Untuk <img src>: mengembalikan object URL yang otomatis dibersihkan saat unmount. */
export const useSecureFileUrl = (filename) => {
  const [url, setUrl] = useState(null);

  useEffect(() => {
    let dibatalkan = false;
    let dibuat = null;

    if (!filename) { setUrl(null); return; }

    fetchFileObjectUrl(filename)
      .then((u) => {
        if (dibatalkan) { if (u) URL.revokeObjectURL(u); return; }
        dibuat = u;
        setUrl(u);
      })
      .catch(() => { if (!dibatalkan) setUrl(null); });

    return () => {
      dibatalkan = true;
      if (dibuat) URL.revokeObjectURL(dibuat);
    };
  }, [filename]);

  return url;
};
