const { Sequelize } = require('sequelize');
require('dotenv').config();

let sequelize;

if (process.env.DATABASE_URL) {
    // PostgreSQL connection (Neon/Production/External)
    sequelize = new Sequelize(process.env.DATABASE_URL, {
        dialect: 'postgres',
        protocol: 'postgres',
        dialectOptions: {
            ssl: {
                require: true,
                rejectUnauthorized: false
            }
        },
        logging: false
    });
} else {
    // MySQL connection for local development fallback
    sequelize = new Sequelize(
        process.env.DB_NAME || 'amalan',
        process.env.DB_USER || 'root',
        process.env.DB_PASS || '',
        {
            host: process.env.DB_HOST || '127.0.0.1',
            dialect: 'mysql',
            logging: false,
        }
    );
}

module.exports = sequelize;

