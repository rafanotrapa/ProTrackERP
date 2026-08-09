const express = require('express');
const router = express.Router();
const Item = require('../models/Item');
const { protect, authorizeRoles } = require('../middleware/auth');

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
    const randomID = Math.floor(1000 + Math.random() * 9000);
    const generatedID = `ITM-${randomID}`;

    const newItem = new Item({
      ...req.body,
      itemId: generatedID
    });

    await newItem.save();
    res.status(201).json({ success: true, msg: "Item Berhasil Disimpan" });
  } catch (err) {
    console.error("Error Simpan:", err.message);
    res.status(500).json({ msg: err.message });
  }
});

module.exports = router;