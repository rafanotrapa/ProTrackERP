const ClientInvoice = require('../models/CreateInvoice');
const SupplierInvoice = require('../models/SupplierInvoice');

exports.getProjectProfitability = async (req, res) => {
  try {
    const sales = await ClientInvoice.find(); 
    const purchases = await SupplierInvoice.find();

    // 1. Ambil semua Project ID unik, bersihkan dari spasi
    const allIds = [
      ...sales.map(s => String(s.projectId).trim()),
      ...purchases.map(p => String(p.projectId).trim())
    ];
    const uniqueIds = [...new Set(allIds)].filter(id => id && id !== "undefined");

    const report = uniqueIds.map(id => {
      // 2. Cari data yang cocok (Case Insensitive & Trim)
      const pSales = sales.filter(s => 
        String(s.projectId).trim().toLowerCase() === id.toLowerCase()
      );
      const pPurchases = purchases.filter(p => 
        String(p.projectId).trim().toLowerCase() === id.toLowerCase()
      );

      // 3. Hitung Income (Cek field 'amount')
      const income = pSales.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);

      // 4. Hitung Expense (Cek SEMUA kemungkinan nama field: totalAmount, amount, atau cost)
      const expense = pPurchases.reduce((acc, curr) => {
        const nilai = curr.totalAmount || curr.amount || curr.cost || 0;
        return acc + Number(nilai);
      }, 0);
      
      const projectName = pSales[0]?.projectName || pPurchases[0]?.projectName || "Project " + id;

      return {
        projectId: id,
        projectName: projectName,
        income: income,
        expense: expense,
        profit: income - expense
      };
    });

    // Log ke terminal biar lo bisa liat hasilnya sebelum dikirim ke frontend
    console.log("FINAL REPORT:", JSON.stringify(report, null, 2));
    
    res.status(200).json(report);
  } catch (error) {
    console.error("ERROR FINANSIAL:", error);
    res.status(500).json({ msg: error.message });
  }
};