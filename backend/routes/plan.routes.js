const express = require("express");
const router = express.Router();
const planController = require("../controllers/plan.controller");
const verifyToken = require("../middlewares/auth.middleware");
const allowRoles = require("../middlewares/role.middleware");

// Get all plans (public or restricted, usually public for users to see options)
// But restricted to viewing/editing for admins
router.get("/", planController.getAllPlans);

// Create Create, Update, Delete - Super Admin Only
router.post("/", verifyToken, allowRoles("super_admin"), planController.createPlan);
router.put("/:id", verifyToken, allowRoles("super_admin"), planController.updatePlan);
router.delete("/:id", verifyToken, allowRoles("super_admin"), planController.deletePlan);

module.exports = router;
