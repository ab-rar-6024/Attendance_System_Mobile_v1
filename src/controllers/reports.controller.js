const pool = require('../config/db');
const { formatTime } = require('../utils/helpers');
const { DateTime } = require('luxon');

/**
 * Reports dashboard
 */
async function reportsDashboard(req, res) {
    try {
        // 7-day graph
        const graphResult = await pool.query(
            `SELECT date, COUNT(*) as count FROM attendance
       GROUP BY date ORDER BY date DESC LIMIT 7`
        );

        const labels = graphResult.rows.reverse().map(r => {
            const date = new Date(r.date);
            return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        });

        const counts = graphResult.rows.map(r => parseInt(r.count));

        // Today's stats
        const totalResult = await pool.query('SELECT COUNT(*) as count FROM employee');
        const total = parseInt(totalResult.rows[0].count);

        const presentResult = await pool.query(
            `SELECT COUNT(DISTINCT emp_id) as count FROM attendance
       WHERE date = CURRENT_DATE AND absent = false`
        );
        const present = parseInt(presentResult.rows[0].count);
        const absent = total - present;

        res.render('reports', {
            labels: labels,
            counts: counts,
            present,
            absent
        });
    } catch (error) {
        console.error('Reports error:', error);
        req.flash('danger', 'Error loading reports');
        res.redirect('/admin');
    }
}

/**
 * Monthly report
 */
async function monthlyReport(req, res) {
    try {
        const today = DateTime.now();
        const firstDay = today.startOf('month').toISODate();
        const lastDay = today.endOf('month').toISODate();

        const result = await pool.query(
            `SELECT e.id, e.name,
              a.date, a.time_in, a.time_out,
              a.location_in, a.location_out,
              a.absent, a.reason
       FROM employee e
       LEFT JOIN attendance a
         ON e.id = a.emp_id
         AND a.date BETWEEN $1 AND $2
       ORDER BY e.id, a.date`,
            [firstDay, lastDay]
        );

        const records = result.rows.map(r => ({
            emp_id: r.id,
            name: r.name,
            date: r.date ? r.date.toISOString().split('T')[0] : '—',
            time_in: formatTime(r.time_in) || '—',
            time_out: formatTime(r.time_out) || '—',
            location_in: r.location_in || '—',
            location_out: r.location_out || '—',
            absent: r.absent ? 'Yes' : 'No',
            reason: r.reason || '—'
        }));

        const month = today.toFormat('MMMM yyyy');

        res.render('monthly_report', {
            records,
            month
        });
    } catch (error) {
        console.error('Monthly report error:', error);
        req.flash('danger', 'Error loading monthly report');
        res.redirect('/admin');
    }
}

module.exports = {
    reportsDashboard,
    monthlyReport
};
