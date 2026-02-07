import express from 'express';
const router = express.Router();
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { isAuthenticated, isAdmin } from '../lib/authMiddleware.js';
import { getDirname } from '../lib/esm_utils.js';

const __dirname = getDirname(import.meta.url);

// Configure Multer
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const dir = path.join(__dirname, '../public/uploads');
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        cb(null, dir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: (req, file, cb) => {
        const filetypes = /jpeg|jpg|png|gif|webp/;
        const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = filetypes.test(file.mimetype);
        if (extname && mimetype) {
            return cb(null, true);
        } else {
            cb(new Error('Images Only!'));
        }
    }
});

// API endpoint for media selector
router.get('/api/list', isAuthenticated, isAdmin, (req, res) => {
    const uploadDir = path.join(__dirname, '../public/uploads');

    if (!fs.existsSync(uploadDir)) {
        return res.json({ images: [] });
    }

    fs.readdir(uploadDir, (err, files) => {
        if (err) {
            return res.json({ images: [] });
        }

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
router.get('/', isAuthenticated, isAdmin, (req, res) => {
    const uploadDir = path.join(__dirname, '../public/uploads');

    // Ensure directory exists
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
router.post('/delete', isAuthenticated, isAdmin, (req, res) => {
    const { filename } = req.body;

    if (!filename) return res.redirect('/admin/media?error=Invalid filename');

    const filePath = path.join(__dirname, '../public/uploads', path.basename(filename));

    if (fs.existsSync(filePath)) {
        try {
            fs.unlinkSync(filePath);
            res.redirect('/admin/media?success=Image deleted successfully');
        } catch (e) {
            console.error(e);
            res.redirect('/admin/media?error=Failed to delete file');
        }
    } else {
        res.redirect('/admin/media?error=File not found');
    }
});

export default router;
