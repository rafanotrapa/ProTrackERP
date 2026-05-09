const CreateInvoice = require('../models/CreateInvoice');
const ClientQuotation = require('../models/ClientQuotation');

exports.createNewInvoice = async (req, res) => {
  try {
    // Kita pastiin statusnya masuk sebagai 'Paid' kalau dikirim dari frontend dashboard
    const invoiceData = {
      ...req.body,
      status: req.body.status || 'Paid' 
    };

    const newInvoice = new CreateInvoice(invoiceData);
    await newInvoice.save();
    
    res.status(201).json({ 
      success: true, 
      msg: "Invoice berhasil disimpan ke database!",
      data: newInvoice 
    });
  } catch (error) {
    console.error("Error Create Invoice:", error.message);
    res.status(400).json({ success: false, msg: error.message });
  }
};

exports.getQuotationForInvoice = async (req, res) => {
  try {
    // Ambil semua quotation client untuk di-pull ke invoice
    // Lo bisa tambah filter { status: 'Approved' } kalau sudah ada sistem approval
    const quotes = await ClientQuotation.find().sort({ timestamp: -1 });
    res.json(quotes);
  } catch (error) {
    res.status(500).json({ msg: error.message });
  }
};