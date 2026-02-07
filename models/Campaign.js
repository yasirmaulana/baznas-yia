import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';
import BankAccount from './BankAccount.js';

const Campaign = sequelize.define('Campaign', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    title: {
        type: DataTypes.STRING,
        allowNull: false
    },
    image: {
        type: DataTypes.STRING,
        allowNull: true // Optional, but usually required for campaigns
    },
    detail: {
        type: DataTypes.TEXT, // Long text for WYSIWYG content
        allowNull: true
    },
    targetAmount: {
        type: DataTypes.DECIMAL(15, 2), // Supports large rupiah amounts
        allowNull: false,
        defaultValue: 0
    },
    startDate: {
        type: DataTypes.DATEONLY,
        allowNull: false
    },
    endDate: {
        type: DataTypes.DATEONLY,
        allowNull: false
    },
    isActive: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    }
});

// Define Association
Campaign.belongsTo(BankAccount, { foreignKey: 'bankAccountId', as: 'bankAccount' });
BankAccount.hasMany(Campaign, { foreignKey: 'bankAccountId' });

export default Campaign;
