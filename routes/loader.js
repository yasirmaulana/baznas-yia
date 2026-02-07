import express from 'express';
import indexRoutes from './index.js';
import authRoutes from './auth.js';
import adminRoutes from './admin.js';
import campaignRoutes from './campaigns.js';
import adminDonationRoutes from './admin_donations.js';
import adminWhatsappRoutes from './admin_whatsapp.js';
import adminNotificationRoutes from './admin_notifications.js';
import adminMutationRoutes from './admin_mutations.js';
import adminBlogRoutes from './admin_blogs.js';
import adminMediaRoutes from './admin_media.js';
import adminSliderRoutes from './admin_sliders.js';
import webhookRoutes from './webhook.js';

/**
 * Load all application routes
 * @param {express.Application} app - Express application instance
 */
export function loadRoutes(app) {
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
