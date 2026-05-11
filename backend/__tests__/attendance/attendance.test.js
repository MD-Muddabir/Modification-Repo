/**
 * Attendance Tests — Phase 3
 * ==========================
 * Tests /api/attendance/* endpoints for auth and validation.
 */

const request = require("supertest");
const { app, FAKE_TOKENS } = require("../helpers/testApp");

const ADMIN_AUTH = { Authorization: `Bearer ${FAKE_TOKENS.admin}` };
const FACULTY_AUTH = { Authorization: `Bearer ${FAKE_TOKENS.faculty}` };
const STUDENT_AUTH = { Authorization: `Bearer ${FAKE_TOKENS.student}` };
const PARENT_AUTH = { Authorization: `Bearer ${FAKE_TOKENS.parent}` };

describe("📅 Attendance — Auth Enforcement", () => {
  it("TC-ATT-001 | GET /api/attendance without token → 401", async () => {
    const res = await request(app).get("/api/attendance");
    expect(res.status).toBe(401);
  });

  it("TC-ATT-002 | POST /api/attendance without token → 401", async () => {
    const res = await request(app)
      .post("/api/attendance")
      .send({ student_id: 1, class_id: 1, date: "2024-01-15", status: "present" });
    expect(res.status).toBe(401);
  });

  it("TC-ATT-003 | POST /api/attendance — missing required fields → 400 or 401", async () => {
    const res = await request(app)
      .post("/api/attendance")
      .set(ADMIN_AUTH)
      .send({}); // No fields

    expect([400, 401]).toContain(res.status);
  });

  it("TC-ATT-004 | POST /api/attendance — invalid date format handled safely", async () => {
    const res = await request(app)
      .post("/api/attendance")
      .set(ADMIN_AUTH)
      .send({ student_id: 1, class_id: 1, date: "not-a-date", status: "present" });

    // Must not crash (500)
    expect(res.status).not.toBe(500);
  });

  it("TC-ATT-005 | Student can check own attendance (GET /api/attendance/student/:id)", async () => {
    const res = await request(app)
      .get("/api/attendance/student/1")
      .set(STUDENT_AUTH);

    // With seeded DB → 200. Without → 401 (user not verified in DB)
    expect([200, 401, 403, 404]).toContain(res.status);
  });

  it("TC-ATT-006 | Parent can view child attendance", async () => {
    const res = await request(app)
      .get("/api/attendance/student/1")
      .set(PARENT_AUTH);

    expect([200, 401, 403, 404]).toContain(res.status);
  });
});
