const express = require("express");
const router = express.Router();
const authController = require("../controllers/auth.controller");
const { verifyToken } = require("../middleware/auth.middleware");
const { registerValidation, loginValidation } = require("../middleware/validation.middleware");

// Public routes
router.post("/register", registerValidation, authController.register);
router.post("/login", loginValidation, authController.login);
router.post("/refresh", authController.refreshToken);
router.post("/logout", authController.logout);

// Protected routes
router.get("/profile", verifyToken, authController.getProfile);

module.exports = router;
