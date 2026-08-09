const express = require('express');
const router = express.Router();
const { protect, authorizeRoles } = require('../middleware/auth');
const { getProjectTimeline } = require('../controllers/projectTimelineController');

router.get('/:projectId', protect, authorizeRoles('Marketing','Owner','Management','Finance','Admin'), getProjectTimeline);

module.exports = router;