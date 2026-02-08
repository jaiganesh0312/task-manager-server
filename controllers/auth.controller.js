const { User, RefreshToken } = require("../models");
const authService = require("../services/auth.service");

const register = async (req, res) => {
    try {
        const { name, email, password, role } = req.body;

        // Check if user already exists
        const existingUser = await User.findOne({ where: { email } });
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: "User with this email already exists",
            });
        }

        // Create new user
        const user = await User.create({
            name,
            email,
            password,
            role: role || "employee",
        });

        // Generate tokens
        const accessToken = authService.generateAccessToken(user);
        const refreshToken = authService.generateRefreshToken();
        const expiresAt = authService.getRefreshTokenExpiry();

        // Save refresh token
        await RefreshToken.create({
            token: refreshToken,
            expiresAt,
            UserId: user.id,
        });

        res.status(201).json({
            success: true,
            data: {
                user: user.toJSON(),
                accessToken,
                refreshToken,
            },
        });
    } catch (error) {
        console.error("Register Error:", error);
        res.status(500).json({
            success: false,
            message: "Error registering user",
            error: error.message,
        });
    }
};

const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Find user
        const user = await User.findOne({ where: { email } });
        if (!user) {
            return res.status(401).json({
                success: false,
                message: "Invalid credentials",
            });
        }

        // Check password
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: "Invalid credentials",
            });
        }

        // Generate tokens
        const accessToken = authService.generateAccessToken(user);
        const refreshToken = authService.generateRefreshToken();
        const expiresAt = authService.getRefreshTokenExpiry();

        // Save refresh token
        await RefreshToken.create({
            token: refreshToken,
            expiresAt,
            UserId: user.id,
        });

        res.json({
            success: true,
            data: {
                user: user.toJSON(),
                accessToken,
                refreshToken,
            },
        });
    } catch (error) {
        console.error("Login Error:", error);
        res.status(500).json({
            success: false,
            message: "Error logging in",
            error: error.message,
        });
    }
};

const refreshToken = async (req, res) => {
    try {
        const { refreshToken } = req.body;

        if (!refreshToken) {
            return res.status(400).json({
                success: false,
                message: "Refresh token is required",
            });
        }

        // Check if token exists in DB and is valid
        const storedToken = await RefreshToken.findOne({
            where: { token: refreshToken },
            include: [{ model: User }],
        });

        if (!storedToken || storedToken.isRevoked) {
            return res.status(401).json({
                success: false,
                message: "Invalid or revoked refresh token",
            });
        }

        // Check if expired
        if (new Date() > storedToken.expiresAt) {
            await storedToken.destroy();
            return res.status(401).json({
                success: false,
                message: "Refresh token expired",
            });
        }

        // Get user from stored token
        const user = storedToken.User;
        if (!user) {
            return res.status(401).json({
                success: false,
                message: "User not found",
            });
        }

        // Generate new access token
        const accessToken = authService.generateAccessToken(user);

        // Optionally rotate refresh token here (create new one, delete old one)
        // For now, keeping the same refresh token until it expires

        res.json({
            success: true,
            data: {
                accessToken,
            },
        });
    } catch (error) {
        console.error("Refresh Token Error:", error);
        res.status(500).json({
            success: false,
            message: "Error refreshing token",
            error: error.message,
        });
    }
};

const logout = async (req, res) => {
    try {
        const { refreshToken } = req.body;

        if (refreshToken) {
            await RefreshToken.destroy({
                where: { token: refreshToken },
            });
        }

        res.json({
            success: true,
            message: "Logged out successfully",
        });
    } catch (error) {
        console.error("Logout Error:", error);
        res.status(500).json({
            success: false,
            message: "Error logging out",
            error: error.message,
        });
    }
};

const getProfile = async (req, res) => {
    try {
        res.json({
            success: true,
            data: req.user,
        });
    } catch (error) {
        console.error("Get Profile Error:", error);
        res.status(500).json({
            success: false,
            message: "Error fetching profile",
            error: error.message,
        });
    }
};

module.exports = {
    register,
    login,
    refreshToken,
    logout,
    getProfile,
};
