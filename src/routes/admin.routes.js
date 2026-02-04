const express = require('express');
const router = express.Router();
const adminController = require('../controllers/admin.controller');
const { protect } = require('../middleware/auth');

// Admin dashboard
router.get('/admin', protect('admin'), adminController.dashboard);

// Search employees
router.get('/search', protect('admin'), adminController.search);

// Employee management
router.post('/add_employee', protect('admin'), adminController.addEmployeeHandler);
router.post('/delete_employee/:emp_id', protect('admin'), adminController.deleteEmployeeHandler);

// Mark absent
router.post('/admin/absent/:emp_id', protect('admin'), adminController.adminMarkAbsent);

module.exports = router;
