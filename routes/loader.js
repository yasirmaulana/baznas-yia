const express = require('express');
const indexRoutes = require('./index');
const authRoutes = require('./auth');
const adminRoutes = require('./admin');
const campaignRoutes = require('./campaigns');
const adminDonationRoutes = require('./admin_donations');
const adminWhatsappRoutes = require('./admin_whatsapp');
const adminNotificationRoutes = require('./admin_notifications');
const adminMutationRoutes = require('./admin_mutations');
const adminBlogRoutes = require('./admin_blogs');
const adminMediaRoutes = require('./admin_media');
const adminSliderRoutes = require('./admin_sliders');
const webhookRoutes = require('./webhook');

/**
 * Load all application routes
 * @param {express.Application} app - Express application instance
 */
function loadRoutes(app) {
    // Public route before auth check/admin routes
    app.use('/api/webhook', webhookRoutes);

    // Core routes
    app.use('/', indexRoutes);
    app.use('/', authRoutes);

    // Admin routes
    app.use('/admin', adminRoutes);
    app.use('/admin/campaigns', campaignRoutes);
    app.use('/admin/donations', adminDonationRoutes);
    app.use('/admin/whatsapp', adminWhatsappRoutes);
    app.use('/admin/notifications', adminNotificationRoutes);
    app.use('/admin/mutations', adminMutationRoutes);
    app.use('/admin/blogs', adminBlogRoutes);
    app.use('/admin/media', adminMediaRoutes);
    app.use('/admin/sliders', adminSliderRoutes);
}

module.exports = { loadRoutes };
