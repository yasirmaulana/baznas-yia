import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

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

export default WhatsappSession;
