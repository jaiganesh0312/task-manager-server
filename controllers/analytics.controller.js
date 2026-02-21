const { Task, Subtask, Project, User, Team } = require("../models");
const { asyncHandler } = require("../middleware/error.handler");
const { Op, fn, col, literal } = require("sequelize");

/**
 * Get dashboard overview
 * GET /api/analytics/overview
 */
const getOverview = asyncHandler(async (req, res) => {
    const isManager = req.user.role === "manager";

    // Build base filter
    const taskWhere = {};
    if (!isManager) {
        taskWhere[Op.or] = [
            { assigneeId: req.user.id },
            { isPersonal: true, createdById: req.user.id },
        ];
    }

    // Task counts by status
    const taskCounts = await Task.findAll({
        where: taskWhere,
        attributes: [
            "status",
            [fn("COUNT", col("id")), "count"],
        ],
        group: ["status"],
        raw: true,
    });

    const statusCounts = {
        todo: 0,
        "in-progress": 0,
        review: 0,
        completed: 0,
    };
    let totalTasks = 0;

    taskCounts.forEach((c) => {
        statusCounts[c.status] = parseInt(c.count);
        totalTasks += parseInt(c.count);
    });

    // Overdue tasks
    const overdueTasks = await Task.count({
        where: {
            ...taskWhere,
            dueDate: { [Op.lt]: new Date() },
            status: { [Op.ne]: "completed" },
        },
    });

    // Tasks due today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const tasksDueToday = await Task.count({
        where: {
            ...taskWhere,
            dueDate: {
                [Op.gte]: today,
                [Op.lt]: tomorrow,
            },
            status: { [Op.ne]: "completed" },
        },
    });

    // Manager-specific stats
    let teamCount = 0;
    let projectCount = 0;
    let employeeCount = 0;

    if (isManager) {
        teamCount = await Team.count({ where: { managerId: req.user.id } });
        projectCount = await Project.count();
        employeeCount = await User.count({ where: { role: "employee" } });
    }

    // Completion rate
    const completionRate = totalTasks > 0
        ? Math.round((statusCounts.completed / totalTasks) * 100)
        : 0;

    res.json({
        success: true,
        data: {
            tasks: {
                total: totalTasks,
                ...statusCounts,
                overdue: overdueTasks,
                dueToday: tasksDueToday,
            },
            completionRate,
            ...(isManager && {
                teams: teamCount,
                projects: projectCount,
                employees: employeeCount,
            }),
        },
    });
});

/**
 * Get productivity metrics (Manager only)
 * GET /api/analytics/productivity
 */
const getProductivity = asyncHandler(async (req, res) => {
    const { period = "week" } = req.query;

    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();

    switch (period) {
        case "week":
            startDate.setDate(startDate.getDate() - 7);
            break;
        case "month":
            startDate.setMonth(startDate.getMonth() - 1);
            break;
        case "quarter":
            startDate.setMonth(startDate.getMonth() - 3);
            break;
        default:
            startDate.setDate(startDate.getDate() - 7);
    }

    // Employee productivity
    const employeeStats = await User.findAll({
        where: { role: "employee" },
        attributes: [
            "id",
            "name",
            "avatar",
            [
                literal(`(
                    SELECT COUNT(*) FROM tasks 
                    WHERE tasks."assigneeId" = "User".id 
                    AND tasks.status = 'completed'
                    AND tasks."completedAt" >= '${startDate.toISOString()}'
                )`),
                "completedTasks",
            ],
            [
                literal(`(
                    SELECT COUNT(*) FROM tasks 
                    WHERE tasks."assigneeId" = "User".id
                )`),
                "totalAssigned",
            ],
        ],
        order: [[literal('"completedTasks"'), "DESC"]],
        limit: 10,
    });

    // Task trend (daily completions)
    const dailyCompletions = await Task.findAll({
        where: {
            status: "completed",
            completedAt: {
                [Op.between]: [startDate, endDate],
            },
        },
        attributes: [
            [fn("DATE", col("completedAt")), "date"],
            [fn("COUNT", col("id")), "count"],
        ],
        group: [fn("DATE", col("completedAt"))],
        order: [[fn("DATE", col("completedAt")), "ASC"]],
        raw: true,
    });

    // Priority distribution
    const priorityDistribution = await Task.findAll({
        where: {
            createdAt: { [Op.gte]: startDate },
        },
        attributes: [
            "priority",
            [fn("COUNT", col("id")), "count"],
        ],
        group: ["priority"],
        raw: true,
    });

    res.json({
        success: true,
        data: {
            employees: employeeStats,
            dailyCompletions,
            priorityDistribution,
            period,
            dateRange: {
                start: startDate,
                end: endDate,
            },
        },
    });
});

