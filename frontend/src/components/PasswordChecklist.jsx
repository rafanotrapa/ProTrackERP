import React from 'react';
import { Check, X } from 'lucide-react';
import { cekSyarat, PANJANG_MIN } from '../utils/passwordPolicy';
import { useLang } from '../i18n';

/* Kunci terjemahan dipetakan berdasarkan URUTAN yang dikembalikan cekSyarat,
 * bukan berdasarkan teks labelnya.
 *
 * utils/passwordPolicy.js sengaja TIDAK disentuh: berkas itu punya kembaran di
 * backend, dan tests/passwordPolicy.test.js mengimpor versi frontend-nya dengan
 * Node polos untuk memastikan kedua sisi sepakat. Menambahkan import React atau
 * context ke sana akan langsung membuat `npm test` merah. Jadi aturannya tetap
 * murni logika, dan penerjemahan terjadi di sini — di lapisan tampilan.
 *
 * Kalau urutan atau jumlah syarat di cekSyarat berubah, daftar ini harus ikut
 * berubah. Pengujian 'Daftar aturan yang ditampilkan' menjaga jumlahnya tetap
 * tujuh. */
const KUNCI = [
  'password.minLength',
  'password.lower',
  'password.upper',
  'password.digit',
  'password.symbol',
  'password.notCommon',
  'password.notIdentity',
];

/**
 * Checklist syarat password yang berubah realtime saat user mengetik.
 * Sengaja disembunyikan sampai kolomnya disentuh, supaya form tidak langsung
 * terlihat penuh peringatan merah sebelum user sempat mengetik apa pun.
 */
const PasswordChecklist = ({ password = '', username = '', email = '', tampil = true }) => {
  const { t } = useLang();
  if (!tampil) return null;

  const syarat = cekSyarat(password, { username, email });

  return (
    <ul className="mt-3 space-y-1.5 rounded-xl bg-slate-50 border border-slate-200 p-3">
      {syarat.map((s, i) => (
        <li
          key={KUNCI[i] || s.label}
          className={`flex items-center gap-2 text-xs font-bold ${
            s.lolos ? 'text-emerald-600' : 'text-slate-400'
          }`}
        >
          {s.lolos ? (
            <Check size={13} className="shrink-0" />
          ) : (
            <X size={13} className="shrink-0" />
          )}
          <span>{KUNCI[i] ? t(KUNCI[i], { min: PANJANG_MIN }) : s.label}</span>
        </li>
      ))}
    </ul>
  );
};

export default PasswordChecklist;
