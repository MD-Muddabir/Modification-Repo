require('dotenv').config();
const { Sequelize } = require('sequelize');

const sequelize = new Sequelize(
    process.env.DB_NAME || 'student_saas',
    process.env.DB_USER || 'root',
    process.env.DB_PASSWORD || 'tiger',
    { host: process.env.DB_HOST || 'localhost', dialect: 'mysql', logging: false }
);

async function migrate() {
    try {
        await sequelize.authenticate();
        console.log('✅ Connected to DB');
        try {
            await sequelize.query("ALTER TABLE Users ADD COLUMN theme_dark TINYINT(1) NOT NULL DEFAULT 0");
            console.log('✅ Added theme_dark column');
        } catch (e) { console.log('ℹ️  theme_dark:', e.message.substring(0, 60)); }
        try {
            await sequelize.query("ALTER TABLE Users ADD COLUMN theme_style ENUM('simple','pro') NOT NULL DEFAULT 'simple'");
            console.log('✅ Added theme_style column');
        } catch (e) { console.log('ℹ️  theme_style:', e.message.substring(0, 60)); }
        console.log('✅ Migration complete!');
    } catch (e) {
        console.error('❌ DB error:', e.message);
    }
    process.exit(0);
}
migrate();
