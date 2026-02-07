const pg = require('pg');
const { Sequelize } = require('sequelize');
require('dotenv').config();

// PostgreSQL connection using DATABASE_URL
const sequelize = new Sequelize(process.env.DATABASE_URL, {
    dialect: 'postgres',
    dialectModule: pg,
    protocol: 'postgres',
    dialectOptions: {
        ssl: {
            require: true,
            rejectUnauthorized: false
        }
    },
    logging: false
});

module.exports = sequelize;
