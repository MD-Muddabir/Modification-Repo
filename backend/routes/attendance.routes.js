/**
 * Attendance Routes
 * Implements role-based and plan-based access control
 */

const express = require("express");
const router = express.Router();
const attendanceController = require("../controllers/attendance.controller");
const verifyToken = require("../middlewares/auth.middleware");
const allowRoles = require("../middlewares/role.middleware");
const checkFeatureAccess = require("../middlewares/checkFeatureAccess");

// All routes require authentication and attendance feature
router.use(verifyToken, checkFeatureAccess("feature_attendance"));

// Bulk mark attendance for a class
router.post("/bulk", allowRoles("admin", "faculty"), attendanceController.markBulkAttendance);

// Get attendance for specific class and date
router.get("/class/:class_id/date/:date", allowRoles("admin", "faculty"), attendanceController.getClassAttendanceByDate);

// Update attendance (admin only)
router.put("/:id", allowRoles("admin"), attendanceController.updateAttendance);

// Delete attendance (admin only)
router.delete("/:id", allowRoles("admin"), attendanceController.deleteAttendance);

// Student attendance report
router.get("/student/:student_id/report", allowRoles("admin", "faculty", "student"), attendanceController.getStudentAttendanceReport);

// Class attendance summary
router.get("/class/:class_id/summary", allowRoles("admin", "faculty"), attendanceController.getClassAttendanceSummary);

// Attendance dashboard stats
router.get("/dashboard", allowRoles("admin", "faculty"), attendanceController.getAttendanceDashboard);

module.exports = router;
