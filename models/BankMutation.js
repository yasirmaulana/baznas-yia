import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';
import BankAccount from './BankAccount.js';

const BankMutation = sequelize.define('BankMutation', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    transactionId: {
        type: DataTypes.STRING,
        allowNull: true,
        unique: true
    },
    date: {
        type: DataTypes.DATE,
        allowNull: false
    },
    description: {
        type: DataTypes.STRING,
        allowNull: false
    },
    amount: {
        type: DataTypes.DECIMAL(15, 2),
        allowNull: false
    },
    type: {
        type: DataTypes.STRING(10), // CR (Credit) or DB (Debit)
        allowNull: false
    },
    balance: {
        type: DataTypes.DECIMAL(15, 2),
        allowNull: true
    },
    rawPayload: {
        type: DataTypes.TEXT, // Store full JSON just in case
        allowNull: true
    }
});

// Link to our local BankAccount if possible (by account number matching)
BankMutation.belongsTo(BankAccount, { foreignKey: 'bankAccountId', as: 'bankAccount' });

export default BankMutation;
