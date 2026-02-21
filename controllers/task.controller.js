const { Task, Subtask, Project, User, Notification } = require("../models");
const { asyncHandler, ApiError } = require("../middleware/error.handler");
const { getPaginationOptions, getPaginatedResponse } = require("../utils/pagination.helper");
const { Op } = require("sequelize");
const {
    sendTaskAssignedEvent,
    sendTaskStatusChangedEvent,
} = require("../services/kafka/kafka.producer");

/**
 * Get all tasks
 * GET /api/tasks
 */
const getTasks = asyncHandler(async (req, res) => {
    const { page, limit, offset } = getPaginationOptions(req.query);
    const { status, priority, projectId, assigneeId, search, isPersonal } = req.query;

    const where = {};
    if (status) where.status = status;
    if (priority) where.priority = priority;
    if (projectId) where.projectId = projectId;
    if (assigneeId) where.assigneeId = assigneeId;
    if (isPersonal !== undefined) where.isPersonal = isPersonal === "true";

    if (search) {
        where[Op.or] = [
            { title: { [Op.iLike]: `%${search}%` } },
            { description: { [Op.iLike]: `%${search}%` } },
        ];
    }

    // Role-based filtering
    if (req.user.role === "employee") {
        // Employees see assigned tasks + their personal tasks
        where[Op.or] = [
            { assigneeId: req.user.id },
            { isPersonal: true, createdById: req.user.id },
        ];
    }

    const { count, rows: tasks } = await Task.findAndCountAll({
        where,
        include: [
            { model: Project, as: "project", attributes: ["id", "name", "color"] },
            { model: User, as: "assignee", attributes: ["id", "name", "avatar"] },
            { model: User, as: "creator", attributes: ["id", "name"] },
            { model: Subtask, as: "subtasks" },
        ],
        order: [
            ["dueDate", "ASC"],
            ["priority", "DESC"],
            ["createdAt", "DESC"],
        ],
        limit,
        offset,
    });

    const response = getPaginatedResponse(tasks, count, { page, limit });

    res.json({
        success: true,
        ...response,
    });
});

/**
 * Get task by ID
 * GET /api/tasks/:id
 */
const getTaskById = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const task = await Task.findByPk(id, {
        include: [
            { model: Project, as: "project" },
            { model: User, as: "assignee", attributes: ["id", "name", "email", "avatar"] },
            { model: User, as: "creator", attributes: ["id", "name", "email"] },
            {
                model: Subtask,
                as: "subtasks",
                include: [{ model: User, as: "creator", attributes: ["id", "name"] }],
            },
        ],
    });

    if (!task) {
        throw new ApiError(404, "Task not found");
    }

    // Calculate subtask progress
    const totalSubtasks = task.subtasks.length;
    const completedSubtasks = task.subtasks.filter((s) => s.status === "completed").length;
    const subtaskProgress = totalSubtasks > 0 ? Math.round((completedSubtasks / totalSubtasks) * 100) : 0;

    res.json({
        success: true,
        data: {
            ...task.toJSON(),
            subtaskProgress,
            totalSubtasks,
            completedSubtasks,
        },
    });
});

/**
 * Create task
 * POST /api/tasks
 */
const createTask = asyncHandler(async (req, res) => {
    const {
        title,
        description,
        priority,
        status,
        dueDate,
        projectId,
        assigneeId,
        isPersonal,
        estimatedHours,
        tags,
    } = req.body;

    // Validate project if provided
    if (projectId) {
        const project = await Project.findByPk(projectId);
        if (!project) {
            throw new ApiError(404, "Project not found");
        }
    }

    // Validate assignee if provided
    if (assigneeId) {
        const assignee = await User.findByPk(assigneeId);
        if (!assignee) {
            throw new ApiError(404, "Assignee not found");
        }
    }

    const task = await Task.create({
        title,
        description,
        priority,
        status,
        dueDate,
        projectId: isPersonal ? null : projectId,
        assigneeId: isPersonal ? req.user.id : assigneeId,
        createdById: req.user.id,
        isPersonal: isPersonal || false,
        estimatedHours,
        tags,
    });

    // Send notification if task is assigned
    if (assigneeId && assigneeId !== req.user.id) {
        await Notification.create({
            type: "task_assigned",
            title: "New Task Assigned",
            message: `You have been assigned to task: ${title}`,
            userId: assigneeId,
            metadata: { taskId: task.id },
        });

        // Send Kafka event for task assignment
        const assignee = await User.findByPk(assigneeId);
        sendTaskAssignedEvent(task, assignee, req.user).catch(console.error);
    }

    const createdTask = await Task.findByPk(task.id, {
        include: [
            { model: Project, as: "project", attributes: ["id", "name"] },
            { model: User, as: "assignee", attributes: ["id", "name", "avatar"] },
            { model: User, as: "creator", attributes: ["id", "name"] },
        ],
    });

    res.status(201).json({
        success: true,
        message: "Task created successfully",
        data: createdTask,
    });
});

/**
 * Update task
 * PUT /api/tasks/:id
 */
