// ─────────────────────────────────────────────────────────────────────────────
// Parser Term of Payment (TOP) → daftar tahap pembayaran (payment stages).
// SATU sumber kebenaran, dipakai projectBillingController, projectTimelineController,
// dan createInvoiceController — supaya jumlah tahap konsisten di semua halaman
// (sebelumnya billing mentok 2, timeline bisa >2 → tidak sinkron).
//
// Aturan:
//   • "DP X%"            → 2 tahap: DP X% + Pelunasan (100-X)%
//   • N persentase (≥2)  → N tahap termin (mendukung 3x, 4x, dst)
//   • 1 persentase       → 2 tahap: Pembayaran X% + Pelunasan (100-X)%
//   • tanpa persentase   → 1 tahap: Full Payment
//
// Return: array stage { name, percentage, amount, order } — selalu array,
// minimal 1 elemen.
// ─────────────────────────────────────────────────────────────────────────────
function parsePaymentStages(topOption, total) {
  const t   = (topOption || '').toUpperCase();
  const num = Number(total) || 0;

  // Mode DP — persentase pertama = DP, sisanya pelunasan.
  const dp = t.match(/DP\s*(\d+)%/);
  if (dp) {
    const d    = parseInt(dp[1]);
    const sisa = 100 - d;
    return [
      { name: `DP ${d}%`,        percentage: d,    amount: (num * d) / 100,    order: 1 },
      { name: `Pelunasan ${sisa}%`, percentage: sisa, amount: (num * sisa) / 100, order: 2 },
    ];
  }

  // Mode termin — tiap persentase jadi satu tahap (N tahap).
  const matches = [...t.matchAll(/(\d+)%/g)];
  if (matches.length >= 2) {
    return matches.map((m, i) => {
      const p = parseInt(m[1]);
      return { name: `Termin ${i + 1} (${p}%)`, percentage: p, amount: (num * p) / 100, order: i + 1 };
    });
  }

  // Satu persentase longgar (mis. "50%") → bayar sebagian + pelunasan.
  if (matches.length === 1) {
    const p    = parseInt(matches[0][1]);
    const sisa = 100 - p;
    return [
      { name: `Pembayaran ${p}%`,   percentage: p,    amount: (num * p) / 100,    order: 1 },
      { name: `Pelunasan ${sisa}%`, percentage: sisa, amount: (num * sisa) / 100, order: 2 },
    ];
  }

  // Tanpa persentase → bayar penuh sekali.
  return [{ name: 'Full Payment', percentage: 100, amount: num, order: 1 }];
}

module.exports = { parsePaymentStages };

// Self-check: `node utils/paymentTerms.js`
if (require.main === module) {
  const assert = require('assert');
  const sum = (s) => s.reduce((a, x) => a + x.amount, 0);

  // DP → 2 tahap
  let s = parsePaymentStages('DP 30%', 1000);
  assert.strictEqual(s.length, 2);
  assert.deepStrictEqual(s.map(x => x.percentage), [30, 70]);
  assert.strictEqual(sum(s), 1000);

  // 3x termin
  s = parsePaymentStages('Termin 30% 30% 40%', 1000);
  assert.strictEqual(s.length, 3);
  assert.deepStrictEqual(s.map(x => x.amount), [300, 300, 400]);
  assert.strictEqual(sum(s), 1000);

  // 4x termin
  s = parsePaymentStages('Termin 25% 25% 25% 25%', 800);
  assert.strictEqual(s.length, 4);
  assert.strictEqual(sum(s), 800);

  // 1 persentase → 2 tahap
  s = parsePaymentStages('50%', 1000);
  assert.strictEqual(s.length, 2);
  assert.deepStrictEqual(s.map(x => x.percentage), [50, 50]);

  // Full payment
  s = parsePaymentStages('COD', 1000);
  assert.strictEqual(s.length, 1);
  assert.strictEqual(s[0].amount, 1000);

  console.log('✅ paymentTerms self-check passed');
}
