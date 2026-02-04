const pool = require('../config/db');
const { safeMatch } = require('../utils/password');
const { getEmployeeByPin } = require('../services/employee.service');

/**
 * Show login page
 */
function showLoginPage(req, res) {
    res.render('login');
}

/**
 * Handle credential-based login (admin or employee)
 */
async function loginCredentials(req, res) {
    const { role, username, password } = req.body;

    try {
        if (role === 'admin') {
            const result = await pool.query(
                'SELECT id, password FROM admin WHERE username = $1',
                [username]
            );

            if (result.rows.length > 0) {
                const row = result.rows[0];
                if (safeMatch(row.password, password)) {
                    req.session.admin = row.id;
                    return res.redirect('/admin');
                }
            }
        } else {
            // Employee login
            const result = await pool.query(
                'SELECT id, password FROM employee WHERE emp_code = $1',
                [username]
            );

            if (result.rows.length > 0) {
                const row = result.rows[0];
                if (safeMatch(row.password, password)) {
                    req.session.emp_id = row.id;
                    return res.redirect('/employee');
                }
            }
        }

        req.flash('danger', 'Invalid credentials');
        res.redirect('/login');
    } catch (error) {
        console.error('Login error:', error);
        req.flash('danger', 'Login failed');
        res.redirect('/login');
    }
}

/**
 * Handle PIN-based login (JSON API)
 */
async function loginPin(req, res) {
    const { pin } = req.body;
    const pinStr = String(pin || '').trim();

    try {
        // Try employee login
        const employee = await getEmployeeByPin(pinStr);
        if (employee) {
            return res.json({
                success: true,
                role: 'employee',
                user: {
                    id: employee.id,
                    name: employee.name,
                    emp_code: employee.emp_code
                }
            });
        }

        // Try admin login
        const adminResult = await pool.query(
            'SELECT id, username FROM admin WHERE pin = $1',
            [pinStr]
        );

        if (adminResult.rows.length > 0) {
            const admin = adminResult.rows[0];
            return res.json({
                success: true,
                role: 'admin',
                user: {
                    id: admin.id,
                    name: admin.username
                }
            });
        }

        res.status(401).json({ success: false });
    } catch (error) {
        console.error('PIN login error:', error);
        res.status(500).json({ success: false, message: 'Login failed' });
    }
}

/**
 * Logout
 */
function logout(req, res) {
    req.session.destroy((err) => {
        if (err) {
            console.error('Logout error:', error);
        }
        res.redirect('/login');
    });
}

module.exports = {
    showLoginPage,
    loginCredentials,
    loginPin,
    logout
};
