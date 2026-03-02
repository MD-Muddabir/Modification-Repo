const express = require("express");
const router = express.Router();
const verifyToken = require("../middlewares/auth.middleware");
const allowRoles = require("../middlewares/role.middleware");
const expenseController = require("../controllers/expense.controller");

// Both superadmin and admin can access these routes
router.use(verifyToken);
router.use(allowRoles("super_admin", "admin"));

router.get("/", expenseController.getExpenses);
router.post("/", expenseController.addExpense);
router.delete("/:id", expenseController.deleteExpense);
router.get("/stats", expenseController.getExpenseStats);

module.exports = router;
