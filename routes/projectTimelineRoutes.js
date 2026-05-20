const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { getProjectTimeline } = require('../controllers/projectTimelineController');

// GET /api/project-timeline/:projectId
// Aggregate semua data 1 project: financial, progress, stages, invoices, PO, logistics, COGS, profit
router.get('/:projectId', protect, getProjectTimeline);

module.exports = router;