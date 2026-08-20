const express = require('express');
const router = express.Router();
const Item = require('../models/Item');
const { protect, authorizeRoles } = require('../middleware/auth');
const { nextDocumentNumber } = require('../utils/documentNumber');

router.use(protect);

router.get('/', authorizeRoles('Procurement','Marketing','Management','Owner','Finance','Admin'), async (req, res) => {
  try {
    const items = await Item.find().sort({ createdAt: -1 });
    res.json(items);
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

router.post('/', authorizeRoles('Procurement','Admin'), async (req, res) => {
  try {
    // Dulu ITM-<acak 1000-9999> tanpa segmen bulan dan tanpa cek duplikat: hanya
    // 9.000 nomor untuk seumur hidup sistem, dan tabrakan langsung jadi 500.
    // Sekarang ikut pola dokumen lain, ITM-YYYYMM-NNNN dan berurutan. Item lama
    // tetap memakai format lamanya.
    const itemId = await nextDocumentNumber(
      'ITM',
      async (nomor) => Boolean(await Item.exists({ itemId: nomor }))
    );

    const newItem = new Item({
      itemId,
      itemName: req.body.itemName,
      unit: req.body.unit,
      specifications: req.body.specifications,
      category: req.body.category,
      vendorName: req.body.vendorName
    });

    await newItem.save();
    res.status(201).json({ success: true, msg: "Item Berhasil Disimpan" });
  } catch (err) {
    console.error("Error Simpan:", err.message);
    res.status(500).json({ msg: 'Gagal menyimpan item' });
  }
});

module.exports = router;