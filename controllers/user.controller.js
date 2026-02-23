const { User, Team } = require("../models");
const { asyncHandler, ApiError } = require("../middleware/error.handler");
const { uploadToGCS, deleteFromGCS } = require("../services/upload.service");
const { getPaginationOptions, getPaginatedResponse } = require("../utils/pagination.helper");

/**
 * Get all users
 * GET /api/users
 */
const getUsers = asyncHandler(async (req, res) => {
    const { page, limit, offset } = getPaginationOptions(req.query);
    const { role, teamId, search } = req.query;

    const where = {};
    if (role) where.role = role;
    if (teamId) where.teamId = teamId;

    // Search by name or email
    if (search) {
        const { Op } = require("sequelize");
        where[Op.or] = [
            { name: { [Op.iLike]: `%${search}%` } },
            { email: { [Op.iLike]: `%${search}%` } },
        ];
    }

    const { count, rows: users } = await User.findAndCountAll({
        where,
        include: [{ model: Team, as: "team", attributes: ["id", "name", "color"] }],
        order: [["createdAt", "DESC"]],
        limit,
        offset,
    });

    const response = getPaginatedResponse(users, count, { page, limit });

    res.json({
        success: true,
        ...response,
    });
});

/**
 * Get user by ID
 * GET /api/users/:id
 */
const getUserById = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const user = await User.findByPk(id, {
        include: [{ model: Team, as: "team" }],
    });

    if (!user) {
        throw new ApiError(404, "User not found");
    }

    res.json({
        success: true,
        data: user,
    });
});

/**
 * Update user
 * PUT /api/users/:id
 */
const updateUser = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { name, role, teamId, isActive } = req.body;

    const user = await User.findByPk(id);
    if (!user) {
        throw new ApiError(404, "User not found");
    }

    // Only managers can change role and team
    if (req.user.role !== "manager") {
        throw new ApiError(403, "Only managers can update user roles and teams");
    }

    await user.update({
        name: name || user.name,
        role: role || user.role,
        teamId: teamId !== undefined ? teamId : user.teamId,
        isActive: isActive !== undefined ? isActive : user.isActive,
    });

    const updatedUser = await User.findByPk(id, {
        include: [{ model: Team, as: "team" }],
    });

    res.json({
        success: true,
        message: "User updated successfully",
        data: updatedUser,
    });
});

/**
 * Delete user
 * DELETE /api/users/:id
 */
const deleteUser = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const user = await User.findByPk(id);
    if (!user) {
        throw new ApiError(404, "User not found");
    }

    // Prevent self-deletion
    if (user.id === req.user.id) {
        throw new ApiError(400, "Cannot delete your own account");
    }

    await user.destroy();

    res.json({
        success: true,
        message: "User deleted successfully",
    });
});

/**
 * Get employees (for task assignment)
 * GET /api/users/employees
 */
const getEmployees = asyncHandler(async (req, res) => {
    const { teamId } = req.query;

    const where = { role: "employee", isActive: true };
    if (teamId) where.teamId = teamId;

    const employees = await User.findAll({
        where,
        attributes: ["id", "name", "email", "avatar"],
        include: [{ model: Team, as: "team", attributes: ["id", "name"] }],
        order: [["name", "ASC"]],
    });

    res.json({
        success: true,
        data: employees,
    });
});

/**
 * Update current user profile
 * PUT /api/users/profile
 */
const updateProfile = asyncHandler(async (req, res) => {
    const { name } = req.body;

    const user = await User.findByPk(req.user.id);
    if (!user) {
        throw new ApiError(404, "User not found");
    }

    await user.update({
        name: name || user.name
    });

    const updatedUser = await User.findByPk(user.id, {
        attributes: { exclude: ['password'] },
        include: [{ model: Team, as: "team" }]
    });

    res.json({
        success: true,
        message: "Profile updated successfully",
        data: updatedUser,
    });
});

/**
 * Update current user password
 * PUT /api/users/profile/password
 */
const updatePassword = asyncHandler(async (req, res) => {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
        throw new ApiError(400, "Current and new password are required");
    }

    const user = await User.findByPk(req.user.id);
    if (!user) {
        throw new ApiError(404, "User not found");
    }

    // Verify current password
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
        throw new ApiError(400, "Invalid current password");
    }

    // Update to new password - the User model hooks should hash it automatically if implemented correctly
    // or we can hash it directly here depending on the implementation
    user.password = newPassword;
    await user.save();

    res.json({
        success: true,
        message: "Password updated successfully"
    });
});

/**
 * Update current user avatar
 * PUT /api/users/profile/avatar
 */
const updateAvatar = asyncHandler(async (req, res) => {
    const file = req.file;

    if (!file) {
        throw new ApiError(400, "No image file provided");
    }

    const user = await User.findByPk(req.user.id);
    if (!user) {
        throw new ApiError(404, "User not found");
    }

    try {
        // Upload to GCS
        const publicUrl = await uploadToGCS(
            file.buffer,
            file.originalname,
            file.mimetype,
            `avatars/${user.id}/`
        );

        // Delete old avatar if it exists and is from GCS
        if (user.avatar && user.avatar.includes('storage.googleapis.com')) {
            await deleteFromGCS(user.avatar);
        }

        // Update user model
        user.avatar = publicUrl;
        await user.save();

        res.json({
            success: true,
            message: "Avatar updated successfully",
            data: {
                avatar: publicUrl
            }
        });
    } catch (error) {
        throw new ApiError(500, `Failed to upload avatar: ${error.message}`);
    }
});

module.exports = {
    getUsers,
    getUserById,
    updateUser,
    deleteUser,
    getEmployees,
    updateProfile,
    updatePassword,
    updateAvatar,
};
