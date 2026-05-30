const ClientInvoice = require('../models/CreateInvoice');
const ClientQuotation = require('../models/ClientQuotation');
const SupplierInvoice = require('../models/SupplierInvoice');
const Payment = require('../models/Payment');
const Project = require('../models/Project');

// ─────────────────────────────────────────────────────────────────────────────
// HELPER: normalize projectId string
// ─────────────────────────────────────────────────────────────────────────────
const norm = (id) => String(id || '').trim().toLowerCase();

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/financial/summary
// Ringkasan total: revenue murni, tax client, shipping client, COGS, bea cukai
// supplier tax, net profit
// ─────────────────────────────────────────────────────────────────────────────
exports.getFinancialSummary = async (req, res) => {
  try {
    // Ambil semua quotation yang approved
    const quotations = await ClientQuotation.find({ approvalStatus: 'Approved' });

    // Ambil semua supplier invoice yang sudah Paid
    const supplierInvoices = await SupplierInvoice.find({ status: 'Paid' });

    // Ambil semua client payment yang verified + populate invoiceId
    const payments = await Payment.find({ status: 'Verified' }).populate('invoiceId');

    // ── CLIENT SIDE ──────────────────────────────────────────────────────────
    // Revenue murni = clientPrice (subtotal items tanpa tax & shipping)
    // Tax client   = taxAmount (PPN ke negara, pass-through)
    // Shipping     = shippingFee (ongkir ke client, pass-through)
    // Grand total yang diterima dari client = clientPrice + taxAmount + shippingFee

    let totalClientRevenue   = 0; // clientPrice saja
    let totalClientTax       = 0; // PPN yang ditagihkan ke client
    let totalClientShipping  = 0; // ongkir yang ditagihkan ke client
    let totalCashReceived    = 0; // uang yang benar-benar masuk (dari Payment verified)

    quotations.forEach(q => {
      totalClientRevenue  += Number(q.clientPrice  || 0);
      totalClientTax      += Number(q.taxAmount     || 0);
      totalClientShipping += Number(q.shippingFee   || 0);
    });

    payments.forEach(p => {
      totalCashReceived += Number(p.amountPaid || 0);
    });

    // ── SUPPLIER SIDE ────────────────────────────────────────────────────────
    // COGS murni        = amount  (harga barang ke vendor, tanpa pajak & bea)
    // Bea cukai         = importDutyAmount (biaya operasional, MASUK expense)
    // Pajak supplier    = taxAmount (PPN ke negara dari vendor, pass-through, TIDAK masuk expense bisnis)
    // Grand total bayar = totalAmount = amount + taxAmount + importDutyAmount

    let totalCOGS               = 0;
    let totalImportDuty         = 0; // bea cukai — biaya operasional riil
    let totalSupplierTaxPassThru = 0; // PPN supplier — pass-through, tidak masuk P&L

    supplierInvoices.forEach(si => {
      totalCOGS               += Number(si.amount           || 0);
      totalImportDuty         += Number(si.importDutyAmount || 0);
      totalSupplierTaxPassThru += Number(si.taxAmount       || 0);
    });

    // ── P&L CALCULATION ──────────────────────────────────────────────────────
    // Net Revenue  = clientPrice  (exclude tax & shipping yang pass-through)
    // Total Expense = COGS + bea cukai
    // Net Profit    = Net Revenue - Total Expense

    const totalExpense  = totalCOGS + totalImportDuty;
    const netProfit     = totalClientRevenue - totalExpense;
    const grossMargin   = totalClientRevenue > 0
      ? ((netProfit / totalClientRevenue) * 100).toFixed(2)
      : '0.00';

    // Uang masuk real vs total tagihan ke client (untuk AR tracking)
    const totalBilled       = totalClientRevenue + totalClientTax + totalClientShipping;
    const totalOutstanding  = totalBilled - totalCashReceived;

    res.status(200).json({
      // --- Revenue breakdown ---
      totalClientRevenue,       // pendapatan bersih bisnis
      totalClientTax,           // PPN ditagihkan ke client (pass-through)
      totalClientShipping,      // ongkir ke client (pass-through)
      totalBilled,              // grand total yang ditagihkan ke semua client

      // --- Cash flow ---
      totalCashReceived,        // uang yang benar-benar masuk
      totalOutstanding,         // piutang yang belum dibayar

      // --- Expense breakdown ---
      totalCOGS,                // harga beli barang murni ke vendor
      totalImportDuty,          // bea cukai (biaya riil)
      totalSupplierTaxPassThru, // PPN vendor (info only, bukan expense bisnis)
      totalExpense,             // total pengeluaran bisnis (COGS + bea cukai)

      // --- Bottom line ---
      netProfit,
      grossMargin: parseFloat(grossMargin),
    });
  } catch (err) {
    console.error('[financialController] getFinancialSummary error:', err);
    res.status(500).json({ msg: err.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/financial/project-report
// P&L detail per project — breakdown lengkap
// ─────────────────────────────────────────────────────────────────────────────
exports.getProjectProfitability = async (req, res) => {
  try {
    const [quotations, supplierInvoices, clientInvoices, payments, projects] =
      await Promise.all([
        ClientQuotation.find({ approvalStatus: 'Approved' }),
        SupplierInvoice.find(),
        ClientInvoice.find(),
        Payment.find({ status: 'Verified' }).populate('invoiceId'),
        Project.find(),
      ]);

    // Build map project name
    const projectNameMap = {};
    projects.forEach(p => { projectNameMap[norm(p.projectId)] = p.projectName; });
    clientInvoices.forEach(i => {
      if (i.projectName) projectNameMap[norm(i.projectId)] = i.projectName;
    });
    quotations.forEach(q => {
      if (q.projectName) projectNameMap[norm(q.projectId)] = q.projectName;
    });
    supplierInvoices.forEach(si => {
      if (si.projectId && !projectNameMap[norm(si.projectId)]) {
        projectNameMap[norm(si.projectId)] = si.projectId;
      }
    });

    // Collect all unique project IDs
    const allIds = new Set([
      ...quotations.map(q => norm(q.projectId)),
      ...supplierInvoices.map(si => norm(si.projectId)),
      ...clientInvoices.map(i => norm(i.projectId)),
    ]);
    allIds.delete('');
    allIds.delete('undefined');

    // Build per-project cash received map from payments
    const cashReceivedByProject = {};
    payments.forEach(p => {
      const inv = p.invoiceId;
      if (!inv) return;
      const pid = norm(inv.projectId);
      cashReceivedByProject[pid] = (cashReceivedByProject[pid] || 0) + Number(p.amountPaid || 0);
    });

    const report = Array.from(allIds).map(pid => {
      const pQuotations       = quotations.filter(q  => norm(q.projectId)  === pid);
      const pSupplierInvoices = supplierInvoices.filter(si => norm(si.projectId) === pid);
      const pClientInvoices   = clientInvoices.filter(i  => norm(i.projectId)   === pid);

      // ── CLIENT SIDE ──────────────────────────────────────────────────────
      // Pakai quotation approved sebagai sumber kebenaran harga ke client
      let clientRevenue  = 0; // clientPrice = harga jual murni (tanpa tax & shipping)
      let clientTax      = 0; // taxAmount = PPN ke client (pass-through)
      let clientShipping = 0; // shippingFee = ongkir ke client (pass-through)

      // Jika ada quotation approved, pakai itu
      if (pQuotations.length > 0) {
        pQuotations.forEach(q => {
          clientRevenue  += Number(q.clientPrice  || 0);
          clientTax      += Number(q.taxAmount     || 0);
          clientShipping += Number(q.shippingFee   || 0);
        });
      } else {
        // Fallback ke client invoice kalau tidak ada quotation
        pClientInvoices.forEach(inv => {
          clientRevenue += Number(inv.amount || 0);
        });
      }

      const grandTotalBilled = clientRevenue + clientTax + clientShipping;

      // Items detail dari quotation
      const itemsDetail = pQuotations.flatMap(q =>
        (q.items || []).map(item => ({
          itemName:   item.itemName,
          qty:        item.quantity,
          unit:       item.unit,
          cogs:       Number(item.cogs       || 0),
          salesPrice: Number(item.salesPrice || 0),
          totalCogs:  Number(item.cogs       || 0) * Number(item.quantity || 1),
          totalSales: Number(item.salesPrice || 0) * Number(item.quantity || 1),
        }))
      );

      // ── SUPPLIER SIDE ────────────────────────────────────────────────────
      let supplierCOGS               = 0; // harga beli barang murni
      let supplierImportDuty         = 0; // bea cukai
      let supplierTaxPassThru        = 0; // PPN vendor (info only)
      let supplierTotalPaid          = 0; // total yang dibayarkan ke vendor (termasuk tax + bea)

      const supplierBreakdown = pSupplierInvoices.map(si => {
        const cogs       = Number(si.amount           || 0);
        const tax        = Number(si.taxAmount         || 0);
        const importDuty = Number(si.importDutyAmount  || 0);
        const total      = Number(si.totalAmount       || (cogs + tax + importDuty));

        supplierCOGS        += cogs;
        supplierTaxPassThru += tax;
        supplierImportDuty  += importDuty;
        supplierTotalPaid   += total;

        return {
          invoiceNumber: si.invoiceNumber,
          vendorName:    si.vendorName,
          status:        si.status,
          cogs,
          taxAmount:     tax,
          importDuty,
          totalPaid:     total,
          isTaxEnabled:      si.isTaxEnabled,
          isImportEnabled:   si.isImportEnabled,
          customsDutyNote:   si.customsDutyNote,
          invoiceDate:       si.invoiceDate,
        };
      });

      // ── P&L PER PROJECT ──────────────────────────────────────────────────
      // Expense bisnis = COGS + bea cukai (bukan pajak supplier — itu pass-through)
      const totalExpense = supplierCOGS + supplierImportDuty;
      const netProfit    = clientRevenue - totalExpense;
      const margin       = clientRevenue > 0
        ? parseFloat(((netProfit / clientRevenue) * 100).toFixed(2))
        : 0;

      // Cash received untuk project ini
      const cashReceived  = cashReceivedByProject[pid] || 0;
      const outstanding   = grandTotalBilled - cashReceived;

      // Invoice status dari client
      const paidInvoices   = pClientInvoices.filter(i => i.status === 'Paid');
      const unpaidInvoices = pClientInvoices.filter(i => i.status === 'Unpaid');

      return {
        projectId:   pid,
        projectName: projectNameMap[pid] || pid,

        // Revenue breakdown
        clientRevenue,      // harga jual murni (bisnis revenue)
        clientTax,          // PPN ke client (pass-through)
        clientShipping,     // ongkir ke client (pass-through)
        grandTotalBilled,   // total yang ditagihkan ke client

        // Cash flow
        cashReceived,
        outstanding,

        // Expense breakdown
        supplierCOGS,        // harga beli murni
        supplierImportDuty,  // bea cukai
        supplierTaxPassThru, // PPN vendor (info only, bukan expense bisnis)
        supplierTotalPaid,   // total transfer ke vendor
        totalExpense,        // expense bisnis (COGS + bea cukai)

        // P&L
        netProfit,
        margin,

        // Detail data
        itemsDetail,
        supplierBreakdown,
        invoiceSummary: {
          total:  pClientInvoices.length,
          paid:   paidInvoices.length,
          unpaid: unpaidInvoices.length,
        },
      };
    });

    // Sort by netProfit descending
    report.sort((a, b) => b.netProfit - a.netProfit);

    res.status(200).json(report);
  } catch (err) {
    console.error('[financialController] getProjectProfitability error:', err);
    res.status(500).json({ msg: err.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/financial/cash-flow
// Cash flow: uang masuk dari client payments, uang keluar ke supplier
// ─────────────────────────────────────────────────────────────────────────────
exports.getCashFlow = async (req, res) => {
  try {
    const payments = await Payment.find({ status: 'Verified' })
      .populate('invoiceId')
      .sort({ paymentDate: -1 });

    const supplierInvoices = await SupplierInvoice.find({ status: 'Paid' })
      .sort({ paymentDate: -1 });

    // Cash In: dari client payments
    const cashInEntries = payments.map(p => ({
      date:          p.paymentDate || p.createdAt,
      type:          'Cash In',
      description:   `Payment – ${p.invoiceId?.invoiceNumber || 'INV'}`,
      projectName:   p.invoiceId?.projectName || '-',
      clientName:    p.invoiceId?.clientName  || '-',
      amount:        Number(p.amountPaid || 0),
      breakdown: {
        // Kita tidak tahu berapa porsi tax/shipping dari payment ini
        // karena client bayar lump sum; kita log gross amount saja
        grossAmount: Number(p.amountPaid || 0),
      },
    }));

    // Cash Out: ke supplier (COGS + importDuty + supplierTax yang dibayar)
    const cashOutEntries = supplierInvoices.map(si => ({
      date:        si.paymentDate || si.updatedAt,
      type:        'Cash Out',
      description: `Supplier – ${si.invoiceNumber}`,
      projectName: si.projectId || '-',
      vendorName:  si.vendorName,
      amount:      Number(si.totalAmount || 0),
      breakdown: {
        cogs:       Number(si.amount           || 0),
        taxAmount:  Number(si.taxAmount         || 0),
        importDuty: Number(si.importDutyAmount  || 0),
      },
    }));

    const allEntries = [
      ...cashInEntries.map(e => ({ ...e, direction: 1  })),
      ...cashOutEntries.map(e => ({ ...e, direction: -1 })),
    ].sort((a, b) => new Date(b.date) - new Date(a.date));

    const totalCashIn  = cashInEntries.reduce((s, e)  => s + e.amount, 0);
    const totalCashOut = cashOutEntries.reduce((s, e) => s + e.amount, 0);
    const netBalance   = totalCashIn - totalCashOut;

    res.status(200).json({
      totalCashIn,
      totalCashOut,
      netBalance,
      entries: allEntries,
    });
  } catch (err) {
    console.error('[financialController] getCashFlow error:', err);
    res.status(500).json({ msg: err.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/financial/receivables
// Outstanding client invoices (belum lunas)
// ─────────────────────────────────────────────────────────────────────────────
exports.getReceivables = async (req, res) => {
  try {
    const unpaidInvoices = await ClientInvoice.find({ status: 'Unpaid' })
      .sort({ dueDate: 1 });

    const now = new Date();
    const enriched = unpaidInvoices.map(inv => {
      const due          = inv.dueDate ? new Date(inv.dueDate) : null;
      const overdueDays  = due ? Math.max(0, Math.floor((now - due) / 86400000)) : null;
      return {
        _id:           inv._id,
        invoiceNumber: inv.invoiceNumber,
        projectId:     inv.projectId,
        projectName:   inv.projectName,
        clientName:    inv.clientName,
        amount:        Number(inv.amount || 0),
        dueDate:       inv.dueDate,
        overdueDays,
        isOverdue:     due ? now > due : false,
        createdAt:     inv.createdAt,
      };
    });

    const totalOutstanding = enriched.reduce((s, i) => s + i.amount, 0);
    const overdueCount     = enriched.filter(i => i.isOverdue).length;

    res.status(200).json({
      totalOutstanding,
      overdueCount,
      invoices: enriched,
    });
  } catch (err) {
    console.error('[financialController] getReceivables error:', err);
    res.status(500).json({ msg: err.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/financial/monthly-trend
// Revenue & expense per bulan (last 12 months)
// ─────────────────────────────────────────────────────────────────────────────
exports.getMonthlyTrend = async (req, res) => {
  try {
    const quotations       = await ClientQuotation.find({ approvalStatus: 'Approved' });
    const supplierInvoices = await SupplierInvoice.find({ status: 'Paid' });

    const monthlyMap = {};

    const getKey = (date) => {
      const d = new Date(date);
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    };

    // Revenue dari quotation (gunakan timestamp/updatedAt approval)
    quotations.forEach(q => {
      const key = getKey(q.approvalDate || q.updatedAt || q.timestamp);
      if (!monthlyMap[key]) monthlyMap[key] = { month: key, revenue: 0, clientTax: 0, clientShipping: 0, cogs: 0, importDuty: 0 };
      monthlyMap[key].revenue        += Number(q.clientPrice  || 0);
      monthlyMap[key].clientTax      += Number(q.taxAmount     || 0);
      monthlyMap[key].clientShipping += Number(q.shippingFee   || 0);
    });

    // Expense dari supplier invoices paid
    supplierInvoices.forEach(si => {
      const key = getKey(si.paymentDate || si.updatedAt);
      if (!monthlyMap[key]) monthlyMap[key] = { month: key, revenue: 0, clientTax: 0, clientShipping: 0, cogs: 0, importDuty: 0 };
      monthlyMap[key].cogs       += Number(si.amount           || 0);
      monthlyMap[key].importDuty += Number(si.importDutyAmount || 0);
    });

    const result = Object.values(monthlyMap)
      .map(m => ({
        ...m,
        expense:   m.cogs + m.importDuty,
        netProfit: m.revenue - m.cogs - m.importDuty,
      }))
      .sort((a, b) => a.month.localeCompare(b.month))
      .slice(-12);

    res.status(200).json(result);
  } catch (err) {
    console.error('[financialController] getMonthlyTrend error:', err);
    res.status(500).json({ msg: err.message });
  }
};