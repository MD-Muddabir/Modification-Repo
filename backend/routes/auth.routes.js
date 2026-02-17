const express = require("express");
const router = express.Router();
const authController = require("../controllers/auth.controller");

const verifyToken = require("../middlewares/auth.middleware");

router.post("/register", authController.register);
router.post("/register-institute", authController.registerInstitute); // Public registration
router.post("/login", authController.login);
router.post("/change-password", verifyToken, authController.changePassword);
router.get("/profile", verifyToken, authController.getProfile);
router.put("/profile", verifyToken, authController.updateProfile);
router.post("/logout", authController.logout);

module.exports = router;
