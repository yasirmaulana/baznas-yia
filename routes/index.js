const express = require('express');
const router = express.Router();
const Campaign = require('../models/Campaign');
const Donation = require('../models/Donation');
const BankAccount = require('../models/BankAccount');
const Post = require('../models/Post');
const User = require('../models/User');
const Slider = require('../models/Slider');
const slugify = require('slugify');
const { Op } = require('sequelize');
const sequelize = require('../config/database');
const sendNotification = require('../lib/notificationService');

// Helper for currency formatting
const formatCurrency = (amount) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);
};

// Helper for masking phone number
const maskPhone = (phone) => {
    if (!phone || phone.length < 8) return phone;
    return phone.substring(0, 4) + '****' + phone.substring(phone.length - 3);
};

// Helper for Percentage
const calculatePercentage = (current, target) => {
    if (!target || target == 0) return 0;
    const percent = (current / target) * 100;
    return Math.min(percent, 100).toFixed(0);
};


const { isAuthenticated } = require('../lib/authMiddleware');

// --- ROUTES ---

// Profile Page
router.get('/profile', isAuthenticated, async (req, res) => {
    const user = await User.findByPk(req.session.userId);
    if (!user) {
        req.session.destroy();
        return res.redirect('/login');
    }

    res.render('front/profile', {
        pageTitle: 'My Profile',
        user
    });
});

// My Donations Page
router.get('/profile/donasi-saya', isAuthenticated, async (req, res) => {
    try {
        const donations = await Donation.findAll({
            where: { donorId: req.session.userId },
            include: [{ model: Campaign, as: 'campaign', attributes: ['title', 'image'] }],
            order: [['createdAt', 'DESC']]
        });

        res.render('front/donasi_saya', {
            pageTitle: 'Donasi Saya',
            donations: donations.map(d => ({
                ...d.toJSON(),
                formattedAmount: formatCurrency(d.amount),
                formattedTotal: formatCurrency(d.totalAmount),
                date: new Date(d.createdAt).toLocaleDateString('id-ID', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric'
                })
            }))
        });
    } catch (error) {
        console.error(error);
        res.status(500).send('Error fetching donations');
    }
});

// Edit Profile Page
router.get('/profile/edit', isAuthenticated, async (req, res) => {
    const user = await User.findByPk(req.session.userId);
    if (!user) return res.redirect('/login');

    res.render('front/profile_edit', {
        pageTitle: 'Edit Profil',
        user
    });
});

// Update Profile Action
router.post('/profile/edit', isAuthenticated, async (req, res) => {
    try {
        const { name, phone, password, confirmPassword } = req.body;
        const user = await User.findByPk(req.session.userId);

        if (!user) return res.redirect('/login');

        user.name = name;
        user.phone = phone;

        if (password && password.length >= 6) {
            if (password === confirmPassword) {
                user.password = password; // Hook will hash it
            } else {
                return res.render('front/profile_edit', {
                    pageTitle: 'Edit Profil',
                    user,
                    error: 'Password tidak cocok'
                });
            }
        }

        await user.save();
        res.redirect('/profile?success=1');
    } catch (error) {
        console.error(error);
        res.status(500).send('Error updating profile');
    }
});

// Fundraising History Page
router.get('/profile/fundraising', isAuthenticated, async (req, res) => {
    try {
        const donations = await Donation.findAll({
            where: { fundraiserId: req.session.userId },
            include: [{ model: Campaign, as: 'campaign', attributes: ['title', 'image'] }],
            order: [['createdAt', 'DESC']]
        });

        const totalCollected = donations
            .filter(d => d.status === 2)
            .reduce((sum, d) => sum + parseFloat(d.amount), 0);

        const totalDonors = donations.length;

        res.render('front/fundraising', {
            pageTitle: 'Riwayat Fundraising',
            totalCollected: formatCurrency(totalCollected),
            totalDonors,
            donations: donations.map(d => ({
                ...d.toJSON(),
                formattedAmount: formatCurrency(d.amount),
                donorName: d.isAnonymous ? 'Hamba Allah' : d.donorName,
                date: new Date(d.createdAt).toLocaleDateString('id-ID', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric'
                })
            }))
        });
    } catch (error) {
        console.error(error);
        res.status(500).send('Error fetching fundraising data');
    }
});


