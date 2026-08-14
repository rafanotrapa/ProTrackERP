const ClientInvoice     = require('../models/CreateInvoice');
const ClientQuotation   = require('../models/ClientQuotation');
const SupplierQuotation = require('../models/SupplierQuotation');
const SupplierInvoice   = require('../models/SupplierInvoice');
const Payment           = require('../models/Payment');
const Project           = require('../models/Project');
const ExpenseSubmission = require('../models/ExpenseSubmission');

const norm = (id) => String(id || '').trim().toLowerCase();

/**
 * Kelompokkan dokumen berdasarkan projectId, sekali jalan.
 *
 * Laporan margin dulu menyaring ulang setiap koleksi untuk tiap project:
 * `quotations.filter(q => norm(q.projectId) === pid)` dikerjakan lima kali di
 * dalam perulangan project. Biayanya P x (Q+SQ+SI+CI+E) — kuadratik terhadap
 * pertumbuhan data, padahal hasilnya sama persis dengan mengelompokkan sekali
 * lalu membacanya lewat kunci.
 */
const kelompokkanPerProject = (dokumen = []) => {
  const peta = new Map();
  dokumen.forEach((d) => {
    const kunci = norm(d.projectId);
    const daftar = peta.get(kunci);
    if (daftar) daftar.push(d);
    else peta.set(kunci, [d]);
  });
  return peta;
};

const KOSONG = [];

// Biaya supplier diakui begitu tagihannya masuk (beserta dokumen buktinya), bukan
// menunggu kasnya keluar. Sebelumnya hanya status 'Paid' yang dihitung, sehingga
// project yang PO-nya sudah jalan tapi vendornya belum dibayar tampil bermargin 100%.
// Ubah daftar ini kalau alur verifikasi Finance dipisah jadi status tersendiri.
const COGS_RECOGNIZED_STATUSES = ['Pending Verification', 'Paid'];
const cogsInvoiceFilter = { status: { $in: COGS_RECOGNIZED_STATUSES } };

const getContractGrandTotal = (q) =>
  Number(q?.clientPrice || 0) + Number(q?.shippingFee || 0) + Number(q?.taxAmount || 0);

// COGS = harga barang + fee vendor (ongkir/instalasi). PPN vendor sengaja tidak
// dihitung di sini karena diperlakukan pass-through ke negara, sama seperti
// supplierCOGS yang memakai si.amount (base) tanpa taxAmount. Kalau keduanya tidak
// pakai basis yang sama, perbandingan estimasi vs aktual jadi tidak berarti.
const getEstimatedCOGS = (sq) => {
  const itemsCost = (sq.items || []).reduce(
    (s, it) => s + (it.cogs || 0) * (it.quantity || 1), 0
  );
  return itemsCost + Number(sq.additionalFee || 0);
};

exports.getFinancialSummary = async (req, res) => {
  try {
    const quotations       = await ClientQuotation.find({ approvalStatus: 'Approved' });
    const supplierInvoices = await SupplierInvoice.find(cogsInvoiceFilter);
    const payments         = await Payment.find({ status: 'Verified' }).populate('invoiceId');
    const otherExpenses     = await ExpenseSubmission.find({ status: 'Approved' });

    let totalClientRevenue   = 0;
    let totalClientTax       = 0;
    let totalClientShipping  = 0;
    let totalCashReceived    = 0;

    quotations.forEach(q => {
      totalClientRevenue  += Number(q.clientPrice  || 0);
      totalClientTax      += Number(q.taxAmount     || 0);
      totalClientShipping += Number(q.shippingFee   || 0);
    });

    payments.forEach(p => {
      totalCashReceived += Number(p.amountPaid || 0);
    });

    let totalCOGS                = 0;
    let totalImportDuty          = 0;
    let totalSupplierTaxPassThru = 0;

    supplierInvoices.forEach(si => {
      totalCOGS                += Number(si.amount           || 0);
      totalImportDuty          += Number(si.importDutyAmount || 0);
      totalSupplierTaxPassThru += Number(si.taxAmount        || 0);
    });

    const totalOtherExpense = otherExpenses.reduce((sum, e) => sum + Number(e.amount || 0), 0);

    const totalExpense = totalCOGS + totalImportDuty + totalOtherExpense;
    const netProfit     = totalClientRevenue - totalExpense;
    const grossMargin   = totalClientRevenue > 0
      ? ((netProfit / totalClientRevenue) * 100).toFixed(2)
      : '0.00';

    const totalBilled      = totalClientRevenue + totalClientTax + totalClientShipping;
    const totalOutstanding = totalBilled - totalCashReceived;

    res.status(200).json({
      totalClientRevenue,
      totalClientTax,
      totalClientShipping,
      totalBilled,

      totalCashReceived,
      totalOutstanding,

      totalCOGS,
      totalImportDuty,
      totalSupplierTaxPassThru,
      totalOtherExpense,
      totalExpense,
      netProfit,
      grossMargin: parseFloat(grossMargin),
    });
  } catch (err) {
    console.error('[financialController] getFinancialSummary error:', err);
    res.status(500).json({ msg: err.message });
  }
};

