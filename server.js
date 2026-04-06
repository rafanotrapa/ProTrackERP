const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const path = require('path');
const connectDB = require('./config/db');

dotenv.config();
connectDB();

const app = express();

// MIDDLEWARE
app.use(cors());
app.use(express.json());

// Biar file di folder uploads bisa diakses lewat browser (e.g., localhost:5000/uploads/...)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Log Request
app.use((req, res, next) => {
  console.log(`${req.method} request ke: ${req.url}`);
  next();
});

// ROUTES
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/project', require('./routes/projectRoutes'));
app.use('/api/vendor', require('./routes/vendorRoutes'));
app.use('/api/item', require('./routes/itemRoutes'));
app.use('/api/supplier_quotation', require('./routes/supplierQuotationRoutes')); // Route Baru
app.use('/api/client_quotation', require('./routes/clientQuotationRoutes'));

app.get('/', (req, res) => {
  res.send('Server ProTrack Rafa sudah Jalan!');
});

// Global Error Handler buat Multer atau error lainnya
app.use((err, req, res, next) => {
  res.status(500).json({ msg: err.message });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server nyala di http://localhost:${PORT}`));