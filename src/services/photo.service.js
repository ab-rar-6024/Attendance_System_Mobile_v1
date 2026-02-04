const pool = require('../config/db');
const supabase = require('../config/supabase');
const crypto = require('crypto');
const path = require('path');

const BUCKET_NAME = 'user_photos';

/**
 * Service to handle photo uploads and database operations using Supabase Storage
 */
class PhotoService {
    /**
     * Upload or update user photo
     */
    async uploadPhoto(userId, file) {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            // 0. Check if Supabase is configured
            if (!supabase) {
                throw new Error('Supabase Storage is not configured. Please add SUPABASE_URL and SUPABASE_ANON_KEY to environment variables.');
            }

            // 1. Find existing active photo
            const existingResult = await client.query(
                'SELECT id, file_path, file_name FROM user_photos WHERE user_id = $1 AND is_active = TRUE',
                [userId]
            );

            // 2. Mark old photo as inactive and delete from Supabase
            if (existingResult.rows.length > 0) {
                const oldPhoto = existingResult.rows[0];
                await client.query(
                    'UPDATE user_photos SET is_active = FALSE WHERE id = $1',
                    [oldPhoto.id]
                );

                // Delete from Supabase Storage
                if (oldPhoto.file_name) {
                    try {
                        await supabase.storage
                            .from(BUCKET_NAME)
                            .remove([oldPhoto.file_name]);
                    } catch (err) {
                        console.error('Failed to delete old file from Supabase:', err);
                    }
                }
            }

            // 3. Upload new photo to Supabase Storage
            const ext = path.extname(file.originalname).toLowerCase();
            const fileName = `${crypto.randomUUID()}${ext}`;

            const { data, error } = await supabase.storage
                .from(BUCKET_NAME)
                .upload(fileName, file.buffer, {
                    contentType: file.mimetype,
                    upsert: false
                });

            if (error) throw error;

            // 4. Get Public URL
            const { data: { publicUrl } } = supabase.storage
                .from(BUCKET_NAME)
                .getPublicUrl(fileName);

            // 5. Insert new photo metadata
            const insertQuery = `
                INSERT INTO user_photos (user_id, file_path, file_name, mime_type, file_size, is_active)
                VALUES ($1, $2, $3, $4, $5, TRUE)
                RETURNING *
            `;
            const result = await client.query(insertQuery, [
                userId,
                publicUrl,
                fileName,
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
