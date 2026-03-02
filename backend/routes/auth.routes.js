const express = require("express");
const router = express.Router();
const authController = require("../controllers/auth.controller");

const verifyToken = require("../middlewares/auth.middleware");

router.post("/register", authController.register);
router.post("/register-institute", authController.registerInstitute);
router.post("/login", authController.login);
router.post("/change-password", verifyToken, authController.changePassword);
router.get("/profile", verifyToken, authController.getProfile);
router.put("/profile", verifyToken, authController.updateProfile);
router.put("/theme", verifyToken, authController.saveTheme);   // ← Phase 2: save theme to DB
router.post("/logout", authController.logout);

module.exports = router;
