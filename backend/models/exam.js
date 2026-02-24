const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Exam = sequelize.define("Exam", {
    institute_id: DataTypes.INTEGER,
    class_id: DataTypes.INTEGER,
    subject_id: DataTypes.INTEGER,
    name: DataTypes.STRING,
    exam_date: DataTypes.DATEONLY,
    total_marks: DataTypes.DECIMAL(5, 2),
    passing_marks: DataTypes.DECIMAL(5, 2),
});

module.exports = Exam;
