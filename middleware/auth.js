const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Peta base-URL → nama modul yang ramah dibaca untuk audit "last activity".
const MODULE_MAP = {
  '/api/auth':               'User Management',
  '/api/project':            'Project',
  '/api/vendor':             'Vendor',
  '/api/item':               'Item',
  '/api/supplier_quotation': 'Supplier Quotation',
  '/api/client_quotation':   'Client Quotation',
  '/api/logs':               'System Logs',
  '/api/po':                 'Purchase Order',
  '/api/client_invoice':     'Client Invoice',
  '/api/payments':           'Client Payment',
  '/api/financial':          'Financial Report',
  '/api/supplier_invoices':  'Supplier Invoice',
  '/api/supplier_payments':  'Supplier Payment',
  '/api/project-billing':    'Project Billing',
  '/api/project-timeline':   'Project Timeline',
  '/api/expense-submission': 'Expense Submission',
  '/api/inventory':          'Inventory',
};

const protect = (req, res, next) => {
  const token = req.header('Authorization')?.split(' ')[1];
  if (!token) return res.status(401).json({ msg: 'No token, access denied' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;

    // Rekam modul terakhir yang diakses (fire-and-forget, tidak memblok request).
    const moduleName = MODULE_MAP[req.baseUrl] || req.baseUrl || 'Unknown';
    User.updateOne(
      { _id: decoded.id },
      { lastActivity: { module: moduleName, method: req.method, at: new Date() } }
    ).catch(() => {}); // abaikan error audit — jangan ganggu flow utama

    next();
  } catch (err) {
    res.status(401).json({ msg: 'Token is not valid' });
  }
};

const admin = (req, res, next) => {
  if (req.user && req.user.role === 'Admin') {
    next();
  } else {
    res.status(403).json({ msg: 'Akses ditolak! Bukan Admin.' });
  }
};

module.exports = { protect, admin };
