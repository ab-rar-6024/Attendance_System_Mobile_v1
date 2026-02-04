const { DateTime } = require('luxon');

/**
 * Format time for display (12-hour format with AM/PM)
 * Handles PostgreSQL time strings, Date objects, and timedelta-like durations
 */
function formatTime(t) {
    if (!t) return null;

    try {
        // Handle PostgreSQL time string (HH:mm:ss or HH:mm:ss.microseconds)
        if (typeof t === 'string') {
            const timeParts = t.split(':');
            if (timeParts.length >= 2) {
                const hours = parseInt(timeParts[0]);
                const minutes = parseInt(timeParts[1]);

                const period = hours < 12 ? 'AM' : 'PM';
                const displayHour = hours % 12 || 12;

                return `${displayHour.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')} ${period}`;
            }
        }

        // Handle Date object
        if (t instanceof Date) {
            const dt = DateTime.fromJSDate(t);
            return dt.toFormat('hh:mm a');
        }

        // Handle Luxon DateTime
        if (t.toFormat) {
            return t.toFormat('hh:mm a');
        }

        return String(t).substring(0, 5); // Fallback: just show HH:MM
    } catch (error) {
        console.error('Error formatting time:', error);
        return null;
    }
}

/**
 * Format date for display
 */
function formatDate(d, format = 'yyyy-MM-dd') {
    if (!d) return null;

    try {
        if (d instanceof Date) {
            return DateTime.fromJSDate(d).toFormat(format);
        }
        if (typeof d === 'string') {
            return DateTime.fromISO(d).toFormat(format);
        }
        return String(d);
    } catch (error) {
        console.error('Error formatting date:', error);
        return null;
    }
}

/**
 * Get employee by PIN
 */
async function getEmpByPin(pool, pin) {
    const result = await pool.query(
        'SELECT id, name, emp_code FROM employee WHERE pin = $1',
        [pin]
    );
    return result.rows.length > 0 ? result.rows[0] : null;
}

module.exports = {
    formatTime,
    formatDate,
    getEmpByPin
};
