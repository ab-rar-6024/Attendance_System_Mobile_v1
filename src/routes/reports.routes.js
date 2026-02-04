const express = require('express');
const router = express.Router();
const reportsController = require('../controllers/reports.controller');
const { protect } = require('../middleware/auth');

// Reports dashboard
router.get('/reports', protect('admin'), reportsController.reportsDashboard);

// Monthly report
router.get('/monthly_report', protect('admin'), reportsController.monthlyReport);

module.exports = router;
