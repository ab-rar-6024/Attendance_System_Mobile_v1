const express = require('express');
const router = express.Router();
const reportsController = require('../controllers/reports.controller');
const { protect } = require('../middleware/auth');

/**
 * Reports Dashboard
 * URL: /reports
 */
router.get('/reports',
    protect('admin'),
    reportsController.reportsDashboard
);

/**
 * Monthly Report View
 * URL: /monthly_report
 */
router.get('/monthly_report',
    protect('admin'),
    reportsController.monthlyReport
);

/**
 * Monthly Report PDF Download
 * URL: /monthly_report/pdf/:employeeId
 */
router.get('/monthly_report/pdf/:employeeId',
    protect('admin'),
    reportsController.downloadMonthlyPDF
);

module.exports = router;