exports.getProjectProfitability = async (req, res) => {
  try {
    const [quotations, supplierQuotations, supplierInvoicesPaid, clientInvoices, payments, projects, otherExpenses] =
      await Promise.all([
        ClientQuotation.find({ approvalStatus: 'Approved' }),
        SupplierQuotation.find({ approvalStatus: 'Approved' }),
        SupplierInvoice.find(cogsInvoiceFilter),
        ClientInvoice.find(),
        Payment.find({ status: 'Verified' }).populate('invoiceId'),
        Project.find(),
        ExpenseSubmission.find({ status: 'Approved' }),
      ]);

    const projectNameMap = {};
    projects.forEach(p => { projectNameMap[norm(p.projectId)] = p.projectName; });

    // Tanggal dibuatnya project dipakai untuk mengurutkan laporan dari yang terbaru.
    // Sebagian project bisa muncul lewat invoice/expense saja tanpa dokumen Project,
    // jadi quotation dipakai sebagai cadangan.
    const projectDateMap = {};
    projects.forEach(p => { projectDateMap[norm(p.projectId)] = p.createdAt; });
    quotations.forEach(q => {
      const k = norm(q.projectId);
      if (!projectDateMap[k]) projectDateMap[k] = q.createdAt || q.timestamp;
    });
    clientInvoices.forEach(i => {
      if (i.projectName) projectNameMap[norm(i.projectId)] = i.projectName;
    });
    quotations.forEach(q => {
      if (q.projectName) projectNameMap[norm(q.projectId)] = q.projectName;
    });
    supplierInvoicesPaid.forEach(si => {
      if (si.projectId && !projectNameMap[norm(si.projectId)]) {
        projectNameMap[norm(si.projectId)] = si.projectId;
      }
    });
    otherExpenses.forEach(e => {
      if (e.projectId && !projectNameMap[norm(e.projectId)]) {
        projectNameMap[norm(e.projectId)] = e.projectName || e.projectId;
      }
    });

    const allIds = new Set([
      ...quotations.map(q => norm(q.projectId)),
      ...supplierInvoicesPaid.map(si => norm(si.projectId)),
      ...clientInvoices.map(i => norm(i.projectId)),
      ...otherExpenses.map(e => norm(e.projectId)),
    ]);
    allIds.delete('');
    allIds.delete('undefined');

    const cashReceivedByProject = {};
    payments.forEach(p => {
      const inv = p.invoiceId;
      if (!inv) return;
      const pid = norm(inv.projectId);
      cashReceivedByProject[pid] = (cashReceivedByProject[pid] || 0) + Number(p.amountPaid || 0);
    });

    // Dikelompokkan sekali di depan, bukan disaring ulang untuk tiap project.
    const perQuotation         = kelompokkanPerProject(quotations);
    const perSupplierQuotation = kelompokkanPerProject(supplierQuotations);
    const perSupplierInvoice   = kelompokkanPerProject(supplierInvoicesPaid);
    const perClientInvoice     = kelompokkanPerProject(clientInvoices);
    const perExpense           = kelompokkanPerProject(otherExpenses);

    const report = Array.from(allIds).map(pid => {
      const pQuotations          = perQuotation.get(pid)         || KOSONG;
      const pSupplierQuotations  = perSupplierQuotation.get(pid) || KOSONG;
      const pSupplierInvoices    = perSupplierInvoice.get(pid)   || KOSONG;
      const pClientInvoices      = perClientInvoice.get(pid)     || KOSONG;
      const pOtherExpenses       = perExpense.get(pid)           || KOSONG;

      let clientRevenue  = 0;
      let clientTax      = 0;
      let clientShipping = 0;

      if (pQuotations.length > 0) {
        pQuotations.forEach(q => {
          clientRevenue  += Number(q.clientPrice  || 0);
          clientTax      += Number(q.taxAmount     || 0);
          clientShipping += Number(q.shippingFee   || 0);
        });
      } else {
        pClientInvoices.forEach(inv => {
          clientRevenue += Number(inv.amount || 0);
        });
      }

      const grandTotalBilled = clientRevenue + clientTax + clientShipping;
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

      const estimatedCOGS = pSupplierQuotations.reduce((sum, sq) => sum + getEstimatedCOGS(sq), 0);

      let supplierCOGS        = 0;
      let supplierImportDuty  = 0;
      let supplierTaxPassThru = 0;
      let supplierTotalBilled = 0;
      let supplierTotalPaid   = 0;

      const supplierBreakdown = pSupplierInvoices.map(si => {
        const cogs       = Number(si.amount           || 0);
        const tax        = Number(si.taxAmount         || 0);
        const importDuty = Number(si.importDutyAmount  || 0);
        const total      = Number(si.totalAmount       || (cogs + tax + importDuty));

        supplierCOGS        += cogs;
        supplierTaxPassThru += tax;
        supplierImportDuty  += importDuty;
        supplierTotalBilled += total;
        // Biaya diakui sejak tagihan masuk, tapi "paid" tetap hanya yang kasnya sudah keluar.
        if (si.status === 'Paid') supplierTotalPaid += total;

        return {
          invoiceNumber:    si.invoiceNumber,
          vendorName:       si.vendorName,
          status:           si.status,
          cogs,
          taxAmount:        tax,
          importDuty,
          totalPaid:        si.status === 'Paid' ? total : 0,
          totalBilled:      total,
          isTaxEnabled:     si.isTaxEnabled,
          isImportEnabled:  si.isImportEnabled,
          customsDutyNote:  si.customsDutyNote,
          invoiceDate:      si.invoiceDate,
        };
      });

      const otherExpenseTotal = pOtherExpenses.reduce((sum, e) => sum + Number(e.amount || 0), 0);
      const otherExpenseBreakdown = pOtherExpenses.map(e => ({
        submissionId: e.submissionId,
        items:        (e.items || []).map(it => ({
          name:        it.name,
          description: it.description || '',
          amount:      it.amount,
        })),
        amount:       Number(e.amount || 0),
        submittedBy:  e.submittedByName,
        approvedAt:   e.reviewDate,
        createdAt:    e.createdAt,
      }));

      const totalExpense = supplierCOGS + supplierImportDuty + otherExpenseTotal;
      const netProfit     = clientRevenue - totalExpense;
      const margin        = clientRevenue > 0
        ? parseFloat(((netProfit / clientRevenue) * 100).toFixed(2))
        : 0;

      const estimatedNetProfit = clientRevenue - estimatedCOGS - otherExpenseTotal;
      const estimatedMargin    = clientRevenue > 0
        ? parseFloat(((estimatedNetProfit / clientRevenue) * 100).toFixed(2))
        : 0;

      const cashReceived = cashReceivedByProject[pid] || 0;
      const outstanding  = grandTotalBilled - cashReceived;

      const paidInvoices   = pClientInvoices.filter(i => i.status === 'Paid');
      const unpaidInvoices = pClientInvoices.filter(i => i.status === 'Unpaid');

      return {
        projectId:   pid,
        projectName: projectNameMap[pid] || pid,

        clientRevenue,
        clientTax,
        clientShipping,
        grandTotalBilled,
        cashReceived,
        outstanding,

        supplierCOGS,
        supplierImportDuty,
        supplierTaxPassThru,
        supplierTotalPaid,
        supplierTotalBilled,

        estimatedCOGS,
        estimatedNetProfit,
        estimatedMargin,
        // Belum ada tagihan supplier sama sekali -> angka aktual masih 0 dan margin
        // terlihat 100%. Frontend memakai flag ini untuk menampilkan estimasi dari
        // supplier quotation, bukan angka nol yang menyesatkan.
        hasActualCOGS: pSupplierInvoices.length > 0,

        otherExpenseTotal,
        otherExpenseBreakdown,

        totalExpense,
        netProfit,
        margin,

        itemsDetail,
        supplierBreakdown,
        invoiceSummary: {
          total:  pClientInvoices.length,
          paid:   paidInvoices.length,
          unpaid: unpaidInvoices.length,
        },
      };
    });

    // Urut dari project terbaru, sejalan dengan Project Billing dan Project Timeline.
    report.sort((a, b) =>
      new Date(projectDateMap[b.projectId] || 0) - new Date(projectDateMap[a.projectId] || 0)
    );

    res.status(200).json(report);
  } catch (err) {
    console.error('[financialController] getProjectProfitability error:', err);
    res.status(500).json({ msg: err.message });
  }
};

