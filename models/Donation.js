import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';
import Campaign from './Campaign.js';
import User from './User.js'; // Import User for approver association

const Donation = sequelize.define('Donation', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    donorName: {
        type: DataTypes.STRING,
        allowNull: false
    },
    isAnonymous: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    whatsapp: {
        type: DataTypes.STRING,
        allowNull: false
    },
    email: {
        type: DataTypes.STRING,
        allowNull: true
    },
    amount: {
        type: DataTypes.DECIMAL(15, 2),
        allowNull: false
    },
    uniqueCode: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    totalAmount: {
        type: DataTypes.DECIMAL(15, 2),
        allowNull: false
    },
    pray: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    status: {
        type: DataTypes.INTEGER,
        defaultValue: 1,
        comment: '1: Waiting, 2: Confirmed, 3: Cancelled'
    },
    approvedAt: {
        type: DataTypes.DATE,
        allowNull: true
    },
    fundraiserId: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    donorId: {
        type: DataTypes.INTEGER,
        allowNull: true
    }
});

Donation.belongsTo(Campaign, { foreignKey: 'campaignId', as: 'campaign' });
Campaign.hasMany(Donation, { foreignKey: 'campaignId', as: 'donations' });

// Association for Approver
Donation.belongsTo(User, { foreignKey: 'approvedBy', as: 'approver' });

// Association for Fundraiser
Donation.belongsTo(User, { foreignKey: 'fundraiserId', as: 'fundraiser' });
User.hasMany(Donation, { foreignKey: 'fundraiserId', as: 'referredDonations' });

// Association for Donor
Donation.belongsTo(User, { foreignKey: 'donorId', as: 'donor' });
User.hasMany(Donation, { foreignKey: 'donorId', as: 'donations' });

export default Donation;
