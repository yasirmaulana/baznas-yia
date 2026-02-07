import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Job = sequelize.define('Job', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    type: {
        type: DataTypes.STRING,
        allowNull: false, // e.g., 'broadcast_whatsapp'
    },
    payload: {
        type: DataTypes.JSON,
        allowNull: false // e.g. { sessionId, target, message }
    },
    status: {
        type: DataTypes.STRING,
        defaultValue: 'pending', // pending, processing, completed, failed
    },
    result: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    attempts: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    }
});

export default Job;
