const pool = require('../config/db');
const { formatTime } = require('../utils/helpers');
const { DateTime } = require('luxon');
const reportService = require('../services/report.service');
const ejs = require('ejs');
const path = require('path');
const pdf = require('html-pdf-node');

/**
 * Reports dashboard
 */
async function reportsDashboard(req, res) {
    try {
        const graphResult = await pool.query(
            `SELECT date, COUNT(*) as count 
             FROM attendance
             GROUP BY date 
             ORDER BY date DESC 
             LIMIT 7`
        );

        const labels = graphResult.rows.reverse().map(r => {
            const date = new Date(r.date);
            return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        });

        const counts = graphResult.rows.map(r => parseInt(r.count));

        const totalResult = await pool.query('SELECT COUNT(*) as count FROM employee');
        const total = parseInt(totalResult.rows[0].count);

        const presentResult = await pool.query(
            `SELECT COUNT(DISTINCT emp_id) as count 
             FROM attendance
             WHERE date = CURRENT_DATE AND absent = false`
        );

        const present = parseInt(presentResult.rows[0].count);
        const absent = total - present;

        res.render('reports', {
            labels,
            counts,
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
 * ✅ ADMIN Monthly report (ALL employees)
 * URL: /monthly_report
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

        const monthName = today.toFormat('MMMM yyyy');

        res.render('monthly_report', {
            records,
            monthName,
            isPDF: false
        });

    } catch (error) {
        console.error('Monthly report error:', error);
        req.flash('danger', 'Error loading monthly report');
        res.redirect('/admin');
    }
}


/**
 * ✅ Single Employee Monthly PDF
 * URL: /monthly_report/pdf/:employeeId
 */
async function downloadMonthlyPDF(req, res) {
    try {
        const today = DateTime.now();
        const month = today.month;
        const year = today.year;

        const data = await reportService.generateMonthlyReport(
            req.params.employeeId,
            month,
            year
        );

        const filePath = path.join(__dirname, '../../views/monthly_report.ejs');

        const html = await ejs.renderFile(filePath, {
            ...data,
            monthName: today.toFormat('MMMM yyyy'),
            isPDF: true
        });

        const file = { content: html };

        const options = {
            format: 'A4',
            margin: {
                top: '20mm',
                bottom: '20mm',
                left: '15mm',
                right: '15mm'
            }
        };

        const pdfBuffer = await pdf.generatePdf(file, options);

        res.set({
            'Content-Type': 'application/pdf',
            'Content-Disposition': `attachment; filename=monthly-report-${month}-${year}.pdf`
        });

        res.send(pdfBuffer);

    } catch (error) {
        console.error('PDF generation error:', error);
        req.flash('danger', 'Error generating PDF');
        res.redirect('/monthly_report');
    }
}

module.exports = {
    reportsDashboard,
    monthlyReport,
    downloadMonthlyPDF
};