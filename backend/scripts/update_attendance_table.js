/**
 * Database Migration Script
 * Adds 'late' status and 'remarks' field to Attendance table
 */

const sequelize = require("../config/database");

async function updateAttendanceTable() {
    try {
        console.log("Starting attendance table update...");

        // Add 'late' to status enum
        await sequelize.query(`
            ALTER TABLE Attendances 
            MODIFY COLUMN status ENUM('present', 'absent', 'late') NOT NULL;
        `);
        console.log("✓ Added 'late' status to enum");

        // Add remarks column if it doesn't exist
        await sequelize.query(`
            ALTER TABLE Attendances 
            ADD COLUMN IF NOT EXISTS remarks TEXT;
        `);
        console.log("✓ Added 'remarks' column");

        console.log("\n✅ Attendance table updated successfully!");
        console.log("\nNew features:");
        console.log("- Status can now be: present, absent, or late");
        console.log("- Remarks field added for notes");

    } catch (error) {
        if (error.message.includes("Duplicate column name")) {
            console.log("⚠️  Column already exists, skipping...");
        } else {
            console.error("❌ Error updating attendance table:", error.message);
        }
    } finally {
        await sequelize.close();
    }
}

updateAttendanceTable();
