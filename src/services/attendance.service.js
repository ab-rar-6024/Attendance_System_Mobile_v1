const pool = require('../config/db');
const { getISTNow, getISTToday, getISTTime } = require('../utils/timezone');
const { getLocation } = require('./location.service');

/**
 * Record punch in/out
 * Converted from Python _record_punch function
 */
async function recordPunch(empId, punchType, gpsLocation = null) {
    const now = getISTNow();
    const date = getISTToday();
    const time = getISTTime();

    let location;

    if (gpsLocation) {
        const city = gpsLocation.city || 'Unknown';
        const lat = gpsLocation.latitude || 0.0;
        const lng = gpsLocation.longitude || 0.0;
        const address = gpsLocation.address || 'Unknown';
        location = `${address}|${lat.toFixed(6)}|${lng.toFixed(6)}`;
    } else {
        location = await getLocation();
    }

    const niceTime = now.toFormat('hh:mm a');

    const client = await pool.connect();

    try {
        // Check existing attendance record
        const checkResult = await client.query(
            'SELECT id, time_in, time_out FROM attendance WHERE emp_id = $1 AND date = $2',
            [empId, date]
        );

        if (punchType === 'in') {
            if (checkResult.rows.length > 0) {
                throw new Error('Already punched in');
            }

            await client.query(
                `INSERT INTO attendance (emp_id, date, time_in, location_in)
         VALUES ($1, $2, $3, $4)`,
                [empId, date, time, location]
            );
        } else {
            // Punch out
            if (checkResult.rows.length === 0 || checkResult.rows[0].time_out) {
                throw new Error('Not punched in yet / already out');
            }

            await client.query(
                `UPDATE attendance 
         SET time_out = $1, location_out = $2 
         WHERE id = $3`,
                [time, location, checkResult.rows[0].id]
            );
        }

        return { success: true, message: 'Saved', time: niceTime, location };
    } catch (error) {
        throw error;
    } finally {
        client.release();
    }
}

/**
 * Mark employee as absent
 */
async function markAbsent(empId, reason = 'No reason given') {
    const today = getISTToday();

    await pool.query(
        `INSERT INTO attendance (emp_id, date, absent, reason)
     VALUES ($1, $2, true, $3)
     ON CONFLICT (emp_id, date) DO UPDATE SET
       absent = true,
       reason = EXCLUDED.reason,
       time_in = NULL,
       time_out = NULL`,
        [empId, today, reason]
    );
}

/**
 * Get dashboard statistics
 */
async function getDashboardStats() {
    // 7-day graph - only count actual punch-ins (exclude absences)
    const graphResult = await pool.query(
        `SELECT date, COUNT(*) as count FROM attendance
     WHERE absent = false AND time_in IS NOT NULL
     GROUP BY date ORDER BY date DESC LIMIT 7`
    );

    const labels = graphResult.rows.reverse().map(r => {
        const date = new Date(r.date);
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    });

    const counts = graphResult.rows.map(r => parseInt(r.count));

    // Today's roster with separate locations
    const rosterResult = await pool.query(
        `SELECT e.id, e.name, e.emp_code, e.pin,
            a.time_in, a.time_out,
            a.location_in, a.location_out,
            a.absent, a.reason
     FROM employee e
     LEFT JOIN attendance a
       ON a.emp_id = e.id AND a.date = CURRENT_DATE
     ORDER BY e.name`
    );

    return {
        labels,
        counts,
        todayRows: rosterResult.rows
    };
}

/**
 * Get employee attendance history
 */
async function getEmployeeHistory(empId) {
    const attendanceResult = await pool.query(
        `SELECT date, time_in, time_out, absent, reason
     FROM attendance
     WHERE emp_id = $1
     ORDER BY date DESC`,
        [empId]
    );

    const leaveResult = await pool.query(
        `SELECT from_date, to_date, reason
     FROM leaves
     WHERE emp_id = $1
     ORDER BY id DESC`,
        [empId]
    );

    return {
        attendance: attendanceResult.rows,
        leave: leaveResult.rows
    };
}

/**
 * Get today's leave for employee
 */
async function getTodayLeave(empId) {
    const result = await pool.query(
        `SELECT reason
     FROM leaves
     WHERE emp_id = $1
     AND CURRENT_DATE BETWEEN from_date AND to_date
     LIMIT 1`,
        [empId]
    );

    return result.rows.length > 0 ? result.rows[0].reason : null;
}

module.exports = {
    recordPunch,
    markAbsent,
    getDashboardStats,
    getEmployeeHistory,
    getTodayLeave
};
