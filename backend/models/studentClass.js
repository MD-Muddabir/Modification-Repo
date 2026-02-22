const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const StudentClass = sequelize.define("StudentClass", {
    student_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    class_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    institute_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
    }
}, {
    tableName: 'student_classes',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
});

module.exports = StudentClass;
