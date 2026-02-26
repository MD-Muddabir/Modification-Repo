/**
 * fix-indexes.js — One-time database index cleanup
 * Drops duplicate indexes that accumulated due to repeated alter:true syncs.
 *
 * Run: node scripts/fix-indexes.js
 */

require("dotenv").config();
const { Sequelize } = require("sequelize");

const DB_NAME = process.env.DB_NAME || "student_saas";
const DB_USER = process.env.DB_USER || "root";
const DB_PASS = process.env.DB_PASSWORD || "tiger";
const DB_HOST = process.env.DB_HOST || "localhost";
const DB_PORT = process.env.DB_PORT || 3306;

const sequelize = new Sequelize(DB_NAME, DB_USER, DB_PASS, {
    host: DB_HOST,
    port: DB_PORT,
    dialect: "mysql",
    logging: false,
});

async function fixIndexes() {
    try {
        await sequelize.authenticate();
        console.log("✅ Connected to database:", DB_NAME);

        // Get all tables
        const [tables] = await sequelize.query(
            `SELECT TABLE_NAME FROM information_schema.TABLES WHERE TABLE_SCHEMA = '${DB_NAME}' AND TABLE_TYPE = 'BASE TABLE'`
        );

        console.log(`\n📋 Found ${tables.length} tables. Checking indexes...\n`);

        let totalDropped = 0;

        for (const row of tables) {
            const tableName = row.TABLE_NAME;

            // Get all index rows for this table
            const [indexRows] = await sequelize.query(
                `SELECT INDEX_NAME, NON_UNIQUE, SEQ_IN_INDEX, COLUMN_NAME 
                 FROM information_schema.STATISTICS 
                 WHERE TABLE_SCHEMA = '${DB_NAME}' AND TABLE_NAME = '${tableName}'
                 ORDER BY INDEX_NAME, SEQ_IN_INDEX`
            );

            if (!indexRows || indexRows.length === 0) continue;

            // Group into map: indexName -> { unique, columns[] }
            const indexMap = {};
            for (const idx of indexRows) {
                if (!indexMap[idx.INDEX_NAME]) {
                    indexMap[idx.INDEX_NAME] = {
                        name: idx.INDEX_NAME,
                        unique: idx.NON_UNIQUE === 0,
                        columns: []
                    };
                }
                indexMap[idx.INDEX_NAME].columns.push(idx.COLUMN_NAME);
            }

            const indexNames = Object.keys(indexMap);
            const totalIndexCount = indexNames.length;

            if (totalIndexCount <= 10) {
                console.log(`✅ ${tableName}: ${totalIndexCount} indexes (OK)`);
                continue;
            }

            console.log(`⚠️  ${tableName}: ${totalIndexCount} indexes — finding duplicates...`);

            // Find duplicates: same column set appearing multiple times
            const seenSignatures = new Map(); // signature -> first index name
            const toDrop = [];

            for (const [name, idx] of Object.entries(indexMap)) {
                if (name === "PRIMARY") continue; // Never drop primary key

                const sig = [...idx.columns].sort().join(",") + "|" + (idx.unique ? "uniq" : "non");

                if (seenSignatures.has(sig)) {
                    // This is a duplicate — drop it
                    toDrop.push(name);
                    console.log(`   🔍 Duplicate of '${seenSignatures.get(sig)}': ${name} (${sig})`);
                } else {
                    seenSignatures.set(sig, name);
                }
            }

            if (toDrop.length === 0) {
                console.log(`   All ${totalIndexCount} indexes are unique (no duplicates)`);
                continue;
            }

            console.log(`   🗑️  Dropping ${toDrop.length} duplicate indexes...`);
            for (const idxName of toDrop) {
                try {
                    await sequelize.query(`ALTER TABLE \`${tableName}\` DROP INDEX \`${idxName}\``);
                    console.log(`   ✓ Dropped: ${idxName}`);
                    totalDropped++;
                } catch (err) {
                    console.warn(`   ⚠️  Could not drop ${idxName}: ${err.message}`);
                }
            }

            // Report new count
            const [afterRows] = await sequelize.query(
                `SELECT COUNT(DISTINCT INDEX_NAME) as cnt FROM information_schema.STATISTICS 
                 WHERE TABLE_SCHEMA = '${DB_NAME}' AND TABLE_NAME = '${tableName}'`
            );
            console.log(`   ✅ ${tableName} now has ${afterRows[0].cnt} indexes\n`);
        }

        console.log("─".repeat(50));
        console.log(`\n🎉 Done! Dropped ${totalDropped} duplicate indexes total.`);
        if (totalDropped > 0) {
            console.log("🔄 Please restart the backend server now.");
        }
        console.log();

    } catch (error) {
        console.error("❌ Script error:", error.message);
        if (error.original) console.error("   MySQL:", error.original.message);
    } finally {
        await sequelize.close();
        process.exit(0);
    }
}

fixIndexes();
