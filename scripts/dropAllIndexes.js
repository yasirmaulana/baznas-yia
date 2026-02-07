import sequelize from '../config/database.js';

async function dropAllIndexes() {
    try {
        const [results] = await sequelize.query('SHOW INDEX FROM Users');
        const indexesToDrop = results
            .filter(index => index.Key_name !== 'PRIMARY')
            .map(index => index.Key_name);

        // Use a Set to get unique index names
        const uniqueIndexes = [...new Set(indexesToDrop)];

        console.log(`Found ${uniqueIndexes.length} indexes to drop.`);

        for (const indexName of uniqueIndexes) {
            console.log(`Dropping index: ${indexName}`);
            await sequelize.query(`ALTER TABLE Users DROP INDEX ${indexName}`);
        }

        console.log('Finished dropping all indexes.');
        process.exit(0);
    } catch (error) {
        console.error('Error dropping indexes:', error);
        process.exit(1);
    }
}

dropAllIndexes();
