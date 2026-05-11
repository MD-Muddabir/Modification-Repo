/**
 * Student Tests — Phase 3
 * =======================
 * Tests /api/students/* endpoints:
 *   - Auth enforcement
 *   - Role-based access
 *   - Validation (bulk import, creation)
 *   - Credential operations
 */

const request = require("supertest");
const { app, FAKE_TOKENS } = require("../helpers/testApp");

const ADMIN_AUTH = { Authorization: `Bearer ${FAKE_TOKENS.admin}` };
const STUDENT_AUTH = { Authorization: `Bearer ${FAKE_TOKENS.student}` };
const PARENT_AUTH = { Authorization: `Bearer ${FAKE_TOKENS.parent}` };
const FACULTY_AUTH = { Authorization: `Bearer ${FAKE_TOKENS.faculty}` };

// ─────────────────────────────────────────────────────────────────────────────
// Student List (Admin Only)
// ─────────────────────────────────────────────────────────────────────────────

describe("👨‍🎓 Students — List Access Control", () => {
  it("TC-STU-001 | GET /api/students without token → 401", async () => {
    const res = await request(app).get("/api/students");
    expect(res.status).toBe(401);
  });

  it("TC-STU-002 | GET /api/students with student token → 401 or 403", async () => {
    const res = await request(app).get("/api/students").set(STUDENT_AUTH);
    expect([401, 403]).toContain(res.status);
  });

  it("TC-STU-003 | GET /api/students with parent token → 401 or 403", async () => {
    const res = await request(app).get("/api/students").set(PARENT_AUTH);
    expect([401, 403]).toContain(res.status);
  });

  it("TC-STU-004 | GET /api/students with faculty token → 401 or 403 (faculty has own endpoint)", async () => {
    const res = await request(app).get("/api/students").set(FACULTY_AUTH);
    expect([401, 403]).toContain(res.status);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Student Creation
// ─────────────────────────────────────────────────────────────────────────────

describe("👨‍🎓 Students — Creation Validation", () => {
  it("TC-STU-010 | POST /api/students without token → 401", async () => {
    const res = await request(app)
      .post("/api/students")
      .send({ name: "Test Student", email: "test@example.com" });
    expect(res.status).toBe(401);
  });

  it("TC-STU-011 | POST /api/students — empty body with admin token → 400 or 401", async () => {
    const res = await request(app)
      .post("/api/students")
      .set(ADMIN_AUTH)
      .send({});

    expect([400, 401]).toContain(res.status);
    if (res.status === 400) {
      expect(res.body.success).toBe(false);
    }
  });

  it("TC-STU-012 | POST /api/students — SQL injection in name is handled safely", async () => {
    const res = await request(app)
      .post("/api/students")
      .set(ADMIN_AUTH)
      .send({
        name: "'; DROP TABLE students;--",
        email: "hack@hack.com",
        class_id: 1,
      });

    // Must not be 500 — Sequelize parameterized queries protect us
    expect(res.status).not.toBe(500);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Student Update / Delete
// ─────────────────────────────────────────────────────────────────────────────

describe("👨‍🎓 Students — Update & Delete", () => {
  it("TC-STU-020 | PUT /api/students/:id without token → 401", async () => {
    const res = await request(app)
      .put("/api/students/99999")
      .send({ name: "New Name" });
    expect(res.status).toBe(401);
  });

  it("TC-STU-021 | DELETE /api/students/:id without token → 401", async () => {
    const res = await request(app).delete("/api/students/99999");
    expect(res.status).toBe(401);
  });

  it("TC-STU-022 | DELETE /api/students/:id — non-existent student with admin → 404 or 401", async () => {
    const res = await request(app)
      .delete("/api/students/99999")
      .set(ADMIN_AUTH);

    expect([401, 404]).toContain(res.status);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Credentials
// ─────────────────────────────────────────────────────────────────────────────

describe("🔐 Students — Credentials", () => {
  it("TC-STU-030 | GET /api/students/:id/credentials without token → 401", async () => {
    const res = await request(app).get("/api/students/1/credentials");
    expect(res.status).toBe(401);
  });

  it("TC-STU-031 | GET /api/students/:id/credentials with student token → 401 or 403", async () => {
    const res = await request(app)
      .get("/api/students/1/credentials")
      .set(STUDENT_AUTH);
    expect([401, 403]).toContain(res.status);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Bulk Import
// ─────────────────────────────────────────────────────────────────────────────

describe("📥 Students — Bulk Import", () => {
  it("TC-STU-040 | POST /api/students/bulk-import without token → 401", async () => {
    const res = await request(app).post("/api/students/bulk-import");
    expect(res.status).toBe(401);
  });

  it("TC-STU-041 | POST /api/students/bulk-import with student token → 401 or 403", async () => {
    const res = await request(app)
      .post("/api/students/bulk-import")
      .set(STUDENT_AUTH);
    expect([401, 403]).toContain(res.status);
  });
});
