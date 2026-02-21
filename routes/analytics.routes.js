const express = require("express");
const router = express.Router();
const analyticsController = require("../controllers/analytics.controller");
const { verifyToken } = require("../middleware/auth.middleware");
const { canViewAnalytics } = require("../middleware/rbac.middleware");
const { uuidParamValidation } = require("../middleware/validation.middleware");

// All routes require authentication
router.use(verifyToken);

// Overview is available to all authenticated users (with role-based data)
router.get("/overview", analyticsController.getOverview);

// Manager-only analytics
router.get("/productivity", canViewAnalytics, analyticsController.getProductivity);
router.get("/projects/:id", uuidParamValidation, analyticsController.getProjectAnalytics);
router.get("/trends", canViewAnalytics, analyticsController.getTrends);

module.exports = router;
