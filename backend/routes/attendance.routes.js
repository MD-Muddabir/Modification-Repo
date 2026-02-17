/**
 * Attendance Routes
 */

const express = require("express");
const router = express.Router();
const attendanceController = require("../controllers/attendance.controller");
const verifyToken = require("../middlewares/auth.middleware");
const allowRoles = require("../middlewares/role.middleware");

const checkFeatureAccess = require("../middlewares/checkFeatureAccess");

router.post("/", verifyToken, allowRoles("admin", "faculty"), checkFeatureAccess("feature_attendance"), attendanceController.markAttendance);
router.get("/", verifyToken, allowRoles("admin", "faculty"), checkFeatureAccess("feature_attendance"), attendanceController.getAttendance);
router.get("/percentage/:student_id", verifyToken, allowRoles("admin", "faculty", "student"), checkFeatureAccess("feature_attendance"), attendanceController.getAttendancePercentage);

module.exports = router;
