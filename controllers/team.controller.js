const { Team, User, Project } = require("../models");
const { asyncHandler, ApiError } = require("../middleware/error.handler");
const { getPaginationOptions, getPaginatedResponse } = require("../utils/pagination.helper");

/**
 * Get all teams
 * GET /api/teams
 */
const getTeams = asyncHandler(async (req, res) => {
    const { page, limit, offset } = getPaginationOptions(req.query);

    // If employee, return only their team
    const where = {};
    if (req.user.role === "employee") {
        if (!req.user.teamId) {
            return res.json({ success: true, data: [], meta: { total: 0, page: 1, limit: 10, totalPages: 0 } });
        }
        where.id = req.user.teamId;
    }

    const { count, rows: teams } = await Team.findAndCountAll({
        where,
        include: [
            { model: User, as: "manager", attributes: ["id", "name", "email", "avatar"] },
            { model: User, as: "members", attributes: ["id", "name", "email", "avatar", "role"] },
        ],
        order: [["createdAt", "DESC"]],
        limit,
        offset,
    });

    const response = getPaginatedResponse(teams, count, { page, limit });

    res.json({
        success: true,
        ...response,
    });
});

/**
 * Get team by ID
 * GET /api/teams/:id
 */
const getTeamById = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const team = await Team.findByPk(id, {
        include: [
            { model: User, as: "manager", attributes: ["id", "name", "email", "avatar"] },
            { model: User, as: "members", attributes: ["id", "name", "email", "avatar", "role"] },
            {
                model: Project,
                as: "projects",
                attributes: ["id", "name", "status", "priority", "startDate", "endDate"],
            },
        ],
    });

    if (!team) {
        throw new ApiError(404, "Team not found");
    }

    res.json({
        success: true,
        data: team,
    });
});

/**
 * Create team
 * POST /api/teams
 */
const createTeam = asyncHandler(async (req, res) => {
    const { name, description, color } = req.body;

    const team = await Team.create({
        name,
        description,
        color,
        managerId: req.user.id,
    });

    const createdTeam = await Team.findByPk(team.id, {
        include: [
            { model: User, as: "manager", attributes: ["id", "name", "email"] },
        ],
    });

    res.status(201).json({
        success: true,
        message: "Team created successfully",
        data: createdTeam,
    });
});

/**
 * Update team
 * PUT /api/teams/:id
 */
const updateTeam = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { name, description, color, managerId } = req.body;

    const team = await Team.findByPk(id);
    if (!team) {
        throw new ApiError(404, "Team not found");
    }

    await team.update({
        name: name || team.name,
        description: description !== undefined ? description : team.description,
        color: color || team.color,
        managerId: managerId || team.managerId,
    });

    const updatedTeam = await Team.findByPk(id, {
        include: [
            { model: User, as: "manager", attributes: ["id", "name", "email"] },
            { model: User, as: "members", attributes: ["id", "name", "email", "role"] },
        ],
    });

    res.json({
        success: true,
        message: "Team updated successfully",
        data: updatedTeam,
    });
});

/**
 * Delete team
 * DELETE /api/teams/:id
 */
const deleteTeam = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const team = await Team.findByPk(id);
    if (!team) {
        throw new ApiError(404, "Team not found");
    }

    // Check if team has projects
    const projectCount = await Project.count({ where: { teamId: id } });
    if (projectCount > 0) {
        throw new ApiError(400, "Cannot delete team with existing projects");
    }

    // Remove team assignment from members
    await User.update({ teamId: null }, { where: { teamId: id } });

    await team.destroy();

    res.json({
        success: true,
        message: "Team deleted successfully",
    });
});

/**
 * Add member to team
 * POST /api/teams/:id/members
 */
const addMember = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { userId } = req.body;

    const team = await Team.findByPk(id);
    if (!team) {
        throw new ApiError(404, "Team not found");
    }

    const user = await User.findByPk(userId);
    if (!user) {
        throw new ApiError(404, "User not found");
    }

    await user.update({ teamId: id });

    res.json({
        success: true,
        message: "Member added to team successfully",
    });
});

/**
 * Remove member from team
 * DELETE /api/teams/:id/members/:userId
 */
const removeMember = asyncHandler(async (req, res) => {
    const { id, userId } = req.params;

    const team = await Team.findByPk(id);
    if (!team) {
        throw new ApiError(404, "Team not found");
    }

    const user = await User.findByPk(userId);
    if (!user) {
        throw new ApiError(404, "User not found");
    }

    if (user.teamId !== id) {
        throw new ApiError(400, "User is not a member of this team");
    }

    await user.update({ teamId: null });

    res.json({
        success: true,
        message: "Member removed from team successfully",
    });
});

module.exports = {
    getTeams,
    getTeamById,
    createTeam,
    updateTeam,
    deleteTeam,
    addMember,
    removeMember,
};
