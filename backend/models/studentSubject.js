const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const StudentSubject = sequelize.define("StudentSubject", {
    student_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    subject_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    institute_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
    }
}, {
    tableName: 'student_subjects',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
});

module.exports = StudentSubject;
