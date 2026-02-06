const Job = require('../models/Job');
const NotificationTemplate = require('../models/NotificationTemplate');
const WhatsappSession = require('../models/WhatsappSession');

async function sendNotification(eventCode, recipientNumber, variables) {
    try {
        console.log(`Attempting to send notification ${eventCode} to ${recipientNumber}`);

        // 1. Find Active Template
        const template = await NotificationTemplate.findOne({
            where: { code: eventCode, isActive: true }
        });

        if (!template) {
            console.log(`No active template for ${eventCode}`);
            return false;
        }

        // 2. Find Active WhatsApp Session
        const session = await WhatsappSession.findOne({
            where: { status: 'connected' }
        });

        if (!session) {
            console.log('No active WhatsApp session found to send notification');
            return false;
        }

        // 3. Replace Variables
        let message = template.messageTemplate;
        for (const [key, value] of Object.entries(variables)) {
            const regex = new RegExp(`{{${key}}}`, 'g');
            message = message.replace(regex, value);
        }

        // 4. Format Number (081 -> 628)
        let cleanNumber = recipientNumber.replace(/\D/g, '');
        if (cleanNumber.startsWith('0')) {
            cleanNumber = '62' + cleanNumber.substring(1);
        }

        // 5. Create Job
        await Job.create({
            type: 'broadcast_whatsapp',
            payload: {
                sessionName: session.sessionName,
                target: cleanNumber,
                message: message
            }
        });

        console.log('Notification job created successfully');
        return true;

    } catch (error) {
        console.error('Error sending notification:', error);
        return false;
    }
}

module.exports = sendNotification;
