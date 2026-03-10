const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');

// Landing page
router.get('/', authController.showLandingPage);

// Login page
router.get('/login', authController.showLoginPage);

// Login handlers
router.post('/login', authController.loginCredentials);
router.post('/login_pin', authController.loginPin);
router.options('/login_pin', (req, res) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Content-Type');
    res.header('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.sendStatus(200);
});

// PIN-based punch from landing page (no session required)
router.post('/punch', authController.punchByPin);

// Logout
router.get('/logout', authController.logout);

module.exports = router;