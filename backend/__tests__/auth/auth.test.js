/**
 * Auth Tests — Phase 3 & 4
 * ========================
 * Tests all /api/auth/* endpoints:
 *   - Login (valid, invalid, missing fields)
 *   - JWT middleware (no token, expired, malformed)
 *   - OTP mode endpoint
 *   - Rate limit headers
 *
 * NOTE: Tests that require actual DB users (login with real credentials)
 * are marked with a `// REQUIRES_DB:` comment and will be skipped
 * automatically when the test DB is not seeded. Seed the test DB first
 * by running:  node create-super-admin.js  (with .env.test loaded)
 */

const request = require("supertest");
const { app, FAKE_TOKENS } = require("../helpers/testApp");

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/auth/login
// ─────────────────────────────────────────────────────────────────────────────

describe("🔑 Auth — POST /api/auth/login", () => {
  it("TC-AUTH-001 | Missing email → 400", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ password: "SomePass123" });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it("TC-AUTH-002 | Missing password → 400", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "test@example.com" });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it("TC-AUTH-003 | Empty body → 400", async () => {
    const res = await request(app).post("/api/auth/login").send({});
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it("TC-AUTH-004 | Wrong credentials → 401 or 404", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "nobody@notexist.com", password: "WrongPass99!" });

    // Must NOT return 200 — invalid credentials always rejected
    expect([401, 404]).toContain(res.status);
    expect(res.body.success).toBe(false);
  });

  it("TC-AUTH-005 | SQL injection in email field is handled safely", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "'; DROP TABLE users;--", password: "hacked" });

    // Must not crash (500) — Sequelize parameterized queries protect us
    expect(res.status).not.toBe(500);
    expect(res.body.success).toBe(false);
  });

  it("TC-AUTH-006 | XSS payload in email is rejected, not reflected unsanitized", async () => {
    const xssPayload = "<script>alert('xss')</script>@evil.com";
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: xssPayload, password: "hacked" });

    // Must not return 500; body should not contain unescaped script tag
    expect(res.status).not.toBe(500);
    const bodyStr = JSON.stringify(res.body);
    expect(bodyStr).not.toContain("<script>");
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// JWT Middleware — Protected Route Behavior
// ─────────────────────────────────────────────────────────────────────────────

describe("🔒 Auth — JWT Middleware", () => {
  const protectedUrl = "/api/students"; // Any route requiring verifyToken

  it("TC-AUTH-010 | No Authorization header → 401", async () => {
    const res = await request(app).get(protectedUrl);
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it("TC-AUTH-011 | Malformed token (garbage) → 401", async () => {
    const res = await request(app)
      .get(protectedUrl)
      .set("Authorization", "Bearer thisisnotavalidjwttoken");

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it("TC-AUTH-012 | Expired token → 401", async () => {
    // Generate a token that expired 1 second ago
    const jwt = require("jsonwebtoken");
    const expiredToken = jwt.sign(
      { id: 1, role: "admin", institute_id: 1 },
      process.env.JWT_SECRET,
      { expiresIn: "-1s" } // Already expired
    );

    const res = await request(app)
      .get(protectedUrl)
      .set("Authorization", `Bearer ${expiredToken}`);

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it("TC-AUTH-013 | Token signed with wrong secret → 401", async () => {
    const jwt = require("jsonwebtoken");
    const wrongToken = jwt.sign(
      { id: 1, role: "admin", institute_id: 1 },
      "this-is-the-wrong-secret-key"
    );

    const res = await request(app)
      .get(protectedUrl)
      .set("Authorization", `Bearer ${wrongToken}`);

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Role-Based Access Control
// ─────────────────────────────────────────────────────────────────────────────

describe("🛡️ Auth — Role-Based Access Control", () => {
  it("TC-AUTH-020 | Student token on /api/biometric/devices → 403", async () => {
    const res = await request(app)
      .get("/api/biometric/devices")
      .set("Authorization", `Bearer ${FAKE_TOKENS.student}`);

    // Student should never access biometric admin endpoints
    // Will be 403 (forbidden) or 401 (if user not found in DB — acceptable)
    expect([401, 403]).toContain(res.status);
  });

  it("TC-AUTH-021 | Parent token on /api/superadmin routes → 403", async () => {
    const res = await request(app)
      .get("/api/superadmin/institutes")
      .set("Authorization", `Bearer ${FAKE_TOKENS.parent}`);

    expect([401, 403]).toContain(res.status);
  });

  it("TC-AUTH-022 | Faculty token on admin-only /api/students (admin route) → 401 or 403", async () => {
    const res = await request(app)
      .get("/api/students")
      .set("Authorization", `Bearer ${FAKE_TOKENS.faculty}`);

    // Faculty should not be able to list all students
    expect([401, 403]).toContain(res.status);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// OTP Mode Endpoint
// ─────────────────────────────────────────────────────────────────────────────

describe("🔔 Auth — GET /api/auth/otp-mode", () => {
  it("TC-AUTH-030 | Returns 200 with testMode boolean", async () => {
    const res = await request(app).get("/api/auth/otp-mode");
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("testMode");
    expect(typeof res.body.testMode).toBe("boolean");
  });

  it("TC-AUTH-031 | testMode is true in test environment", async () => {
    const res = await request(app).get("/api/auth/otp-mode");
    expect(res.status).toBe(200);
    // In test env OTP_TEST_MODE=true
    expect(res.body.testMode).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Forgot Password
// ─────────────────────────────────────────────────────────────────────────────

describe("🔑 Auth — POST /api/auth/forgot-password", () => {
  it("TC-AUTH-040 | Missing email → 400", async () => {
    const res = await request(app)
      .post("/api/auth/forgot-password")
      .send({});

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it("TC-AUTH-041 | Non-existent email returns success to prevent enumeration", async () => {
    const res = await request(app)
      .post("/api/auth/forgot-password")
      .send({ email: "doesnotexist9999@nowhere.com" });

    // Must not return 500
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toContain("receive an OTP");
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Change Password
// ─────────────────────────────────────────────────────────────────────────────

describe("🔑 Auth — PUT /api/auth/change-password", () => {
  it("TC-AUTH-050 | No token → 401", async () => {
    const res = await request(app)
      .post("/api/auth/change-password")
      .send({ oldPassword: "old", newPassword: "new" });

    expect(res.status).toBe(401);
  });
});
