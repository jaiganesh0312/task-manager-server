const { verifyAccessToken } = require("../services/auth.service");
const { User } = require("../models");

/**
 * Verify JWT token middleware
 */
const verifyToken = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({
                success: false,
                message: "Access token is required",
            });
        }

        const token = authHeader.split(" ")[1];
        const decoded = verifyAccessToken(token);

        if (!decoded) {
            return res.status(401).json({
                success: false,
                message: "Invalid or expired access token",
            });
        }

        // Get fresh user data
        const user = await User.findByPk(decoded.id);

        if (!user || !user.isActive) {
            return res.status(401).json({
                success: false,
                message: "User not found or inactive",
            });
        }

        req.user = user;
        next();
    } catch (error) {
        console.error("Auth middleware error:", error);
        return res.status(500).json({
            success: false,
            message: "Authentication error",
        });
    }
};

/**
 * Check if user is a Manager
 */
const isManager = (req, res, next) => {
    if (req.user.role !== "manager") {
        return res.status(403).json({
            success: false,
            message: "Access denied. Manager role required.",
        });
    }
    next();
};

/**
 * Check if user is an Employee
 */
const isEmployee = (req, res, next) => {
    if (req.user.role !== "employee") {
        return res.status(403).json({
            success: false,
            message: "Access denied. Employee role required.",
        });
    }
    next();
};

/**
 * Check if user has one of the allowed roles
 */
const hasRole = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: `Access denied. Required roles: ${roles.join(", ")}`,
            });
        }
        next();
    };
};

module.exports = {
    verifyToken,
    isManager,
    isEmployee,
    hasRole,
};
