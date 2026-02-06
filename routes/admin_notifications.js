const express = require('express');
const router = express.Router();
const NotificationTemplate = require('../models/NotificationTemplate');

const { isAdmin } = require('../lib/authMiddleware');

router.use(isAdmin);

// List
router.get('/', async (req, res) => {
    const templates = await NotificationTemplate.findAll();
    res.render('admin/notifications/index', { templates });
});

// Edit Form
router.get('/:id/edit', async (req, res) => {
    const template = await NotificationTemplate.findByPk(req.params.id);
    if (!template) return res.redirect('/admin/notifications');
    res.render('admin/notifications/form', { template });
});

// Update Action
router.post('/:id', async (req, res) => {
    try {
        const { messageTemplate, isActive } = req.body;
        const template = await NotificationTemplate.findByPk(req.params.id);

        if (template) {
            template.messageTemplate = messageTemplate;
            template.isActive = isActive === 'on';
            await template.save();
        }
        res.redirect('/admin/notifications');
    } catch (error) {
        console.error(error);
        res.status(500).send('Error updating template');
    }
});

module.exports = router;
