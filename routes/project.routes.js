const express = require("express");
const router = express.Router();
const projectController = require("../controllers/project.controller");
const { verifyToken } = require("../middleware/auth.middleware");
const { canManageProject } = require("../middleware/rbac.middleware");
const { createProjectValidation, uuidParamValidation, paginationValidation } = require("../middleware/validation.middleware");

// All routes require authentication
router.use(verifyToken);

// CRUD operations
router.get("/", paginationValidation, projectController.getProjects);
router.get("/:id", uuidParamValidation, projectController.getProjectById);
router.post("/", canManageProject, createProjectValidation, projectController.createProject);
router.put("/:id", canManageProject, uuidParamValidation, projectController.updateProject);
router.delete("/:id", canManageProject, uuidParamValidation, projectController.deleteProject);

module.exports = router;
