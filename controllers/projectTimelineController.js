const Project            = require('../models/Project');
const ClientQuotation    = require('../models/ClientQuotation');
const CreateInvoice      = require('../models/CreateInvoice');
const Payment            = require('../models/Payment');
const PurchaseOrder      = require('../models/PurchaseOrder');
const SupplierQuotation  = require('../models/SupplierQuotation');
const SupplierInvoice    = require('../models/SupplierInvoice');
const ExpenseSubmission  = require('../models/ExpenseSubmission');
const { parsePaymentStages, resolveTopOption } = require('../utils/paymentTerms');
const { keIDR, jumlahIDR } = require('../utils/uang');
const { computePOPaymentStatuses, UNPAID } = require('../utils/poPaymentStatus');
const { computeProcessSteps } = require('../utils/processProgress');

// Berkas ini dulu punya getInvoicePaymentStatus sendiri yang hanya memeriksa
// ADA atau TIDAK pembayaran terverifikasi, tanpa membandingkan nominalnya
// dengan nilai tagihan. Akibatnya bayar sebagian tampil "Paid" di timeline,
// dan karena paidStages memberi makan progressPercent serta paymentFraction,
// persentase progres project ikut naik lebih cepat dari kenyataan.
const { statusPerInvoice, totalTerbayarPerInvoice } = require('../utils/clientPaymentStatus');

const getVerifiedPayment = async (invoiceId) => {
  return Payment.findOne({ invoiceId, status: 'Verified' }).sort({ paymentDate: -1 });
};

const getContractGrandTotal = (q) =>
  Number(q?.clientPrice || 0) + Number(q?.shippingFee || 0) + Number(q?.taxAmount || 0);