const updateTask = asyncHandler(async (req, res) => {
    const task = req.task; // Set by RBAC middleware
    const {
        title,
        description,
        priority,
        status,
        dueDate,
        projectId,
        assigneeId,
        estimatedHours,
        actualHours,
        tags,
    } = req.body;

    const previousAssignee = task.assigneeId;

    await task.update({
        title: title || task.title,
        description: description !== undefined ? description : task.description,
        priority: priority || task.priority,
        status: status || task.status,
        dueDate: dueDate !== undefined ? dueDate : task.dueDate,
        projectId: projectId !== undefined ? projectId : task.projectId,
        assigneeId: assigneeId !== undefined ? assigneeId : task.assigneeId,
        estimatedHours: estimatedHours !== undefined ? estimatedHours : task.estimatedHours,
        actualHours: actualHours !== undefined ? actualHours : task.actualHours,
        tags: tags || task.tags,
        completedAt: status === "completed" ? new Date() : task.completedAt,
    });

    // Notify new assignee if changed
    if (assigneeId && assigneeId !== previousAssignee && assigneeId !== req.user.id) {
        await Notification.create({
            type: "task_assigned",
            title: "Task Assigned to You",
            message: `You have been assigned to task: ${task.title}`,
            userId: assigneeId,
            metadata: { taskId: task.id },
        });

        // Send Kafka event for task assignment
        const assignee = await User.findByPk(assigneeId);
        sendTaskAssignedEvent(task, assignee, req.user).catch(console.error);
    }

    const updatedTask = await Task.findByPk(task.id, {
        include: [
            { model: Project, as: "project", attributes: ["id", "name"] },
            { model: User, as: "assignee", attributes: ["id", "name", "avatar"] },
            { model: User, as: "creator", attributes: ["id", "name"] },
            { model: Subtask, as: "subtasks" },
        ],
    });

    res.json({
        success: true,
        message: "Task updated successfully",
        data: updatedTask,
    });
});

/**
 * Update task status
 * PUT /api/tasks/:id/status
 */
const updateTaskStatus = asyncHandler(async (req, res) => {
    const task = req.task; // Set by RBAC middleware
    const { status } = req.body;

    const previousStatus = task.status;

    await task.update({
        status,
        completedAt: status === "completed" ? new Date() : null,
    });

    // Notify task creator about status change
    if (task.createdById !== req.user.id) {
        await Notification.create({
            type: "task_status_changed",
            title: "Task Status Updated",
            message: `Task "${task.title}" status changed from ${previousStatus} to ${status}`,
            userId: task.createdById,
            metadata: { taskId: task.id, previousStatus, newStatus: status },
        });
    }

    // Send Kafka event for status change
    sendTaskStatusChangedEvent(task, previousStatus, status, req.user).catch(console.error);

    res.json({
        success: true,
        message: "Task status updated successfully",
        data: task,
    });
});

/**
 * Assign task to user
 * PUT /api/tasks/:id/assign
 */
const assignTask = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { assigneeId } = req.body;

    const task = await Task.findByPk(id);
    if (!task) {
        throw new ApiError(404, "Task not found");
    }

    const assignee = await User.findByPk(assigneeId);
    if (!assignee) {
        throw new ApiError(404, "Assignee not found");
    }

    await task.update({ assigneeId });

    // Notify assignee
    if (assigneeId !== req.user.id) {
        await Notification.create({
            type: "task_assigned",
            title: "Task Assigned to You",
            message: `You have been assigned to task: ${task.title}`,
            userId: assigneeId,
            metadata: { taskId: task.id },
        });

        // Send Kafka event for task assignment
        sendTaskAssignedEvent(task, assignee, req.user).catch(console.error);
    }

    const updatedTask = await Task.findByPk(id, {
        include: [
            { model: User, as: "assignee", attributes: ["id", "name", "avatar"] },
        ],
    });

    res.json({
        success: true,
        message: "Task assigned successfully",
        data: updatedTask,
    });
});

/**
 * Delete task
 * DELETE /api/tasks/:id
 */
const deleteTask = asyncHandler(async (req, res) => {
    const task = req.task; // Set by RBAC middleware

    // Delete subtasks first
    await Subtask.destroy({ where: { taskId: task.id } });

    await task.destroy();

    res.json({
        success: true,
        message: "Task deleted successfully",
    });
});

/**
 * Get personal tasks
 * GET /api/tasks/personal
 */
const getPersonalTasks = asyncHandler(async (req, res) => {
    const { page, limit, offset } = getPaginationOptions(req.query);
    const { status, priority } = req.query;

    const where = {
        isPersonal: true,
        createdById: req.user.id,
    };

    if (status) where.status = status;
    if (priority) where.priority = priority;

    const { count, rows: tasks } = await Task.findAndCountAll({
        where,
        include: [
            { model: Subtask, as: "subtasks" },
        ],
        order: [
            ["dueDate", "ASC"],
            ["createdAt", "DESC"],
        ],
        limit,
        offset,
    });

    const response = getPaginatedResponse(tasks, count, { page, limit });

    res.json({
        success: true,
        ...response,
    });
});

/**
 * Get upcoming tasks (due in next 7 days)
 * GET /api/tasks/upcoming
 */
const getUpcomingTasks = asyncHandler(async (req, res) => {
    const today = new Date();
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);

    const where = {
        dueDate: {
            [Op.between]: [today, nextWeek],
        },
        status: {
            [Op.ne]: "completed",
        },
    };

    // Role-based filtering
    if (req.user.role === "employee") {
        where[Op.or] = [
            { assigneeId: req.user.id },
            { isPersonal: true, createdById: req.user.id },
        ];
    }

    const tasks = await Task.findAll({
        where,
        include: [
            { model: Project, as: "project", attributes: ["id", "name", "color"] },
            { model: User, as: "assignee", attributes: ["id", "name", "avatar"] },
        ],
        order: [["dueDate", "ASC"]],
        limit: 10,
    });

    res.json({
        success: true,
        data: tasks,
    });
});

module.exports = {
    getTasks,
    getTaskById,
    createTask,
    updateTask,
    updateTaskStatus,
    assignTask,
    deleteTask,
    getPersonalTasks,
    getUpcomingTasks,
};
