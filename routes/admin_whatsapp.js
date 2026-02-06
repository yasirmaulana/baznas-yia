const express = require('express');
const router = express.Router();
const WhatsappSession = require('../models/WhatsappSession');
const Job = require('../models/Job');
const whatsappManager = require('../lib/whatsapp');
const QRCode = require('qrcode');

const { isAdmin } = require('../lib/authMiddleware');

router.use(isAdmin);

// List Sessions
router.get('/', async (req, res) => {
    const sessions = await WhatsappSession.findAll();
    res.render('admin/whatsapp/index', { sessions });
});

// Create Session
router.post('/sessions', async (req, res) => {
    try {
        const uniqueName = 'session_' + Date.now();
        await WhatsappSession.create({ sessionName: uniqueName });

        // Trigger start immediately
        whatsappManager.startSession(uniqueName);

        res.redirect('/admin/whatsapp/scan/' + uniqueName);
    } catch (error) {
        console.error(error);
        res.status(500).send('Error creating session');
    }
});

// Delete Session
router.post('/sessions/:id/delete', async (req, res) => {
    try {
        const session = await WhatsappSession.findByPk(req.params.id);
        if (session) {
            await whatsappManager.deleteSession(session.sessionName);
            await session.destroy();
        }
        res.redirect('/admin/whatsapp');
    } catch (error) {
        res.status(500).send('Error deleting session');
    }
});

// Scan QR
router.get('/scan/:name', async (req, res) => {
    const sessionName = req.params.name;
    const session = await WhatsappSession.findOne({ where: { sessionName } });

    if (!session) return res.redirect('/admin/whatsapp');
    if (session.status === 'connected') return res.redirect('/admin/whatsapp');

    // Get QR from manager
    const qrRaw = whatsappManager.getQR(sessionName);
    let qrDataURL = null;

    if (qrRaw) {
        qrDataURL = await QRCode.toDataURL(qrRaw);
    }

    res.render('admin/whatsapp/scan', {
        session,
        qrDataURL
    });
});

// Broadcast Page
router.get('/broadcast', async (req, res) => {
    const sessions = await WhatsappSession.findAll({ where: { status: 'connected' } });
    const jobs = await Job.findAll({
        where: { type: 'broadcast_whatsapp' },
        order: [['createdAt', 'DESC']],
        limit: 10
    });

    res.render('admin/whatsapp/broadcast', { sessions, jobs });
});

// Send Broadcast
router.post('/broadcast', async (req, res) => {
    try {
        const { sessionName, numbers, message } = req.body;

        const targetNumbers = numbers.split(',').map(n => n.trim()).filter(n => n.length > 5);

        for (const number of targetNumbers) {
            // Clean number (remove non-digits, replace 08 with 628)
            let cleanNumber = number.replace(/\D/g, '');
            if (cleanNumber.startsWith('0')) {
                cleanNumber = '62' + cleanNumber.substring(1);
            }

            await Job.create({
                type: 'broadcast_whatsapp',
                payload: {
                    sessionName,
                    target: cleanNumber,
                    message
                }
            });
        }

        res.redirect('/admin/whatsapp/broadcast');
    } catch (error) {
        console.error(error);
        res.status(500).send('Error queuing broadcast');
    }
});

module.exports = router;
