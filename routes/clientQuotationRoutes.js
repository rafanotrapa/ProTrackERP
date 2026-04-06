const express = require('express');
const router = express.Router();
const ClientQuotation = require('../models/ClientQuotation');

// @route   POST api/client_quotation
router.post('/', async (req, res) => {
  try {
    const newQuote = new ClientQuotation(req.body);
    const savedQuote = await newQuote.save();
    res.status(201).json({ 
      success: true, 
      msg: "Quotation Client Berhasil Disimpan!",
      data: savedQuote 
    });
  } catch (err) {
    console.error("Error Simpan Client Quote:", err.message);
    res.status(500).json({ success: false, msg: err.message });
  }
});

// @route   GET api/client_quotation
router.get('/', async (req, res) => {
  try {
    const quotes = await ClientQuotation.find().sort({ timestamp: -1 });
    res.json(quotes);
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

module.exports = router;