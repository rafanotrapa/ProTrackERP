const CreateInvoice = require('../models/CreateInvoice');
const { kirimDiamDiam } = require('../utils/notify');
const { picMarketing, usersByRole, gabung, namaPelaku } = require('../utils/notifyTargets');
const Payment = require('../models/Payment');
const ClientQuotation = require('../models/ClientQuotation');
const PurchaseOrder = require('../models/PurchaseOrder');
const SupplierInvoice = require('../models/SupplierInvoice');
const Project = require('../models/Project');
const { parsePaymentStages, resolveTopOption } = require('../utils/paymentTerms');
const { computeProcessPercent } = require('../utils/processProgress');
const { statusPerInvoice, totalTerbayarPerInvoice, totalTerbayar, sudahLunas } = require('../utils/clientPaymentStatus');

// Dulu berkas ini punya getInvoicePaymentStatus sendiri yang menjalankan satu
// findOne per invoice, dan hanya memeriksa ADA atau TIDAK pembayaran
// terverifikasi — bukan apakah nominalnya menutup tagihan. Keduanya sekarang
// ditangani utils/clientPaymentStatus.js dengan satu query untuk seluruh daftar.

const getVerifiedPayment = async (invoiceId) => {
  return Payment.findOne({ invoiceId, status: 'Verified' }).sort({ paymentDate: -1 });
};

const getContractGrandTotal = (quotation) => {
  const clientPrice = Number(quotation?.clientPrice || 0);
  const shippingFee = Number(quotation?.shippingFee || 0);
  const taxAmount   = Number(quotation?.taxAmount   || 0);
  return clientPrice + shippingFee + taxAmount;
};

exports.getAllProjectsBilling = async (req, res) => {
  try {
    const quotations = await ClientQuotation.find({ approvalStatus: 'Approved' });

    // Tanggal project dipakai untuk mengurutkan daftar dari yang terbaru, memakai
    // kunci yang sama dengan Financial Report dan Project Timeline.
    const projectDocs = await Project.find({}, 'projectId createdAt');
    const projectDateMap = {};
    projectDocs.forEach(p => { projectDateMap[p.projectId] = p.createdAt; });

    const projectMap = new Map();

    for (const quote of quotations) {
      if (!projectMap.has(quote.projectId)) {
        projectMap.set(quote.projectId, {
          projectId: quote.projectId,
          projectName: quote.projectName,
          clientName: quote.clientName,
          totalContractValue: getContractGrandTotal(quote),
          topOption: resolveTopOption(quote.topOption, quote.customTop),
          createdAt: projectDateMap[quote.projectId] || quote.createdAt || quote.timestamp,
          invoices: [],
          totalPaid: 0
        });
      }
    }

    const invoices = await CreateInvoice.find().sort({ createdAt: 1 });

    // Satu query untuk seluruh invoice. Sebelumnya findOne dipanggil di dalam
    // perulangan ini: pada 19 invoice biayanya 551 ms berbanding 33 ms, dan
    // tumbuh linier — 500 invoice berarti belasan detik.
    const statusInvoice = await statusPerInvoice(invoices);

    for (const invoice of invoices) {
      const project = projectMap.get(invoice.projectId);
      if (project) {
        const paymentStatus = statusInvoice.get(String(invoice._id)) || 'Unpaid';
        project.invoices.push({
          id: invoice._id,
          invoiceNumber: invoice.invoiceNumber,
          amount: invoice.amount,
          status: paymentStatus
        });
        // Hanya invoice yang benar-benar tertutup penuh yang dihitung lunas.
        // Yang berstatus Partial tetap menyisakan tagihan.
        if (paymentStatus === 'Paid') {
          project.totalPaid += invoice.amount;
        }
      }
    }

    const allPOs = await PurchaseOrder.find();
    const allSIs = await SupplierInvoice.find();
    const posByProject = {};
    allPOs.forEach(po => { (posByProject[po.projectId] = posByProject[po.projectId] || []).push(po); });
    const sisByProject = {};
    allSIs.forEach(si => { (sisByProject[si.projectId] = sisByProject[si.projectId] || []).push(si); });

    const result = Array.from(projectMap.values()).map(project => {
      const totalContract = project.totalContractValue || 0;
      const totalPaid = project.totalPaid || 0;
      const remainingAmount = totalContract - totalPaid;

      const stages = parsePaymentStages(project.topOption, totalContract);
      const totalStages = stages.length;
      const paidStages = project.invoices.filter(inv => inv.status === 'Paid').length;
      const progressPercent = totalStages > 0 ? (paidStages / totalStages) * 100 : 0;

      const processPercent = computeProcessPercent({
        hasQuotation: true,
        purchaseOrders: posByProject[project.projectId] || [],
        supplierInvoices: sisByProject[project.projectId] || [],
        paymentFraction: totalStages > 0 ? paidStages / totalStages : 0,
      });

      return {
        ...project,
        remainingAmount,
        progressPercent: Math.round(progressPercent),
        processPercent,
        stagesCount: totalStages,
        paidCount: paidStages,
        isComplete: paidStages >= totalStages
      };
    });

    result.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

    res.json(result);
  } catch (err) {
    console.error("Error get all projects billing:", err);
    res.status(500).json({ msg: err.message });
  }
};

