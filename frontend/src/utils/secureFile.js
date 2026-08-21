import { useEffect, useState } from 'react';
import Swal from 'sweetalert2';
import { terjemah } from '../i18n';

const API = 'http://localhost:5000';

/* Bahasa dibaca dari localStorage, bukan dari useLang().
 *
 * Berkas ini bukan komponen React — ia dipanggil dari handler onClick di tujuh
 * halaman — sehingga tidak bisa memakai context. terjemah() memang disediakan
 * untuk kasus seperti ini; kuncinya sama persis dengan yang dipakai t(). */
const bahasaAktif = () => (localStorage.getItem('lang') === 'en' ? 'en' : 'id');
const tr = (kunci) => terjemah(bahasaAktif(), kunci);

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
  if (!res.ok) {
    // Kode status dibawa di properti terpisah supaya pemanggil bisa membedakan
    // "berkasnya memang tidak ada" dari "servernya bermasalah", sementara
    // .message tetap kalimat siap tampil untuk pemanggil yang cuma meneruskannya.
    const err = new Error(res.status === 404 ? tr('file.notFound') : tr('file.loadFailed'));
    err.status = res.status;
    throw err;
  }
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
    /* Dulu di sini alert() bawaan browser. Dua masalahnya: kalimatnya
     * selalu Indonesia walau toggle di English, dan alert() MEMBEKUKAN
     * seluruh halaman sampai ditutup — sehingga tombol yang gagal terasa
     * seperti tombol mati, bukan seperti kesalahan yang bisa dibaca.
     *
     * Penyebab 404 yang paling sering: baris dokumennya ada di database tapi
     * berkasnya tidak ada di disk server ini. Itu terjadi karena beberapa
     * lingkungan berbagi satu MongoDB Atlas tapi diskanya sendiri-sendiri,
     * jadi berkas yang diunggah dari mesin lain tidak pernah ikut. Pesannya
     * menyebutkan itu supaya tidak dikira tombolnya rusak. */
    Swal.fire({
      icon: err.status === 404 ? 'warning' : 'error',
      title: err.status === 404 ? tr('file.unavailable') : tr('file.loadFailed'),
      text: err.status === 404 ? tr('file.missingOnServer') : err.message,
      confirmButtonColor: '#0f172a',
      customClass: { popup: 'rounded-2xl' },
    });
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
