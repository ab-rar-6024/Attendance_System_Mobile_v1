const bcrypt = require('bcryptjs');
const crypto = require('crypto');

/**
 * Verify password against stored hash
 * Supports Werkzeug (pbkdf2, sha, bcrypt) and plain text
 * This maintains compatibility with existing Python Flask passwords
 */
function safeMatch(stored, raw) {
    if (!stored || !raw) return false;

    // Werkzeug pbkdf2 format: pbkdf2:sha256:iterations$salt$hash
    if (stored.startsWith('pbkdf2:')) {
        return verifyWerkzeugHash(stored, raw);
    }

    // bcrypt format
    if (stored.startsWith('$2a$') || stored.startsWith('$2b$') || stored.startsWith('$2y$')) {
        return bcrypt.compareSync(raw, stored);
    }

    // sha256 format (Werkzeug)
    if (stored.startsWith('sha256$')) {
        return verifyWerkzeugSHA256(stored, raw);
    }

    // Plain text (legacy - not recommended)
    return stored === raw;
}

/**
 * Verify Werkzeug pbkdf2 hash
 */
function verifyWerkzeugHash(hash, password) {
    try {
        // Format: pbkdf2:sha256:iterations$salt$hash
        const parts = hash.split(':');
        if (parts.length < 3) return false;

        const method = parts[1]; // e.g., 'sha256'
        const rest = parts.slice(2).join(':');
        const [iterations, saltAndHash] = rest.split('$', 2);

        if (!saltAndHash) return false;

        const lastDollar = saltAndHash.lastIndexOf('$');
        const salt = saltAndHash.substring(0, lastDollar);
        const storedHash = saltAndHash.substring(lastDollar + 1);

        const derived = crypto.pbkdf2Sync(
            password,
            salt,
            parseInt(iterations) || 260000,
            storedHash.length / 2,
            method
        );

        return derived.toString('hex') === storedHash;
    } catch (error) {
        console.error('Error verifying Werkzeug hash:', error);
        return false;
    }
}

/**
 * Verify Werkzeug SHA256 hash
 */
function verifyWerkzeugSHA256(hash, password) {
    try {
        // Format: sha256$salt$hash
        const parts = hash.split('$');
        if (parts.length !== 3) return false;

        const salt = parts[1];
        const storedHash = parts[2];

        const derived = crypto
            .createHash('sha256')
            .update(salt + password)
            .digest('hex');

        return derived === storedHash;
    } catch (error) {
        console.error('Error verifying SHA256 hash:', error);
        return false;
    }
}

/**
 * Hash a new password using bcrypt
 */
function hashPassword(password) {
    return bcrypt.hashSync(password, 10);
}

module.exports = {
    safeMatch,
    hashPassword
};
