import sequelize from '../config/database.js';

async function checkIndexes() {
    try {
        const [results] = await sequelize.query('SHOW INDEX FROM Posts');
        console.log('Total indexes:', results.length);
        results.forEach(index => {
            console.log(`- ${index.Key_name} on ${index.Column_name} (Unique: ${index.Non_unique === 0})`);
        });
        process.exit(0);
    } catch (error) {
        console.error('Error checking indexes:', error);
        process.exit(1);
    }
}

checkIndexes();
