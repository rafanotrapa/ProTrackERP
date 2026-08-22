import React from 'react';
import { useLang } from '../i18n';
import { mataUangDasar, keIDR, formatIDR, angkaUang, bacaAngka } from '../utils/uang';

/**
 * Kolom kurs yang hanya muncul kalau mata uangnya bukan Rupiah.
 *
 * Sengaja tidak pernah tampil untuk dokumen IDR: alur rupiah yang selama ini
 * dipakai sehari-hari tidak boleh mendapat kolom tambahan yang selalu berisi 1.
 * Begitu mata uang asing dipilih, kolomnya wajib diisi — server menolak dokumen
 * asing tanpa kurs, jadi peringatan di sini mencegah pengguna baru tahu setelah
 * menekan Simpan.
 *
 * Nilai yang ditampilkan sebagai pratinjau adalah hasil perkalian yang PERSIS
 * dipakai backend, lewat utils/uang.js yang sama — supaya tidak pernah ada
 * selisih antara yang dilihat pengguna dan yang tercatat.
 *
 * @param {string}   currency  kode mata uang dokumen
 * @param {number}   value     kurs terhadap Rupiah
 * @param {Function} onChange  menerima ({ target: { name, value } })
 * @param {number}   [nominal] nominal dokumen, untuk pratinjau setara Rupiah
 * @param {string}   [name]    nama field, bawaan 'exchangeRate'
 */
const InputKurs = ({ currency, value, onChange, nominal, name = 'exchangeRate' }) => {
  const { t } = useLang();
  if (mataUangDasar(currency)) return null;

  const kurs = Number(value) || 0;
  const belumDiisi = kurs <= 0;
  const kode = String(currency).toUpperCase();

  return (
    <div className="space-y-1">
      <label className="text-xs font-black text-amber-600 uppercase tracking-widest ml-1 italic">
        {t('cur.rateLabel', { kode })} <span className="text-red-500">*</span>
      </label>
      <input
        type="text"
        name={name}
        value={kurs ? angkaUang(kurs, 'IDR') : ''}
        onChange={(e) => onChange({ target: { name, value: bacaAngka(e.target.value, 'IDR') } })}
        placeholder="0"
        className={`w-full p-3 bg-white border rounded-xl font-black text-amber-600 outline-none transition-all ${
          belumDiisi ? 'border-red-300 focus:border-red-500' : 'border-slate-300 focus:border-amber-500'
        }`}
      />
      {belumDiisi ? (
        <p className="text-2xs font-bold text-red-500 ml-1">{t('cur.rateRequired', { kode })}</p>
      ) : (
        <p className="text-2xs font-bold text-slate-400 ml-1">
          1 {kode} = {formatIDR(kurs)}
          {Number(nominal) > 0 && (
            <span className="text-emerald-600">
              {' '}&bull; {t('cur.equivalent', { nilai: formatIDR(keIDR(nominal, kurs, currency)) })}
            </span>
          )}
        </p>
      )}
    </div>
  );
};

export default InputKurs;
