/**
 * Uji otomatis konversi mata uang.
 *
 * Memakai test runner bawaan Node (node:test), tanpa dependency tambahan.
 * Jalankan dari root proyek:
 *
 *   npm test
 *
 * utils/uang.js adalah fungsi murni — tidak menyentuh database maupun jaringan —
 * sehingga berkas ini berjalan tanpa MongoDB.
 */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { pathToFileURL } = require('node:url');

const {
  keIDR, jumlahIDR, kursValid, kursDipakai, normalkanUang,
  desimalMataUang, mataUangDasar, MATA_UANG_DASAR, KURS_DASAR,
} = require('../utils/uang');

const muatFrontend = () => {
  const berkas = path.join(__dirname, '..', 'frontend', 'src', 'utils', 'uang.js');
  return import(pathToFileURL(berkas).href);
};

describe('Konversi ke mata uang dasar', () => {
  test('mata uang asing dikalikan kursnya', () => {
    assert.equal(keIDR(12500, 16200, 'USD'), 202_500_000);
    assert.equal(keIDR(100000, 2250, 'CNY'), 225_000_000);
    assert.equal(keIDR(1, 0.5, 'XXX'), 0.5, 'kurs pecahan tetap sah');
  });

  test('IDR tidak pernah dikalikan, bahkan kalau kursnya salah kirim', () => {
    // Ini penjagaan terpenting di berkas ini. Kalau kurs ikut terpakai untuk
    // dokumen rupiah, SELURUH laporan keuangan berlipat tanpa ada yang gagal.
    assert.equal(keIDR(1000, 16200, 'IDR'), 1000);
    assert.equal(keIDR(1000, 16200, 'idr'), 1000);
    assert.equal(keIDR(1000, 0, 'IDR'), 1000);
  });

  test('nominal tidak valid dihitung nol, bukan NaN', () => {
    assert.equal(keIDR(undefined, 16200, 'USD'), 0);
    assert.equal(keIDR(null, 16200, 'USD'), 0);
    assert.equal(keIDR('bukan angka', 16200, 'USD'), 0);
    assert.equal(keIDR('', 16200, 'USD'), 0);
  });
});

describe('Dokumen lama tanpa field mata uang', () => {
  // Seluruh data yang sudah ada berdenominasi IDR dan tidak punya exchangeRate.
  // Kalau blok ini gagal, artinya perubahan multi-mata-uang mengubah angka
  // historis — kegagalan paling berbahaya yang mungkin terjadi di sini.
  test('diperlakukan sebagai rupiah dengan kurs 1', () => {
    assert.equal(keIDR(1000), 1000);
    assert.equal(keIDR(1000, undefined, undefined), 1000);
    assert.equal(keIDR(1000, null, null), 1000);
    assert.equal(kursDipakai(undefined, undefined), KURS_DASAR);
  });

  test('agregasinya identik dengan reduce polos sebelum perubahan', () => {
    const lama = [
      { amount: 380_000_000 }, { amount: 190_000_000 },
      { amount: 285_000_000 }, { amount: 95_000_000 },
    ];
    assert.equal(
      jumlahIDR(lama, (d) => d.amount),
      lama.reduce((s, d) => s + d.amount, 0)
    );
  });
});

describe('Validasi kurs', () => {
  test('mata uang asing wajib punya kurs positif', () => {
    assert.equal(kursValid('USD', 16200), true);
    assert.equal(kursValid('USD', 0), false);
    assert.equal(kursValid('USD', -1), false);
    assert.equal(kursValid('USD', undefined), false);
    assert.equal(kursValid('USD', null), false);
    assert.equal(kursValid('USD', 'abc'), false);
    assert.equal(kursValid('USD', Infinity), false);
  });

  test('IDR hanya sah dengan kurs tepat 1', () => {
    assert.equal(kursValid('IDR', 1), true);
    assert.equal(kursValid('IDR', 16200), false);
    assert.equal(kursValid('IDR', 0.5), false);
  });

  test('normalkanUang menolak pasangan yang tidak sah', () => {
    assert.deepEqual(normalkanUang('USD', 16200), { currency: 'USD', exchangeRate: 16200 });
    assert.deepEqual(normalkanUang('usd', 16200), { currency: 'USD', exchangeRate: 16200 });
    assert.deepEqual(normalkanUang('IDR', 99), { currency: 'IDR', exchangeRate: 1 });
    assert.deepEqual(normalkanUang(undefined, undefined), { currency: 'IDR', exchangeRate: 1 });
    assert.equal(normalkanUang('USD', undefined), null);
    assert.equal(normalkanUang('USD', 0), null);
  });
});

