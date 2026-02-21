const express = require("express");
const router = express.Router();
const subtaskController = require("../controllers/subtask.controller");
const { verifyToken } = require("../middleware/auth.middleware");
const { canCreateSubtask, canModifySubtask } = require("../middleware/rbac.middleware");
const { createSubtaskValidation, uuidParamValidation } = require("../middleware/validation.middleware");

// All routes require authentication
router.use(verifyToken);

// Subtask routes under tasks
router.get("/tasks/:taskId/subtasks", subtaskController.getSubtasks);
router.post("/tasks/:taskId/subtasks", canCreateSubtask, createSubtaskValidation, subtaskController.createSubtask);

// Direct subtask routes
router.put("/subtasks/:id", canModifySubtask, uuidParamValidation, subtaskController.updateSubtask);
router.put("/subtasks/:id/status", uuidParamValidation, subtaskController.updateSubtaskStatus);
router.delete("/subtasks/:id", canModifySubtask, uuidParamValidation, subtaskController.deleteSubtask);

module.exports = router;
