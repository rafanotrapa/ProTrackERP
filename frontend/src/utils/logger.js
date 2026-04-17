const Log = require('../models/Log');

/**
 * @param {Object} req - Request object dari express (buat ambil data user)
 * @param {String} action - Deskripsi aksi (e.g., "Created Project BJK-001")
 * @param {String} category - Kategori (ACCOUNT, PROJECT, MARKETING, PROCUREMENT, FINANCE)
 * @param {String} type - Tipe aksi (CREATE, UPDATE, DELETE, SECURITY)
 */
const createLog = async (req, action, category, type) => {
  try {
    // Ambil nama user dari token (req.user diisi oleh middleware protect)
    const userName = req.user ? req.user.username : 'System';

    await Log.create({
      user: userName,
      action: action,
      category: category,
      type: type,
      timestamp: new Date()
    });
    console.log(`[LOG SAVED]: ${action}`);
  } catch (err) {
    console.error("Gagal menyimpan log:", err);
  }
};

module.exports = createLog;