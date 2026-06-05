const SupplierInvoice = require('../models/SupplierInvoice');


exports.getSupplierPayments = async (req, res) => {
  try {
    const data = await SupplierInvoice.find({ status: { $ne: 'Paid' } }).sort({ createdAt: -1 });
    res.status(200).json(data);
  } catch (error) {
    console.error("Error Fetching Payments:", error.message);
    res.status(500).json({ msg: "Internal Server Error" });
  }
};

exports.updateToPaid = async (req, res) => {
  try {
    const updatedInvoice = await SupplierInvoice.findByIdAndUpdate(
      req.params.id,
      { 
        status: 'Paid', 
        paymentDate: new Date() 
      },
      { new: true }
    );

    if (!updatedInvoice) {
      return res.status(404).json({ msg: "Invoice not found" });
    }

    res.status(200).json({ success: true, msg: "Payment status updated to Paid", data: updatedInvoice });
  } catch (error) {
    console.error("Error Updating Payment:", error.message);
    res.status(400).json({ msg: error.message });
  }
};