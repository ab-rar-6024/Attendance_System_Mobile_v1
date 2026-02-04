const multer = require('multer');
const path = require('path');
const crypto = require('crypto');
const { isValidMimeType, MAX_FILE_SIZE } = require('../utils/fileValidation');

// Use memoryStorage for Supabase/Vercel (No disk access needed)
const storage = multer.memoryStorage();

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
    upload
};
