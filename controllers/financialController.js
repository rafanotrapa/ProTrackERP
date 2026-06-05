const ClientInvoice = require('../models/CreateInvoice');
const ClientQuotation = require('../models/ClientQuotation');
const SupplierInvoice = require('../models/SupplierInvoice');
const Payment = require('../models/Payment');
const Project = require('../models/Project');

// ─────────────────────────────────────────────────────────────────────────────
// HELPER: normalize projectId string
// ─────────────────────────────────────────────────────────────────────────────
const norm = (id) => String(id || '').trim().toLowerCase();
exports.getFinancialSummary = async (req, res) => {
  try {
    const quotations = await ClientQuotation.find({ approvalStatus: 'Approved' });
    const supplierInvoices = await SupplierInvoice.find({ status: 'Paid' });
    const payments = await Payment.find({ status: 'Verified' }).populate('invoiceId');

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

    let totalCOGS               = 0;
    let totalImportDuty         = 0; 
    let totalSupplierTaxPassThru = 0; 

    supplierInvoices.forEach(si => {
      totalCOGS               += Number(si.amount           || 0);
      totalImportDuty         += Number(si.importDutyAmount || 0);
      totalSupplierTaxPassThru += Number(si.taxAmount       || 0);
    });


    const totalExpense  = totalCOGS + totalImportDuty;
    const netProfit     = totalClientRevenue - totalExpense;
    const grossMargin   = totalClientRevenue > 0
      ? ((netProfit / totalClientRevenue) * 100).toFixed(2)
      : '0.00';

    const totalBilled       = totalClientRevenue + totalClientTax + totalClientShipping;
    const totalOutstanding  = totalBilled - totalCashReceived;

    res.status(200).json({
      // --- Revenue breakdown ---
      totalClientRevenue,       
      totalClientTax,           
      totalClientShipping,      
      totalBilled,              

      totalCashReceived,        
      totalOutstanding,         


      totalCOGS,                
      totalImportDuty,          
      totalSupplierTaxPassThru, 
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
    const [quotations, supplierInvoices, clientInvoices, payments, projects] =
      await Promise.all([
        ClientQuotation.find({ approvalStatus: 'Approved' }),
        SupplierInvoice.find(),
        ClientInvoice.find(),
        Payment.find({ status: 'Verified' }).populate('invoiceId'),
        Project.find(),
      ]);


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

    const allIds = new Set([
      ...quotations.map(q => norm(q.projectId)),
      ...supplierInvoices.map(si => norm(si.projectId)),
      ...clientInvoices.map(i => norm(i.projectId)),
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

    const report = Array.from(allIds).map(pid => {
      const pQuotations       = quotations.filter(q  => norm(q.projectId)  === pid);
      const pSupplierInvoices = supplierInvoices.filter(si => norm(si.projectId) === pid);
      const pClientInvoices   = clientInvoices.filter(i  => norm(i.projectId)   === pid);


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

      let supplierCOGS               = 0; 
      let supplierImportDuty         = 0; 
      let supplierTaxPassThru        = 0; 
      let supplierTotalPaid          = 0;

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

      const totalExpense = supplierCOGS + supplierImportDuty;
      const netProfit    = clientRevenue - totalExpense;
      const margin       = clientRevenue > 0
        ? parseFloat(((netProfit / clientRevenue) * 100).toFixed(2))
        : 0;

      const cashReceived  = cashReceivedByProject[pid] || 0;
      const outstanding   = grandTotalBilled - cashReceived;

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


    report.sort((a, b) => b.netProfit - a.netProfit);

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

    const supplierInvoices = await SupplierInvoice.find({ status: 'Paid' })
      .sort({ paymentDate: -1 });

    const cashInEntries = payments.map(p => ({
      date:          p.paymentDate || p.createdAt,
      type:          'Cash In',
      description:   `Payment – ${p.invoiceId?.invoiceNumber || 'INV'}`,
      projectName:   p.invoiceId?.projectName || '-',
      clientName:    p.invoiceId?.clientName  || '-',
      amount:        Number(p.amountPaid || 0),
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

exports.getMonthlyTrend = async (req, res) => {
  try {
    const quotations       = await ClientQuotation.find({ approvalStatus: 'Approved' });
    const supplierInvoices = await SupplierInvoice.find({ status: 'Paid' });

    const monthlyMap = {};

    const getKey = (date) => {
      const d = new Date(date);
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    };

    quotations.forEach(q => {
      const key = getKey(q.approvalDate || q.updatedAt || q.timestamp);
      if (!monthlyMap[key]) monthlyMap[key] = { month: key, revenue: 0, clientTax: 0, clientShipping: 0, cogs: 0, importDuty: 0 };
      monthlyMap[key].revenue        += Number(q.clientPrice  || 0);
      monthlyMap[key].clientTax      += Number(q.taxAmount     || 0);
      monthlyMap[key].clientShipping += Number(q.shippingFee   || 0);
    });

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