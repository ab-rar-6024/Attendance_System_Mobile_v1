const express = require('express');
const router = express.Router();
const mobileController = require('../controllers/mobile.controller');
const employeeController = require('../controllers/employee.controller');
const { upload } = require('../middleware/upload');

// Mobile punch
router.post('/mobile/punch', mobileController.punchMobile);

// Employee history
router.get('/mobile/history/:emp_id', mobileController.history);

// Who am I
router.get('/mobile/whoami/:pin', mobileController.whoami);

// Profile
router.post('/profile', mobileController.getProfile);
router.options('/profile', (req, res) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Content-Type');
    res.header('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.sendStatus(200);
});

// Biometric punch
router.post('/punch/biometric', mobileController.punchBiometric);

// User Photo Operations
router.post('/mobile/employee/:id/photo', upload.single('photo'), employeeController.uploadUserPhoto);
router.get('/mobile/employee/:id/photo', employeeController.getUserPhoto);

module.exports = router;
