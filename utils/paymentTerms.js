function parsePaymentStages(topOption, total) {
  const t   = (topOption || '').toUpperCase();
  const num = Number(total) || 0;

  const dp = t.match(/DP\s*(\d+)%/);
  if (dp) {
    const d    = parseInt(dp[1]);
    const sisa = 100 - d;
    return [
      { name: `DP ${d}%`,        percentage: d,    amount: (num * d) / 100,    order: 1 },
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
    const p    = parseInt(matches[0][1]);
    const sisa = 100 - p;
    return [
      { name: `Pembayaran ${p}%`,   percentage: p,    amount: (num * p) / 100,    order: 1 },
      { name: `Pelunasan ${sisa}%`, percentage: sisa, amount: (num * sisa) / 100, order: 2 },
    ];
  }

  return [{ name: 'Full Payment', percentage: 100, amount: num, order: 1 }];
}

module.exports = { parsePaymentStages };

if (require.main === module) {
  const assert = require('assert');
  const sum = (s) => s.reduce((a, x) => a + x.amount, 0);

  let s = parsePaymentStages('DP 30%', 1000);
  assert.strictEqual(s.length, 2);
  assert.deepStrictEqual(s.map(x => x.percentage), [30, 70]);
  assert.strictEqual(sum(s), 1000);

  s = parsePaymentStages('Termin 30% 30% 40%', 1000);
  assert.strictEqual(s.length, 3);
  assert.deepStrictEqual(s.map(x => x.amount), [300, 300, 400]);
  assert.strictEqual(sum(s), 1000);

  s = parsePaymentStages('Termin 25% 25% 25% 25%', 800);
  assert.strictEqual(s.length, 4);
  assert.strictEqual(sum(s), 800);

  s = parsePaymentStages('50%', 1000);
  assert.strictEqual(s.length, 2);
  assert.deepStrictEqual(s.map(x => x.percentage), [50, 50]);

  s = parsePaymentStages('COD', 1000);
  assert.strictEqual(s.length, 1);
  assert.strictEqual(s[0].amount, 1000);

  console.log('✅ paymentTerms self-check passed');
}
