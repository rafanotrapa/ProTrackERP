const dotenv = require('dotenv');

dotenv.config(); 

const express = require('express');
const cors = require('cors');
const path = require('path');
const connectDB = require('./config/db');

const supplierInvoiceRoutes = require('./routes/supplierInvoiceRoutes');
const supplierPaymentRoutes = require('./routes/supplierpaymentroutes');
const createInvoiceRoutes = require('./routes/createInvoiceRoutes');
const financialRoutes = require('./routes/financialRoutes');

// Connect to Database
connectDB();

const app = express();

// --- MIDDLEWARE ---
app.use(cors());
app.use(express.json());

app.use((req, res, next) => {
  console.log(`${req.method} request ke: ${req.url}`);
  next();
});

// --- STATIC FOLDER ---
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// --- ROUTES ---
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/project', require('./routes/projectRoutes'));
app.use('/api/vendor', require('./routes/vendorRoutes'));
app.use('/api/item', require('./routes/itemRoutes'));
app.use('/api/supplier_quotation', require('./routes/supplierQuotationRoutes'));
app.use('/api/client_quotation', require('./routes/clientQuotationRoutes'));
app.use('/api/logs', require('./routes/logRoutes'));
app.use('/api/po', require('./routes/poRoutes'));
app.use('/api/client_invoice', createInvoiceRoutes);
app.use('/api/financial', financialRoutes);

// 2. RUTE INVOICE DISAMAKAN DENGAN FRONTEND
app.use('/api/supplier_invoices', supplierInvoiceRoutes); 

// --- BASE ENDPOINT ---
app.get('/', (req, res) => {
  res.send('Server ProTrack Firman sudah Jalan bray!');
});

// --- GLOBAL ERROR HANDLER ---
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    msg: err.message || 'Internal Server Error',
    error: process.env.NODE_ENV === 'development' ? err : {} 
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`=========================================`);
  console.log(`🚀 Server nyala di http://localhost:${PORT}`);
  console.log(`🛡️  Database ProTrack connected!`);
  console.log(`=========================================`);
});