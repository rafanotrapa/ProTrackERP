const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { getProjectTimeline } = require('../controllers/projectTimelineController');

router.get('/:projectId', protect, getProjectTimeline);

module.exports = router;