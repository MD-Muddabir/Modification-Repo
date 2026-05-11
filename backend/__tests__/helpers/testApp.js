/**
 * Test Application Factory
 * =========================
 * Returns the Express `app` with the test environment loaded.
 *
 * WHY a factory instead of importing app directly?
 *   - `app.js` calls `syncDatabase()` on load which spins up cron jobs,
 *     seeder calls, and DB migrations — too heavy for unit/integration tests.
 *   - This factory imports app AFTER dotenv has loaded `.env.test` so all
 *     environment variables are correct.
 *   - It also provides `getSequelize()` so individual tests can clean up data.
 */

const path = require("path");

// Load test env FIRST — before any backend module is required
require("dotenv").config({ path: path.resolve(__dirname, "../../.env.test") });

// Now safe to import the Express app
const app = require("../../app");

/**
 * Get the Sequelize instance for DB operations in tests.
 * @returns {import('sequelize').Sequelize}
 */
function getSequelize() {
  return require("../../models").sequelize;
}

/**
 * Generate a JWT token for a test user (bypasses login flow).
 * Use this to seed an authenticated state quickly.
 */
function generateTestToken(payload) {
  const jwt = require("jsonwebtoken");
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "1h" });
}

/**
 * Pre-built tokens for common roles used across tests.
 * These use fake user IDs — they should only be used for middleware/auth tests,
 * not for tests that need real DB users.
 */
const FAKE_TOKENS = {
  superAdmin: generateTestToken({ id: 9999, role: "super_admin", institute_id: null }),
  admin: generateTestToken({ id: 1001, role: "admin", institute_id: 1 }),
  faculty: generateTestToken({ id: 1002, role: "faculty", institute_id: 1 }),
  student: generateTestToken({ id: 1003, role: "student", institute_id: 1 }),
  parent: generateTestToken({ id: 1004, role: "parent", institute_id: 1 }),
  manager: generateTestToken({ id: 1005, role: "manager", institute_id: 1 }),
};

module.exports = { app, getSequelize, generateTestToken, FAKE_TOKENS };
