const { Subtask, Task, User, Notification } = require("../models");
const { asyncHandler, ApiError } = require("../middleware/error.handler");
const { sendSubtaskAddedEvent } = require("../services/kafka/kafka.producer");

/**
 * Get subtasks for a task
 * GET /api/tasks/:taskId/subtasks
 */
const getSubtasks = asyncHandler(async (req, res) => {
    const { taskId } = req.params;

    const task = await Task.findByPk(taskId);
    if (!task) {
        throw new ApiError(404, "Task not found");
    }

    const subtasks = await Subtask.findAll({
        where: { taskId },
        include: [
            { model: User, as: "creator", attributes: ["id", "name", "avatar"] },
        ],
        order: [["createdAt", "ASC"]],
    });

    res.json({
        success: true,
        data: subtasks,
    });
});

/**
 * Create subtask
 * POST /api/tasks/:taskId/subtasks
 */
const createSubtask = asyncHandler(async (req, res) => {
    const { taskId } = req.params;
    const { title, description } = req.body;

    const task = req.task; // Set by RBAC middleware

    const subtask = await Subtask.create({
        title,
        description,
        taskId,
        createdById: req.user.id,
    });

    // Notify task creator/assignee about new subtask
    const notifyUserId = task.createdById !== req.user.id ? task.createdById : task.assigneeId;
    if (notifyUserId && notifyUserId !== req.user.id) {
        await Notification.create({
            type: "subtask_added",
            title: "New Subtask Added",
            message: `Subtask "${title}" was added to task "${task.title}"`,
            userId: notifyUserId,
            metadata: { taskId: task.id, subtaskId: subtask.id },
        });
    }

    // Send Kafka event for subtask creation
    sendSubtaskAddedEvent(subtask, task, req.user).catch(console.error);

    const createdSubtask = await Subtask.findByPk(subtask.id, {
        include: [
            { model: User, as: "creator", attributes: ["id", "name"] },
        ],
    });

    res.status(201).json({
        success: true,
        message: "Subtask created successfully",
        data: createdSubtask,
    });
});

/**
 * Update subtask
 * PUT /api/subtasks/:id
 */
const updateSubtask = asyncHandler(async (req, res) => {
    const subtask = req.subtask; // Set by RBAC middleware
    const { title, description, status } = req.body;

    await subtask.update({
        title: title || subtask.title,
        description: description !== undefined ? description : subtask.description,
        status: status || subtask.status,
        completedAt: status === "completed" ? new Date() : null,
    });

    res.json({
        success: true,
        message: "Subtask updated successfully",
        data: subtask,
    });
});

/**
 * Update subtask status
 * PUT /api/subtasks/:id/status
 */
const updateSubtaskStatus = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;

    const subtask = await Subtask.findByPk(id, {
        include: [{ model: Task, as: "task" }],
    });

    if (!subtask) {
        throw new ApiError(404, "Subtask not found");
    }

    const task = subtask.task;

    // Check permissions
    if (req.user.role !== "manager") {
        if (
            task.assigneeId !== req.user.id &&
            !(task.isPersonal && task.createdById === req.user.id)
        ) {
            throw new ApiError(403, "You can only update subtasks of tasks assigned to you");
        }
    }

    await subtask.update({
        status,
        completedAt: status === "completed" ? new Date() : null,
    });

    res.json({
        success: true,
        message: "Subtask status updated successfully",
        data: subtask,
    });
});

/**
 * Delete subtask
 * DELETE /api/subtasks/:id
 */
const deleteSubtask = asyncHandler(async (req, res) => {
    const subtask = req.subtask; // Set by RBAC middleware

    await subtask.destroy();

    res.json({
        success: true,
        message: "Subtask deleted successfully",
    });
});

module.exports = {
    getSubtasks,
    createSubtask,
    updateSubtask,
    updateSubtaskStatus,
    deleteSubtask,
};
