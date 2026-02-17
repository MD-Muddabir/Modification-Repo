const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Attendance = sequelize.define("Attendance", {
    institute_id: DataTypes.INTEGER,
    student_id: DataTypes.INTEGER,
    class_id: DataTypes.INTEGER,
    date: DataTypes.DATEONLY,
    status: DataTypes.ENUM("present", "absent", "late"),
    marked_by: DataTypes.INTEGER,
    remarks: DataTypes.TEXT,
});

module.exports = Attendance;
