import User from '../models/User.js';
import slugify from 'slugify';

async function populateUsernames() {
    try {
        const users = await User.findAll({
            where: { username: null }
        });

        console.log(`Found ${users.length} users without usernames.`);

        for (const user of users) {
            if (user.name) {
                let baseUsername = slugify(user.name, { lower: true, strict: true, replacement: '' });
                let username = baseUsername;
                let exists = await User.findOne({ where: { username } });

                while (exists) {
                    const random = Math.floor(Math.random() * 99);
                    username = `${baseUsername}${random}`;
                    exists = await User.findOne({ where: { username } });
                }

                user.username = username;
                await user.save();
                console.log(`Updated user ${user.id}: ${user.name} -> ${user.username}`);
            }
        }

        console.log('Finished populating usernames.');
        process.exit(0);
    } catch (error) {
        console.error('Error populating usernames:', error);
        process.exit(1);
    }
}

populateUsernames();
