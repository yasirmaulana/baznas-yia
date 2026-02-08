import express from 'express';
const router = express.Router();
import path from 'path';
import fs from 'fs';
import { isAuthenticated, isAdmin } from '../lib/authMiddleware.js';
import { getDirname } from '../lib/esm_utils.js';

const __dirname = getDirname(import.meta.url);

import { createUpload, deleteFile, getFilePath, cloudinary } from '../lib/upload.js';

const upload = createUpload('media');

// API endpoint for media selector
router.get('/api/list', isAuthenticated, isAdmin, async (req, res) => {
    if (process.env.NODE_ENV === 'production') {
        try {
            const result = await cloudinary.api.resources({
                type: 'upload',
                prefix: 'baznas-yia/media/',
                max_results: 100
            });
            const images = result.resources.map(file => ({
                name: file.public_id.split('/').pop(),
                url: file.secure_url
            }));
            return res.json({ images });
        } catch (error) {
            console.error('Error listing Cloudinary resources:', error);
            return res.json({ images: [] });
        }
    }

    const uploadDir = path.join(__dirname, '../public/uploads');
    if (!fs.existsSync(uploadDir)) {
        return res.json({ images: [] });
    }

    fs.readdir(uploadDir, (err, files) => {
        if (err) return res.json({ images: [] });

        const images = files
            .filter(file => /\.(jpg|jpeg|png|gif|webp)$/i.test(file))
            .map(file => ({
                name: file,
                url: '/uploads/' + file
            }));
        res.json({ images });
    });
});

// List Media
router.get('/', isAuthenticated, isAdmin, async (req, res) => {
    if (process.env.NODE_ENV === 'production') {
        try {
            const result = await cloudinary.api.resources({
                type: 'upload',
                prefix: 'baznas-yia/media/',
                max_results: 100
            });
            const images = result.resources.map(file => ({
                name: file.public_id.split('/').pop(),
                url: file.secure_url,
                size: (file.bytes / 1024).toFixed(2) + ' KB',
                date: new Date(file.created_at)
            })).sort((a, b) => b.date - a.date);

            return res.render('admin/media', {
                pageTitle: 'Media Manager',
                images,
                error: req.query.error || null,
                success: req.query.success || null
            });
        } catch (error) {
            console.error('Error listing Cloudinary resources:', error);
            return res.render('admin/media', {
                pageTitle: 'Media Manager',
                images: [],
                error: 'Error loading Cloudinary files',
                success: null
            });
        }
    }

    const uploadDir = path.join(__dirname, '../public/uploads');
    if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
    }

    fs.readdir(uploadDir, (err, files) => {
        if (err) {
            console.error(err);
            return res.render('admin/media', {
                pageTitle: 'Media Manager',
                images: [],
                error: 'Error loading files',
                success: null
            });
        }

        const images = files
            .filter(file => /\.(jpg|jpeg|png|gif|webp)$/i.test(file))
            .map(file => {
                try {
                    const stats = fs.statSync(path.join(uploadDir, file));
                    return {
                        name: file,
                        url: '/uploads/' + file,
                        size: (stats.size / 1024).toFixed(2) + ' KB',
                        date: stats.mtime
                    };
                } catch (e) {
                    return null;
                }
            })
            .filter(img => img !== null)
            .sort((a, b) => b.date - a.date);

        res.render('admin/media', {
            pageTitle: 'Media Manager',
            images,
            error: req.query.error || null,
            success: req.query.success || null
        });
    });
});

// Upload Media
router.post('/upload', isAuthenticated, isAdmin, (req, res) => {
    upload.single('image')(req, res, (err) => {
        if (err instanceof multer.MulterError) {
            return res.redirect('/admin/media?error=' + encodeURIComponent(err.message));
        } else if (err) {
            return res.redirect('/admin/media?error=' + encodeURIComponent(err.message));
        }

        if (req.file) {
            return res.redirect('/admin/media?success=Image uploaded successfully');
        }

        res.redirect('/admin/media?error=No file selected');
    });
});

// Delete Media
router.post('/delete', isAuthenticated, isAdmin, async (req, res) => {
    const { filename } = req.body;

    if (!filename) return res.redirect('/admin/media?error=Invalid filename');

    try {
        let filePath;
        if (process.env.NODE_ENV === 'production' && filename.startsWith('http')) {
            filePath = filename; // Full Cloudinary URL
        } else {
            filePath = filename.startsWith('/uploads') ? filename : '/uploads/' + filename;
        }

        await deleteFile(filePath);
        res.redirect('/admin/media?success=Image deleted successfully');
    } catch (e) {
        console.error(e);
        res.redirect('/admin/media?error=Failed to delete file');
    }
});

export default router;
