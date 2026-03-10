const pool = require('../config/db');
const { safeMatch } = require('../utils/password');
const { getEmployeeByPin } = require('../services/employee.service');
const { recordPunch } = require('../services/attendance.service');

/**
 * Show landing page (homepage — indexed by Google)
 * Redirects already-logged-in users straight to their dashboard
 */
function showLandingPage(req, res) {
    if (req.session && req.session.admin)  return res.redirect('/admin');
    if (req.session && req.session.emp_id) return res.redirect('/employee');
    res.render('index');
}

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
        res.redirect('/');
    } catch (error) {
        console.error('Login error:', error);
        req.flash('danger', 'Login failed');
        res.redirect('/');
    }
}

/**
 * Handle PIN-based login (JSON API — mobile)
 */
async function loginPin(req, res) {
    const { pin } = req.body;
    const pinStr = String(pin || '').trim();

    try {
        const employee = await getEmployeeByPin(pinStr);
        if (employee) {
            return res.json({
                success: true,
                role: 'employee',
                user: { id: employee.id, name: employee.name, emp_code: employee.emp_code }
            });
        }

        const adminResult = await pool.query(
            'SELECT id, username FROM admin WHERE pin = $1',
            [pinStr]
        );

        if (adminResult.rows.length > 0) {
            const admin = adminResult.rows[0];
            return res.json({
                success: true,
                role: 'admin',
                user: { id: admin.id, name: admin.username }
            });
        }

        res.status(401).json({ success: false });
    } catch (error) {
        console.error('PIN login error:', error);
        res.status(500).json({ success: false, message: 'Login failed' });
    }
}

/**
 * Normalize punch type — accepts any reasonable variation from mobile apps:
 *   'in', 'IN', 'punch_in', 'PUNCH_IN', 'checkin', 'check_in', '1'  → 'in'
 *   'out', 'OUT', 'punch_out', 'PUNCH_OUT', 'checkout', 'check_out', '0' → 'out'
 */
function normalizePunchType(raw) {
    const val = String(raw || '').trim().toLowerCase().replace(/[\s-]/g, '_');

    if (['in', '1', 'punch_in', 'check_in', 'checkin', 'clock_in', 'clockin'].includes(val)) {
        return 'in';
    }
    if (['out', '0', 'punch_out', 'check_out', 'checkout', 'clock_out', 'clockout'].includes(val)) {
        return 'out';
    }
    return null; // unrecognized
}

/**
 * PIN-based punch from landing page / mobile app
 * No session required — looks up employee by PIN and records punch
 *
 * POST /punch
 * Body: { pin: '1234', type: 'in' | 'out' }   ← accepts many type variations
 */
async function punchByPin(req, res) {
    console.log('[punch] full body:', JSON.stringify(req.body));

    // Accept every possible field name the mobile app might use for PIN
    const rawPin =
        req.body.pin          ??
        req.body.PIN          ??
        req.body.emp_pin      ??
        req.body.empPin       ??
        req.body.employee_pin ??
        req.body.user_pin     ??
        req.body.passcode     ??
        req.body.code         ??
        '';
    const rawType = req.body.type ?? req.body.punch_type ?? req.body.punchType ?? '';

    const pinStr    = String(rawPin).trim();
    const punchType = normalizePunchType(rawType);

    // Log what we received to help debug mobile mismatches
    console.log(`[punch] received → pin: "${pinStr}", raw type: "${rawType}", normalized: "${punchType}"`);

    if (!pinStr) {
        return res.json({ success: false, message: 'PIN is required' });
    }

    if (!punchType) {
        return res.json({
            success: false,
            message: `Invalid punch type: "${rawType}". Send "in" or "out".`
        });
    }

    try {
        const employee = await getEmployeeByPin(pinStr);

        if (!employee) {
            return res.json({ success: false, message: 'Invalid PIN. Please try again.' });
        }

        await recordPunch(employee.id, punchType);

        return res.json({
            success: true,
            message: `${employee.name} punched ${punchType.toUpperCase()} successfully`
        });

    } catch (error) {
        console.error('PIN punch error:', error);
        return res.json({
            success: false,
            message: error.message || 'Punch failed. Please try again.'
        });
    }
}

/**
 * Logout — destroys session and redirects to landing page
 */
function logout(req, res) {
    req.session.destroy((err) => {
        if (err) console.error('Logout error:', err);
        res.redirect('/');
    });
}

module.exports = {
    showLandingPage,
    showLoginPage,
    loginCredentials,
    loginPin,
    punchByPin,
    logout
};