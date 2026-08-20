import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { KAMUS, BAHASA } from './kamus';

/* Sebelumnya pilihan bahasa hanya hidup di dalam Dashboard.jsx: nilainya
 * tersimpan di localStorage, tapi tidak ada satu pun dari 59 halaman lain yang
 * membacanya. Jadi tombol ID/EN terlihat berfungsi padahal begitu pindah
 * halaman tampilannya kembali ke teks hardcoded. Context ini yang membuat
 * pilihan itu benar-benar berlaku di seluruh aplikasi.
 *
 * Sengaja tanpa pustaka i18n. Frontend belum memuat satu pun, dan commit
 * 8fdc2c8 justru membuang 9 dependensi supaya npm install di cPanel ringan —
 * menambah react-i18next beserta tiga paket turunannya untuk kebutuhan sebesar
 * ini bertentangan dengan arah itu. */
const LanguageContext = createContext(null);

const KUNCI = 'lang';
const BAWAAN = 'id';

/** Sisipkan {param} ke dalam teks. */
const isi = (teks, params) =>
  params
    ? Object.keys(params).reduce((s, k) => s.replaceAll(`{${k}}`, params[k]), teks)
    : teks;

export const LanguageProvider = ({ children }) => {
  const [lang, setLangState] = useState(() => {
    const tersimpan = localStorage.getItem(KUNCI);
    return BAHASA.includes(tersimpan) ? tersimpan : BAWAAN;
  });

  const setLang = (l) => {
    if (!BAHASA.includes(l)) return;
    setLangState(l);
    localStorage.setItem(KUNCI, l);
  };

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  const nilai = useMemo(() => {
    /* Rantai fallback: bahasa aktif -> Indonesia -> kunci mentah. Kunci yang
     * lupa diterjemahkan muncul apa adanya di layar, jadi ketahuan saat dilihat
     * dan tidak pernah merender kosong. */
    const t = (kunci, params) =>
      isi(KAMUS[lang]?.[kunci] ?? KAMUS[BAWAAN]?.[kunci] ?? kunci, params);

    /* Status dari database hanya dipetakan untuk ditampilkan. Nilai aslinya
     * yang harus tetap dipakai untuk perbandingan dan dikirim ke API. */
    const tStatus = (mentah) => (mentah ? t(`status.${mentah}`) : '—');

    const fmtAngka = (n) => Number(n || 0).toLocaleString('id-ID');

    /* Rupiah tetap ditulis 'Rp' dengan pemisah ribuan Indonesia di kedua
     * bahasa: mata uangnya memang IDR dalam konteks bisnis Indonesia, dan itu
     * masuk daftar istilah yang tidak dipaksa diterjemahkan. Yang mengikuti
     * bahasa hanyalah format tanggal. */
    const fmtRupiah = (n) => (n ? `Rp ${fmtAngka(n)}` : 'Rp 0');

    const fmtTanggal = (d, opsi) =>
      new Date(d).toLocaleDateString(lang === 'id' ? 'id-ID' : 'en-GB', opsi);

    return { lang, setLang, t, tStatus, fmtAngka, fmtRupiah, fmtTanggal };
  }, [lang]);

  return <LanguageContext.Provider value={nilai}>{children}</LanguageContext.Provider>;
};

export const useLang = () => {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLang harus dipakai di dalam <LanguageProvider>');
  return ctx;
};

/* ErrorBoundary adalah class component sehingga tidak bisa memakai hook.
 * contextType memberinya jalan resmi ke nilai yang sama. */
export { LanguageContext };
