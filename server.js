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
const paymentRoutes = require('./routes/paymentRoutes'); 
const projectBillingRoutes = require('./routes/projectBillingRoutes');

connectDB();

const app = express();

app.use(cors());
app.use(express.json());

app.use((req, res, next) => {
  console.log(`${req.method} request ke: ${req.url}`);
  next();
});

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/project', require('./routes/projectRoutes'));
app.use('/api/vendor', require('./routes/vendorRoutes'));
app.use('/api/item', require('./routes/itemRoutes'));
app.use('/api/supplier_quotation', require('./routes/supplierQuotationRoutes'));
app.use('/api/client_quotation', require('./routes/clientQuotationRoutes'));
app.use('/api/logs', require('./routes/logRoutes'));
app.use('/api/po', require('./routes/poRoutes'));
app.use('/api/client_invoice', createInvoiceRoutes); 
app.use('/api/payments', paymentRoutes);            
app.use('/api/financial', financialRoutes);
app.use('/api/supplier_invoices', supplierInvoiceRoutes); 
app.use('/api/supplier_payments', supplierPaymentRoutes);
app.use('/api/project-billing', projectBillingRoutes);
app.use('/api/project-timeline', require('./routes/projectTimelineRoutes'));
app.use('/api/expense-submission', require('./routes/expenseSubmissionRoutes'));

app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>ProTrack ERP - Backend Server</title>
        <style>
            body { 
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
                background-color: #f8fafc; 
                display: flex; 
                justify-content: center; 
                align-items: center; 
                height: 100vh; 
                margin: 0; 
                color: #0f172a; 
            }
            .container { 
                background-color: white; 
                padding: 4rem; 
                border-radius: 2rem; 
                box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.05); 
                text-align: center; 
                max-width: 28rem;
                border: 1px solid #f1f5f9;
            }
            .status-indicator { 
                display: inline-block; 
                width: 12px; 
                height: 12px; 
                background-color: #10b981; 
                border-radius: 50%; 
                margin-right: 8px; 
                box-shadow: 0 0 10px #10b981; 
                animation: pulse 2s infinite; 
            }
            @keyframes pulse { 
                0% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7); } 
                70% { box-shadow: 0 0 0 10px rgba(16, 185, 129, 0); } 
                100% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); } 
            }
            h1 { 
                font-size: 2.5rem; 
                font-weight: 900; 
                margin: 1.5rem 0 0.5rem; 
                font-style: italic; 
                letter-spacing: -0.05em; 
                text-transform: uppercase;
            }
            h1 span { color: #4f46e5; }
            p { 
                color: #64748b; 
                font-size: 0.75rem; 
                text-transform: uppercase; 
                letter-spacing: 0.2em; 
                font-weight: 800; 
                margin-bottom: 0; 
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div style="display: flex; align-items: center; justify-content: center;">
                <span class="status-indicator"></span>
                <span style="font-size: 0.75rem; font-weight: 900; color: #10b981; text-transform: uppercase; letter-spacing: 0.1em;">System Online</span>
            </div>
            <h1>ProTrack <span>API</span></h1>
            <p>Backend Server is running properly</p>
        </div>
    </body>
    </html>
  `);
});

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