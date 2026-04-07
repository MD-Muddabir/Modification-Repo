const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Announcement = sequelize.define("Announcement", {
    institute_id: DataTypes.INTEGER,
    title: DataTypes.STRING,
    content: DataTypes.TEXT,
    target_audience: {
        type: DataTypes.STRING(20),
        validate: { isIn: [['all', 'students', 'faculty']] }
    },
    priority: {
        type: DataTypes.STRING(20),
        validate: { isIn: [['normal', 'high', 'urgent']] }
    },
    created_by: DataTypes.INTEGER,
    subject_id: DataTypes.INTEGER, // added subject field
});

module.exports = Announcement;
