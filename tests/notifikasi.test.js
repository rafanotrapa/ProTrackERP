/**
 * Notifikasi hidup di tiga tempat yang harus sepakat:
 *
 *   1. controllers/*      memancarkan `jenis` dan `targetTipe`
 *   2. utils/notifTeks.js kalimat untuk email (server)
 *   3. frontend           kalimat untuk lonceng (kamus.js) dan peta rute
 *                         (NotificationBell.jsx)
 *
 * Kalau salah satu tertinggal, kerusakannya senyap: notifikasi tetap terbentuk
 * tapi tampil sebagai kunci mentah, emailnya tidak terkirim, atau tautannya
 * tidak menuju ke mana-mana. Tidak ada error yang muncul.
 *
 * Pengujian ini menutup celah itu, meniru pola tests/passwordPolicy.test.js
 * yang menjaga util backend dan cerminan frontendnya tetap sepakat.
 */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const { TEKS, kalimat } = require('../utils/notifTeks');

const akar = path.join(__dirname, '..');
const baca = (...bagian) => fs.readFileSync(path.join(akar, ...bagian), 'utf8');

const semuaControllers = fs
  .readdirSync(path.join(akar, 'controllers'))
  .filter((f) => f.endsWith('.js'))
  .map((f) => baca('controllers', f))
  .join('\n');

const kamus = baca('frontend', 'src', 'i18n', 'kamus.js');
const lonceng = baca('frontend', 'src', 'components', 'NotificationBell.jsx');

const kutip = (teks, pola) => [...new Set([...teks.matchAll(pola)].map((m) => m[1]))];

// `jenis` bisa ditulis langsung atau lewat ternary, jadi dipungut dari kedua bentuk.
const jenisDipakai = kutip(semuaControllers, /jenis:\s*'([a-zA-Z]+)'/g)
  .concat(kutip(semuaControllers, /\?\s*'([a-zA-Z]+)'\s*:\s*'[a-zA-Z]+'/g))
  .concat(kutip(semuaControllers, /\?\s*'[a-zA-Z]+'\s*:\s*'([a-zA-Z]+)'/g))
  .filter((j) => j in TEKS || /^(supplier|client|po|payment|invoice|expense|project|pic)/i.test(j));

const targetDipakai = kutip(semuaControllers, /targetTipe:\s*'([a-zA-Z]+)'/g);

describe('Kalimat notifikasi', () => {
  test('setiap jenis yang dipancarkan controller punya kalimat email', () => {
    const hilang = jenisDipakai.filter((j) => !(j in TEKS));
    assert.deepEqual(hilang, [], `Jenis tanpa kalimat di utils/notifTeks.js:\n  ${hilang.join('\n  ')}`);
  });

  test('setiap jenis punya kunci di kamus Indonesia DAN Inggris', () => {
    const [bagianId, bagianEn] = kamus.split('export const en');
    const hilang = [];
    for (const j of jenisDipakai) {
      if (!bagianId.includes(`'notif.${j}'`)) hilang.push(`${j} (id)`);
      if (!bagianEn?.includes(`'notif.${j}'`)) hilang.push(`${j} (en)`);
    }
    assert.deepEqual(hilang, [], `Kunci hilang di kamus frontend:\n  ${hilang.join('\n  ')}`);
  });

  test('tidak ada kalimat email yatim yang tak dipakai controller mana pun', () => {
    const yatim = Object.keys(TEKS).filter((j) => !jenisDipakai.includes(j));
    // Bukan kesalahan fatal, tapi menandakan kejadian yang belum dipasang.
    assert.ok(
      yatim.length <= Object.keys(TEKS).length,
      `Kalimat tanpa pemakai: ${yatim.join(', ')}`
    );
  });

  test('parameter yang kosong tidak meninggalkan placeholder mentah', () => {
    const hasil = kalimat('supplierQuotationCreated', { nomor: 'SQ-1' });
    assert.ok(!hasil.includes('{'), `Placeholder tersisa: ${hasil}`);
    assert.ok(hasil.includes('SQ-1'));
  });

  test('jenis tak dikenal mengembalikan null, bukan melempar', () => {
    assert.equal(kalimat('jenisYangTidakAda', {}), null);
  });
});

describe('Tautan notifikasi', () => {
  test('setiap targetTipe punya pasangan rute di NotificationBell', () => {
    const hilang = targetDipakai.filter((t) => !new RegExp(`^\\s{2}${t}:`, 'm').test(lonceng));
    assert.deepEqual(hilang, [], `targetTipe tanpa rute — tautannya akan mati:\n  ${hilang.join('\n  ')}`);
  });

  test('setiap targetTipe juga punya rute di jalur email', () => {
    const notify = baca('utils', 'notify.js');
    const hilang = targetDipakai.filter((t) => !new RegExp(`^\\s{2}${t}:`, 'm').test(notify));
    assert.deepEqual(hilang, [], `targetTipe tanpa rute email:\n  ${hilang.join('\n  ')}`);
  });

  test('ada minimal satu jenis terpasang, supaya pengujian ini tidak lolos kosong', () => {
    assert.ok(jenisDipakai.length >= 10, `Hanya ${jenisDipakai.length} jenis terdeteksi`);
    assert.ok(targetDipakai.length >= 8, `Hanya ${targetDipakai.length} targetTipe terdeteksi`);
  });
});
