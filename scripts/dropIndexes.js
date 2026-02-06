const sequelize = require('../config/database');

async function dropRedundantIndexes() {
    try {
        const [results] = await sequelize.query('SHOW INDEX FROM Users');
        const redundantIndexes = results
            .filter(index => index.Key_name.startsWith('email_'))
            .map(index => index.Key_name);

        console.log(`Found ${redundantIndexes.length} redundant indexes.`);

        for (const indexName of redundantIndexes) {
            console.log(`Dropping index: ${indexName}`);
            await sequelize.query(`ALTER TABLE Users DROP INDEX ${indexName}`);
        }

        console.log('Finished dropping redundant indexes.');
        process.exit(0);
    } catch (error) {
        console.error('Error dropping indexes:', error);
        process.exit(1);
    }
}

dropRedundantIndexes();
