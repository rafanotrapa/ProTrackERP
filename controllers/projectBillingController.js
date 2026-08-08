const CreateInvoice = require('../models/CreateInvoice');
const Payment = require('../models/Payment');
const ClientQuotation = require('../models/ClientQuotation');
const PurchaseOrder = require('../models/PurchaseOrder');
const SupplierInvoice = require('../models/SupplierInvoice');
const { parsePaymentStages, resolveTopOption } = require('../utils/paymentTerms');
const { computeProcessPercent } = require('../utils/processProgress');

const getInvoicePaymentStatus = async (invoiceId) => {
  const payment = await Payment.findOne({ invoiceId, status: 'Verified' });
  return payment ? 'Paid' : 'Unpaid';
};

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

    const projectMap = new Map();

    for (const quote of quotations) {
      if (!projectMap.has(quote.projectId)) {
        projectMap.set(quote.projectId, {
          projectId: quote.projectId,
          projectName: quote.projectName,
          clientName: quote.clientName,
          totalContractValue: getContractGrandTotal(quote),
          topOption: resolveTopOption(quote.topOption, quote.customTop),
          invoices: [],
          totalPaid: 0
        });
      }
    }

    const invoices = await CreateInvoice.find().sort({ createdAt: 1 });

    for (const invoice of invoices) {
      const project = projectMap.get(invoice.projectId);
      if (project) {
        const paymentStatus = await getInvoicePaymentStatus(invoice._id);
        project.invoices.push({
          id: invoice._id,
          invoiceNumber: invoice.invoiceNumber,
          amount: invoice.amount,
          status: paymentStatus
        });
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

    const stagesWithStatus = await Promise.all(expectedStages.map(async (stage, idx) => {
      const invoice = invoices[idx];
      let status = 'Pending';
      let invoiceData = null;

      if (invoice) {
        const paymentStatus = await getInvoicePaymentStatus(invoice._id);
        status = paymentStatus;

        let paymentDate = null;
        if (paymentStatus === 'Paid') {
          const verifiedPayment = await getVerifiedPayment(invoice._id);
          paymentDate = verifiedPayment?.paymentDate || null;
        }

        invoiceData = {
          id: invoice._id,
          invoiceNumber: invoice.invoiceNumber,
          amount: invoice.amount,
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

    const totalPaid = invoices
      .filter(inv => inv.status === 'Paid')
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

    if (existingInvoices.length > 0) {
      const previousInvoice = existingInvoices[existingInvoices.length - 1];
      const previousPaymentStatus = await getInvoicePaymentStatus(previousInvoice._id);
      if (previousPaymentStatus !== 'Paid') {
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
      amount: nextStage.amount,
      items: itemsWithSalesPrice,
      status: 'Unpaid',
      dueDate,
      totalContractValue,
      billingPhase: nextStage.name,
      topOption
    });

    await newInvoice.save();

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
    console.error("Error generate next invoice:", err);
    res.status(500).json({ msg: err.message });
  }
};