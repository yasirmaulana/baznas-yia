import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';
import bcrypt from 'bcryptjs';
import slugify from 'slugify';

const User = sequelize.define('User', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        validate: {
            isEmail: true
        }
    },
    name: {
        type: DataTypes.STRING,
        allowNull: true
    },
    phone: {
        type: DataTypes.STRING,
        allowNull: true
    },
    password: {
        type: DataTypes.STRING,
        allowNull: false
    },
    isActive: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    },
    role: {
        type: DataTypes.ENUM('admin', 'member'),
        defaultValue: 'member'
    },
    username: {
        type: DataTypes.STRING,
        allowNull: true,
        unique: true
    }
}, {
    hooks: {
        beforeCreate: async (user) => {
            if (user.password) {
                user.password = await bcrypt.hash(user.password, 10);
            }
            if (user.name && !user.username) {
                let baseUsername = slugify(user.name, { lower: true, strict: true, replacement: '' });
                let username = baseUsername;
                let exists = await user.constructor.findOne({ where: { username } });

                while (exists) {
                    const random = Math.floor(Math.random() * 99);
                    username = `${baseUsername}${random}`;
                    exists = await user.constructor.findOne({ where: { username } });
                }
                user.username = username;
            }
        },
        beforeUpdate: async (user) => {
            if (user.changed('password')) {
                user.password = await bcrypt.hash(user.password, 10);
            }
        }
    }
});

User.prototype.validPassword = async function (password) {
    return await bcrypt.compare(password, this.password);
};

export default User;
