/**
 * Database Configuration
 * Sequelize instance for PostgreSQL (Neon) connection
 * Uses environment variables for flexibility across environments
 */

const { Sequelize } = require("sequelize");
require("dotenv").config();

const dbUrl = process.env.DATABASE_URL;

if (!dbUrl) {
    console.error("❌ DATABASE_URL is missing in environment variables.");
    process.exit(1);
}

const isLocal = dbUrl.includes("localhost") || dbUrl.includes("127.0.0.1");

console.log(`🗄️  Connecting to DB via PostgreSQL...`);
console.log(`🔒  SSL: ${isLocal ? "disabled (localhost)" : "enabled"}`);

// Initialize Sequelize with environment variables
const sequelize = new Sequelize(dbUrl, {
    dialect: "postgres",

    // Only log slow queries in development
    logging: process.env.NODE_ENV === "development"
        ? (sql, timing) => {
            if (timing && timing > 500) {
                console.warn(`🐌 SLOW QUERY (${timing}ms):`, sql.substring(0, 200));
            }
        }
        : false,
    benchmark: process.env.NODE_ENV === "development",

    // Optimized Connection Pooling
    pool: {
        max: 10,
        min: 2,
        acquire: 30000,
        idle: 10000,
    },

    // SSL Configuration for Neon
    dialectOptions: {
        connectTimeout: 60000,
        ...(isLocal ? {} : {
            ssl: {
                require: true,
                rejectUnauthorized: false,
            }
        })
    },

    define: {
        timestamps: true,
        underscored: true,
        paranoid: false,
    },
});

// Connection health check on startup
sequelize.authenticate()
    .then(() => console.log("✅ PostgreSQL DB Pool Ready"))
    .catch(err => console.error("❌ DB Pool Failed:", err.message));

module.exports = sequelize;
