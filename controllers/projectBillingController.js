const CreateInvoice = require('../models/CreateInvoice');
const Payment = require('../models/Payment');
const ClientQuotation = require('../models/ClientQuotation');

// Helper: Get payment status for an invoice
const getInvoicePaymentStatus = async (invoiceId) => {
  const payment = await Payment.findOne({ invoiceId, status: 'Verified' });
  return payment ? 'Paid' : 'Unpaid';
};

// Helper: Parse TOP to get stages count and percentages
const parseTopOption = (topOption, totalContractValue) => {
  const topText = topOption?.toUpperCase() || '';
  
  // Check for DP X% pattern (e.g., "DP 30%", "DP 50%")
  const dpMatch = topText.match(/DP\s*(\d+)%/i);
  if (dpMatch) {
    const dpPercent = parseInt(dpMatch[1]);
    const remainingPercent = 100 - dpPercent;
    return {
      type: 'installment',
      stages: [
        { name: `DP ${dpPercent}%`, percentage: dpPercent, amount: (totalContractValue * dpPercent) / 100, order: 1 },
        { name: `Pelunasan ${remainingPercent}%`, percentage: remainingPercent, amount: (totalContractValue * remainingPercent) / 100, order: 2 }
      ]
    };
  }
  
  // Check for "Termin X% + Y%" pattern
  const terminMatches = [...topText.matchAll(/(\d+)%/g)];
  if (terminMatches.length === 2) {
    const p1 = parseInt(terminMatches[0][1]);
    const p2 = parseInt(terminMatches[1][1]);
    return {
      type: 'installment',
      stages: [
        { name: `Termin ${p1}%`, percentage: p1, amount: (totalContractValue * p1) / 100, order: 1 },
        { name: `Termin ${p2}%`, percentage: p2, amount: (totalContractValue * p2) / 100, order: 2 }
      ]
    };
  }
  
  // Check for single percentage (e.g., just "30%")
  const singlePercentMatch = topText.match(/(\d+)%/);
  if (singlePercentMatch && !topText.includes('DP') && !topText.includes('TERMIN')) {
    const percent = parseInt(singlePercentMatch[1]);
    const remainingPercent = 100 - percent;
    return {
      type: 'installment',
      stages: [
        { name: `Pembayaran ${percent}%`, percentage: percent, amount: (totalContractValue * percent) / 100, order: 1 },
        { name: `Pelunasan ${remainingPercent}%`, percentage: remainingPercent, amount: (totalContractValue * remainingPercent) / 100, order: 2 }
      ]
    };
  }
  
  // Default: Single payment (Net, COD, CBD, etc)
  return {
    type: 'full',
    stages: [
      { name: 'Full Payment', percentage: 100, amount: totalContractValue, order: 1 }
    ]
  };
};

// 1. GET ALL PROJECTS WITH BILLING INFO
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
          totalContractValue: quote.clientPrice,
          topOption: quote.topOption,
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
    
    const result = Array.from(projectMap.values()).map(project => {
      const totalContract = project.totalContractValue || 0;
      const totalPaid = project.totalPaid || 0;
      const remainingAmount = totalContract - totalPaid;
      
      // 🔥 PROGRESS BERDASARKAN STAGES (TERMIN), BUKAN NOMINAL
      const stages = parseTopOption(project.topOption, totalContract);
      const totalStages = stages.stages.length;
      const paidStages = project.invoices.filter(inv => inv.status === 'Paid').length;
      const progressPercent = totalStages > 0 ? (paidStages / totalStages) * 100 : 0;
      
      return {
        ...project,
        remainingAmount,
        progressPercent: Math.round(progressPercent),
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

// 2. GET PROJECT BILLING DETAIL
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
    
    const totalContractValue = quotation.clientPrice;
    const topOption = quotation.topOption;
    
    const invoices = await CreateInvoice.find({ projectId }).sort({ createdAt: 1 });
    
    const expectedStages = parseTopOption(topOption, totalContractValue);
    
    const stagesWithStatus = await Promise.all(expectedStages.stages.map(async (stage, idx) => {
      const invoice = invoices[idx];
      let status = 'Pending';
      let invoiceData = null;
      
      if (invoice) {
        const paymentStatus = await getInvoicePaymentStatus(invoice._id);
        status = paymentStatus;
        invoiceData = {
          id: invoice._id,
          invoiceNumber: invoice.invoiceNumber,
          amount: invoice.amount,
          dueDate: invoice.dueDate,
          createdAt: invoice.createdAt
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
    
    // 🔥 PROGRESS BERDASARKAN STAGES (TERMIN)
    const totalStages = expectedStages.stages.length;
    const paidStages = stagesWithStatus.filter(s => s.status === 'Paid').length;
    const progressPercent = totalStages > 0 ? (paidStages / totalStages) * 100 : 0;
    
    res.json({
      projectId: quotation.projectId,
      projectName: quotation.projectName,
      clientName: quotation.clientName,
      totalContractValue,
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

// 3. GENERATE NEXT INVOICE
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
    
    const totalContractValue = quotation.clientPrice;
    const topOption = quotation.topOption;
    
    const existingInvoices = await CreateInvoice.find({ projectId }).sort({ createdAt: 1 });
    
    const expectedStages = parseTopOption(topOption, totalContractValue);
    const nextStageIndex = existingInvoices.length;
    
    if (nextStageIndex >= expectedStages.stages.length) {
      return res.status(400).json({ msg: 'All stages have been generated already' });
    }
    
    const nextStage = expectedStages.stages[nextStageIndex];
    
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