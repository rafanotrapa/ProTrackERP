const ClientInvoice = require('../models/CreateInvoice');
const ClientQuotation = require('../models/ClientQuotation');

// 1. Fungsi Create Invoice
exports.createNewInvoice = async (req, res) => {
  try {
    const { projectId, amount, isProgressInvoice } = req.body;
    
    if (isProgressInvoice) {
      const existingInvoices = await ClientInvoice.find({ 
        projectId: projectId,
        amount: amount,
        status: 'Paid'
      });
      
      if (existingInvoices.length > 0) {
        return res.status(400).json({ 
          msg: "Termin/Progress invoice ini sudah pernah dibuat dan dibayar" 
        });
      }
    }
    
    const newInvoice = new ClientInvoice({
      ...req.body,
      status: 'Unpaid'
    });

    const savedInvoice = await newInvoice.save();
    res.status(201).json(savedInvoice);
  } catch (err) {
    console.error("Error Create Invoice:", err);
    res.status(500).json({ msg: "Gagal membuat invoice", error: err.message });
  }
};

// 2. Fungsi Get Quotation untuk Invoice (Progress Invoice)
exports.getQuotationForInvoice = async (req, res) => {
  try {
    const quotations = await ClientQuotation.find();
    const availableQuotes = [];
    
    for (const quote of quotations) {
      const projectId = quote.projectId;
      
      // Cari semua invoice untuk project ini
      const invoices = await ClientInvoice.find({ projectId: projectId });
      
      // Hitung total yang sudah dibayar
      const totalPaid = invoices
        .filter(inv => inv.status === 'Paid')
        .reduce((sum, inv) => sum + (inv.amount || 0), 0);
      
      // Hitung total yang pending
      const totalPending = invoices
        .filter(inv => inv.status === 'Unpaid')
        .reduce((sum, inv) => sum + (inv.amount || 0), 0);
      
      const totalContract = Number(quote.clientPrice || 0);
      const remainingAmount = totalContract - totalPaid - totalPending;
      
      // TAMPILKAN SEMUA PROJECT yang masih punya sisa tagihan (remainingAmount > 0)
      if (remainingAmount > 0) {
        // Parse TOP
        const topText = (quote.topOption || 'COD').toUpperCase();
        const percentageMatch = topText.match(/(\d+)%/);
        let terminPercentage = percentageMatch ? parseInt(percentageMatch[1]) : 100;
        const terminAmount = (totalContract * terminPercentage) / 100;
        
        // Ambil nama project dari invoice yang sudah ada (jika ada), atau dari quotation
        let projectDisplayName = projectId; // default pake kode project
        
        // Coba ambil nama dari invoice yang sudah ada
        if (invoices.length > 0 && invoices[0].projectName) {
          projectDisplayName = invoices[0].projectName;
        } else {
          // Coba ambil dari item pertama (jika ada)
          const firstItem = quote.items?.[0];
          if (firstItem && firstItem.itemName) {
            projectDisplayName = firstItem.itemName;
          }
        }
        
        availableQuotes.push({
          _id: quote._id,
          projectId: projectId,
          projectName: projectDisplayName, // ← sekarang pake nama bener
          clientName: quote.clientName || 'N/A',
          clientPrice: totalContract,
          items: quote.items || [],
          topOption: quote.topOption,
          remainingAmount: remainingAmount,
          terminPercentage: terminPercentage,
          terminAmount: terminAmount,
          totalPaid: totalPaid,
          totalPending: totalPending,
          hasPartialPayment: totalPaid > 0
        });
      }
    }
    
    res.json(availableQuotes);
  } catch (err) {
    console.error("Error getQuotationForInvoice:", err);
    res.status(500).json({ msg: "Gagal mengambil data quotation", error: err.message });
  }
};

// 3. Get All Invoices
exports.getAllInvoices = async (req, res) => {
  try {
    const invoices = await ClientInvoice.find().sort({ createdAt: -1 });
    res.json(invoices);
  } catch (err) {
    console.error("Error getAllInvoices:", err);
    res.status(500).json({ msg: "Gagal mengambil list invoice" });
  }
};

// 4. Get Single Invoice by ID
exports.getInvoiceById = async (req, res) => {
  try {
    const invoice = await ClientInvoice.findById(req.params.id);
    if (!invoice) {
      return res.status(404).json({ msg: "Invoice tidak ditemukan" });
    }
    res.json(invoice);
  } catch (err) {
    console.error("Error getInvoiceById:", err);
    res.status(500).json({ msg: "Gagal mengambil detail invoice" });
  }
};

// 5. Update Invoice Status
exports.updateInvoiceStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const invoice = await ClientInvoice.findByIdAndUpdate(
      req.params.id,
      { status: status },
      { new: true }
    );
    
    if (!invoice) {
      return res.status(404).json({ msg: "Invoice tidak ditemukan" });
    }
    
    res.json({ msg: "Status invoice updated", invoice });
  } catch (err) {
    console.error("Error updateInvoiceStatus:", err);
    res.status(500).json({ msg: "Gagal update status invoice" });
  }
};

// 6. Get Invoice by Project ID
exports.getInvoicesByProject = async (req, res) => {
  try {
    const { projectId } = req.params;
    const invoices = await ClientInvoice.find({ projectId: projectId })
      .sort({ createdAt: -1 });
    
    const totalPaid = invoices
      .filter(inv => inv.status === 'Paid')
      .reduce((sum, inv) => sum + inv.amount, 0);
    
    const totalUnpaid = invoices
      .filter(inv => inv.status === 'Unpaid')
      .reduce((sum, inv) => sum + inv.amount, 0);
    
    res.json({
      invoices: invoices,
      summary: {
        totalPaid: totalPaid,
        totalUnpaid: totalUnpaid,
        count: invoices.length
      }
    });
  } catch (err) {
    console.error("Error getInvoicesByProject:", err);
    res.status(500).json({ msg: "Gagal ambil invoice by project" });
  }
};