const { Notification } = require("../models");
const { asyncHandler, ApiError } = require("../middleware/error.handler");
const { getPaginationOptions, getPaginatedResponse } = require("../utils/pagination.helper");

/**
 * Get user notifications
 * GET /api/notifications
 */
const getNotifications = asyncHandler(async (req, res) => {
    const { page, limit, offset } = getPaginationOptions(req.query);
    const { isRead } = req.query;

    const where = { userId: req.user.id };
    if (isRead !== undefined) {
        where.isRead = isRead === "true";
    }

    const { count, rows: notifications } = await Notification.findAndCountAll({
        where,
        order: [["createdAt", "DESC"]],
        limit,
        offset,
    });

    // Get unread count
    const unreadCount = await Notification.count({
        where: { userId: req.user.id, isRead: false },
    });

    const response = getPaginatedResponse(notifications, count, { page, limit });

    res.json({
        success: true,
        ...response,
        unreadCount,
    });
});

/**
 * Mark notification as read
 * PUT /api/notifications/:id/read
 */
const markAsRead = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const notification = await Notification.findByPk(id);
    if (!notification) {
        throw new ApiError(404, "Notification not found");
    }

    if (notification.userId !== req.user.id) {
        throw new ApiError(403, "Access denied");
    }

    await notification.update({ isRead: true });

    res.json({
        success: true,
        message: "Notification marked as read",
    });
});

/**
 * Mark all notifications as read
 * PUT /api/notifications/read-all
 */
const markAllAsRead = asyncHandler(async (req, res) => {
    await Notification.update(
        { isRead: true },
        { where: { userId: req.user.id, isRead: false } }
    );

    res.json({
        success: true,
        message: "All notifications marked as read",
    });
});

/**
 * Delete notification
 * DELETE /api/notifications/:id
 */
const deleteNotification = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const notification = await Notification.findByPk(id);
    if (!notification) {
        throw new ApiError(404, "Notification not found");
    }

    if (notification.userId !== req.user.id) {
        throw new ApiError(403, "Access denied");
    }

    await notification.destroy();

    res.json({
        success: true,
        message: "Notification deleted",
    });
});

/**
 * Clear all notifications
 * DELETE /api/notifications
 */
const clearAllNotifications = asyncHandler(async (req, res) => {
    await Notification.destroy({
        where: { userId: req.user.id },
    });

    res.json({
        success: true,
        message: "All notifications cleared",
    });
});

module.exports = {
    getNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAllNotifications,
};
