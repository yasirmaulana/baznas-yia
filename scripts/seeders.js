import User from '../models/User.js';
import NotificationTemplate from '../models/NotificationTemplate.js';

/**
 * Seed initial administrative data and notification templates
 */
export async function runSeeders() {
    try {
        // Seed Admin User if none exists
        const adminCount = await User.count();
        if (adminCount === 0) {
            await User.create({
                email: 'admin@amalan.com',
                password: 'admin', // Will be hashed by hook
                isActive: true,
                role: 'admin'
            });
            console.log('Default admin created: admin@amalan.com / admin. Login at /login');
        }

        // Seed Notifications if empty
        const tplCount = await NotificationTemplate.count();
        if (tplCount === 0) {
            await NotificationTemplate.bulkCreate([
                {
                    code: 'DONATION_CREATED',
                    name: 'New Donation Pending',
                    messageTemplate: 'Assalamu alaikum {{name}}, terima kasih atas sedekah Anda sebesar {{amount}} untuk campaign {{campaign}}. Mohon transfer ke {{bank}} {{accountNumber}} ({{accountName}}). Jazakumullah khairan katsiran.',
                    isActive: true
                },
                {
                    code: 'DONATION_CONFIRMED',
                    name: 'Donation Confirmed',
                    messageTemplate: 'Alhamdulillah {{name}}, donasi Anda sebesar {{amount}} telah kami terima. Semoga menjadi amal jariyah yang tak terputus. Aamiin.',
                    isActive: true
                }
            ]);
            console.log('Seeded default notification templates');
        }
    } catch (error) {
        console.error('Seeding error:', error);
    }
}
