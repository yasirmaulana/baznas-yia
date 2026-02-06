const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const NotificationTemplate = sequelize.define('NotificationTemplate', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    code: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true, // e.g. DONATION_CREATED, DONATION_CONFIRMED
        comment: 'Unique code to identify event'
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    messageTemplate: {
        type: DataTypes.TEXT,
        allowNull: false,
        comment: 'Supports variables like {{name}}, {{amount}}'
    },
    isActive: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    }
});

module.exports = NotificationTemplate;
