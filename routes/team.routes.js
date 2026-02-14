const express = require("express");
const router = express.Router();
const teamController = require("../controllers/team.controller");
const { verifyToken } = require("../middleware/auth.middleware");
const { canManageTeam } = require("../middleware/rbac.middleware");
const { createTeamValidation, uuidParamValidation, paginationValidation } = require("../middleware/validation.middleware");

// All routes require authentication
router.use(verifyToken);

// CRUD operations
router.get("/", paginationValidation, teamController.getTeams);
router.get("/:id", uuidParamValidation, teamController.getTeamById);
router.post("/", canManageTeam, createTeamValidation, teamController.createTeam);
router.put("/:id", canManageTeam, uuidParamValidation, teamController.updateTeam);
router.delete("/:id", canManageTeam, uuidParamValidation, teamController.deleteTeam);

// Member management
router.post("/:id/members", canManageTeam, uuidParamValidation, teamController.addMember);
router.delete("/:id/members/:userId", canManageTeam, teamController.removeMember);

module.exports = router;
