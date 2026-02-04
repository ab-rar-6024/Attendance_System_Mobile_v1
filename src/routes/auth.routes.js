const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');

// Login page
router.get('/', authController.showLoginPage);
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

// Logout
router.get('/logout', authController.logout);

module.exports = router;
