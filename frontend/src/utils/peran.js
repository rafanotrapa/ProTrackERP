/**
 * Penentu peran lihat-saja untuk sisi tampilan.
 *
 * Server sudah menolak setiap permintaan tulis dari peran ini di
 * middleware/auth.js, jadi ini bukan lapis keamanan — gunanya supaya tombol
 * yang pasti ditolak tidak ditawarkan sejak awal.
 *
 * Daftar perannya harus sama dengan PERAN_BACA_SAJA di middleware/auth.js.
 */
export const PERAN_BACA_SAJA = ['Super Admin', 'Viewer'];

export const akunSaatIni = () => {
  try {
    return JSON.parse(localStorage.getItem('user') || 'null') || {};
  } catch {
    return {};
  }
};

/** @returns {boolean} true bila akun yang login hanya boleh melihat. */
export const akunBacaSaja = () => PERAN_BACA_SAJA.includes(akunSaatIni().role);
