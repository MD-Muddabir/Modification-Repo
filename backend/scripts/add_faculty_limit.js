const { Sequelize, DataTypes } = require("sequelize");
require("dotenv").config({ path: "../.env" });
const sequelize = require("../config/database");

const addFacultyLimit = async () => {
    try {
        await sequelize.authenticate();
        console.log("✅ Database connection established.");

        const queryInterface = sequelize.getQueryInterface();
        const tableInfo = await queryInterface.describeTable("Plans");

        if (!tableInfo.faculty_limit) {
            console.log("⚠️ 'faculty_limit' column missing in Plans table. Adding now...");
            await queryInterface.addColumn("Plans", "faculty_limit", {
                type: DataTypes.INTEGER,
                allowNull: true,
                defaultValue: 10,  // Default limit for existing plans
            });
            console.log("✅ 'faculty_limit' column added successfully.");
        } else {
            console.log("ℹ️ 'faculty_limit' column already exists.");
        }
    } catch (error) {
        console.error("❌ Error adding column:", error);
    } finally {
        await sequelize.close();
    }
};

addFacultyLimit();
