function computeProcessSteps({ hasQuotation, purchaseOrders = [], supplierInvoices = [], paymentFraction = 0 }) {
  const poCount = purchaseOrders.length;
  return [
    { label: 'Quotation Approved', fraction: hasQuotation ? 1 : 0 },
    { label: 'PO Terbit',          fraction: poCount > 0 ? 1 : 0 },
    { label: 'QC Passed',          fraction: poCount > 0 && purchaseOrders.every(po => po.qcStatus === 'Passed') ? 1 : 0 },
    { label: 'Supplier Paid',      fraction: supplierInvoices.length > 0 && supplierInvoices.every(si => si.status === 'Paid') ? 1 : 0 },
    { label: 'Delivered',          fraction: poCount > 0 && purchaseOrders.every(po => po.deliveryStatus === 'Delivered') ? 1 : 0 },
    { label: 'Client Payment',     fraction: paymentFraction },
  ];
}

function computeProcessPercent(args) {
  const steps = computeProcessSteps(args);
  return Math.round((steps.reduce((s, st) => s + st.fraction, 0) / steps.length) * 100);
}

module.exports = { computeProcessSteps, computeProcessPercent };
