import express from 'express';
const router = express.Router();
import slugify from 'slugify';
import Post from '../models/Post.js';
import User from '../models/User.js';
import { isAdmin } from "../lib/authMiddleware.js";
import { getDirname } from '../lib/esm_utils.js';

const __dirname = getDirname(import.meta.url);

import { createUpload, deleteFile, getFilePath } from '../lib/upload.js';

const upload = createUpload('posts');

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
        const imagePath = getFilePath(req.file, 'posts');

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
                    await deleteFile(post.image);
                }
                post.image = getFilePath(req.file, 'posts');
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
                await deleteFile(post.image);
            }
            await post.destroy();
        }
        res.redirect('/admin/blogs');
    } catch (error) {
        res.status(500).send('Error deleting post');
    }
});

export default router;
