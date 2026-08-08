const SupplierInvoice = require('../models/SupplierInvoice');

const PAID    = 'Paid';
const PARTIAL = 'Partial';
const UNPAID  = 'Unpaid';

// Toleransi pembulatan saat membandingkan total tagihan dengan nilai PO.
const TOLERANSI = 1;

const totalTagihan = (si) => {
  const base = Number(si.amount || 0);
  const tax  = Number(si.taxAmount || 0);
  const bea  = Number(si.importDutyAmount || 0);
  return Number(si.totalAmount || (base + tax + bea));
};

/**
 * Status pembayaran PO diturunkan dari tagihan supplier yang sudah dibayar,
 * bukan disimpan sebagai field di dokumen PO.
 *
 * PO adalah dokumen penugasan senilai penuh; pembayaran ke vendor berjalan
 * mengikuti TOP lewat beberapa kali Invoice Submission. Karena itu status
 * hanya "Paid" bila seluruh nilai PO sudah tertutup tagihan yang lunas,
 * "Partial" bila baru sebagian, dan "Unpaid" bila belum ada sama sekali.
 *
 * Menurunkannya saat dibaca membuat PO lama ikut benar tanpa migrasi data.
 *
 * @param {Array} pos daftar dokumen PurchaseOrder
 * @returns {Promise<Map<string, string>>} peta poNumber -> status
 */
async function computePOPaymentStatuses(pos = []) {
  const hasil = new Map();
  if (pos.length === 0) return hasil;

  const poNumbers = pos.map(po => po.poNumber).filter(Boolean);
  const invoices  = await SupplierInvoice.find(
    { poNumber: { $in: poNumbers }, status: PAID },
    'poNumber amount taxAmount importDutyAmount totalAmount'
  );

  const terbayarPerPO = {};
  invoices.forEach(si => {
    terbayarPerPO[si.poNumber] = (terbayarPerPO[si.poNumber] || 0) + totalTagihan(si);
  });

  pos.forEach(po => {
    const terbayar = terbayarPerPO[po.poNumber] || 0;
    const nilaiPO  = Number(po.totalAmount || 0);

    if (terbayar <= 0)                          hasil.set(po.poNumber, UNPAID);
    else if (terbayar + TOLERANSI >= nilaiPO)   hasil.set(po.poNumber, PAID);
    else                                        hasil.set(po.poNumber, PARTIAL);
  });

  return hasil;
}

module.exports = { computePOPaymentStatuses, PAID, PARTIAL, UNPAID };
