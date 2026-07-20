const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Log = require('../models/Log');

// Peta base-URL → nama modul ramah dibaca untuk audit log.
const MODULE_MAP = {
  '/api/auth':               'Account',
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

// Verb HTTP → kata kerja audit
const ACTION_VERB = { POST: 'CREATE', PUT: 'UPDATE', PATCH: 'UPDATE', DELETE: 'DELETE' };

const protect = (req, res, next) => {
  const token = req.header('Authorization')?.split(' ')[1];
  if (!token) return res.status(401).json({ msg: 'No token, access denied' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;

    // Audit lintas modul: catat aksi ubah-data (bukan GET) ke System Logs
    // supaya terlihat siapa mengubah modul apa. Dicatat SETELAH response
    // selesai & HANYA jika sukses (status < 400) agar aksi gagal tidak
    // mengotori audit. GET tidak dicatat agar log tidak banjir.
    const verb = ACTION_VERB[req.method];
    if (verb) {
      const moduleName = MODULE_MAP[req.baseUrl] || req.baseUrl || 'System';
      res.on('finish', () => {
        if (res.statusCode >= 400) return;
        const writeLog = (username) => Log.create({
          user:     username || 'Unknown',
          action:   `${verb} @ ${moduleName}`,
          category: moduleName,
          type:     verb,
        }).catch(() => {});
        // Token baru sudah membawa username → tak perlu query DB.
        // Token lama (belum re-login) → ambil dari DB.
        if (decoded.username) writeLog(decoded.username);
        else User.findById(decoded.id).select('username').then((u) => writeLog(u?.username)).catch(() => {});
      });
    }

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
