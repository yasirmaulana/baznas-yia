import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';
import User from './User.js';

const Post = sequelize.define('Post', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    title: {
        type: DataTypes.STRING,
        allowNull: false
    },
    slug: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
    },
    image: {
        type: DataTypes.STRING,
        allowNull: true
    },
    content: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    isPublished: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    }
});

Post.belongsTo(User, { foreignKey: 'createdBy', as: 'author' });

export default Post;
