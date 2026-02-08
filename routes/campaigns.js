import express from 'express';
const router = express.Router();
import Campaign from '../models/Campaign.js';
import BankAccount from '../models/BankAccount.js';
import { isAdmin } from '../lib/authMiddleware.js';
import { getDirname } from '../lib/esm_utils.js';

const __dirname = getDirname(import.meta.url);

import { createUpload, deleteFile, getFilePath } from '../lib/upload.js';

const upload = createUpload('campaigns');

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
        const { title, detail, targetAmount, startDate, endDate, bankAccountId, isActive, imageUrl } = req.body;

        // Priority: Direct Upload (req.file) > Manual URL/Media Library (imageUrl)
        const imagePath = getFilePath(req.file, 'campaigns') || imageUrl;

        if (!imagePath) {
            return res.status(400).send('Campaign image is required');
        }

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
        const { title, detail, targetAmount, startDate, endDate, bankAccountId, isActive, imageUrl } = req.body;
        const campaign = await Campaign.findByPk(req.params.id);

        if (campaign) {
            campaign.title = title;
            campaign.detail = detail;
            campaign.targetAmount = targetAmount;
            campaign.startDate = startDate;
            campaign.endDate = endDate;
            campaign.bankAccountId = bankAccountId || null;
            campaign.isActive = isActive === 'on' || isActive === 'true';

            // Check for new image (Upload or URL)
            const newImage = getFilePath(req.file, 'campaigns') || imageUrl;

            if (newImage && newImage !== campaign.image) {
                // Delete old image if it was a stored file (not a random external URL)
                if (campaign.image) {
                    await deleteFile(campaign.image);
                }
                campaign.image = newImage;
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
                await deleteFile(campaign.image);
            }
            await campaign.destroy();
        }
        res.redirect('/admin/campaigns');
    } catch (error) {
        res.status(500).send('Error deleting campaign');
    }
});

export default router;
