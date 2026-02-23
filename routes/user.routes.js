const express = require("express");
const router = express.Router();
const userController = require("../controllers/user.controller");
const { verifyToken, isManager } = require("../middleware/auth.middleware");
const { uuidParamValidation, paginationValidation } = require("../middleware/validation.middleware");
const { upload } = require("../middleware/upload.middleware");

// All routes require authentication
router.use(verifyToken);

// Get employees (for task assignment)
router.get("/employees", userController.getEmployees);

// Profile operations (current user)
router.put("/profile", userController.updateProfile);
router.put("/profile/password", userController.updatePassword);
router.put("/profile/avatar", upload.single('avatar'), userController.updateAvatar);

// CRUD operations
router.get("/", paginationValidation, userController.getUsers);
router.get("/:id", uuidParamValidation, userController.getUserById);
router.put("/:id", isManager, uuidParamValidation, userController.updateUser);
router.delete("/:id", isManager, uuidParamValidation, userController.deleteUser);

module.exports = router;
