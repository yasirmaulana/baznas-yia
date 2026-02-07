import express from 'express';
const router = express.Router();
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import slugify from 'slugify';
import Post from '../models/Post.js';
import User from '../models/User.js';
import { isAdmin } from "../lib/authMiddleware.js";
import { getDirname } from '../lib/esm_utils.js';

const __dirname = getDirname(import.meta.url);

// Multer Storage
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadDir = 'public/uploads/posts';
        // Create directory if it doesn't exist
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: function (req, file, cb) {
        const filetypes = /jpeg|jpg|png|webp/;
        const mimetype = filetypes.test(file.mimetype);
        const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
        if (mimetype && extname) {
            return cb(null, true);
        }
        cb(new Error("Error: File upload only supports images"));
    }
});

router.use(isAdmin);

// List
router.get('/', async (req, res) => {
    const posts = await Post.findAll({
        include: [{ model: User, as: 'author', attributes: ['email'] }],
        order: [['createdAt', 'DESC']]
    });
    res.render('admin/blogs/index', { posts });
});

// Create Form
router.get('/create', (req, res) => {
    res.render('admin/blogs/form', { post: null });
});

// Store Action
router.post('/', upload.single('image'), async (req, res) => {
    try {
        const { title, content, isPublished } = req.body;
        const imagePath = req.file ? '/uploads/posts/' + req.file.filename : null;

        let slug = slugify(title, { lower: true, strict: true });
        // Simple duplicate slug check
        const existing = await Post.findOne({ where: { slug } });
        if (existing) {
            slug = slug + '-' + Date.now();
        }

        await Post.create({
            title,
            slug,
            image: imagePath,
            content,
            isPublished: isPublished === 'on',
            createdBy: req.session.userId
        });

        res.redirect('/admin/blogs');
    } catch (error) {
        console.error(error);
        res.status(500).send('Error creating post');
    }
});

// Edit Form
router.get('/:id/edit', async (req, res) => {
    const post = await Post.findByPk(req.params.id);
    if (!post) return res.redirect('/admin/blogs');
    res.render('admin/blogs/form', { post });
});

// Update Action
router.put('/:id', upload.single('image'), async (req, res) => {
    try {
        const { title, content, isPublished } = req.body;
        const post = await Post.findByPk(req.params.id);

        if (post) {
            post.title = title;
            post.content = content;
            post.isPublished = isPublished === 'on';

            if (post.title !== title) {
                post.slug = slugify(title, { lower: true, strict: true });
            }

            if (req.file) {
                if (post.image) {
                    const oldPath = path.join(__dirname, '../public', post.image);
                    if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
                }
                post.image = '/uploads/posts/' + req.file.filename;
            }

            await post.save();
        }
        res.redirect('/admin/blogs');
    } catch (error) {
        console.error(error);
        res.status(500).send('Error updating post');
    }
});

// Delete Action
router.delete('/:id', async (req, res) => {
    try {
        const post = await Post.findByPk(req.params.id);
        if (post) {
            if (post.image) {
                const oldPath = path.join(__dirname, '../public', post.image);
                if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
            }
            await post.destroy();
        }
        res.redirect('/admin/blogs');
    } catch (error) {
        res.status(500).send('Error deleting post');
    }
});

export default router;
