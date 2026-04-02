/**
 * Database Configuration
 * Sequelize instance for MySQL connection
 * Uses environment variables for flexibility across environments
 */

const { Sequelize } = require("sequelize");
require("dotenv").config();

// Initialize Sequelize with environment variables
const sequelize = new Sequelize(
    process.env.DB_NAME || "railway",          // ✅ change default
    process.env.DB_USER || "root",
    process.env.DB_PASSWORD,
    {
        host: process.env.DB_HOST,              // ❌ no localhost fallback
        port: process.env.DB_PORT || 3306,
        dialect: "mysql",
        logging: false,
        pool: {
            max: 10,
            min: 0,
            acquire: 30000,
            idle: 10000,
        },
        define: {
            timestamps: true, // Automatically add created_at and updated_at
            underscored: true, // Use snake_case to match database columns
        },
    }
);

module.exports = sequelize;
