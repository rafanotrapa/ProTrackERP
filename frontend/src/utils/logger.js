const Log = require('../models/Log');

const createLog = async (req, action, category, type) => {
  try {
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