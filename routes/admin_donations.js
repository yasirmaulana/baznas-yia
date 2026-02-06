const express = require('express');
const router = express.Router();
const Donation = require('../models/Donation');
const Campaign = require('../models/Campaign');
const User = require('../models/User');
const { Op } = require('sequelize');
const sendNotification = require('../lib/notificationService');

// Helper for currency formatting
const formatCurrency = (amount) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);
};

const { isAdmin } = require('../lib/authMiddleware');

router.use(isAdmin);

// List Donations
router.get('/', async (req, res) => {
    const { date, minAmount } = req.query;
    let where = {};

    if (date) {
        // Filter by created date
        const start = new Date(date);
        start.setHours(0, 0, 0, 0);
        const end = new Date(date);
        end.setHours(23, 59, 59, 999);
        where.createdAt = { [Op.between]: [start, end] };
    }

    if (minAmount) {
        where.totalAmount = { [Op.gte]: minAmount };
    }

    const donations = await Donation.findAll({
        where,
        include: [
            { model: Campaign, as: 'campaign', attributes: ['title'] },
            { model: User, as: 'approver', attributes: ['email'] }
        ],
        order: [['createdAt', 'DESC']]
    });

    // KPI Stats
    const totalDonations = await Donation.count();
    const totalAmountCollected = await Donation.sum('amount', { where: { status: 2 } }) || 0;
    const pendingDonations = await Donation.count({ where: { status: 1 } });

    res.render('admin/donations/index', {
        donations,
        stats: { totalDonations, totalAmountCollected, pendingDonations },
        query: req.query
    });
});

// Approve Action
router.post('/:id/approve', async (req, res) => {
    try {
        const donation = await Donation.findByPk(req.params.id);
        if (donation && donation.status === 1) {
            donation.status = 2; // Confirmed
            donation.approvedBy = req.session.userId;
            donation.approvedAt = new Date();
            donation.approvedAt = new Date();
            await donation.save();

            // Send Notification
            if (donation.whatsapp && donation.whatsapp.length > 5) {
                // Fetch Campaign Title for context if needed (though template might just use name/amount)
                // Re-fetch to be safe or assuming title isn't needed for confirmed template, 
                // but checking template 'DONATION_CONFIRMED' from init has {{name}} and {{amount}}

                await sendNotification('DONATION_CONFIRMED', donation.whatsapp, {
                    name: donation.donorName,
                    amount: formatCurrency(donation.amount)
                });
            }
        }
        res.redirect('/admin/donations');
    } catch (error) {
        console.error(error);
        res.status(500).send('Error approving donation');
    }
});

// Reject/Cancel Action
router.post('/:id/reject', async (req, res) => {
    try {
        const donation = await Donation.findByPk(req.params.id);
        if (donation && donation.status === 1) {
            donation.status = 3; // Cancelled
            await donation.save();
        }
        res.redirect('/admin/donations');
    } catch (error) {
        console.error(error);
        res.status(500).send('Error rejecting donation');
    }
});

module.exports = router;
