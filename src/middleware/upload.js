const multer = require('multer');
const path = require('path');
const crypto = require('crypto');
const fs = require('fs');
const { isValidMimeType, MAX_FILE_SIZE } = require('../utils/fileValidation');

// 🛠️ Filesystem Resilience for Vercel
// Vercel is read-only except for /tmp.
const isVercel = process.env.VERCEL === '1';
const UPLOAD_BASE_DIR = isVercel ? '/tmp/uploads' : (process.env.UPLOAD_DIR || 'public/uploads');
const USER_PHOTOS_DIR = path.join(UPLOAD_BASE_DIR, 'users');

// Ensure directory exists (Resilient to read-only errors)
try {
    if (!fs.existsSync(USER_PHOTOS_DIR)) {
        fs.mkdirSync(USER_PHOTOS_DIR, { recursive: true });
    }
} catch (err) {
    if (!isVercel) console.error('Failed to create upload directory:', err);
}

// Storage configuration
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, USER_PHOTOS_DIR);
    },
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname).toLowerCase();
        const filename = `${crypto.randomUUID()}${ext}`;
        cb(null, filename);
    }
});

// File filter
const fileFilter = (req, file, cb) => {
    if (isValidMimeType(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Invalid file type. Only JPG, JPEG, PNG, and WEBP are allowed.'), false);
    }
};

const upload = multer({
    storage: storage,
    limits: {
        fileSize: MAX_FILE_SIZE
    },
    fileFilter: fileFilter
});

module.exports = {
    upload,
    USER_PHOTOS_DIR
};
