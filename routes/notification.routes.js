const express = require("express");
const router = express.Router();
const notificationController = require("../controllers/notification.controller");
const { verifyToken } = require("../middleware/auth.middleware");
const { uuidParamValidation, paginationValidation } = require("../middleware/validation.middleware");

// All routes require authentication
router.use(verifyToken);

// Notification routes
router.get("/", paginationValidation, notificationController.getNotifications);
router.put("/read-all", notificationController.markAllAsRead);
router.put("/:id/read", uuidParamValidation, notificationController.markAsRead);
router.delete("/", notificationController.clearAllNotifications);
router.delete("/:id", uuidParamValidation, notificationController.deleteNotification);

module.exports = router;
