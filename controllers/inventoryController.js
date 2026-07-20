const PurchaseOrder  = require('../models/PurchaseOrder');
const Item           = require('../models/Item');

// ─────────────────────────────────────────────────────────────────────────────
// Inventory OTOMATIS dari Purchase Order — tanpa input manual:
//   • Qty Awal (masuk gudang) = total item dari SEMUA PO.
//   • Terpakai (keluar gudang) = total item dari PO yang sudah "Delivered"
//     (ditandai di Delivery Management saat barang dikirim ke client).
//   • Sisa = Qty Awal - Terpakai.
// Semua dihitung ulang tiap request → selalu sinkron dengan PO & pengiriman.
// ─────────────────────────────────────────────────────────────────────────────
const aggregateByItem = (match) => {
  const pipeline = [];
  if (match) pipeline.push({ $match: match });
  pipeline.push(
    { $unwind: '$items' },
    {
      $group: {
        _id: '$items.itemName',
        qty:  { $sum: { $ifNull: ['$items.quantity', 0] } },
        unit: { $first: '$items.unit' },
      },
    },
  );
  return PurchaseOrder.aggregate(pipeline);
};

exports.getInventory = async (req, res) => {
  try {
    const [poItems, deliveredItems, masterItems] = await Promise.all([
      aggregateByItem(null),                              // semua PO → qty awal
      aggregateByItem({ deliveryStatus: 'Delivered' }),   // PO terkirim → terpakai
      Item.find().select('itemName category'),
    ]);

    // category ("jenis") diambil dari master Item bila nama cocok
    const categoryByName = {};
    masterItems.forEach(it => { if (it.itemName) categoryByName[it.itemName.toLowerCase()] = it.category; });

    const usedByName = {};
    deliveredItems.forEach(d => { usedByName[(d._id || '').toLowerCase()] = d.qty; });

    const rows = poItems.map(p => {
      const itemName   = p._id;
      const initialQty = p.qty || 0;
      const usedQty    = usedByName[(itemName || '').toLowerCase()] || 0;
      return {
        itemName,
        category:  categoryByName[(itemName || '').toLowerCase()] || '-',
        unit:      p.unit || '-',
        initialQty,
        usedQty,
        remaining: initialQty - usedQty,
      };
    }).sort((a, b) => (a.itemName || '').localeCompare(b.itemName || ''));

    res.json(rows);
  } catch (err) {
    console.error('Error get inventory:', err);
    res.status(500).json({ msg: err.message });
  }
};
