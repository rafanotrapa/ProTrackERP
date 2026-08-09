const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Log = require('../models/Log');

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

const ACTION_VERB = { POST: 'CREATE', PUT: 'UPDATE', PATCH: 'UPDATE', DELETE: 'DELETE' };

const protect = async (req, res, next) => {
  const token = req.header('Authorization')?.split(' ')[1];
  if (!token) return res.status(401).json({ msg: 'No token, access denied' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Tanda tangan yang sah saja tidak cukup. Tanpa pemeriksaan ini, token yang
    // sudah terbit tetap berlaku sampai kedaluwarsa walaupun user-nya dihapus,
    // perannya diubah, atau passwordnya direset karena akunnya diduga bocor.
    // Peran juga dibaca ulang dari database supaya perubahan peran langsung
    // berlaku, bukan menunggu login berikutnya.
    const user = await User.findById(decoded.id).select('role tokenVersion');
    if (!user) {
      return res.status(401).json({ msg: 'Akun sudah tidak aktif. Silakan login ulang.' });
    }
    if ((decoded.tv || 0) !== (user.tokenVersion || 0)) {
      return res.status(401).json({ msg: 'Sesi sudah tidak berlaku. Silakan login ulang.' });
    }

    req.user = { ...decoded, role: user.role };

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

/**
 * Batasi endpoint ke peran tertentu.
 *
 * Pembatasan peran sebelumnya hanya ada di frontend lewat <ProtectedRoute>,
 * yang cuma menyembunyikan menu. API-nya sendiri menerima siapa pun yang
 * punya token valid, sehingga mis. staf Marketing bisa memanggil endpoint
 * approve quotation dan verifikasi pembayaran secara langsung.
 *
 * Dipakai setelah `protect`, karena membaca req.user hasil verifikasi token.
 */
const authorizeRoles = (...allowedRoles) => (req, res, next) => {
  if (!req.user || !allowedRoles.includes(req.user.role)) {
    return res.status(403).json({
      msg: `Akses ditolak. Endpoint ini hanya untuk: ${allowedRoles.join(', ')}.`
    });
  }
  next();
};

module.exports = { protect, admin, authorizeRoles };
