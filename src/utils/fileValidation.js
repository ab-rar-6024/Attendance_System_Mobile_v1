/**
 * File validation helpers
 */

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
const MAX_FILE_SIZE = parseInt(process.env.MAX_FILE_SIZE) || 5 * 1024 * 1024; // Default 5MB

/**
 * Validate mime type
 * @param {string} mimeType 
 * @returns {boolean}
 */
function isValidMimeType(mimeType) {
    return ALLOWED_MIME_TYPES.includes(mimeType);
}

/**
 * Validate file size
 * @param {number} size 
 * @returns {boolean}
 */
function isValidFileSize(size) {
    return size <= MAX_FILE_SIZE;
}

module.exports = {
    isValidMimeType,
    isValidFileSize,
    ALLOWED_MIME_TYPES,
    MAX_FILE_SIZE
};
