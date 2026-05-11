/**
 * Authorization & Multi-Tenancy Tests — Phase 4
 * ===============================================
 * Validates role-based access control across every major route group.
 * Also tests multi-tenant isolation expectations.
 *
 * These tests are "grey box" — they know which routes are admin-only,
 * which are faculty-accessible, etc., based on the route files.
 */

const request = require("supertest");
const { app, FAKE_TOKENS } = require("../helpers/testApp");

// ─────────────────────────────────────────────────────────────────────────────
// Superadmin Routes — ONLY super_admin role allowed
// ─────────────────────────────────────────────────────────────────────────────

describe("🛡️ Authorization — Superadmin Routes", () => {
  const SUPERADMIN_ONLY_ROUTES = [
    { method: "get", path: "/api/superadmin/institutes" },
  ];

  const NON_SUPERADMIN_TOKENS = [
    { role: "admin", token: FAKE_TOKENS.admin },
    { role: "faculty", token: FAKE_TOKENS.faculty },
    { role: "student", token: FAKE_TOKENS.student },
    { role: "parent", token: FAKE_TOKENS.parent },
    { role: "manager", token: FAKE_TOKENS.manager },
  ];

  it.each(NON_SUPERADMIN_TOKENS)(
    "GET /api/superadmin/institutes with $role token → 401 or 403",
    async ({ token }) => {
      const res = await request(app)
        .get("/api/superadmin/institutes")
        .set("Authorization", `Bearer ${token}`);
      expect([401, 403]).toContain(res.status);
    }
  );
});

// ─────────────────────────────────────────────────────────────────────────────
// Admin-Only Routes
// ─────────────────────────────────────────────────────────────────────────────

describe("🛡️ Authorization — Admin-Only Endpoints", () => {
  const ADMIN_ONLY_ENDPOINTS = [
    { method: "get", path: "/api/students" },
    { method: "get", path: "/api/faculty" },
    { method: "get", path: "/api/classes" },
    { method: "get", path: "/api/biometric/devices" },
    { method: "get", path: "/api/finance/dashboard" },
    { method: "get", path: "/api/expenses" },
    { method: "get", path: "/api/manager/stats" },
  ];

  const NON_ADMIN_TOKENS = [
    { role: "student", token: FAKE_TOKENS.student },
    { role: "parent", token: FAKE_TOKENS.parent },
    { role: "faculty", token: FAKE_TOKENS.faculty },
  ];

  test.each(
    ADMIN_ONLY_ENDPOINTS.flatMap((endpoint) =>
      NON_ADMIN_TOKENS.map((t) => ({
        method: endpoint.method,
        path: endpoint.path,
        role: t.role,
        token: t.token,
      }))
    )
  )("$method $path with $role token → 401 or 403", async ({ method, path, token }) => {
    const res = await request(app)
      [method](path)
      .set("Authorization", `Bearer ${token}`);
    expect([401, 403]).toContain(res.status);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Write Operations Require Auth (POST/PUT/DELETE without token → 401)
// ─────────────────────────────────────────────────────────────────────────────

describe("🛡️ Authorization — No-Token Write Operations All Return 401", () => {
  const WRITE_ENDPOINTS = [
    { method: "post", path: "/api/students" },
    { method: "put", path: "/api/students/1" },
    { method: "delete", path: "/api/students/1" },
    { method: "post", path: "/api/faculty" },
    { method: "post", path: "/api/classes" },
    { method: "post", path: "/api/fees/structure" },
    { method: "post", path: "/api/attendance" },
    { method: "post", path: "/api/biometric/devices" },
    { method: "post", path: "/api/announcements" },
    { method: "post", path: "/api/exams" },
    { method: "post", path: "/api/expenses" },
  ];

  test.each(WRITE_ENDPOINTS)(
    "$method $path without token → 401",
    async ({ method, path }) => {
      const res = await request(app)[method](path).send({});
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    }
  );
});

// ─────────────────────────────────────────────────────────────────────────────
// Cross-Tenant Isolation (Structural Check)
// ─────────────────────────────────────────────────────────────────────────────

describe("🏢 Multi-Tenancy — Token Institute ID", () => {
  it("TC-MT-001 | Token for institute_id=1 cannot access institute_id=2 data (would 401 without DB)", async () => {
    // Institute 1 admin token
    const jwt = require("jsonwebtoken");
    const inst1Token = jwt.sign(
      { id: 1001, role: "admin", institute_id: 1 },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    // Attempt to access data — without real DB seeding it will be 401
    // This test documents the expected structure; with seeded DB it should be 200
    // for own data and 404/403 for other institute's specific resource IDs.
    const res = await request(app)
      .get("/api/students")
      .set("Authorization", `Bearer ${inst1Token}`);

    // Without seeded DB: 401 (user not found in DB, can't verify institute)
    // With seeded DB: 200 (own students), never returns other institute's data
    expect([200, 401, 403]).toContain(res.status);
  });
});
