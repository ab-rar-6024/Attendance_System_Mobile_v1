const express = require('express');
const router = express.Router();
const employeeController = require('../controllers/employee.controller');
const { protect } = require('../middleware/auth');

const { upload } = require('../middleware/upload');

// Employee dashboard
router.get('/employee', protect('emp_id'), employeeController.dashboard);

// Punch in/out (web form)
router.post('/punch', protect('emp_id'), employeeController.punchWeb);

// Mark absent
router.post('/absent', protect('emp_id'), employeeController.employeeMarkAbsent);

// Apply leave (API)
router.post('/api/leave', employeeController.applyLeave);

module.exports = router;
