/**
 * Uji otomatis kebijakan password.
 *
 * Memakai test runner bawaan Node (node:test), jadi tidak menambah dependency
 * apa pun. Jalankan dari root proyek:
 *
 *   npm test
 *
 * utils/passwordPolicy.js adalah fungsi murni — tidak menyentuh database,
 * jaringan, maupun server — sehingga seluruh berkas ini berjalan tanpa
 * `npm install` dan tanpa MongoDB.
 */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { pathToFileURL } = require('node:url');

const { validatePassword, ATURAN, PANJANG_MIN, PANJANG_MAX } =
  require('../utils/passwordPolicy');

// Password acuan yang memenuhi semua syarat. Dipakai sebagai titik awal supaya
// setiap pengujian hanya melanggar satu aturan.
const PASSWORD_AMAN = 'Bulan#Biru77';

const pesanGabungan = (hasil) => hasil.errors.join(' | ');

describe('Password yang seharusnya diterima', () => {
  const contoh = [
    'Bulan#Biru77',
    'Kopi$Pagi2026',
    'Xy9@zqRt',                       // tepat 8 karakter, batas bawah
    'Gerhana!Matahari9Total',
    'p@ssPHRASE dengan spasi 7',      // spasi di tengah boleh
  ];

  for (const pw of contoh) {
    test(`diterima: ${JSON.stringify(pw)}`, () => {
      const hasil = validatePassword(pw);
      assert.equal(hasil.valid, true, `seharusnya lolos, tapi: ${pesanGabungan(hasil)}`);
      assert.deepEqual(hasil.errors, []);
    });
  }
});

describe('Batas panjang', () => {
  test(`kurang dari ${PANJANG_MIN} karakter ditolak`, () => {
    const hasil = validatePassword('Ab1!xy');
    assert.equal(hasil.valid, false);
    assert.ok(hasil.errors.some((e) => e.includes(`minimal ${PANJANG_MIN}`)));
  });

  test(`tepat ${PANJANG_MIN} karakter diterima`, () => {
    assert.equal(validatePassword('Xy9@zqRt').valid, true);
  });

  test(`tepat ${PANJANG_MAX} byte diterima`, () => {
    const pw = 'Aa1!' + 'x'.repeat(PANJANG_MAX - 4);
    assert.equal(Buffer.byteLength(pw), PANJANG_MAX);
    assert.equal(validatePassword(pw).valid, true);
  });

  test(`lebih dari ${PANJANG_MAX} byte ditolak`, () => {
    const pw = 'Aa1!' + 'x'.repeat(PANJANG_MAX - 3);
    const hasil = validatePassword(pw);
    assert.equal(hasil.valid, false);
    assert.ok(hasil.errors.some((e) => e.includes(`maksimal ${PANJANG_MAX}`)));
  });

  // Batas bcrypt dihitung dalam BYTE, bukan karakter. Satu huruf beraksen
  // memakan 2 byte dan satu emoji bisa 4 byte, jadi password yang terlihat
  // pendek masih bisa melewati batas.
  test('dihitung per byte, bukan per karakter', () => {
    const pw = 'Aa1!' + 'é'.repeat(35);          // 39 karakter, 74 byte
    assert.ok(pw.length < PANJANG_MAX);
    assert.ok(Buffer.byteLength(pw) > PANJANG_MAX);
    assert.equal(validatePassword(pw).valid, false);
  });
});

describe('Komposisi karakter', () => {
  const kasus = [
    ['tanpa huruf kecil', 'BULAN#BIRU77', 'huruf kecil'],
    ['tanpa huruf besar', 'bulan#biru77', 'huruf besar'],
    ['tanpa angka', 'Bulan#BiruSaja', 'angka'],
    ['tanpa simbol', 'BulanBiru77xy', 'simbol'],
  ];

  for (const [nama, pw, potonganPesan] of kasus) {
    test(`${nama} ditolak`, () => {
      const hasil = validatePassword(pw);
      assert.equal(hasil.valid, false);
      assert.ok(
        hasil.errors.some((e) => e.includes(potonganPesan)),
        `pesan tidak menyebut "${potonganPesan}": ${pesanGabungan(hasil)}`
      );
    });
  }
});

describe('Spasi di awal atau akhir', () => {
  for (const pw of [` ${PASSWORD_AMAN}`, `${PASSWORD_AMAN} `, `  ${PASSWORD_AMAN}  `]) {
    test(`ditolak: ${JSON.stringify(pw)}`, () => {
      const hasil = validatePassword(pw);
      assert.equal(hasil.valid, false);
      assert.ok(hasil.errors.some((e) => e.includes('spasi')));
    });
  }
});

