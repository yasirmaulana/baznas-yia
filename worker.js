import Job from './models/Job.js';
import whatsappManager from './lib/whatsapp.js';
import sequelize from './config/database.js';

async function startWorker() {
    console.log('Worker started...');

    // Ensure DB is synced (or at least Job table exists) for the worker context
    // In production, sync should be done once by migration, but here we can wait a bit

    setInterval(async () => {
        try {
            // Find pending job
            const job = await Job.findOne({
                where: { status: 'pending' },
                order: [['createdAt', 'ASC']]
            });

            if (job) {
                console.log(`Processing Job #${job.id} (${job.type})`);

                job.status = 'processing';
                await job.save();

                try {
                    if (job.type === 'broadcast_whatsapp') {
                        const { sessionName, target, message } = job.payload;

                        // Small delay to prevent rate limit if multiple jobs processed fast
                        await new Promise(r => setTimeout(r, 2000));

                        await whatsappManager.sendMessage(sessionName, target, message);

                        job.status = 'completed';
                        job.result = 'Sent successfully';
                    } else {
                        job.status = 'failed';
                        job.result = 'Unknown job type';
                    }
                } catch (error) {
                    console.error(`Job #${job.id} failed:`, error.message);
                    job.status = 'failed';
                    job.result = error.message;
                    job.attempts += 1;

                    // Simple retry logic (optional)
                    if (job.attempts < 3) {
                        job.status = 'pending'; // Retry
                    }
                }

                await job.save();
            }
        } catch (err) {
            console.error('Worker loop error:', err);
        }
    }, 5000); // Poll every 5 seconds
}

export default startWorker;
