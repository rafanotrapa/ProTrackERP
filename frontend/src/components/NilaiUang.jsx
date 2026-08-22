import React from 'react';
import { useLang } from '../i18n';
import { formatUang, setaraIDR, keteranganKurs } from '../utils/uang';

/**
 * Nominal dalam mata uang dokumennya, dengan setara Rupiah di bawahnya.
 *
 * Nominal aslinya sengaja jadi angka yang dominan: itu yang benar-benar harus
 * ditransfer ke vendor atau ditagihkan ke client. Setara Rupiah dan kursnya
 * tampil kecil di bawahnya supaya Finance tetap tahu dampak rupiahnya tanpa
 * membuka laporan terpisah.
 *
 * Untuk dokumen Rupiah, baris tambahannya TIDAK dirender sama sekali — alur
 * sehari-hari yang selama ini dipakai tampil persis seperti sebelumnya.
 *
 * @param {number} nominal  nilai dalam mata uang dokumen
 * @param {string} currency kode mata uang dokumen
 * @param {number} rate     kurs terhadap Rupiah yang terkunci di dokumen
 * @param {string} [className] kelas untuk angka utamanya
 * @param {boolean} [tampilkanKurs] tampilkan juga "1 USD = Rp ..."
 */
const NilaiUang = ({ nominal, currency, rate, className = '', tampilkanKurs = false }) => {
  const setara = setaraIDR(nominal, rate, currency);

  return (
    <>
      <span className={className}>{formatUang(nominal, currency)}</span>
      {setara && (
        <span className="block text-2xs font-bold text-slate-400 normal-case tracking-normal mt-0.5">
          {setara}
          {tampilkanKurs && <> &bull; {keteranganKurs(currency, rate)}</>}
        </span>
      )}
    </>
  );
};

/**
 * Penanda kecil bahwa seluruh angka di sebuah laporan disajikan dalam Rupiah.
 * Dipakai di Financial Report dan Project Timeline, yang memang selalu memakai
 * mata uang dasar apa pun mata uang dokumen sumbernya.
 */
export const CatatanRupiah = () => {
  const { t } = useLang();
  return (
    <p className="text-2xs font-bold text-slate-400 italic">{t('cur.reportNote')}</p>
  );
};

export default NilaiUang;