exports.getProjectBillingDetail = async (req, res) => {
  try {
    const { projectId } = req.params;

    const quotation = await ClientQuotation.findOne({
      projectId,
      approvalStatus: 'Approved'
    }).sort({ createdAt: -1 });

    if (!quotation) {
      return res.status(404).json({ msg: 'No approved quotation found for this project' });
    }

    const totalContractValue = getContractGrandTotal(quotation);
    const topOption = resolveTopOption(quotation.topOption, quotation.customTop);

    const invoices = await CreateInvoice.find({ projectId }).sort({ createdAt: 1 });

    const expectedStages = parsePaymentStages(topOption, totalContractValue);

    // Status seluruh termin diambil sekali di depan, bukan satu query per tahap.
    const statusInvoice = await statusPerInvoice(invoices);
    // Nominal yang sudah benar-benar masuk per invoice. Dipakai untuk sisa
    // tagihan; tanpa ini layar input pembayaran tidak punya cara tahu bahwa
    // sebuah termin sudah dibayar sebagian.
    const terbayarInvoice = await totalTerbayarPerInvoice(invoices.map((i) => i._id));

    const stagesWithStatus = await Promise.all(expectedStages.map(async (stage, idx) => {
      const invoice = invoices[idx];
      let status = 'Pending';
      let invoiceData = null;

      if (invoice) {
        const paymentStatus = statusInvoice.get(String(invoice._id)) || 'Unpaid';
        status = paymentStatus;

        let paymentDate = null;
        if (paymentStatus === 'Paid') {
          const verifiedPayment = await getVerifiedPayment(invoice._id);
          paymentDate = verifiedPayment?.paymentDate || null;
        }

        /* paidAmount dan remaining ikut dikirim supaya Finance Input Payment bisa
         * mengunci kolom nominal ke SISA tagihan, bukan ke nilai penuh termin.
         * Bedanya nyata begitu sebuah termin berstatus Partial: mengunci di nilai
         * penuh akan mencatat angka yang tidak pernah diterima. */
        const sudahMasuk = terbayarInvoice.get(String(invoice._id)) || 0;

        invoiceData = {
          id: invoice._id,
          invoiceNumber: invoice.invoiceNumber,
          amount: invoice.amount,
          paidAmount: sudahMasuk,
          remaining: Math.max(Number(invoice.amount || 0) - sudahMasuk, 0),
          dueDate: invoice.dueDate,
          createdAt: invoice.createdAt,
          paymentDate
        };
      }

      return {
        stageNumber: idx + 1,
        name: stage.name,
        percentage: stage.percentage,
        expectedAmount: stage.amount,
        actualAmount: invoice?.amount || null,
        status,
        invoice: invoiceData,
        canGenerate: !invoice && idx === invoices.length
      };
    }));

    // Dulu baris ini membaca inv.status — tanda yang disimpan di dokumen invoice —
    // sementara seluruh berkas ini memakai status turunan. Keduanya bisa berbeda,
    // dan ringkasan jadi tidak cocok dengan daftar terminnya sendiri.
    const totalPaid = invoices
      .filter(inv => statusInvoice.get(String(inv._id)) === 'Paid')
      .reduce((sum, inv) => sum + inv.amount, 0);

    const totalStages = expectedStages.length;
    const paidStages = stagesWithStatus.filter(s => s.status === 'Paid').length;
    const progressPercent = totalStages > 0 ? (paidStages / totalStages) * 100 : 0;

    res.json({
      projectId: quotation.projectId,
      projectName: quotation.projectName,
      clientName: quotation.clientName,
      totalContractValue,
      clientPrice: Number(quotation.clientPrice || 0),
      shippingFee: Number(quotation.shippingFee || 0),
      taxAmount:   Number(quotation.taxAmount   || 0),
      topOption,
      stages: stagesWithStatus,
      summary: {
        totalPaid,
        remainingAmount: totalContractValue - totalPaid,
        progressPercent: Math.round(progressPercent),
        isComplete: paidStages >= totalStages,
        nextStageCanGenerate: stagesWithStatus.some(s => s.canGenerate)
      }
    });

  } catch (err) {
    console.error("Error get project billing detail:", err);
    res.status(500).json({ msg: err.message });
  }
};

