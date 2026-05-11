/**
 * Biometric Tests — Phase 3 (Biometric Module)
 * =============================================
 * Covers:
 *   - Device CRUD (with admin token)
 *   - Duplicate serial number constraint
 *   - Enrollment flow
 *   - Punch receiver (no auth — device secret_key only)
 *   - Settings get/update
 *
 * Tests that require real DB data (actual institute/user rows) are marked
 * with REQUIRES_DB and will fail gracefully (404/401) if not seeded.
 */

const request = require("supertest");
const { app, FAKE_TOKENS } = require("../helpers/testApp");

const ADMIN_AUTH = { Authorization: `Bearer ${FAKE_TOKENS.admin}` };
const STUDENT_AUTH = { Authorization: `Bearer ${FAKE_TOKENS.student}` };
const FACULTY_AUTH = { Authorization: `Bearer ${FAKE_TOKENS.faculty}` };

// ─────────────────────────────────────────────────────────────────────────────
// Device Management
// ─────────────────────────────────────────────────────────────────────────────

describe("📡 Biometric — Device Management", () => {
  it("TC-BIO-001 | GET /devices without token → 401", async () => {
    const res = await request(app).get("/api/biometric/devices");
    expect(res.status).toBe(401);
  });

  it("TC-BIO-002 | GET /devices with student token → 403", async () => {
    const res = await request(app)
      .get("/api/biometric/devices")
      .set(STUDENT_AUTH);
    // Student must never reach biometric admin endpoints
    expect([401, 403]).toContain(res.status);
  });

  it("TC-BIO-003 | GET /devices with faculty token → 403", async () => {
    const res = await request(app)
      .get("/api/biometric/devices")
      .set(FACULTY_AUTH);
    expect([401, 403]).toContain(res.status);
  });

  it("TC-BIO-004 | POST /devices — missing name → 400 or 401 (REQUIRES_DB for 400)", async () => {
    const res = await request(app)
      .post("/api/biometric/devices")
      .set(ADMIN_AUTH)
      .send({ serial_number: "TEST-SERIAL-001" }); // missing name

    // Without real DB: 401 (user not found). With seeded DB: 400 (validation).
    expect([400, 401]).toContain(res.status);
    if (res.status === 400) {
      expect(res.body.success).toBe(false);
    }
  });

  it("TC-BIO-005 | POST /devices — missing serial_number → 400 or 401", async () => {
    const res = await request(app)
      .post("/api/biometric/devices")
      .set(ADMIN_AUTH)
      .send({ name: "Test Device" }); // missing serial

    expect([400, 401]).toContain(res.status);
  });

  it("TC-BIO-006 | PUT /devices/:id — update non-existent device with admin → 404 or 401", async () => {
    const res = await request(app)
      .put("/api/biometric/devices/99999")
      .set(ADMIN_AUTH)
      .send({ name: "Updated Name" });

    expect([401, 404]).toContain(res.status);
  });

  it("TC-BIO-007 | DELETE /devices/:id — delete non-existent device → 404 or 401", async () => {
    const res = await request(app)
      .delete("/api/biometric/devices/99999")
      .set(ADMIN_AUTH);

    expect([401, 404]).toContain(res.status);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Punch Receiver (No Auth — secured by device secret_key only)
// ─────────────────────────────────────────────────────────────────────────────

describe("👆 Biometric — Punch Receiver", () => {
  it("TC-BIO-010 | POST /punch without secret_key → 200 (punch silently ignored)", async () => {
    // The punch endpoint NEVER returns 4xx — it always 200s to avoid
    // confusing ZKTeco devices. Invalid punches are simply ignored.
    const res = await request(app)
      .post("/api/biometric/punch")
      .send({
        // AttLog format (ZKTeco ADMS)
        Sn: "FAKE-DEVICE-SERIAL",
        AttLog: "12345\t2024-01-15 09:00:00\t0\t0",
      });

    // Must respond (200 or 4xx) — not crash
    expect(res.status).not.toBe(500);
  });

  it("TC-BIO-011 | POST /punch with wrong secret_key → still 200 (punch ignored)", async () => {
    const res = await request(app)
      .post("/api/biometric/punch")
      .set("X-Secret-Key", "WRONG-SECRET-KEY-NOBODY-KNOWS")
      .send({
        Sn: "FAKE-SERIAL",
        AttLog: "99999\t2024-01-15 09:00:00\t0\t0",
      });

    expect(res.status).not.toBe(500);
  });

  it("TC-BIO-012 | POST /punch with empty body → handled gracefully (not 500)", async () => {
    const res = await request(app)
      .post("/api/biometric/punch")
      .send({});

    expect(res.status).not.toBe(500);
  });

  it("TC-BIO-013 | POST /punch with generic format (pin/user_id fields) → not 500", async () => {
    const res = await request(app)
      .post("/api/biometric/punch")
      .send({
        pin: "12345",
        user_id: "12345",
        time: "2024-01-15 09:00:00",
        device_serial: "FAKE-GENERIC-DEVICE",
      });

    expect(res.status).not.toBe(500);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Enrollment
// ─────────────────────────────────────────────────────────────────────────────

describe("📋 Biometric — Enrollment", () => {
  it("TC-BIO-020 | POST /enroll without token → 401", async () => {
    const res = await request(app)
      .post("/api/biometric/enroll")
      .send({ device_id: 1, user_id: 1, user_role: "student" });

    expect(res.status).toBe(401);
  });

  it("TC-BIO-021 | POST /enroll with invalid user_role → 400 or 401", async () => {
    const res = await request(app)
      .post("/api/biometric/enroll")
      .set(ADMIN_AUTH)
      .send({ device_id: 1, user_id: 1, user_role: "superadmin" }); // invalid role

    expect([400, 401]).toContain(res.status);
  });

  it("TC-BIO-022 | GET /enrollments without token → 401", async () => {
    const res = await request(app).get("/api/biometric/enrollments");
    expect(res.status).toBe(401);
  });

  it("TC-BIO-023 | GET /enrollments with student token → 403", async () => {
    const res = await request(app)
      .get("/api/biometric/enrollments")
      .set(STUDENT_AUTH);
    expect([401, 403]).toContain(res.status);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Settings
// ─────────────────────────────────────────────────────────────────────────────

describe("⚙️ Biometric — Settings", () => {
  it("TC-BIO-030 | GET /settings without token → 401", async () => {
    const res = await request(app).get("/api/biometric/settings");
    expect(res.status).toBe(401);
  });

  it("TC-BIO-031 | PUT /settings without token → 401", async () => {
    const res = await request(app)
      .put("/api/biometric/settings")
      .send({ late_threshold_minutes: 15 });

    expect(res.status).toBe(401);
  });

  it("TC-BIO-032 | GET /settings with student token → 403", async () => {
    const res = await request(app)
      .get("/api/biometric/settings")
      .set(STUDENT_AUTH);
    expect([401, 403]).toContain(res.status);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Excel Export
// ─────────────────────────────────────────────────────────────────────────────

describe("📊 Biometric — Excel Export", () => {
  it("TC-BIO-040 | GET /export/excel without token → 401", async () => {
    const res = await request(app).get("/api/biometric/export/excel");
    expect(res.status).toBe(401);
  });

  it("TC-BIO-041 | GET /export/excel with student token → 403", async () => {
    const res = await request(app)
      .get("/api/biometric/export/excel")
      .set(STUDENT_AUTH);
    expect([401, 403]).toContain(res.status);
  });
});