describe('Agregasi lintas mata uang', () => {
  test('campuran dijumlahkan dalam rupiah, bukan sebagai angka telanjang', () => {
    // Inilah bug yang diperbaiki: sebelum ini CNY 100.000 masuk laporan sebagai
    // Rp 100.000 — meleset lebih dari dua ribu kali lipat.
    const daftar = [
      { amount: 100, currency: 'USD', exchangeRate: 16200 },
      { amount: 5_000_000, currency: 'IDR', exchangeRate: 1 },
      { amount: 200, currency: 'CNY', exchangeRate: 2250 },
      { amount: 1_000_000 },
    ];
    assert.equal(jumlahIDR(daftar, (d) => d.amount), 1_620_000 + 5_000_000 + 450_000 + 1_000_000);

    const polos = daftar.reduce((s, d) => s + d.amount, 0);
    assert.notEqual(jumlahIDR(daftar, (d) => d.amount), polos,
      'hasilnya harus BERBEDA dari penjumlahan polos, kalau sama berarti konversinya tidak jalan');
  });

  test('daftar kosong dan null aman', () => {
    assert.equal(jumlahIDR([], (d) => d.amount), 0);
    assert.equal(jumlahIDR(null, (d) => d.amount), 0);
    assert.equal(jumlahIDR(undefined, (d) => d.amount), 0);
  });

  test('pengambil nominal boleh menghitung, bukan cuma membaca field', () => {
    const sq = [{
      items: [{ cogs: 100, quantity: 2 }, { cogs: 50, quantity: 1 }],
      currency: 'USD', exchangeRate: 16000,
    }];
    assert.equal(
      jumlahIDR(sq, (d) => d.items.reduce((s, i) => s + i.cogs * i.quantity, 0)),
      250 * 16000
    );
  });
});

describe('Desimal mata uang', () => {
  test('mata uang tanpa pecahan dikenali', () => {
    assert.equal(desimalMataUang('IDR'), 0);
    assert.equal(desimalMataUang('JPY'), 0);
    assert.equal(desimalMataUang('KRW'), 0);
    assert.equal(desimalMataUang('VND'), 0);
  });

  test('selebihnya dua angka di belakang koma', () => {
    assert.equal(desimalMataUang('USD'), 2);
    assert.equal(desimalMataUang('eur'), 2);
    assert.equal(desimalMataUang('SGD'), 2);
  });
});

describe('Mata uang dasar', () => {
  test('IDR dikenali tanpa peduli besar-kecil huruf, kosong dianggap dasar', () => {
    assert.equal(MATA_UANG_DASAR, 'IDR');
    assert.equal(mataUangDasar('IDR'), true);
    assert.equal(mataUangDasar('idr'), true);
    assert.equal(mataUangDasar(undefined), true, 'dokumen lama tanpa currency = rupiah');
    assert.equal(mataUangDasar('USD'), false);
  });
});

// Logikanya ditulis di dua tempat: backend (mengikat, dipakai semua laporan) dan
// cermin frontend (dipakai layar). Kalau salah satu diubah tanpa yang lain,
// angka di layar berbeda dengan angka yang tercatat — dan tidak ada yang gagal.
describe('Backend dan cermin frontend harus sepakat', () => {
  const KASUS = [
    [12500, 16200, 'USD'],
    [100000, 2250, 'CNY'],
    [1000, 16200, 'IDR'],
    [1000, undefined, undefined],
    [1000, null, 'IDR'],
    [0, 16200, 'USD'],
    [undefined, 16200, 'USD'],
    ['bukan angka', 16200, 'USD'],
    [1, 0.5, 'XXX'],
    [999.99, 16200.5, 'EUR'],
    [1000, 0, 'USD'],
    [1000, -5, 'USD'],
  ];

  test('keIDR menghasilkan angka yang sama', async () => {
    const frontend = await muatFrontend();
    const beda = [];
    for (const [nominal, kurs, kode] of KASUS) {
      const b = keIDR(nominal, kurs, kode);
      const f = frontend.keIDR(nominal, kurs, kode);
      if (!Object.is(b, f)) beda.push(`${JSON.stringify([nominal, kurs, kode])}: backend=${b}, frontend=${f}`);
    }
    assert.deepEqual(beda, [], 'konversi backend dan frontend berbeda');
  });

  test('kursValid dan desimalMataUang menghasilkan hasil yang sama', async () => {
    const frontend = await muatFrontend();
    const beda = [];
    for (const [, kurs, kode] of KASUS) {
      if (kursValid(kode, kurs) !== frontend.kursValid(kode, kurs)) {
        beda.push(`kursValid(${kode}, ${kurs})`);
      }
    }
    for (const kode of ['IDR', 'USD', 'JPY', 'eur', 'KRW', 'SGD', undefined]) {
      if (desimalMataUang(kode) !== frontend.desimalMataUang(kode)) {
        beda.push(`desimalMataUang(${kode})`);
      }
    }
    assert.deepEqual(beda, [], 'aturan backend dan frontend berbeda');
  });

  test('jumlahIDR menghasilkan total yang sama', async () => {
    const frontend = await muatFrontend();
    const daftar = [
      { amount: 100, currency: 'USD', exchangeRate: 16200 },
      { amount: 5_000_000, currency: 'IDR', exchangeRate: 1 },
      { amount: 200, currency: 'CNY', exchangeRate: 2250 },
      { amount: 1_000_000 },
    ];
    assert.equal(
      jumlahIDR(daftar, (d) => d.amount),
      frontend.jumlahIDR(daftar, (d) => d.amount)
    );
  });
});