router.get('/', async (req, res) => {
    const campaigns = await Campaign.findAll({
        where: { isActive: true },
        order: [['createdAt', 'DESC']],
        limit: 6,
        include: [{ model: Donation, as: 'donations', where: { status: 2 }, required: false }]
    });

    const prayers = await Donation.findAll({
        where: {
            status: 2,
            pray: { [Op.ne]: null, [Op.ne]: '' }
        },
        order: [['createdAt', 'DESC']],
        limit: 10,
        include: [{ model: Campaign, as: 'campaign' }]
    });

    const sliders = await Slider.findAll({
        where: { isActive: true },
        order: [['order', 'ASC'], ['createdAt', 'DESC']]
    });

    res.render('front/home', {
        pageTitle: 'Home',
        sliders,
        prayers: prayers.map(p => ({
            ...p.toJSON(),
            name: p.isAnonymous ? 'Hamba Allah' : p.donorName,
        })),
        campaigns: campaigns.map(c => {
            const collected = c.donations ? c.donations.reduce((sum, d) => sum + parseFloat(d.amount), 0) : 0;
            const fullUrl = req.protocol + '://' + req.get('host') + '/campaign/' + c.id + '-' + slugify(c.title, { lower: true, strict: true });
            return {
                ...c.toJSON(),
                fullUrl,
                slug: slugify(c.title, { lower: true, strict: true }),
                formattedTarget: formatCurrency(c.targetAmount),
                currentAmount: collected,
                formattedCurrent: formatCurrency(collected),
                percentage: calculatePercentage(collected, c.targetAmount)
            };
        })
    });
});

// Blog List
router.get('/blog', async (req, res) => {
    const posts = await Post.findAll({
        where: { isPublished: true },
        order: [['createdAt', 'DESC']]
    });

    const postsData = posts.map(post => {
        const textContent = post.content.replace(/<[^>]*>?/gm, '');
        const wordCount = textContent.split(/\s+/).length;
        const readTime = Math.ceil(wordCount / 200); // Avg 200 words per minute

        return {
            ...post.toJSON(),
            snippet: textContent.substring(0, 150) + '...',
            readTime,
            formattedDate: new Date(post.createdAt).toLocaleDateString('id-ID', {
                day: 'numeric',
                month: 'long',
                year: 'numeric'
            })
        };
    });

    res.render('front/blog', {
        pageTitle: 'Ilmu Portal',
        posts: postsData
    });
});

// Campaigns List Page
router.get('/campaigns', async (req, res) => {
    const campaigns = await Campaign.findAll({
        where: { isActive: true },
        order: [['createdAt', 'DESC']],
        include: [{ model: Donation, as: 'donations', where: { status: 2 }, required: false }]
    });

    const campaignsData = campaigns.map(c => {
        const collected = c.donations ? c.donations.reduce((sum, d) => sum + parseFloat(d.amount), 0) : 0;
        return {
            ...c.toJSON(),
            slug: slugify(c.title, { lower: true, strict: true }),
            formattedTarget: formatCurrency(c.targetAmount),
            currentAmount: collected,
            formattedCurrent: formatCurrency(collected),
            percentage: calculatePercentage(collected, c.targetAmount)
        };
    });

    res.render('front/campaigns', {
        pageTitle: 'Daftar Campaign',
        campaigns: campaignsData
    });
});

// Blog Detail
router.get('/blog/:slug', async (req, res) => {
    const post = await Post.findOne({ where: { slug: req.params.slug, isPublished: true } });
    if (!post) return res.redirect('/blog');

    const textContent = post.content.replace(/<[^>]*>?/gm, '');
    const wordCount = textContent.split(/\s+/).length;
    const readTime = Math.ceil(wordCount / 200);

    res.render('front/blog_detail', {
        pageTitle: post.title,
        post: {
            ...post.toJSON(),
            readTime,
            formattedDate: new Date(post.createdAt).toLocaleDateString('id-ID', {
                day: 'numeric',
                month: 'long',
                year: 'numeric'
            })
        }
    });
});