/**
 * Get project analytics
 * GET /api/analytics/projects/:id
 */
const getProjectAnalytics = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const project = await Project.findByPk(id);
    if (!project) {
        return res.status(404).json({
            success: false,
            message: "Project not found",
        });
    }

    // Task status distribution
    const statusDistribution = await Task.findAll({
        where: { projectId: id },
        attributes: [
            "status",
            [fn("COUNT", col("id")), "count"],
        ],
        group: ["status"],
        raw: true,
    });

    // Tasks by assignee
    const tasksByAssignee = await Task.findAll({
        where: { projectId: id },
        include: [
            { model: User, as: "assignee", attributes: ["id", "name", "avatar"] },
        ],
        attributes: [
            "assigneeId",
            [fn("COUNT", col("Task.id")), "total"],
            [
                literal(`SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END)`),
                "completed",
            ],
        ],
        group: ["assigneeId", "assignee.id"],
        raw: true,
        nest: true,
    });

    // Calculate progress
    const totalTasks = await Task.count({ where: { projectId: id } });
    const completedTasks = await Task.count({ where: { projectId: id, status: "completed" } });
    const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    // Overdue tasks
    const overdueTasks = await Task.count({
        where: {
            projectId: id,
            dueDate: { [Op.lt]: new Date() },
            status: { [Op.ne]: "completed" },
        },
    });

    res.json({
        success: true,
        data: {
            project: project.toJSON(),
            progress,
            totalTasks,
            completedTasks,
            overdueTasks,
            statusDistribution,
            tasksByAssignee,
        },
    });
});

/**
 * Get task trends
 * GET /api/analytics/trends
 */
const getTrends = asyncHandler(async (req, res) => {
    const { period = "month" } = req.query;

    // Calculate weeks in period
    let weeks = 4;
    if (period === "quarter") weeks = 12;
    if (period === "year") weeks = 52;

    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - (weeks * 7));

    // Weekly task creation trend
    const creationTrend = await Task.findAll({
        where: {
            createdAt: { [Op.gte]: startDate },
        },
        attributes: [
            [fn("DATE_TRUNC", "week", col("createdAt")), "week"],
            [fn("COUNT", col("id")), "created"],
        ],
        group: [fn("DATE_TRUNC", "week", col("createdAt"))],
        order: [[fn("DATE_TRUNC", "week", col("createdAt")), "ASC"]],
        raw: true,
    });

    // Weekly task completion trend
    const completionTrend = await Task.findAll({
        where: {
            status: "completed",
            completedAt: { [Op.gte]: startDate },
        },
        attributes: [
            [fn("DATE_TRUNC", "week", col("completedAt")), "week"],
            [fn("COUNT", col("id")), "completed"],
        ],
        group: [fn("DATE_TRUNC", "week", col("completedAt"))],
        order: [[fn("DATE_TRUNC", "week", col("completedAt")), "ASC"]],
        raw: true,
    });

    res.json({
        success: true,
        data: {
            creationTrend,
            completionTrend,
            period,
            weeks,
        },
    });
});

module.exports = {
    getOverview,
    getProductivity,
    getProjectAnalytics,
    getTrends,
};
