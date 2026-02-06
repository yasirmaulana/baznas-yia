const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const WhatsappSession = sequelize.define('WhatsappSession', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    sessionName: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
    },
    phoneNumber: {
        type: DataTypes.STRING,
        allowNull: true
    },
    status: {
        type: DataTypes.STRING,
        defaultValue: 'disconnected' // disconnected, scanning, connected
    }
});

module.exports = WhatsappSession;
