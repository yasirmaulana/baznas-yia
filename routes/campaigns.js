const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Campaign = require('../models/Campaign');
const BankAccount = require('../models/BankAccount');

// Multer Storage
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadDir = 'public/uploads/campaigns';
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
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: function (req, file, cb) {
        const filetypes = /jpeg|jpg|png|webp/;
        const mimetype = filetypes.test(file.mimetype);
        const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
        if (mimetype && extname) {
            return cb(null, true);
        }
        cb(new Error("Error: File upload only supports the following filetypes: " + filetypes));
    }
});

const { isAdmin } = require('../lib/authMiddleware');

router.use(isAdmin);

// List Campaigns
router.get('/', async (req, res) => {
    const campaigns = await Campaign.findAll({
        include: [{
            model: BankAccount,
            as: 'bankAccount'
        }],
        order: [['createdAt', 'DESC']]
    });
    res.render('admin/campaigns/index', { campaigns });
});

// Create Form
router.get('/create', async (req, res) => {
    const banks = await BankAccount.findAll({ where: { isActive: true } });
    res.render('admin/campaigns/form', {
        campaign: null, // Null indicates create mode
        banks
    });
});

// Store Action
router.post('/', upload.single('image'), async (req, res) => {
    try {
        const { title, detail, targetAmount, startDate, endDate, bankAccountId, isActive } = req.body;
        const imagePath = req.file ? '/uploads/campaigns/' + req.file.filename : null;

        await Campaign.create({
            title,
            image: imagePath,
            detail,
            targetAmount,
            startDate,
            endDate,
            bankAccountId: bankAccountId || null,
            isActive: isActive === 'on' || isActive === 'true'
        });

        res.redirect('/admin/campaigns');
    } catch (error) {
        console.error(error);
        res.status(500).send('Error creating campaign');
    }
});

// Edit Form
router.get('/:id/edit', async (req, res) => {
    const campaign = await Campaign.findByPk(req.params.id);
    const banks = await BankAccount.findAll({ where: { isActive: true } });

    if (!campaign) return res.redirect('/admin/campaigns');

    res.render('admin/campaigns/form', {
        campaign,
        banks
    });
});

// Update Action
router.put('/:id', upload.single('image'), async (req, res) => {
    try {
        const { title, detail, targetAmount, startDate, endDate, bankAccountId, isActive } = req.body;
        const campaign = await Campaign.findByPk(req.params.id);

        if (campaign) {
            campaign.title = title;
            campaign.detail = detail;
            campaign.targetAmount = targetAmount;
            campaign.startDate = startDate;
            campaign.endDate = endDate;
            campaign.bankAccountId = bankAccountId || null;
            campaign.isActive = isActive === 'on' || isActive === 'true';

            if (req.file) {
                // Delete old image if exists
                if (campaign.image) {
                    const oldPath = path.join(__dirname, '../public', campaign.image);
                    if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
                }
                campaign.image = '/uploads/campaigns/' + req.file.filename;
            }

            await campaign.save();
        }

        res.redirect('/admin/campaigns');
    } catch (error) {
        console.error(error);
        res.status(500).send('Error updating campaign');
    }
});

// Delete Action
router.delete('/:id', async (req, res) => {
    try {
        const campaign = await Campaign.findByPk(req.params.id);
        if (campaign) {
            if (campaign.image) {
                const oldPath = path.join(__dirname, '../public', campaign.image);
                if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
            }
            await campaign.destroy();
        }
        res.redirect('/admin/campaigns');
    } catch (error) {
        res.status(500).send('Error deleting campaign');
    }
});

module.exports = router;
