import express from 'express';
const router = express.Router();
import Slider from '../models/Slider.js';
import { isAuthenticated, isAdmin } from '../lib/authMiddleware.js';

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
router.post('/create', isAuthenticated, isAdmin, async (req, res) => {
    try {
        const { title, imageUrl, link, order } = req.body;

        await Slider.create({
            title,
            imageUrl,
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
        await Slider.destroy({ where: { id: req.params.id } });
        res.redirect('/admin/sliders?success=Slider deleted successfully');
    } catch (error) {
        console.error(error);
        res.redirect('/admin/sliders?error=Failed to delete slider');
    }
});

export default router;