const parseTopOption = parsePaymentStages;

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

    const clientPrice   = clientQuotation?.clientPrice || project.amount || 0;
    const shippingFee   = clientQuotation?.shippingFee || 0;
    const taxAmount     = clientQuotation?.taxAmount   || 0;
    const taxPercentage = clientQuotation?.taxPercentage || 0;

    const grandTotal = getContractGrandTotal(clientQuotation || { clientPrice, shippingFee, taxAmount });

    /* Dua satuan yang sengaja dipisah, dan pemisahan ini penting:
     *
     *   - clientPrice / grandTotal tetap dalam MATA UANG QUOTATION-nya. Keduanya
     *     membagi tahap termin yang nantinya diterbitkan sebagai invoice ke
     *     client, jadi mengonversinya di sini akan mengubah nominal tagihan.
     *   - clientPriceIDR dipakai HANYA untuk margin dan laba, karena semua biaya
     *     (COGS, bea masuk, expense) sudah dinyatakan dalam rupiah.
     *
     * Sebelum ini keduanya satu variabel, sehingga harga jual berdenominasi
     * asing dibandingkan langsung dengan biaya berdenominasi rupiah. */
    const kontrakMata = clientQuotation?.currency || 'IDR';
    const kontrakKurs = clientQuotation?.exchangeRate || 1;
    const clientPriceIDR = keIDR(clientPrice, kontrakKurs, kontrakMata);

    const topOption = resolveTopOption(clientQuotation?.topOption, clientQuotation?.customTop) || '—';
    const rawInvoices = await CreateInvoice.find({ projectId }).sort({ createdAt: 1 });

    // Status seluruh invoice diambil sekali di depan, dan diturunkan dari
    // nominal yang benar-benar masuk — bisa Paid, Partial, atau Unpaid.
    const statusInvoice = await statusPerInvoice(rawInvoices);
    const terbayarInvoice = await totalTerbayarPerInvoice(rawInvoices.map((i) => i._id));

    const clientInvoices = await Promise.all(
      rawInvoices.map(async (inv) => {
        const payStatus = statusInvoice.get(String(inv._id)) || 'Unpaid';
        let paymentDate = null;
        if (payStatus !== 'Unpaid') {
          const verifiedPayment = await getVerifiedPayment(inv._id);
          paymentDate = verifiedPayment?.paymentDate || null;
        }
        return {
          _id: inv._id,
          invoiceNumber: inv.invoiceNumber,
          billingPhase: inv.billingPhase || '—',
          amount: inv.amount,
          dueDate: inv.dueDate,
          createdAt: inv.createdAt,
          status: payStatus,
          paidAmount: terbayarInvoice.get(String(inv._id)) || 0,
          paymentDate,
          topOption: inv.topOption
        };
      })
    );

    // Dijumlahkan dari uang yang benar-benar masuk, bukan dari nilai invoice
    // yang kebetulan berstatus Paid. Dengan cara lama, invoice yang baru
    // dibayar sebagian dihitung penuh di totalPaid; dan begitu status Partial
    // ada, invoice itu justru hilang dari kedua penjumlahan.
    const totalPaidFromInvoices = clientInvoices
      .reduce((sum, inv) => sum + inv.paidAmount, 0);

    const totalBilled = clientInvoices.reduce((sum, inv) => sum + Number(inv.amount || 0), 0);
    const totalUnpaidFromInvoices = Math.max(totalBilled - totalPaidFromInvoices, 0);

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
              paymentDate: invoice.paymentDate,
              status: invoice.status
            }
          : null,
        status: invoice ? invoice.status : 'Pending'
      };
    });

    const totalStages = paymentStages.length;
    const paidStages = paymentStages.filter(s => s.status === 'Paid').length;
    const progressPercent = totalStages > 0 ? Math.round((paidStages / totalStages) * 100) : 0;
    const isComplete = paidStages >= totalStages && totalStages > 0;

    const lastClientPaymentDate = clientInvoices.reduce((latest, inv) => {
      if (!inv.paymentDate) return latest;
      return !latest || new Date(inv.paymentDate) > new Date(latest) ? inv.paymentDate : latest;
    }, null);

    const paymentFraction = totalStages > 0 ? paidStages / totalStages : 0;

    const purchaseOrders = await PurchaseOrder.find({ projectId })
      .populate('vendorId', 'vendorName vendorContact vendorAddress')
      .sort({ timestamp: -1 });

    // Sama seperti daftar PO: status pembayaran diturunkan dari tagihan supplier
    // yang sudah lunas, bukan dari field PO yang tidak pernah diperbarui.
    const poStatusMap = await computePOPaymentStatuses(purchaseOrders);

    const poSummary = purchaseOrders.map(po => ({
      _id: po._id,
      poNumber: po.poNumber,
      vendorName: po.vendorId?.vendorName || '—',
      vendorContact: po.vendorId?.vendorContact || '—',
      items: po.items || [],
      totalAmount: po.totalAmount || 0,
      additionalFee: po.additionalFee || 0,
      taxAmount: po.taxAmount || 0,
      paymentStatus: poStatusMap.get(po.poNumber) || UNPAID,
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

    /* Seluruh angka biaya di bawah ini dinyatakan dalam RUPIAH.
     *
     * Quotation supplier bisa berdenominasi asing, dan sebelum ini nominalnya
     * dijumlahkan apa adanya — CNY 100.000 masuk sebagai Rp 100.000. jumlahIDR
     * mengalikannya dengan kurs yang terkunci di dokumen masing-masing.
     * Dokumen lama tidak punya kurs dan seluruhnya rupiah, jadi bawaan 1 membuat
     * hasilnya persis sama seperti sebelumnya. */
    const estimatedCOGS = jumlahIDR(supplierQuotations, (sq) =>
      (sq.items || []).reduce((s, it) => s + (it.cogs || 0) * (it.quantity || 1), 0)
      + (sq.additionalFee || 0) + (sq.taxAmount || 0)
    );

    const sqSummary = supplierQuotations.map(sq => ({
      _id: sq._id,
      quotationId: sq.quotationId,
      vendorId: sq.vendorId,
      items: sq.items || [],
      additionalFee: sq.additionalFee || 0,
      taxAmount: sq.taxAmount || 0,
      taxPercentage: sq.taxPercentage || 0,
      // Nominal asli tetap dibawa supaya layar bisa menampilkan mata uang
      // dokumennya; totalCOGS sendiri sudah dalam rupiah agar bisa dibandingkan
      // dengan harga jual.
      currency: sq.currency || 'IDR',
      exchangeRate: sq.exchangeRate || 1,
      totalCOGSAsli:
        (sq.items || []).reduce((s, it) => s + (it.cogs || 0) * (it.quantity || 1), 0) +
        (sq.additionalFee || 0) + (sq.taxAmount || 0),
      totalCOGS: keIDR(
        (sq.items || []).reduce((s, it) => s + (it.cogs || 0) * (it.quantity || 1), 0) +
        (sq.additionalFee || 0) + (sq.taxAmount || 0),
        sq.exchangeRate, sq.currency
      ),
      approvalStatus: sq.approvalStatus,
      createdAt: sq.createdAt
    }));

    const supplierInvoices = await SupplierInvoice.find({ projectId }).sort({ createdAt: -1 });

    const paidSupplierInvoices    = supplierInvoices.filter(si => si.status === 'Paid');
    const pendingSupplierInvoices = supplierInvoices.filter(si => si.status !== 'Paid');

    const nilaiPenuh = (si) =>
      Number(si.totalAmount || (si.amount + si.taxAmount + si.importDutyAmount) || si.amount || 0);

    const actualCOGS        = jumlahIDR(paidSupplierInvoices, (si) => Number(si.amount || 0));
    const actualImportDuty  = jumlahIDR(paidSupplierInvoices, (si) => Number(si.importDutyAmount || 0));
    const actualTaxPassThru = jumlahIDR(paidSupplierInvoices, (si) => Number(si.taxAmount || 0));

    const totalSupplierPaid    = jumlahIDR(paidSupplierInvoices, nilaiPenuh);
    const totalSupplierPending = jumlahIDR(pendingSupplierInvoices, nilaiPenuh);

    const siSummary = supplierInvoices.map(si => ({
      _id: si._id,
      invoiceNumber: si.invoiceNumber,
      poNumber: si.poNumber || '—',
      vendorName: si.vendorName,
      terminName: si.terminName,
      amount: si.amount,
      taxAmount: si.taxAmount || 0,
      importDutyAmount: si.importDutyAmount || 0,
      totalAmount: si.totalAmount || si.amount,
      status: si.status,
      invoiceDate: si.invoiceDate,
      dueDate: si.dueDate || null,
      paymentDate: si.paymentDate || null
    }));

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

    // Pengajuan biaya juga bisa berdenominasi asing — currency-nya bahkan sudah
    // ikut dikirim ke layar di expenseSummary di atas, tapi tidak pernah dibaca
    // saat menjumlah. Itu yang membuat ProjectTimeline mencetak "Rp 500" tepat
    // di atas label "Total • USD".
    const totalOtherExpenseApproved = jumlahIDR(
      expenseSubmissions.filter(e => e.status === 'Approved'), (e) => e.amount || 0);

    const totalOtherExpensePending = jumlahIDR(
      expenseSubmissions.filter(e => e.status === 'Pending Verification'), (e) => e.amount || 0);

    const totalActualExpense = actualCOGS + actualImportDuty + totalOtherExpenseApproved;
    const grossProfit = clientPriceIDR - actualCOGS;
    const netProfit   = clientPriceIDR - totalActualExpense;

    const profitMarginPct = clientPriceIDR > 0
      ? parseFloat(((grossProfit / clientPriceIDR) * 100).toFixed(2))
      : 0;
    const netMarginPct = clientPriceIDR > 0
      ? parseFloat(((netProfit / clientPriceIDR) * 100).toFixed(2))
      : 0;

    const estimatedNetProfit = clientPriceIDR - estimatedCOGS - totalOtherExpenseApproved;
    const estimatedMarginPct = clientPriceIDR > 0
      ? parseFloat(((estimatedNetProfit / clientPriceIDR) * 100).toFixed(2))
      : 0;

    const milestones = {
      isDPPaid: project.isDPPaid || false,
      isItemsReceived: project.isItemsReceived || false,
      isItemsDelivered: project.isItemsDelivered || false,
      isFinalPaid: project.isFinalPaid || false
    };

    const processStepsRaw = computeProcessSteps({
      hasQuotation: !!clientQuotation,
      purchaseOrders,
      supplierInvoices,
      paymentFraction,
    });
    const processPercent = Math.round(
      (processStepsRaw.reduce((s, st) => s + st.fraction, 0) / processStepsRaw.length) * 100
    );
    const processSteps = processStepsRaw.map(st => ({
      label: st.label,
      done: st.fraction >= 1,
      percent: Math.round(st.fraction * 100),
    }));

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
        // Mata uang kontrak dikirim supaya layar tahu satuan clientPrice dan
        // grandTotal; angka laba/margin di blok lain selalu rupiah.
        currency: kontrakMata,
        exchangeRate: kontrakKurs,
        clientPriceIDR,
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
        percent: processPercent,
        paymentPercent: progressPercent,
        paidStages,
        totalStages,
        isComplete,
        lastClientPaymentDate,
        steps: processSteps
      },

      paymentStages,
      clientInvoices,
      purchaseOrders: poSummary,

      supplierQuotations: sqSummary,
      cogs: {
        total: estimatedCOGS,
        breakdown: sqSummary
      },

      supplierInvoices: siSummary,
      cashOut: {
        totalPaid: totalSupplierPaid,
        totalPending: totalSupplierPending,
        total: totalSupplierPaid + totalSupplierPending,
        breakdownPaid: {
          cogs: actualCOGS,
          taxAmount: actualTaxPassThru,
          importDuty: actualImportDuty,
        }
      },

      expenses: {
        items:         expenseSummary,
        totalApproved: totalOtherExpenseApproved,
        totalPending:  totalOtherExpensePending,
        count:         expenseSummary.length
      },

      profitMargin: {
        salesPrice:    clientPrice,

        cogs:          actualCOGS,
        importDuty:    actualImportDuty,
        otherExpense:  totalOtherExpenseApproved,
        grossProfit,
        netProfit,
        marginPercent:    profitMarginPct,
        netMarginPercent: netMarginPct,

        estimatedCOGS,
        estimatedNetProfit,
        estimatedMarginPct,
      }
    });

  } catch (err) {
    console.error('Error getProjectTimeline:', err);
    res.status(500).json({ msg: err.message });
  }
};