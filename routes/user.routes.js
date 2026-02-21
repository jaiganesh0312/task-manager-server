const express = require("express");
const router = express.Router();
const userController = require("../controllers/user.controller");
const { verifyToken, isManager } = require("../middleware/auth.middleware");
const { uuidParamValidation, paginationValidation } = require("../middleware/validation.middleware");

// All routes require authentication
router.use(verifyToken);

// Get employees (for task assignment)
router.get("/employees", userController.getEmployees);

// CRUD operations
router.get("/", paginationValidation, userController.getUsers);
router.get("/:id", uuidParamValidation, userController.getUserById);
router.put("/:id", isManager, uuidParamValidation, userController.updateUser);
router.delete("/:id", isManager, uuidParamValidation, userController.deleteUser);

module.exports = router;
