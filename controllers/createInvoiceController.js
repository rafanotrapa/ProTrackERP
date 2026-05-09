const CreateInvoice = require('../models/CreateInvoice');
const ClientQuotation = require('../models/ClientQuotation'); // Untuk tarik data quote

exports.createNewInvoice = async (req, res) => {
  try {
    const newInvoice = new CreateInvoice(req.body);
    await newInvoice.save();
    res.status(201).json({ success: true, data: newInvoice });
  } catch (error) {
    res.status(400).json({ success: false, msg: error.message });
  }
};

exports.getQuotationForInvoice = async (req, res) => {
  try {
    const quotes = await ClientQuotation.find({ status: 'Approved' });
    res.json(quotes);
  } catch (error) {
    res.status(500).json({ msg: error.message });
  }
};