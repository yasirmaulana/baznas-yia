import express from 'express';
const router = express.Router();
import Slider from '../models/Slider.js';
import { isAuthenticated, isAdmin } from '../lib/authMiddleware.js';
import { createUpload, deleteFile, getFilePath } from '../lib/upload.js';

const upload = createUpload('sliders');

// List Sliders
router.get('/', isAuthenticated, isAdmin, async (req, res) => {
    try {
        const sliders = await Slider.findAll({
            order: [['order', 'ASC'], ['createdAt', 'DESC']]
        });

        res.render('admin/sliders', {
            pageTitle: 'Slider Management',
            sliders,
            error: req.query.error || null,
            success: req.query.success || null
        });
    } catch (error) {
        console.error(error);
        res.render('admin/sliders', {
            pageTitle: 'Slider Management',
            sliders: [],
            error: 'Error loading sliders',
            success: null
        });
    }
});

// Create Slider
router.post('/create', isAuthenticated, isAdmin, upload.single('image'), async (req, res) => {
    try {
        const { title, imageUrl, link, order } = req.body;

        // Priority: Direct Upload > Manual URL/Media Selector
        const finalImageUrl = getFilePath(req.file, 'sliders') || imageUrl;

        if (!finalImageUrl) {
            return res.redirect('/admin/sliders?error=Image is required');
        }

        await Slider.create({
            title,
            imageUrl: finalImageUrl,
            link: link || null,
            order: order || 0,
            isActive: true
        });

        res.redirect('/admin/sliders?success=Slider created successfully');
    } catch (error) {
        console.error(error);
        res.redirect('/admin/sliders?error=Failed to create slider');
    }
});

// Toggle Active Status
router.post('/:id/toggle', isAuthenticated, isAdmin, async (req, res) => {
    try {
        const slider = await Slider.findByPk(req.params.id);
        if (slider) {
            slider.isActive = !slider.isActive;
            await slider.save();
            res.redirect('/admin/sliders?success=Status updated');
        } else {
            res.redirect('/admin/sliders?error=Slider not found');
        }
    } catch (error) {
        console.error(error);
        res.redirect('/admin/sliders?error=Failed to update status');
    }
});

// Delete Slider
router.post('/:id/delete', isAuthenticated, isAdmin, async (req, res) => {
    try {
        const slider = await Slider.findByPk(req.params.id);
        if (slider) {
            if (slider.imageUrl) {
                await deleteFile(slider.imageUrl);
            }
            await slider.destroy();
            res.redirect('/admin/sliders?success=Slider deleted successfully');
        } else {
            res.redirect('/admin/sliders?error=Slider not found');
        }
    } catch (error) {
        console.error(error);
        res.redirect('/admin/sliders?error=Failed to delete slider');
    }
});

export default router;
