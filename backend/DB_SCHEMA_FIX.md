# Database Error Fix: "Too many keys specified"

**Issue:**
When checking for new database schema updates using `sequelize.sync({ alter: true })`, the following error occurred:
`[0] ❌ Database error: Too many keys specified; max 64 keys allowed`
`[0] Please ensure MySQL is running and database 'student_saas' exists`

This is caused by Sequelize attempting to re-add too many indexes during the schema synchronization process, exceeding MySQL's limit of 64 keys per table.

**Solution Applied:**
1.  **Revert Sequelize Sync Config**: Changed `backend/app.js` to disable automatic schema alteration:
    ```javascript
    // backend/app.js:182
    await sequelize.sync({ alter: false });
    ```
2.  **Manual Schema Update**: Created and ran a custom migration script (`backend/scripts/fix_db_enums.js`) to directly update the database with the required changes for `pending` status without triggering automatic index creation.
    - Updated `Institutes` table: Added `pending` to `status` ENUM.
    - Updated `Subscriptions` table: Added `pending` to `payment_status` ENUM.

**Result:**
The database schema is now updated correctly without errors, and the server can restart safely.

**Next Steps:**
- Avoid using `alter: true` in production or large development databases.
- Use Sequelize Migrations for future schema changes.
