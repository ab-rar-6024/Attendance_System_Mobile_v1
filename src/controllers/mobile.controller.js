const pool = require('../config/db');
const { recordPunch, getEmployeeHistory } = require('../services/attendance.service');
const { getEmployeeByPin, getEmployeeByCode } = require('../services/employee.service');
const { formatTime } = require('../utils/helpers');

/**
 * Mobile punch in/out
 */
async function punchMobile(req, res) {
    const { pin, type, location } = req.body;
    const pinStr = String(pin || '').trim();
    const punchType = (type || '').toLowerCase();

    if (!['in', 'out'].includes(punchType)) {
        return res.status(400).json({ success: false, msg: 'type?' });
    }

    try {
        const employee = await getEmployeeByPin(pinStr);
        if (!employee) {
            return res.status(400).json({ success: false, msg: 'bad pin' });
        }

        const result = await recordPunch(employee.id, punchType, location);
        res.json({
            success: result.success,
            msg: result.message,
            time: result.time,
            location: result.location
        });
    } catch (error) {
        console.error('Mobile punch error:', error);
        res.status(400).json({ success: false, msg: error.message });
    }
}

/**
 * Get employee history
 */
async function history(req, res) {
    const empId = parseInt(req.params.emp_id);

    try {
        const { attendance, leave } = await getEmployeeHistory(empId);

        res.json({
            attendance: attendance.map(r => ({
                date: r.date.toISOString().split('T')[0],
                time_in: formatTime(r.time_in),
                time_out: formatTime(r.time_out),
                absent: Boolean(r.absent),
                reason: r.reason
            })),
            leave: leave.map(r => ({
                from_date: r.from_date.toISOString().split('T')[0],
                to_date: r.to_date.toISOString().split('T')[0],
                reason: r.reason
            }))
        });
    } catch (error) {
        console.error('History error:', error);
        res.status(500).json({ success: false, message: 'Failed to get history' });
    }
}

/**
 * Who am I - get employee info by PIN
 */
async function whoami(req, res) {
    const pin = req.params.pin;

    try {
        const employee = await getEmployeeByPin(pin);
        if (!employee) {
            return res.status(404).json({ success: false });
        }

        res.json({
            success: true,
            id: employee.id,
            name: employee.name,
            emp_code: employee.emp_code
        });
    } catch (error) {
        console.error('Whoami error:', error);
        res.status(500).json({ success: false });
    }
}

/**
 * Get employee profile
 */
async function getProfile(req, res) {
    const { emp_code } = req.body;

    if (!emp_code) {
        return res.status(400).json({ success: false, message: 'emp_code required' });
    }

    try {
        const employee = await getEmployeeByCode(emp_code.trim());
        if (!employee) {
            return res.status(404).json({ success: false, message: 'Employee not found' });
        }

        res.json({
            success: true,
            user: {
                id: employee.id,
                name: employee.name,
                emp_code: employee.emp_code,
                email: employee.email || 'N/A',
                phone: employee.phone || 'N/A',
                department: employee.department || 'N/A',
                designation: employee.designation || 'N/A'
            }
        });
    } catch (error) {
        console.error('Profile error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
}

/**
 * Biometric punch
 */
async function punchBiometric(req, res) {
    const { emp_id, type } = req.body;

    try {
        const result = await recordPunch(emp_id, type);

        // Log biometric usage
        await pool.query(
            `UPDATE attendance 
       SET auth_method = 'biometric'
       WHERE emp_id = $1 AND date = CURRENT_DATE`,
            [emp_id]
        );

        res.json({
            success: result.success,
            msg: result.message,
            time: result.time,
            location: result.location
        });
    } catch (error) {
        console.error('Biometric punch error:', error);
        res.status(400).json({ success: false, msg: error.message });
    }
}

module.exports = {
    punchMobile,
    history,
    whoami,
    getProfile,
    punchBiometric
};
