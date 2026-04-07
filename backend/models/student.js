const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Student = sequelize.define("Student", {
    institute_id: DataTypes.INTEGER,
    user_id: DataTypes.INTEGER,
    roll_number: DataTypes.STRING,
    class_id: DataTypes.INTEGER,
    admission_date: DataTypes.DATEONLY,
    leave_date: DataTypes.DATEONLY,
    date_of_birth: DataTypes.DATEONLY,

    gender: {
        type: DataTypes.STRING(20),
        validate: { isIn: [["male", "female", "other"]] }
    },
    address: DataTypes.TEXT,
    is_full_course: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
}, {
    tableName: 'students'

});

module.exports = Student;
