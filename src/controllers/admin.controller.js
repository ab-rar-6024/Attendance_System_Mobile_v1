const pool = require('../config/db');
const { getDashboardStats, markAbsent } = require('../services/attendance.service');
const { getAllEmployees, addEmployee, deleteEmployee, searchEmployees } = require('../services/employee.service');
const { formatTime } = require('../utils/helpers');
const { getISTToday } = require('../utils/timezone');

/**
 * Admin dashboard
 */
async function dashboard(req, res) {
    try {
        const { labels, counts, todayRows } = await getDashboardStats();
        const employees = await getAllEmployees();

        // Format times for display
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

        // Get absent history
        const absentResult = await pool.query(
            `SELECT e.name, a.date, a.reason
       FROM attendance a
       JOIN employee e ON e.id = a.emp_id
       WHERE a.absent = true
       ORDER BY a.date DESC`
        );

        // Get leave requests
        const leaveResult = await pool.query(
            `SELECT l.emp_id, e.name, l.from_date, l.to_date, l.reason, l.id
       FROM leaves l
       JOIN employee e ON e.id = l.emp_id
       ORDER BY l.id DESC
       LIMIT 10`
        );

        res.render('admin_dashboard', {
            labels: labels,
            counts: counts,
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
            labels: labels,
            counts: counts,
            attendance: formattedRows,
            employees,
            query
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
    search,
    addEmployeeHandler,
    deleteEmployeeHandler,
    adminMarkAbsent
};
