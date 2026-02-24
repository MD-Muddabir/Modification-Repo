/**
 * Fees Routes
 */

const express = require("express");
const router = express.Router();
const feesController = require("../controllers/fees.controller");
const verifyToken = require("../middlewares/auth.middleware");
const allowRoles = require("../middlewares/role.middleware");

const checkFeatureAccess = require("../middlewares/checkFeatureAccess");

router.post("/structure", verifyToken, allowRoles("admin"), checkFeatureAccess("feature_fees"), feesController.createFeeStructure);
router.get("/structure", verifyToken, allowRoles("admin", "faculty", "student"), checkFeatureAccess("feature_fees"), feesController.getAllFeeStructures);
router.post("/pay", verifyToken, allowRoles("admin", "student"), checkFeatureAccess("feature_fees"), feesController.recordPayment);
router.get("/payments", verifyToken, allowRoles("admin"), checkFeatureAccess("feature_fees"), feesController.getAllPayments);
router.get("/payment/:student_id", verifyToken, allowRoles("admin", "faculty", "student"), checkFeatureAccess("feature_fees"), feesController.getStudentPayments);

module.exports = router;
