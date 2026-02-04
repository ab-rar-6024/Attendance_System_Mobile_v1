const { DateTime } = require('luxon');

/**
 * Get current time in IST timezone
 */
function getISTNow() {
    return DateTime.now().setZone('Asia/Kolkata');
}

/**
 * Get today's date in IST
 */
function getISTToday() {
    return getISTNow().toISODate();
}

/**
 * Get IST time in HH:mm:ss format
 */
function getISTTime() {
    return getISTNow().toFormat('HH:mm:ss');
}

/**
 * Convert date to IST
 */
function toIST(date) {
    return DateTime.fromJSDate(date).setZone('Asia/Kolkata');
}

module.exports = {
    getISTNow,
    getISTToday,
    getISTTime,
    toIST
};
