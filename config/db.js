const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    // Kita biarin MONGO_URI nya standar, 
    // tapi kita kasih instruksi tambahan "dbName" di sini
    await mongoose.connect(process.env.MONGO_URI, {
      dbName: 'protrack_erp' 
    });
    console.log('Well Done! Terhubung ke Database protrack_erp...');
  } catch (err) {
    console.error('Failed to Connect:', err.message);
    process.exit(1);
  }
};

module.exports = connectDB;