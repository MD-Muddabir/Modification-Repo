const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const ClassSession = sequelize.define("ClassSession", {
    institute_id: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    class_id: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    faculty_id: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    session_token: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
    },
    start_time: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
    },
    end_time: {
        type: DataTypes.DATE,
        allowNull: true
    },
    is_active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    },
    expires_at: {
        type: DataTypes.DATE,
        allowNull: false
    }
}, {
    tableName: 'class_sessions',
    timestamps: true
});

module.exports = ClassSession;
