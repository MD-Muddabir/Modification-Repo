const { sequelize } = require("../models");

async function fixEnums() {
    try {
        console.log("Connecting to database...");
        await sequelize.authenticate();
        console.log("Connected.");

        // Fix Institute Status Enum
        console.log("Updating Institutes table status column...");
        try {
            // Attempt plural
            await sequelize.query(`
                ALTER TABLE Institutes 
                MODIFY COLUMN status ENUM('active', 'expired', 'suspended', 'pending') DEFAULT 'active'
            `);
            console.log("Institutes table updated successfully.");
        } catch (e) {
            console.log("Could not update 'Institutes' table (Plural).Trying singular...", e.message);
            try {
                // Attempt singular
                await sequelize.query(`
                    ALTER TABLE Institute 
                    MODIFY COLUMN status ENUM('active', 'expired', 'suspended', 'pending') DEFAULT 'active'
                `);
                console.log("Institute table updated successfully (Singular).");
            } catch (e2) {
                console.error("Failed to update Institute table:", e2.message);
            }
        }

        // Fix Subscription Payment Status Enum
        console.log("Updating Subscriptions table payment_status column...");
        try {
            // Attempt plural
            await sequelize.query(`
                ALTER TABLE Subscriptions 
                MODIFY COLUMN payment_status ENUM('paid', 'unpaid', 'failed', 'pending') DEFAULT 'unpaid'
            `);
            console.log("Subscriptions table updated successfully.");
        } catch (e) {
            console.log("Could not update 'Subscriptions' table (Plural). Trying singular...", e.message);
            try {
                // Attempt singular
                await sequelize.query(`
                    ALTER TABLE Subscription 
                    MODIFY COLUMN payment_status ENUM('paid', 'unpaid', 'failed', 'pending') DEFAULT 'unpaid'
                `);
                console.log("Subscription table updated successfully (Singular).");
            } catch (e2) {
                console.error("Failed to update Subscription table:", e2.message);
            }
        }

        console.log("Schema update complete.");
        process.exit(0);

    } catch (error) {
        console.error("Fatal error connecting to database:", error);
        process.exit(1);
    }
}

fixEnums();
