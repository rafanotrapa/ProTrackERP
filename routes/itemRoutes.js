const express = require('express');
const router = express.Router();
const Item = require('../models/Item');

// Ini untuk GET (Ambil data buat tabel)
router.get('/', async (req, res) => {
  try {
    const items = await Item.find().sort({ createdAt: -1 });
    res.json(items);
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

// Ini untuk POST (Simpan data dari form)
router.post('/', async (req, res) => {
  try {
    // Generate Item ID Otomatis (Contoh: ITM-8372)
    const randomID = Math.floor(1000 + Math.random() * 9000);
    const generatedID = `ITM-${randomID}`;

    const newItem = new Item({
      ...req.body,
      itemId: generatedID // Masukin ID-nya di sini biar gak error required
    });

    await newItem.save();
    res.status(201).json({ success: true, msg: "Item Berhasil Disimpan" });
  } catch (err) {
    console.error("Error Simpan:", err.message);
    res.status(500).json({ msg: err.message });
  }
});

module.exports = router; // <-- CEK INI, JANGAN SAMPE TYPO/ILANG