exports.generateNextInvoice = async (req, res) => {
  try {
    const { projectId } = req.params;

    const quotation = await ClientQuotation.findOne({
      projectId,
      approvalStatus: 'Approved'
    }).sort({ createdAt: -1 });

    if (!quotation) {
      return res.status(404).json({ msg: 'No approved quotation found for this project' });
    }

    const totalContractValue = getContractGrandTotal(quotation);
    const topOption = resolveTopOption(quotation.topOption, quotation.customTop);

    const existingInvoices = await CreateInvoice.find({ projectId }).sort({ createdAt: 1 });

    const expectedStages = parsePaymentStages(topOption, totalContractValue);
    const nextStageIndex = existingInvoices.length;

    if (nextStageIndex >= expectedStages.length) {
      return res.status(400).json({ msg: 'All stages have been generated already' });
    }

    const nextStage = expectedStages[nextStageIndex];

    // Termin berikutnya hanya boleh terbit kalau termin sebelumnya benar-benar
    // lunas. Dulu cukup ada satu pembayaran terverifikasi, berapa pun nominalnya —
    // jadi bayar sebagian sudah membuka termin berikutnya.
    if (existingInvoices.length > 0) {
      const previousInvoice = existingInvoices[existingInvoices.length - 1];
      const masuk = await totalTerbayar(previousInvoice._id);
      if (!sudahLunas(masuk, previousInvoice.amount)) {
        return res.status(400).json({ msg: 'Previous stage must be paid before generating next invoice' });
      }
    }

    const invoiceCount = existingInvoices.length + 1;
    const invoiceNumber = `INV-${Date.now()}-${invoiceCount}`;

    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 30);

    const itemsWithSalesPrice = (quotation.items || []).map(item => ({
      itemName: item.itemName,
      quantity: item.quantity,
      unit: item.unit,
      price: item.salesPrice || item.cogs,
      cogs: item.cogs
    }));

    const newInvoice = new CreateInvoice({
      invoiceNumber,
      projectId,
      projectName: quotation.projectName,
      clientName: quotation.clientName,
      // Invoice memakai mata uang quotation-nya; nominal tahap juga dihitung
      // dari nilai kontrak yang berdenominasi sama, jadi keduanya konsisten.
      currency: quotation.currency || 'IDR',
      exchangeRate: quotation.exchangeRate || 1,
      amount: nextStage.amount,
      items: itemsWithSalesPrice,
      status: 'Unpaid',
      dueDate,
      totalContractValue,
      billingPhase: nextStage.name,
      topOption
    });

    await newInvoice.save();

    kirimDiamDiam({ penerima: gabung([await picMarketing(newInvoice.projectId)], req.user?.id),
      jenis: 'invoiceIssued',
      params: { nomor: newInvoice.invoiceNumber, tahap: newInvoice.billingPhase, oleh: await namaPelaku(req) },
      targetTipe: 'invoiceLog', actor: req.user?.id });

    res.status(201).json({
      success: true,
      msg: `Invoice for ${nextStage.name} generated successfully`,
      invoice: {
        id: newInvoice._id,
        invoiceNumber: newInvoice.invoiceNumber,
        amount: newInvoice.amount,
        billingPhase: newInvoice.billingPhase,
        clientName: quotation.clientName,
        dueDate: dueDate,
        topOption: topOption,
        items: itemsWithSalesPrice
      }
    });

  } catch (err) {
    // Indeks unik {projectId, billingPhase} menolak tahap yang sama dibuat dua
    // kali. Ini yang terjadi kalau dua orang menekan Generate Invoice hampir
    // bersamaan: permintaan pertama menang, sisanya mendarat di sini.
    if (err.code === 11000) {
      return res.status(409).json({
        msg: 'Invoice untuk tahap ini baru saja dibuat oleh pengguna lain. Muat ulang halaman untuk melihat versi terbaru.'
      });
    }
    console.error("Error generate next invoice:", err);
    res.status(500).json({ msg: err.message });
  }
};