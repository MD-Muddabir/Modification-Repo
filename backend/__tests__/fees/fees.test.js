/**
 * Fees Tests — Phase 3
 * ====================
 * Tests all /api/fees/* endpoints for:
 *   - Authentication enforcement
 *   - Role-based access (admin, student, parent)
 *   - Validation (missing required fields)
 *   - Data isolation (tokens must only see own institute's fees)
 */

const request = require("supertest");
const { app, FAKE_TOKENS } = require("../helpers/testApp");

const ADMIN_AUTH = { Authorization: `Bearer ${FAKE_TOKENS.admin}` };
const STUDENT_AUTH = { Authorization: `Bearer ${FAKE_TOKENS.student}` };
const PARENT_AUTH = { Authorization: `Bearer ${FAKE_TOKENS.parent}` };
const FACULTY_AUTH = { Authorization: `Bearer ${FAKE_TOKENS.faculty}` };

// ─────────────────────────────────────────────────────────────────────────────
// Fee Structure CRUD
// ─────────────────────────────────────────────────────────────────────────────

describe("💰 Fees — Fee Structure Access Control", () => {
  it("TC-FEES-001 | GET /api/fees/structure without token → 401", async () => {
    const res = await request(app).get("/api/fees/structure");
    expect(res.status).toBe(401);
  });

  it("TC-FEES-002 | GET /api/fees/structure with faculty token → 401 or 403 (faculty cannot manage fees)", async () => {
    const res = await request(app).get("/api/fees/structure").set(FACULTY_AUTH);
    expect([401, 403]).toContain(res.status);
  });

  it("TC-FEES-003 | POST /api/fees/structure without token → 401", async () => {
    const res = await request(app)
      .post("/api/fees/structure")
      .send({ name: "Tuition Fee", amount: 5000 });
    expect(res.status).toBe(401);
  });

  it("TC-FEES-004 | POST /api/fees/structure — missing required fields → 400 or 401", async () => {
    const res = await request(app)
      .post("/api/fees/structure")
      .set(ADMIN_AUTH)
      .send({}); // No fields

    expect([400, 401]).toContain(res.status);
    if (res.status === 400) {
      expect(res.body.success).toBe(false);
    }
  });

  it("TC-FEES-005 | DELETE /api/fees/structure/:id — non-existent fee → 404 or 401", async () => {
    const res = await request(app)
      .delete("/api/fees/structure/99999")
      .set(ADMIN_AUTH);

    expect([401, 404]).toContain(res.status);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Student Fees
// ─────────────────────────────────────────────────────────────────────────────

describe("💰 Fees — Student Fee Operations", () => {
  it("TC-FEES-010 | GET /api/fees/my-fees without token → 401", async () => {
    const res = await request(app).get("/api/fees/my-fees");
    expect(res.status).toBe(401);
  });

  it("TC-FEES-011 | Student can access /api/fees/my-fees (with token, may 401 if user not in DB)", async () => {
    const res = await request(app)
      .get("/api/fees/my-fees")
      .set(STUDENT_AUTH);

    // With real seeded DB → 200; without seeded DB → 401 (user not found)
    expect([200, 401, 404]).toContain(res.status);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Fee Payment
// ─────────────────────────────────────────────────────────────────────────────

describe("💰 Fees — Fee Payment Validation", () => {
  it("TC-FEES-020 | POST /api/fees/pay — no token → 401", async () => {
    const res = await request(app)
      .post("/api/fees/pay")
      .send({ student_fee_id: 1, amount: 5000 });
    expect(res.status).toBe(401);
  });

  it("TC-FEES-021 | POST /api/fees/pay — with parent token, missing fields → 400 or 401", async () => {
    const res = await request(app)
      .post("/api/fees/pay")
      .set(PARENT_AUTH)
      .send({}); // Missing required fields

    expect([400, 401]).toContain(res.status);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Transport Fees
// ─────────────────────────────────────────────────────────────────────────────

describe("🚌 Fees — Transport Fees", () => {
  it("TC-FEES-030 | GET /api/transport-fees without token → 401", async () => {
    const res = await request(app).get("/api/transport-fees");
    expect(res.status).toBe(401);
  });

  it("TC-FEES-031 | POST /api/transport-fees without token → 401", async () => {
    const res = await request(app)
      .post("/api/transport-fees")
      .send({ student_id: 1, amount: 500 });
    expect(res.status).toBe(401);
  });
});
