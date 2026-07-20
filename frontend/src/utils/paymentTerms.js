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
