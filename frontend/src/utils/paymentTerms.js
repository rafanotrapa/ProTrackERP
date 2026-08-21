export function parsePaymentStages(topOption, total) {
  const t = (topOption || '').toUpperCase();
  const num = Number(total) || 0;

  const dp = t.match(/DP\s*(\d+)%/);
  if (dp) {
    const d = parseInt(dp[1]);
    const sisa = 100 - d;
    return [
      { name: `DP ${d}%`, percentage: d, amount: (num * d) / 100, order: 1 },
      { name: `Pelunasan ${sisa}%`, percentage: sisa, amount: (num * sisa) / 100, order: 2 },
    ];
  }

  const matches = [...t.matchAll(/(\d+)%/g)];
  if (matches.length >= 2) {
    return matches.map((m, i) => {
      const p = parseInt(m[1]);
      return { name: `Termin ${i + 1} (${p}%)`, percentage: p, amount: (num * p) / 100, order: i + 1 };
    });
  }
  if (matches.length === 1) {
    const p = parseInt(matches[0][1]);
    const sisa = 100 - p;
    return [
      { name: `Pembayaran ${p}%`, percentage: p, amount: (num * p) / 100, order: 1 },
      { name: `Pelunasan ${sisa}%`, percentage: sisa, amount: (num * sisa) / 100, order: 2 },
    ];
  }

  return [{ name: 'Full Payment', percentage: 100, amount: num, order: 1 }];
}

const hasPercentage = (str) => /\d+\s*%/.test(String(str || ''));

/* Cermin dari utils/paymentTerms.js di backend.
 *
 * TOP disimpan sebagai satu string yang harus mengandung persentase kalau
 * skemanya termin, karena parsePaymentStages() jatuh ke "Full Payment" begitu
 * tidak menemukan '%'. Form mengirim label "Termin" di topOption dan skema
 * persentasenya di customTop, jadi keduanya perlu digabung di sini. */
export function resolveTopOption(topOption, customTop) {
  if (hasPercentage(topOption)) return String(topOption).trim();
  if (hasPercentage(customTop)) return String(customTop).trim();
  return String(topOption || '').trim();
}

/**
 * Term of Payment siap tampil.
 *
 * Dua hal yang diperbaiki di sini sekaligus:
 *
 * 1. Halaman view dulu menulis `topOption === 'Custom' ? customTop : topOption`,
 *    padahal dropdown-nya memakai value 'Termin'. Perbandingan itu tidak pernah
 *    cocok, jadi persentase yang SUDAH tersimpan di customTop tidak pernah
 *    terbaca dan layar cuma menampilkan "TERMIN".
 *
 * 2. Kata "Termin" diterjemahkan HANYA di sini, saat render. Nilai aslinya
 *    tidak boleh ikut berubah: controllers/supplierQuotationController.js
 *    membandingkan `topOption === 'Termin'`, dan string itu juga tersimpan di
 *    database. Menerjemahkannya di hulu akan menghapus skema termin jadi string
 *    kosong. Aturan ini sama dengan tStatus() di i18n/index.jsx.
 *
 * @param {(kunci: string) => string} t dari useLang()
 */
export function labelTop(topOption, customTop, t) {
  const nilai = resolveTopOption(topOption, customTop);
  if (!nilai) return '—';
  return nilai.replace(/Termin/gi, t('top.term'));
}

/**
 * Nama tahap pembayaran siap tampil.
 *
 * parsePaymentStages() menghasilkan nama seperti "Termin 1 (30%)" yang DISIMPAN
 * ke database sebagai SupplierInvoice.terminName dan CreateInvoice.terminName.
 * Karena itu penerjemahannya hanya boleh terjadi di sini, saat render — nilai
 * yang dikirim ke API harus tetap bentuk aslinya. DP dan Pelunasan sengaja
 * dibiarkan: keduanya ada di daftar istilah lindung di kamus.js.
 */
export function labelTahap(nama, t) {
  if (!nama) return '—';
  return String(nama).replace(/Termin/gi, t('top.term'));
}
