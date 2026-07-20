const PurchaseOrder  = require('../models/PurchaseOrder');
const Item           = require('../models/Item');
const InventoryUsage = require('../models/InventoryUsage');

// ─────────────────────────────────────────────────────────────────────────────
// Agregasi jumlah awal per item dari SEMUA Purchase Order.
// Idempoten: dihitung ulang tiap request, jadi selalu sinkron dengan PO.
// ─────────────────────────────────────────────────────────────────────────────
const aggregatePOItems = () =>
  PurchaseOrder.aggregate([
    { $unwind: '$items' },
    {
      $group: {
        _id: '$items.itemName',
        initialQty: { $sum: { $ifNull: ['$items.quantity', 0] } },
        unit:       { $first: '$items.unit' },
      },
    },
    { $sort: { _id: 1 } },
  ]);

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/inventory — daftar stok gabungan (PO qty + terpakai → sisa)
// ─────────────────────────────────────────────────────────────────────────────
exports.getInventory = async (req, res) => {
  try {
    const [poItems, masterItems, usages] = await Promise.all([
      aggregatePOItems(),
      Item.find().select('itemName category'),
      InventoryUsage.find(),
    ]);

    // category ("jenis") diambil dari master Item bila cocok namanya
    const categoryByName = {};
    masterItems.forEach(it => { if (it.itemName) categoryByName[it.itemName.toLowerCase()] = it.category; });

    const usedByName = {};
    usages.forEach(u => { usedByName[u.itemName.toLowerCase()] = u.usedQty; });

    const rows = poItems.map(p => {
      const itemName   = p._id;
      const initialQty = p.initialQty || 0;
      const usedQty    = usedByName[itemName?.toLowerCase()] || 0;
      return {
        itemName,
        category:  categoryByName[itemName?.toLowerCase()] || '-',
        unit:      p.unit || '-',
        initialQty,
        usedQty,
        remaining: initialQty - usedQty,
      };
    });

    res.json(rows);
  } catch (err) {
    console.error('Error get inventory:', err);
    res.status(500).json({ msg: err.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /api/inventory/use — set nilai "terpakai" (absolut) untuk satu item.
// Guard: 0 <= usedQty <= initialQty (dihitung ulang dari PO).
// ─────────────────────────────────────────────────────────────────────────────
exports.updateUsage = async (req, res) => {
  try {
    const { itemName, usedQty } = req.body;
    if (!itemName) return res.status(400).json({ msg: 'itemName wajib diisi' });

    // initialQty untuk item ini (dari semua PO)
    const agg = await PurchaseOrder.aggregate([
      { $unwind: '$items' },
      { $match: { 'items.itemName': itemName } },
      { $group: { _id: '$items.itemName', initialQty: { $sum: { $ifNull: ['$items.quantity', 0] } } } },
    ]);
    const initialQty = agg[0]?.initialQty || 0;

    let clean = Number(usedQty) || 0;
    if (clean < 0) clean = 0;
    if (clean > initialQty) clean = initialQty;

    const updated = await InventoryUsage.findOneAndUpdate(
      { itemName },
      { usedQty: clean, updatedByName: req.user?.username || req.user?.name || 'System' },
      { new: true, upsert: true }
    );

    res.json({
      success: true,
      msg: `Terpakai untuk "${itemName}" diperbarui`,
      data: { itemName, usedQty: updated.usedQty, initialQty, remaining: initialQty - updated.usedQty },
    });
  } catch (err) {
    console.error('Error update usage:', err);
    res.status(500).json({ msg: err.message });
  }
};
