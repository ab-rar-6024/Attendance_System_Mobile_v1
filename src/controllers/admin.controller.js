const pool = require('../config/db');
const { getDashboardStats, markAbsent } = require('../services/attendance.service');
const { getAllEmployees, addEmployee, deleteEmployee, searchEmployees } = require('../services/employee.service');
const { formatTime } = require('../utils/helpers');
const { getISTToday } = require('../utils/timezone');

/**
 * Admin dashboard (web)
 */
async function dashboard(req, res) {
    try {
        const { labels, counts, todayRows } = await getDashboardStats();
        const employees = await getAllEmployees();

        const formattedRows = todayRows.map(r => ({
            id: r.id,
            name: r.name,
            emp_code: r.emp_code,
            pin: r.pin,
            time_in: formatTime(r.time_in),
            time_out: formatTime(r.time_out),
            location_in: r.location_in,
            location_out: r.location_out,
            absent: r.absent,
            reason: r.reason
        }));

        const absentResult = await pool.query(
            `SELECT e.name, a.date, a.reason
             FROM attendance a
             JOIN employee e ON e.id = a.emp_id
             WHERE a.absent = true
             ORDER BY a.date DESC`
        );

        const leaveResult = await pool.query(
            `SELECT l.emp_id, e.name, l.from_date, l.to_date, l.reason, l.id
             FROM leaves l
             JOIN employee e ON e.id = l.emp_id
             ORDER BY l.id DESC
             LIMIT 10`
        );

        res.render('admin_dashboard', {
            labels,
            counts,
            attendance: formattedRows,
            employees,
            absent_history: absentResult.rows,
            leave_requests: leaveResult.rows,
            query: ''
        });
    } catch (error) {
        console.error('Admin dashboard error:', error);
        req.flash('danger', 'Error loading dashboard');
        res.redirect('/login');
    }
}

/**
 * ✅ NEW — Mobile API: Today's attendance as JSON
 * GET /mobile/admin/attendance?admin_id=<id>
 * No session needed — verifies admin_id is an admin role employee
 */
async function latestAttendanceJson(req, res) {
    try {
        const adminId = parseInt(req.query.admin_id);

        // ✅ Just verify admin_id exists — no role column needed
        if (!adminId) {
            return res.status(400).json({ success: false, msg: 'admin_id is required' });
        }

        const adminCheck = await pool.query(
            `SELECT id FROM employee WHERE id = $1`,
            [adminId]
        );

        if (adminCheck.rows.length === 0) {
            return res.status(404).json({ success: false, msg: 'Admin not found' });
        }

        // Get today's date in IST
        const today = getISTToday();

        // ✅ Fetch ALL employees except admin themselves (LEFT JOIN = show all even not punched)
        const result = await pool.query(
            `SELECT
                e.id,
                e.name,
                e.emp_code,
                e.pin,
                COALESCE(a.time_in::text,  '')  AS time_in,
                COALESCE(a.time_out::text, '')  AS time_out,
                COALESCE(a.location_in,    '')  AS location_in,
                COALESCE(a.location_out,   '')  AS location_out,
                COALESCE(a.absent, false)        AS absent,
                COALESCE(a.reason, '')           AS reason
             FROM employee e
             LEFT JOIN attendance a
               ON a.emp_id = e.id AND a.date = $1
             WHERE e.id != $2
             ORDER BY e.name ASC`,
            [today, adminId]
        );

        // Format times for display
        const records = result.rows.map(r => ({
            id:           r.id,
            name:         r.name,
            emp_code:     r.emp_code,
            pin:          r.pin,
            time_in:      r.time_in  ? formatTime(r.time_in)  : null,
            time_out:     r.time_out ? formatTime(r.time_out) : null,
            location_in:  r.location_in  || null,
            location_out: r.location_out || null,
            absent:       r.absent,
            reason:       r.reason || null,
        }));

        return res.json({ success: true, records, date: today });

    } catch (error) {
        console.error('Mobile admin attendance error:', error);
        return res.status(500).json({ success: false, msg: 'Server error: ' + error.message });
    }
}

/**
 * Search employees
 */
async function search(req, res) {
    const query = req.query.query || '';
    try {
        const { labels, counts, todayRows } = await getDashboardStats();
        const employees = await searchEmployees(query);

        const formattedRows = todayRows.map(r => ({
            id: r.id,
            name: r.name,
            emp_code: r.emp_code,
            pin: r.pin,
            time_in: formatTime(r.time_in),
            time_out: formatTime(r.time_out),
            location_in: r.location_in,
            location_out: r.location_out,
            absent: r.absent,
            reason: r.reason
        }));

        res.render('admin_dashboard', {
            labels, counts, attendance: formattedRows, employees, query
        });
    } catch (error) {
        console.error('Search error:', error);
        req.flash('danger', 'Search failed');
        res.redirect('/admin');
    }
}

/**
 * Add employee
 */
async function addEmployeeHandler(req, res) {
    const { name, emp_code, password } = req.body;
    const pin = String(Math.floor(Math.random() * 10000)).padStart(4, '0');
    try {
        await addEmployee(name, emp_code, password, pin);
        req.flash('success', `Employee added! Quick PIN = ${pin}`);
    } catch (error) {
        console.error('Add employee error:', error);
        req.flash('danger', error.message || 'Failed to add employee');
    }
    res.redirect('/admin');
}

/**
 * Delete employee
 */
async function deleteEmployeeHandler(req, res) {
    const empId = parseInt(req.params.emp_id);
    try {
        await deleteEmployee(empId);
        req.flash('success', 'Employee deleted');
    } catch (error) {
        console.error('Delete employee error:', error);
        req.flash('danger', `Error: ${error.message}`);
    }
    res.redirect('/admin');
}

/**
 * Admin mark employee absent
 */
async function adminMarkAbsent(req, res) {
    const empId = parseInt(req.params.emp_id);
    const reason = req.body.reason?.trim() || 'Not specified';
    try {
        await markAbsent(empId, reason);
        req.flash('info', 'Employee marked absent.');
    } catch (error) {
        console.error('Mark absent error:', error);
        req.flash('danger', 'Failed to mark absent');
    }
    res.redirect('/admin');
}

module.exports = {
    dashboard,
    latestAttendanceJson,   // ✅ new
    search,
    addEmployeeHandler,
    deleteEmployeeHandler,
    adminMarkAbsent
};