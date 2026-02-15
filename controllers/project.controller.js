const { Project, Team, Task, User } = require("../models");
const { asyncHandler, ApiError } = require("../middleware/error.handler");
const { getPaginationOptions, getPaginatedResponse } = require("../utils/pagination.helper");
const { Op } = require("sequelize");

/**
 * Get all projects
 * GET /api/projects
 */
const getProjects = asyncHandler(async (req, res) => {
    const { page, limit, offset } = getPaginationOptions(req.query);
    const { status, teamId, priority, search } = req.query;

    const where = {};
    if (status) where.status = status;
    if (teamId) where.teamId = teamId;
    if (priority) where.priority = priority;

    if (search) {
        where[Op.or] = [
            { name: { [Op.iLike]: `%${search}%` } },
            { description: { [Op.iLike]: `%${search}%` } },
        ];
    }

    // If employee, only show projects from their team
    if (req.user.role === "employee" && req.user.teamId) {
        where.teamId = req.user.teamId;
    }

    const { count, rows: projects } = await Project.findAndCountAll({
        where,
        include: [
            { model: Team, as: "team", attributes: ["id", "name", "color"] },
            { model: User, as: "creator", attributes: ["id", "name"] },
        ],
        order: [["createdAt", "DESC"]],
        limit,
        offset,
    });

    // Add task counts
    const projectsWithCounts = await Promise.all(
        projects.map(async (project) => {
            const taskCounts = await Task.count({
                where: { projectId: project.id },
                group: ["status"],
            });

            const counts = {
                total: 0,
                todo: 0,
                "in-progress": 0,
                review: 0,
                completed: 0,
            };

            taskCounts.forEach((c) => {
                counts[c.status] = c.count;
                counts.total += c.count;
            });

            return {
                ...project.toJSON(),
                taskCounts: counts,
            };
        })
    );

    const response = getPaginatedResponse(projectsWithCounts, count, { page, limit });

    res.json({
        success: true,
        ...response,
    });
});

/**
 * Get project by ID
 * GET /api/projects/:id
 */
const getProjectById = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const project = await Project.findByPk(id, {
        include: [
            { model: Team, as: "team" },
            { model: User, as: "creator", attributes: ["id", "name", "email"] },
            {
                model: Task,
                as: "tasks",
                include: [
                    { model: User, as: "assignee", attributes: ["id", "name", "avatar"] },
                ],
            },
        ],
    });

    if (!project) {
        throw new ApiError(404, "Project not found");
    }

    // Calculate progress
    const totalTasks = project.tasks.length;
    const completedTasks = project.tasks.filter((t) => t.status === "completed").length;
    const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    res.json({
        success: true,
        data: {
            ...project.toJSON(),
            progress,
            totalTasks,
            completedTasks,
        },
    });
});

/**
 * Create project
 * POST /api/projects
 */
const createProject = asyncHandler(async (req, res) => {
    const { name, description, teamId, status, priority, startDate, endDate, color } = req.body;

    // Verify team exists
    const team = await Team.findByPk(teamId);
    if (!team) {
        throw new ApiError(404, "Team not found");
    }

    const project = await Project.create({
        name,
        description,
        teamId,
        status,
        priority,
        startDate,
        endDate,
        color,
        createdById: req.user.id,
    });

    const createdProject = await Project.findByPk(project.id, {
        include: [
            { model: Team, as: "team", attributes: ["id", "name"] },
            { model: User, as: "creator", attributes: ["id", "name"] },
        ],
    });

    res.status(201).json({
        success: true,
        message: "Project created successfully",
        data: createdProject,
    });
});

/**
 * Update project
 * PUT /api/projects/:id
 */
const updateProject = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { name, description, teamId, status, priority, startDate, endDate, color } = req.body;

    const project = await Project.findByPk(id);
    if (!project) {
        throw new ApiError(404, "Project not found");
    }

    if (teamId) {
        const team = await Team.findByPk(teamId);
        if (!team) {
            throw new ApiError(404, "Team not found");
        }
    }

    await project.update({
        name: name || project.name,
        description: description !== undefined ? description : project.description,
        teamId: teamId || project.teamId,
        status: status || project.status,
        priority: priority || project.priority,
        startDate: startDate !== undefined ? startDate : project.startDate,
        endDate: endDate !== undefined ? endDate : project.endDate,
        color: color || project.color,
    });

    const updatedProject = await Project.findByPk(id, {
        include: [
            { model: Team, as: "team", attributes: ["id", "name"] },
            { model: User, as: "creator", attributes: ["id", "name"] },
        ],
    });

    res.json({
        success: true,
        message: "Project updated successfully",
        data: updatedProject,
    });
});

/**
 * Delete project
 * DELETE /api/projects/:id
 */
const deleteProject = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const project = await Project.findByPk(id);
    if (!project) {
        throw new ApiError(404, "Project not found");
    }

    // Delete all associated tasks first
    await Task.destroy({ where: { projectId: id } });

    await project.destroy();

    res.json({
        success: true,
        message: "Project deleted successfully",
    });
});

module.exports = {
    getProjects,
    getProjectById,
    createProject,
    updateProject,
    deleteProject,
};
