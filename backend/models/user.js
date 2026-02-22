const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const User = sequelize.define("User", {
    institute_id: DataTypes.INTEGER,
    role: DataTypes.ENUM("super_admin", "admin", "faculty", "student", "parent"),
    name: DataTypes.STRING,
    email: { type: DataTypes.STRING, unique: 'unique_user_email' },
    phone: DataTypes.STRING,
    password_hash: DataTypes.STRING,
    status: DataTypes.ENUM("active", "blocked"),

});

module.exports = User;
