const pool = require('../config/db');
const { recordPunch, markAbsent } = require('../services/attendance.service');
const { getEmployeeById } = require('../services/employee.service');
const { formatTime } = require('../utils/helpers');
const { getISTToday } = require('../utils/timezone');
const { DateTime } = require('luxon');

/**
 * Employee dashboard
 */
async function dashboard(req, res) {
    const empId = req.session.emp_id;
    const today = getISTToday();

    try {
        // Get today's attendance
        const todayResult = await pool.query(
            'SELECT time_in, time_out FROM attendance WHERE emp_id = $1 AND date = $2',
            [empId, today]
        );

        let timeIn = null;
        let timeOut = null;

        if (todayResult.rows.length > 0) {
            timeIn = formatTime(todayResult.rows[0].time_in);
            timeOut = formatTime(todayResult.rows[0].time_out);
        }

        // Get 7-day attendance for chart
        const weekResult = await pool.query(
            `SELECT date, COUNT(*) as count FROM attendance
       WHERE emp_id = $1 AND date >= CURRENT_DATE - INTERVAL '6 days'
       GROUP BY date ORDER BY date`,
            [empId]
        );

        const pLabels = weekResult.rows.map(r => {
            const date = new Date(r.date);
            return date.toLocaleDateString('en-US', { weekday: 'short' });
        });

        const pCounts = weekResult.rows.map(r => parseInt(r.count));

        // Get employee name
        const employee = await getEmployeeById(empId);
        const empName = employee ? employee.name : 'Employee';

        res.render('employee_dashboard', {
            name: empName,
            time_in: timeIn,
            time_out: timeOut,
            p_labels: pLabels,
            p_counts: pCounts
        });
    } catch (error) {
        console.error('Employee dashboard error:', error);
        req.flash('danger', 'Error loading dashboard');
        res.redirect('/login');
    }
}

/**
 * Web punch (form submission)
 */
async function punchWeb(req, res) {
    const empId = req.session.emp_id;
    const punchType = req.body.type;

    try {
        await recordPunch(empId, punchType);
        req.flash('success', 'Saved');
    } catch (error) {
        console.error('Punch error:', error);
        req.flash('danger', error.message || 'Punch failed');
    }

    res.redirect('/employee');
}

/**
 * Employee mark self absent
 */
async function employeeMarkAbsent(req, res) {
    const empId = req.session.emp_id;
    const reason = req.body.reason?.trim() || 'No reason given';

    try {
        await markAbsent(empId, reason);
        req.flash('warning', 'Absent recorded.');
    } catch (error) {
        console.error('Mark absent error:', error);
        req.flash('danger', 'Failed to mark absent');
    }

    res.redirect('/employee');
}

/**
 * Apply leave (API endpoint)
 */
async function applyLeave(req, res) {
    const { emp_id, type, reason, from_date, to_date } = req.body;

    if (!emp_id) {
        return res.status(400).json({ success: false, message: 'emp_id required' });
    }

    if (!['quick', 'custom'].includes(type)) {
        return res.status(400).json({ success: false, message: 'type must be quick or custom' });
    }

    const client = await pool.connect();

    try {
        if (type === 'quick') {
            // Quick leave - today only
            const today = getISTToday();

            await client.query(
                `INSERT INTO attendance (emp_id, date, absent, reason)
         VALUES ($1, $2, true, $3)
         ON CONFLICT (emp_id, date) DO UPDATE SET
           absent = true,
           reason = EXCLUDED.reason,
           time_in = NULL,
           time_out = NULL`,
                [emp_id, today, reason || 'No reason']
            );

            await client.query(
                'INSERT INTO leaves (emp_id, from_date, to_date, reason) VALUES ($1, $2, $3, $4)',
                [emp_id, today, today, reason || 'No reason']
            );

            return res.json({ success: true, message: 'Quick leave applied' });
        }

        // Custom leave
        if (!from_date || !to_date || !reason) {
            return res.status(400).json({
                success: false,
                message: 'from_date, to_date and reason required'
            });
        }

        await client.query(
            'INSERT INTO leaves (emp_id, from_date, to_date, reason) VALUES ($1, $2, $3, $4)',
            [emp_id, from_date, to_date, reason]
        );

        // Mark all dates as absent
        const fromDt = DateTime.fromISO(from_date);
        const toDt = DateTime.fromISO(to_date);
        let current = fromDt;

        while (current <= toDt) {
            await client.query(
                `INSERT INTO attendance (emp_id, date, absent, reason)
         VALUES ($1, $2, true, $3)
         ON CONFLICT (emp_id, date) DO UPDATE SET
           absent = true,
           reason = EXCLUDED.reason,
           time_in = NULL,
           time_out = NULL`,
                [emp_id, current.toISODate(), reason]
            );
            current = current.plus({ days: 1 });
        }

        res.json({ success: true, message: 'Custom leave applied' });
    } catch (error) {
        console.error('Apply leave error:', error);
        res.status(500).json({ success: false, message: error.message });
    } finally {
        client.release();
    }
}

const photoService = require('../services/photo.service');
const path = require('path');

/**
 * Upload User Photo
 */
async function uploadUserPhoto(req, res) {
    const targetUserId = req.params.id;
    const sessionAdmin = req.session?.admin;
    const sessionEmpId = req.session?.emp_id;

    // Permission logic:
    // 1. If session exists, must be Admin or the owner.
    // 2. If no session, we assume it's hit from the mobile API. 
    //    For now, we trust the targetUserId (can be secured further with tokens).
    const isOwner = sessionEmpId && String(sessionEmpId) === String(targetUserId);
    const hasSession = !!req.session?.emp_id || !!req.session?.admin;

    if (hasSession && !sessionAdmin && !isOwner) {
        return res.status(403).json({ success: false, message: 'Forbidden' });
    }

    if (!req.file) {
        return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    try {
        const photo = await photoService.uploadPhoto(targetUserId, req.file);

        // Handle absolute URLs (Supabase) vs relative paths (local)
        let photoUrl = photo.file_path;
        if (!photoUrl.startsWith('http')) {
            photoUrl = photoUrl.replace('public/', '');
            if (!photoUrl.startsWith('/')) photoUrl = '/' + photoUrl;
        }

        res.json({
            success: true,
            message: 'Photo uploaded successfully',
            photoUrl: photoUrl
        });
    } catch (error) {
        console.error('Photo upload error:', error);
        // Provide the actual error message to the client for debugging
        res.status(500).json({
            success: false,
            message: error.message || 'Internal server error'
        });
    }
}

/**
 * Get User Photo
 */
async function getUserPhoto(req, res) {
    const targetUserId = req.params.id;

    try {
        const photo = await photoService.getActivePhoto(targetUserId);

        if (photo) {
            // Handle absolute URLs (Supabase) vs relative paths (local)
            let url = photo.file_path;
            if (!url.startsWith('http')) {
                url = url.replace('public/', '');
                if (!url.startsWith('/')) url = '/' + url;
            }

            return res.json({ success: true, photoUrl: url });
        } else {
            // Default avatar
            return res.json({
                success: true,
                photoUrl: '/img/default-avatar.png' // Assuming this exists or returns a known default
            });
        }
    } catch (error) {
        console.error('Get photo error:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
}

module.exports = {
    dashboard,
    punchWeb,
    employeeMarkAbsent,
    applyLeave,
    uploadUserPhoto,
    getUserPhoto
};