describe('Kata terlarang', () => {
  const KATA = [
    'password', 'passw0rd', 'qwerty', 'asdf', 'zxcv',
    '12345678', '123456789', '87654321', '11111111',
    'protrack', 'batavia', 'kreasindo', 'erp',
    'admin', 'administrator', 'superadmin',
    'marketing', 'procurement', 'finance', 'owner', 'management',
    'welcome', 'letmein', 'iloveyou', 'sayang', 'rahasia',
  ];

  test('daftarnya berisi 26 kata', () => {
    assert.equal(KATA.length, 26);
  });

  for (const kata of KATA) {
    test(`menolak password yang memuat "${kata}"`, () => {
      // Diapit karakter lain supaya sekaligus membuktikan pencocokannya
      // substring, bukan kecocokan kata utuh.
      const hasil = validatePassword(`Zq7!${kata}#Xw`);
      assert.equal(hasil.valid, false, `"${kata}" lolos padahal harus ditolak`);
      assert.ok(
        hasil.errors.some((e) => e.includes('mudah ditebak')),
        `ditolak karena alasan lain: ${pesanGabungan(hasil)}`
      );
    });
  }

  test('tidak peduli huruf besar atau kecil', () => {
    for (const varian of ['ProTrack', 'PROTRACK', 'pRoTrAcK']) {
      const hasil = validatePassword(`Zq7!${varian}#Xw`);
      assert.equal(hasil.valid, false, `${varian} lolos`);
    }
  });

  test('tidak bisa diakali dengan menambah angka dan simbol', () => {
    for (const pw of ['Password1!', 'ProTrack2026!', 'Admin#2026x']) {
      assert.equal(validatePassword(pw).valid, false, `${pw} lolos`);
    }
  });

  test('kata yang mirip tapi tidak ada di daftar tetap lolos', () => {
    // "passer" bukan "password"; memastikan pencocokannya tidak terlalu longgar.
    assert.equal(validatePassword('Zq7!passer#Xw').valid, true);
  });
});

describe('Password tidak boleh memuat identitas pemilik', () => {
  const identitas = { username: 'Firman', email: 'firmanhidayat@gmail.com' };

  test('menolak password yang memuat username', () => {
    const hasil = validatePassword('Zq7!Firman#Xw', identitas);
    assert.equal(hasil.valid, false);
    assert.ok(hasil.errors.some((e) => e.includes('username')));
  });

  test('menolak password yang memuat bagian lokal email', () => {
    const hasil = validatePassword('Zq7!firmanhidayat#Xw', identitas);
    assert.equal(hasil.valid, false);
    assert.ok(hasil.errors.some((e) => e.includes('email')));
  });

  test('pencocokan identitas tidak peduli huruf besar/kecil', () => {
    assert.equal(validatePassword('Zq7!FIRMAN#Xw', identitas).valid, false);
  });

  test('username sangat pendek diabaikan agar tidak asal menolak', () => {
    // Username 2 huruf akan cocok dengan hampir semua password, jadi sengaja
    // dilewati. "ab" ada di dalam password ini dan harus tetap lolos.
    const hasil = validatePassword('Zq7!abcdef#Xw', { username: 'ab', email: 'ab@x.com' });
    assert.equal(hasil.valid, true, pesanGabungan(hasil));
  });

  test('tanpa identitas, pemeriksaan itu dilewati', () => {
    assert.equal(validatePassword(PASSWORD_AMAN).valid, true);
  });
});

describe('Masukan yang tidak wajar', () => {
  for (const nilai of ['', null, undefined, 12345678, {}, []]) {
    test(`ditolak dengan pesan wajib diisi: ${JSON.stringify(nilai) ?? String(nilai)}`, () => {
      const hasil = validatePassword(nilai);
      assert.equal(hasil.valid, false);
      assert.deepEqual(hasil.errors, ['Password wajib diisi.']);
    });
  }

  test('tidak melempar error walau identitas berbentuk aneh', () => {
    assert.doesNotThrow(() => validatePassword(PASSWORD_AMAN, { username: null, email: null }));
    assert.doesNotThrow(() => validatePassword(PASSWORD_AMAN, {}));
  });
});

describe('Daftar aturan yang ditampilkan', () => {
  test('berisi tujuh syarat', () => {
    assert.equal(ATURAN.length, 7);
  });

  test('semuanya berupa kalimat, bukan nilai kosong', () => {
    for (const aturan of ATURAN) {
      assert.equal(typeof aturan, 'string');
      assert.ok(aturan.length > 0);
    }
  });
});

// Aturan ditulis di dua tempat: backend (mengikat) dan frontend (tampilan).
// Kalau salah satu diubah tanpa yang lain, user melihat checklist hijau semua
// tapi ditolak server. Pengujian ini yang menangkap keadaan itu.
describe('Backend dan cermin frontend harus sepakat', () => {
  const KASUS = [
    'Bulan#Biru77',
    'Kopi$Pagi2026',
    'Xy9@zqRt',
    'Ab1!xy',
    'BULAN#BIRU77',
    'bulan#biru77',
    'Bulan#BiruSaja',
    'BulanBiru77xy',
    ' Bulan#Biru77',
    'Bulan#Biru77 ',
    'Password1!',
    'ProTrack2026!',
    'Zq7!finance#Xw',
    'Zq7!passer#Xw',
    'Aa1!' + 'x'.repeat(PANJANG_MAX - 4),
    'Aa1!' + 'x'.repeat(PANJANG_MAX - 3),
    'Aa1!' + 'é'.repeat(35),
  ];

  test('hasil valid/tidak valid sama untuk semua kasus uji', async () => {
    const berkasFrontend = path.join(__dirname, '..', 'frontend', 'src', 'utils', 'passwordPolicy.js');
    const frontend = await import(pathToFileURL(berkasFrontend).href);

    const beda = [];
    for (const pw of KASUS) {
      const hasilBackend = validatePassword(pw).valid;
      const hasilFrontend = frontend.passwordValid(pw, {});
      if (hasilBackend !== hasilFrontend) {
        beda.push(`${JSON.stringify(pw.length > 30 ? pw.slice(0, 20) + `...(${pw.length} char)` : pw)}: backend=${hasilBackend}, frontend=${hasilFrontend}`);
      }
    }

    assert.deepEqual(beda, [], `Aturan backend dan frontend tidak sinkron:\n  ${beda.join('\n  ')}`);
  });
});
