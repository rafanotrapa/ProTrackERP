const Project            = require('../models/Project');
const ClientQuotation    = require('../models/ClientQuotation');
const CreateInvoice      = require('../models/CreateInvoice');
const Payment            = require('../models/Payment');
const PurchaseOrder      = require('../models/PurchaseOrder');
const SupplierQuotation  = require('../models/SupplierQuotation');
const SupplierInvoice    = require('../models/SupplierInvoice');
const ExpenseSubmission  = require('../models/ExpenseSubmission'); // ← baru

const getInvoicePaymentStatus = async (invoiceId) => {
  const payment = await Payment.findOne({ invoiceId, status: 'Verified' });
  return payment ? 'Paid' : 'Unpaid';
};

const parseTopOption = (topOption, totalContractValue) => {
  const topText = (topOption || '').toUpperCase();

  const dpMatch = topText.match(/DP\s*(\d+)%/i);
  if (dpMatch) {
    const dp = parseInt(dpMatch[1]);
    const sisa = 100 - dp;
    return [
      { name: `DP ${dp}%`, percentage: dp, amount: (totalContractValue * dp) / 100, order: 1 },
      { name: `Pelunasan ${sisa}%`, percentage: sisa, amount: (totalContractValue * sisa) / 100, order: 2 }
    ];
  }

  const terminMatches = [...topText.matchAll(/(\d+)%/g)];
  if (terminMatches.length >= 2) {
    return terminMatches.map((m, i) => {
      const pct = parseInt(m[1]);
      return { name: `Termin ${i + 1} (${pct}%)`, percentage: pct, amount: (totalContractValue * pct) / 100, order: i + 1 };
    });
  }

  return [
    { name: 'Full Payment', percentage: 100, amount: totalContractValue, order: 1 }
  ];
};

