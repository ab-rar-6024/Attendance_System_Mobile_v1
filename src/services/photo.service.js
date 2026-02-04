const pool = require('../config/db');
const fs = require('fs');
const path = require('path');

/**
 * Service to handle photo uploads and database operations
 */
class PhotoService {
    /**
     * Upload or update user photo
     */
    async uploadPhoto(userId, file) {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            // 1. Find existing active photo
            const existingResult = await client.query(
                'SELECT id, file_path FROM user_photos WHERE user_id = $1 AND is_active = TRUE',
                [userId]
            );

            // 2. Mark old photo as inactive
            if (existingResult.rows.length > 0) {
                const oldPhoto = existingResult.rows[0];
                await client.query(
                    'UPDATE user_photos SET is_active = FALSE WHERE id = $1',
                    [oldPhoto.id]
                );

                // Option: Delete the physical file (Resilient to read-only)
                const isVercel = process.env.VERCEL === '1';
                const baseDir = isVercel && oldPhoto.file_path.startsWith('/tmp') ? '' : process.cwd();
                const oldFilePath = path.join(baseDir, oldPhoto.file_path);

                if (fs.existsSync(oldFilePath)) {
                    try {
                        fs.unlinkSync(oldFilePath);
                    } catch (err) {
                        // On Vercel, unlinking might fail or file might already be gone
                        console.error(`Failed to delete old photo file: ${oldFilePath}`, err);
                    }
                }
            }

            // 3. Insert new photo metadata
            const isVercel = process.env.VERCEL === '1';
            const relativePath = isVercel
                ? `/tmp/uploads/users/${file.filename}`
                : path.join('public/uploads/users', file.filename).replace(/\\/g, '/');

            const insertQuery = `
                INSERT INTO user_photos (user_id, file_path, file_name, mime_type, file_size, is_active)
                VALUES ($1, $2, $3, $4, $5, TRUE)
                RETURNING *
            `;
            const result = await client.query(insertQuery, [
                userId,
                relativePath,
                file.filename,
                file.mimetype,
                file.size
            ]);

            await client.query('COMMIT');
            return result.rows[0];
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }

    /**
     * Get active photo for a user
     */
    async getActivePhoto(userId) {
        const result = await pool.query(
            'SELECT file_path FROM user_photos WHERE user_id = $1 AND is_active = TRUE',
            [userId]
        );
        return result.rows.length > 0 ? result.rows[0] : null;
    }
}

module.exports = new PhotoService();
