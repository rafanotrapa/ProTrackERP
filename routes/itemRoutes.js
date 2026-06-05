const express = require('express');
const router = express.Router();
const Item = require('../models/Item');

router.get('/', async (req, res) => {
  try {
    const items = await Item.find().sort({ createdAt: -1 });
    res.json(items);
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

router.post('/', async (req, res) => {
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