exports.getCashFlow = async (req, res) => {
  try {
    const payments = await Payment.find({ status: 'Verified' })
      .populate('invoiceId')
      .sort({ paymentDate: -1 });

    const supplierInvoices = await SupplierInvoice.find(cogsInvoiceFilter)
      .sort({ paymentDate: -1 });

    const otherExpenses = await ExpenseSubmission.find({ status: 'Approved' })
      .sort({ reviewDate: -1 });

    const cashInEntries = payments.map(p => ({
      date:        p.paymentDate || p.createdAt,
      type:        'Cash In',
      description: `Payment – ${p.invoiceId?.invoiceNumber || 'INV'}`,
      projectName: p.invoiceId?.projectName || '-',
      clientName:  p.invoiceId?.clientName  || '-',
      amount:      Number(p.amountPaid || 0),
      breakdown: {
        grossAmount: Number(p.amountPaid || 0),
      },
    }));

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

    const otherExpenseEntries = otherExpenses.map(e => {
      const itemNames = (e.items || []).map(it => it.name).join(', ');
      return {
        date:        e.reviewDate || e.updatedAt,
        type:        'Cash Out',
        description: `Expense – ${itemNames || e.submissionId} (${e.submissionId})`,
        projectName: e.projectName || e.projectId || '-',
        vendorName:  e.submittedByName || '-',
        amount:      Number(e.amount || 0),
        breakdown: {
          otherExpense: Number(e.amount || 0),
        },
      };
    });

    const allEntries = [
      ...cashInEntries.map(e => ({ ...e, direction: 1  })),
      ...cashOutEntries.map(e => ({ ...e, direction: -1 })),
      ...otherExpenseEntries.map(e => ({ ...e, direction: -1 })),
    ].sort((a, b) => new Date(b.date) - new Date(a.date));

    const totalCashIn          = cashInEntries.reduce((s, e)  => s + e.amount, 0);
    const totalCashOutSupplier = cashOutEntries.reduce((s, e) => s + e.amount, 0);
    const totalCashOutOther    = otherExpenseEntries.reduce((s, e) => s + e.amount, 0);
    const totalCashOut         = totalCashOutSupplier + totalCashOutOther;
    const netBalance           = totalCashIn - totalCashOut;

    res.status(200).json({
      totalCashIn,
      totalCashOut,
      totalCashOutSupplier,
      totalCashOutOther,
      netBalance,
      entries: allEntries,
    });
  } catch (err) {
    console.error('[financialController] getCashFlow error:', err);
    res.status(500).json({ msg: err.message });
  }
};

