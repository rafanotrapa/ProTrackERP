/**
 * Mode "akun per tab".
 *
 * Token disimpan di localStorage, yang dipakai bersama oleh semua tab dalam satu
 * profil browser. Akibatnya satu profil hanya bisa memegang satu sesi: login
 * sebagai Finance di tab kedua akan menimpa sesi Marketing di tab pertama.
 * Untuk demo yang perlu memperagakan enam peran sekaligus, itu memaksa
 * berpindah-pindah profil Chrome.
 *
 * sessionStorage terpisah per tab, jadi kalau kunci autentikasi diarahkan ke
 * sana, tiap tab bisa memegang akun berbeda dalam satu profil.
 *
 * Ada 77 pembacaan localStorage.getItem('token') tersebar di 45 berkas, jadi
 * pengalihan dilakukan di lapisan penyimpanan supaya semuanya ikut tanpa harus
 * menyunting tiap pemanggilan. Yang dialihkan hanya kunci autentikasi; kunci
 * lain seperti preferensi bahasa tetap di localStorage seperti biasa.
 *
 * Efek sampingnya justru menguntungkan: sesi bermode tab ikut hilang begitu
 * tabnya ditutup.
 */

const KUNCI_AUTH = ['token', 'user'];
const PENANDA = 'authScopedToTab';

export const modeTabAktif = () => {
  try { return sessionStorage.getItem(PENANDA) === '1'; } catch { return false; }
};

/** Dipanggil sebelum login supaya sesi tab ini tidak menimpa tab lain. */
export const aktifkanModeTab = () => {
  sessionStorage.setItem(PENANDA, '1');
};

export const matikanModeTab = () => {
  sessionStorage.removeItem(PENANDA);
  KUNCI_AUTH.forEach((k) => sessionStorage.removeItem(k));
};

/** Pasang sekali di awal aplikasi, sebelum modul lain membaca penyimpanan. */
export const pasangSessionScope = () => {
  const proto = window.Storage.prototype;
  const getAsli = proto.getItem;
  const setAsli = proto.setItem;
  const hapusAsli = proto.removeItem;

  const dialihkan = (target, key) =>
    target === window.localStorage && modeTabAktif() && KUNCI_AUTH.includes(key);

  proto.getItem = function (key) {
    if (dialihkan(this, key)) return getAsli.call(window.sessionStorage, key);
    return getAsli.call(this, key);
  };

  proto.setItem = function (key, value) {
    if (dialihkan(this, key)) return setAsli.call(window.sessionStorage, key, value);
    return setAsli.call(this, key, value);
  };

  proto.removeItem = function (key) {
    if (dialihkan(this, key)) return hapusAsli.call(window.sessionStorage, key);
    return hapusAsli.call(this, key);
  };
};
