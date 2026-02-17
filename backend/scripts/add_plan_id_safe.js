const { Sequelize, DataTypes } = require("sequelize");
require("dotenv").config({ path: "../.env" });

const sequelize = require("../config/database");

const addPlanIdColumn = async () => {
    try {
        await sequelize.authenticate();
        console.log("✅ Database connection established.");

        const queryInterface = sequelize.getQueryInterface();
        const tableInfo = await queryInterface.describeTable("Institutes");

        if (!tableInfo.plan_id) {
            console.log("⚠️ 'plan_id' column missing in Institutes table. Adding now...");
            await queryInterface.addColumn("Institutes", "plan_id", {
                type: DataTypes.INTEGER,
                allowNull: true,
            });
            console.log("✅ 'plan_id' column added successfully.");
        } else {
            console.log("ℹ️ 'plan_id' column already exists.");
        }

    } catch (error) {
        console.error("❌ Error modifying table:", error);
    } finally {
        await sequelize.close();
    }
};

addPlanIdColumn();