// Campaign Detail
router.get('/campaign/:slug', async (req, res) => {
    const match = req.params.slug.match(/^(\d+)-/);
    if (!match) return res.redirect('/');

    const id = match[1];

    // Fetch Campaign with Bank Account
    const campaign = await Campaign.findByPk(id, {
        include: [
            { model: BankAccount, as: 'bankAccount' }
        ]
    });

    if (!campaign || !campaign.isActive) return res.redirect('/');

    // Fetch Confirmed Donations
    const donations = await Donation.findAll({
        where: { campaignId: id, status: 2 }, // Only confirmed
        order: [['createdAt', 'DESC']],
        limit: 10
    });

    const totalCollected = await Donation.sum('amount', {
        where: { campaignId: id, status: 2 }
    }) || 0;

    const fullUrl = req.protocol + '://' + req.get('host') + req.originalUrl;
    const imageUrl = campaign.image ? (req.protocol + '://' + req.get('host') + campaign.image) : '';

    // Fetch User if logged in
    let user = null;
    if (req.session.userId) {
        user = await User.findByPk(req.session.userId);
    }

    // Handle Referral
    const ref = req.query.ref;
    if (ref) {
        // Find user by username or ID
        const referralUser = await User.findOne({
            where: {
                [Op.or]: [
                    { username: ref },
                    { id: isNaN(ref) ? -1 : ref } // Fallback to ID if numeric
                ]
            }
        });
        if (referralUser) {
            req.session.fundraiserId = referralUser.id;
        }
    }

    // Fetch Real Fundraisers Stats
    const rawFundraisers = await Donation.findAll({
        where: { campaignId: id, status: 2, fundraiserId: { [Op.ne]: null } },
        attributes: [
            'fundraiserId',
            [sequelize.fn('COUNT', sequelize.col('Donation.id')), 'count'],
            [sequelize.fn('SUM', sequelize.col('Donation.amount')), 'amount']
        ],
        group: ['fundraiserId', 'fundraiser.id', 'fundraiser.name'],
        include: [{
            model: User,
            as: 'fundraiser',
            attributes: ['id', 'name']
        }],
        order: [[sequelize.literal('amount'), 'DESC']]
    });

    const fundraisers = rawFundraisers.map(f => {
        const data = f.get({ plain: true });
        return {
            name: data.fundraiser ? data.fundraiser.name : 'Fundraiser',
            count: data.count,
            amount: parseFloat(data.amount),
            formattedAmount: formatCurrency(parseFloat(data.amount)),
            avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(data.fundraiser ? data.fundraiser.name : 'F')}&background=random`
        };
    });

    res.render('front/campaign_detail', {
        pageTitle: campaign.title,
        og: {
            title: campaign.title,
            description: campaign.detail.replace(/<[^>]*>?/gm, '').substring(0, 150) + '...',
            image: imageUrl,
            url: fullUrl
        },
        campaign: {
            ...campaign.toJSON(),
            fullUrl,
            slug: slugify(campaign.title, { lower: true, strict: true }),
            formattedTarget: formatCurrency(campaign.targetAmount),
            currentAmount: totalCollected,
            formattedCurrent: formatCurrency(totalCollected),
            percentage: calculatePercentage(totalCollected, campaign.targetAmount)
        },
        donations: donations.map(d => ({
            ...d.toJSON(),
            name: d.isAnonymous ? 'Hamba Allah' : d.donorName,
            formattedAmount: formatCurrency(d.amount),
            timeAgo: new Date(d.createdAt).toLocaleDateString()
        })),
        fundraisers,
        user
    });
});

// Process Donation
router.post('/campaign/:id/donate', async (req, res) => {
    try {
        const campaignId = req.params.id;
        const { donorName, whatsapp, email, amount, pray, isAnonymous } = req.body;

        const cleanAmount = parseFloat(amount.toString().replace(/[^0-9]/g, ''));

        if (!cleanAmount || cleanAmount < 1000) {
            return res.redirect('back');
        }

        const uniqueCode = Math.floor(Math.random() * 999) + 1;
        const totalAmount = cleanAmount + uniqueCode;

        const donation = await Donation.create({
            campaignId,
            donorName,
            whatsapp,
            email,
            amount: cleanAmount,
            uniqueCode,
            totalAmount,
            pray,
            isAnonymous: isAnonymous === 'on',
            status: 1, // Waiting
            fundraiserId: req.session.fundraiserId || null,
            donorId: req.session.userId || null
        });

        // Trigger Notification
        const campaign = await Campaign.findByPk(campaignId, {
            include: [{ model: BankAccount, as: 'bankAccount' }]
        });

        if (whatsapp && whatsapp.length > 5) {
            await sendNotification('DONATION_CREATED', whatsapp, {
                name: isAnonymous === 'on' ? 'Hamba Allah' : donorName,
                amount: formatCurrency(totalAmount),
                campaign: campaign.title,
                bank: campaign.bankAccount.bank,
                accountNumber: campaign.bankAccount.accountNumber,
                accountName: campaign.bankAccount.name
            });
        }

        res.redirect(`/donation/confirmation/${donation.id}`);

    } catch (error) {
        console.error(error);
        res.status(500).send("Error processing donation");
    }
});

// Confirmation Page
router.get('/donation/confirmation/:id', async (req, res) => {
    const donation = await Donation.findByPk(req.params.id, {
        include: [
            {
                model: Campaign,
                as: 'campaign',
                include: [{ model: BankAccount, as: 'bankAccount' }]
            }
        ]
    });

    if (!donation) return res.redirect('/');

    res.render('front/donation_confirmation', {
        pageTitle: 'Donation Confirmation',
        donation: {
            ...donation.toJSON(),
            formattedAmount: formatCurrency(donation.amount),
            formattedTotal: formatCurrency(donation.totalAmount),
            expiryDate: new Date(donation.createdAt.getTime() + 24 * 60 * 60 * 1000).toLocaleString()
        }
    });
});

module.exports = router;