exports.getProjectTimeline = async (req, res) => {
  try {
    const { projectId } = req.params;
    const project = await Project.findOne({ projectId });
    if (!project) {
      return res.status(404).json({ msg: `Project ${projectId} tidak ditemukan` });
    }

    const clientQuotation = await ClientQuotation.findOne({
      projectId,
      approvalStatus: 'Approved'
    }).sort({ createdAt: -1 });

    const clientPrice    = clientQuotation?.clientPrice || project.amount || 0;
    const shippingFee    = clientQuotation?.shippingFee || 0;
    const taxAmount      = clientQuotation?.taxAmount || 0;
    const taxPercentage  = clientQuotation?.taxPercentage || 0;
    const grandTotal     = clientPrice + shippingFee + taxAmount;
    const topOption      = clientQuotation?.topOption || '—';
    const rawInvoices    = await CreateInvoice.find({ projectId }).sort({ createdAt: 1 });

    const clientInvoices = await Promise.all(
      rawInvoices.map(async (inv) => {
        const payStatus = await getInvoicePaymentStatus(inv._id);
        return {
          _id: inv._id,
          invoiceNumber: inv.invoiceNumber,
          billingPhase: inv.billingPhase || '—',
          amount: inv.amount,
          dueDate: inv.dueDate,
          createdAt: inv.createdAt,
          status: payStatus,
          topOption: inv.topOption
        };
      })
    );

    const totalPaidFromInvoices = clientInvoices
      .filter(inv => inv.status === 'Paid')
      .reduce((sum, inv) => sum + inv.amount, 0);

    const totalUnpaidFromInvoices = clientInvoices
      .filter(inv => inv.status === 'Unpaid')
      .reduce((sum, inv) => sum + inv.amount, 0);

    const expectedStages = parseTopOption(topOption, grandTotal);
    const paymentStages = expectedStages.map((stage, idx) => {
      const invoice = clientInvoices[idx] || null;
      return {
        stageNumber: idx + 1,
        name: stage.name,
        percentage: stage.percentage,
        expectedAmount: stage.amount,
        invoice: invoice
          ? {
              invoiceNumber: invoice.invoiceNumber,
              amount: invoice.amount,
              dueDate: invoice.dueDate,
              status: invoice.status
            }
          : null,
        status: invoice ? invoice.status : 'Pending'
      };
    });

    const totalStages       = paymentStages.length;
    const paidStages        = paymentStages.filter(s => s.status === 'Paid').length;
    const progressPercent   = totalStages > 0 ? Math.round((paidStages / totalStages) * 100) : 0;
    const isComplete        = paidStages >= totalStages && totalStages > 0;

    const purchaseOrders = await PurchaseOrder.find({ projectId })
      .populate('vendorId', 'vendorName vendorContact vendorAddress')
      .sort({ timestamp: -1 });

    const poSummary = purchaseOrders.map(po => ({
      _id: po._id,
      poNumber: po.poNumber,
      vendorName: po.vendorId?.vendorName || '—',
      vendorContact: po.vendorId?.vendorContact || '—',
      items: po.items || [],
      totalAmount: po.totalAmount || 0,
      additionalFee: po.additionalFee || 0,
      taxAmount: po.taxAmount || 0,
      paymentStatus: po.paymentStatus,
      qcStatus: po.qcStatus,
      qcRemarks: po.qcRemarks || '',
      deliveryStatus: po.deliveryStatus,
      deliveryDate: po.deliveryDate || null,
      courierName: po.courierName || '—',
      trackingNumber: po.trackingNumber || '—',
      createdAt: po.timestamp
    }));

    const supplierQuotations = await SupplierQuotation.find({
      projectId,
      approvalStatus: 'Approved'
    }).sort({ createdAt: -1 });

    const totalCOGS = supplierQuotations.reduce((sum, sq) => {
      const itemsCost = (sq.items || []).reduce(
        (s, it) => s + (it.cogs || 0) * (it.quantity || 1),
        0
      );
      return sum + itemsCost + (sq.additionalFee || 0) + (sq.taxAmount || 0);
    }, 0);

    const sqSummary = supplierQuotations.map(sq => ({
      _id: sq._id,
      quotationId: sq.quotationId,
      vendorId: sq.vendorId,
      items: sq.items || [],
      additionalFee: sq.additionalFee || 0,
      taxAmount: sq.taxAmount || 0,
      taxPercentage: sq.taxPercentage || 0,
      totalCOGS:
        (sq.items || []).reduce((s, it) => s + (it.cogs || 0) * (it.quantity || 1), 0) +
        (sq.additionalFee || 0) +
        (sq.taxAmount || 0),
      approvalStatus: sq.approvalStatus,
      createdAt: sq.createdAt
    }));

    const supplierInvoices = await SupplierInvoice.find({ projectId }).sort({ createdAt: -1 });

    const totalSupplierPaid = supplierInvoices
      .filter(si => si.status === 'Paid')
      .reduce((sum, si) => sum + si.amount, 0);

    const totalSupplierPending = supplierInvoices
      .filter(si => si.status !== 'Paid')
      .reduce((sum, si) => sum + si.amount, 0);

    const siSummary = supplierInvoices.map(si => ({
      _id: si._id,
      invoiceNumber: si.invoiceNumber,
      poNumber: si.poNumber || '—',
      vendorName: si.vendorName,
      terminName: si.terminName,
      amount: si.amount,
      status: si.status,
      invoiceDate: si.invoiceDate,
      dueDate: si.dueDate || null,
      paymentDate: si.paymentDate || null
    }));

    // ─────────────────────────────────────────────────────────────────────
    // EXPENSE SUBMISSION (Reimburse / Meeting / Entertainment dll)
    // Ambil SEMUA status (Pending, Approved, Rejected) supaya tim project
    // bisa lihat histori lengkap di timeline — bukan cuma yang Approved.
    // Hanya yang Approved yang dihitung sebagai pengurang profit.
    // ─────────────────────────────────────────────────────────────────────
    const expenseSubmissions = await ExpenseSubmission.find({ projectId })
      .sort({ createdAt: -1 });

    const expenseSummary = expenseSubmissions.map(e => ({
      _id:             e._id,
      submissionId:    e.submissionId,
      items:           (e.items || []).map(it => ({
        name:        it.name,
        description: it.description || '',
        amount:      it.amount,
      })),
      amount:          e.amount,
      currency:        e.currency || 'IDR',
      status:          e.status,
      submittedByName: e.submittedByName || '—',
      reviewedByName:  e.reviewedByName || null,
      reviewDate:      e.reviewDate || null,
      rejectionReason: e.rejectionReason || null,
      file:            e.file || null,
      createdAt:       e.createdAt
    }));

    const totalOtherExpenseApproved = expenseSubmissions
      .filter(e => e.status === 'Approved')
      .reduce((sum, e) => sum + (e.amount || 0), 0);

    const totalOtherExpensePending = expenseSubmissions
      .filter(e => e.status === 'Pending Verification')
      .reduce((sum, e) => sum + (e.amount || 0), 0);

    // ─────────────────────────────────────────────────────────────────────
    // PROFIT MARGIN — sekarang ikut mengurangi biaya reimburse Approved
    // ─────────────────────────────────────────────────────────────────────
    const grossProfit = clientPrice - totalCOGS;
    const netProfit    = grossProfit - totalOtherExpenseApproved; // ← baru
    const profitMarginPct = clientPrice > 0
      ? parseFloat(((grossProfit / clientPrice) * 100).toFixed(2))
      : 0;
    const netMarginPct = clientPrice > 0
      ? parseFloat(((netProfit / clientPrice) * 100).toFixed(2))
      : 0;

    const milestones = {
      isDPPaid: project.isDPPaid || false,
      isItemsReceived: project.isItemsReceived || false,
      isItemsDelivered: project.isItemsDelivered || false,
      isFinalPaid: project.isFinalPaid || false
    };

    res.json({
      project: {
        projectId: project.projectId,
        projectName: project.projectName,
        clientName: project.clientName,
        institutionName: project.institutionName || '',
        clientContact: project.clientContact || '',
        clientAddress: project.clientAddress || '',
        status: project.status,
        createdAt: project.createdAt,
        milestones
      },

      financial: {
        clientPrice,
        shippingFee,
        taxPercentage,
        taxAmount,
        grandTotal,
        totalPaid: totalPaidFromInvoices,
        totalUnpaid: totalUnpaidFromInvoices,
        remaining: grandTotal - totalPaidFromInvoices,
        topOption
      },

      progress: {
        percent: progressPercent,
        paidStages,
        totalStages,
        isComplete
      },

      paymentStages,
      clientInvoices,
      purchaseOrders: poSummary,
      supplierQuotations: sqSummary,
      cogs: {
        total: totalCOGS,
        breakdown: sqSummary
      },

      supplierInvoices: siSummary,
      cashOut: {
        totalPaid: totalSupplierPaid,
        totalPending: totalSupplierPending,
        total: totalSupplierPaid + totalSupplierPending
      },

      // ── Baru: Expense Submission ──────────────────────────────────────
      expenses: {
        items:           expenseSummary,
        totalApproved:   totalOtherExpenseApproved,
        totalPending:    totalOtherExpensePending,
        count:           expenseSummary.length
      },

      profitMargin: {
        salesPrice:    clientPrice,
        cogs:          totalCOGS,
        otherExpense:  totalOtherExpenseApproved,  // ← baru
        grossProfit,
        netProfit,                                  // ← baru
        marginPercent: profitMarginPct,
        netMarginPercent: netMarginPct               // ← baru
      }
    });

  } catch (err) {
    console.error('Error getProjectTimeline:', err);
    res.status(500).json({ msg: err.message });
  }
};