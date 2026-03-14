const express = require('express');
const router = express.Router();
const adminController = require('../controllers/admin.controller');
const { protect } = require('../middleware/auth');

// ── Web routes (session protected) ────────────────────────────
router.get('/admin',                        protect('admin'), adminController.dashboard);
router.get('/search',                       protect('admin'), adminController.search);
router.post('/add_employee',                protect('admin'), adminController.addEmployeeHandler);
router.post('/delete_employee/:emp_id',     protect('admin'), adminController.deleteEmployeeHandler);
router.post('/admin/absent/:emp_id',        protect('admin'), adminController.adminMarkAbsent);

// ✅ Mobile API route — no session, verifies admin_id from query param
// GET /mobile/admin/attendance?admin_id=<id>
router.get('/mobile/admin/attendance', adminController.latestAttendanceJson);

module.exports = router;