exports.getReceivables = async (req, res) => {
  try {
    const unpaidInvoices = await ClientInvoice.find({ status: 'Unpaid' })
      .sort({ dueDate: 1 });

    const now = new Date();
    const enriched = unpaidInvoices.map(inv => {
      const due         = inv.dueDate ? new Date(inv.dueDate) : null;
      const overdueDays = due ? Math.max(0, Math.floor((now - due) / 86400000)) : null;
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

exports.getMonthlyTrend = async (req, res) => {
  try {
    const quotations       = await ClientQuotation.find({ approvalStatus: 'Approved' });
    const supplierInvoices = await SupplierInvoice.find(cogsInvoiceFilter);
    const otherExpenses    = await ExpenseSubmission.find({ status: 'Approved' });

    const monthlyMap = {};

    const getKey = (date) => {
      const d = new Date(date);
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    };

    const ensureMonth = (key) => {
      if (!monthlyMap[key]) {
        monthlyMap[key] = {
          month: key, revenue: 0, clientTax: 0, clientShipping: 0,
          cogs: 0, importDuty: 0, otherExpense: 0,
        };
      }
      return monthlyMap[key];
    };

    quotations.forEach(q => {
      const key = getKey(q.approvalDate || q.updatedAt || q.timestamp);
      const m = ensureMonth(key);
      m.revenue        += Number(q.clientPrice  || 0);
      m.clientTax      += Number(q.taxAmount     || 0);
      m.clientShipping += Number(q.shippingFee   || 0);
    });

    supplierInvoices.forEach(si => {
      const key = getKey(si.paymentDate || si.updatedAt);
      const m = ensureMonth(key);
      m.cogs       += Number(si.amount           || 0);
      m.importDuty += Number(si.importDutyAmount || 0);
    });

    otherExpenses.forEach(e => {
      const key = getKey(e.reviewDate || e.updatedAt);
      const m = ensureMonth(key);
      m.otherExpense += Number(e.amount || 0);
    });

    const result = Object.values(monthlyMap)
      .map(m => ({
        ...m,
        expense:   m.cogs + m.importDuty + m.otherExpense,
        netProfit: m.revenue - m.cogs - m.importDuty - m.otherExpense,
      }))
      .sort((a, b) => a.month.localeCompare(b.month))
      .slice(-12);

    res.status(200).json(result);
  } catch (err) {
    console.error('[financialController] getMonthlyTrend error:', err);
    res.status(500).json({ msg: err.message });
  }
};