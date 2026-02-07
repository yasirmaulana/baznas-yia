import sequelize from '../config/database.js';

async function showCreate() {
    try {
        const [results] = await sequelize.query('SHOW CREATE TABLE Users');
        console.log(results[0]['Create Table']);
        process.exit(0);
    } catch (error) {
        console.error('Error showing create table:', error);
        process.exit(1);
    }
}

showCreate();
