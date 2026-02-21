const express = require("express");
const router = express.Router();
const taskController = require("../controllers/task.controller");
const { verifyToken } = require("../middleware/auth.middleware");
const {
    canCreateTask,
    canEditTask,
    canDeleteTask,
    canUpdateTaskStatus,
    canAssignTask,
} = require("../middleware/rbac.middleware");
const {
    createTaskValidation,
    updateTaskStatusValidation,
    uuidParamValidation,
    paginationValidation,
} = require("../middleware/validation.middleware");

// All routes require authentication
router.use(verifyToken);

// Personal tasks
router.get("/personal", paginationValidation, taskController.getPersonalTasks);

// Upcoming tasks
router.get("/upcoming", taskController.getUpcomingTasks);

// CRUD operations
router.get("/", paginationValidation, taskController.getTasks);
router.get("/:id", uuidParamValidation, taskController.getTaskById);
router.post("/", canCreateTask, createTaskValidation, taskController.createTask);
router.put("/:id", canEditTask, uuidParamValidation, taskController.updateTask);
router.delete("/:id", canDeleteTask, uuidParamValidation, taskController.deleteTask);

// Status and assignment
router.put("/:id/status", canUpdateTaskStatus, updateTaskStatusValidation, taskController.updateTaskStatus);
router.put("/:id/assign", canAssignTask, uuidParamValidation, taskController.assignTask);

module.exports = router;
