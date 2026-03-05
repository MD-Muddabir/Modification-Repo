/**
 * Fees Routes
 */

const express = require("express");
const router = express.Router();
const feesController = require("../controllers/fees.controller");
const verifyToken = require("../middlewares/auth.middleware");
const allowRoles = require("../middlewares/role.middleware");

const checkFeatureAccess = require("../middlewares/checkFeatureAccess");
const checkManagerPermission = require("../middlewares/checkManagerPermission");

router.post("/structure", verifyToken, allowRoles("admin", "manager"), checkManagerPermission("fees.create"), checkFeatureAccess("feature_fees"), feesController.createFeeStructure);
router.put("/structure/:id", verifyToken, allowRoles("admin", "manager"), checkManagerPermission("fees.update"), checkFeatureAccess("feature_fees"), feesController.updateFeeStructure);
router.delete("/structure/:id", verifyToken, allowRoles("admin", "manager"), checkManagerPermission("fees.delete"), checkFeatureAccess("feature_fees"), feesController.deleteFeeStructure);
router.get("/structure", verifyToken, allowRoles("admin", "faculty", "student", "manager"), checkManagerPermission("fees.read"), checkFeatureAccess("feature_fees"), feesController.getAllFeeStructures);
router.post("/pay", verifyToken, allowRoles("admin", "student", "manager"), checkManagerPermission("fees.create"), checkFeatureAccess("feature_fees"), feesController.recordPayment);
router.get("/payments", verifyToken, allowRoles("admin", "manager"), checkManagerPermission("fees.read"), checkFeatureAccess("feature_fees"), feesController.getAllPayments);
router.get("/payment/:student_id", verifyToken, allowRoles("admin", "faculty", "student", "manager"), checkManagerPermission("fees.read"), checkFeatureAccess("feature_fees"), feesController.getStudentPayments);

module.exports = router;
