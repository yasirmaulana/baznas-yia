const express = require('express');
const router = express.Router();
const BankMutation = require('../models/BankMutation');
const BankAccount = require('../models/BankAccount');
const NotificationTemplate = require('../models/NotificationTemplate');
const Donation = require('../models/Donation');
const User = require('../models/User'); // For system user if needed
const sendNotification = require('../lib/notificationService');
const sequelize = require('../config/database');
const { Op } = require('sequelize');

// Public Webhook Route for Moota
// POST /api/webhook/moota
router.post('/moota', async (req, res) => {
    // Moota sends an array or single object of mutations
    // We should ideally verify a secret header here if Moota provides one (e.g., 'Signature')

    console.log('Received Moota Webhook:', JSON.stringify(req.body));

    const mutations = Array.isArray(req.body) ? req.body : [req.body];
    const results = [];

    for (const data of mutations) {
        /* 
           Expected payload structure (approximate based on common practices):
           {
             "bank_id": "...",
             "account_number": "123456",
             "date": "2024-01-01 10:00:00",
             "description": "TRANSFER ...",
             "amount": 100000,
             "type": "CR",
             "balance": 5000000,
             "mutation_id": "..." 
           }
           Adjust based on actual Moota docs.
        */

        // 1. Basic Validation
        if (!data.amount || !data.description) continue;

        try {
            // 2. Find matching internal BankAccount
            // Moota might send 'account_number' or we match by bank_id context
            let bankAccount = null;
            if (data.account_number) {
                bankAccount = await BankAccount.findOne({ where: { accountNumber: data.account_number } });
            }

            // 3. Store Mutation
            // Check duplications by transaction ID if provided
            const existing = data.mutation_id
                ? await BankMutation.findOne({ where: { transactionId: data.mutation_id } })
                : null; // If no ID, might risk duplicates, but assuming Moota pushes unique IDs

            if (!existing) {
                const mutation = await BankMutation.create({
                    transactionId: data.mutation_id || null,
                    date: data.date || new Date(),
                    description: data.description,
                    amount: data.amount,
                    type: data.type || (data.amount > 0 ? 'CR' : 'DB'), // Fallback logic
                    balance: data.balance || 0,
                    bankAccountId: bankAccount ? bankAccount.id : null,
                    rawPayload: JSON.stringify(data)
                });

                results.push(mutation);

                // --- OPTIONAL: AUTO MATCH DONATION ---
                // If it's a CREDIT (incoming money)
                if (data.direction === 'IN' || data.type === 'CR') {
                    // Try to find a pending donation with this exact amount (including unique code)
                    // Logic: Donation.totalAmount == data.amount && status == 1

                    const pendingDonation = await Donation.findOne({
                        where: {
                            totalAmount: data.amount,
                            status: 1,
                            createdAt: {
                                [Op.gte]: new Date(new Date() - 24 * 60 * 60 * 1000) // Within last 24h
                            }
                        }
                    });

                    if (pendingDonation) {
                        console.log(`Auto-matching Donation #${pendingDonation.id} with Mutation #${mutation.id}`);

                        pendingDonation.status = 2; // Confirmed
                        pendingDonation.approvedAt = new Date();
                        // We could set 'approvedBy' to a system user ID if we had one
                        await pendingDonation.save();

                        // Send Notification
                        if (pendingDonation.whatsapp && pendingDonation.whatsapp.length > 5) {
                            const formatCurrency = (amount) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);

                            await sendNotification('DONATION_CONFIRMED', pendingDonation.whatsapp, {
                                name: pendingDonation.donorName,
                                amount: formatCurrency(pendingDonation.amount)
                            });
                        }
                    }
                }
            }
        } catch (err) {
            console.error('Error processing mutation item:', err);
        }
    }

    res.json({ status: 'ok', processed: results.length });
});

module.exports = router;
