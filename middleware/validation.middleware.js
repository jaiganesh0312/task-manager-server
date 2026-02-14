const { validationResult, body, param, query } = require("express-validator");

/**
 * Validation result handler
 */
const validate = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            message: "Validation failed",
            errors: errors.array(),
        });
    }
    next();
};

// ===== AUTH VALIDATIONS =====
const registerValidation = [
    body("name")
        .trim()
        .notEmpty()
        .withMessage("Name is required")
        .isLength({ min: 2, max: 100 })
        .withMessage("Name must be between 2 and 100 characters"),
    body("email")
        .trim()
        .notEmpty()
        .withMessage("Email is required")
        .isEmail()
        .withMessage("Invalid email format")
        .normalizeEmail(),
    body("password")
        .notEmpty()
        .withMessage("Password is required")
        .isLength({ min: 6 })
        .withMessage("Password must be at least 6 characters"),
    body("role")
        .optional()
        .isIn(["manager", "employee"])
        .withMessage("Role must be either manager or employee"),
    validate,
];

const loginValidation = [
    body("email")
        .trim()
        .notEmpty()
        .withMessage("Email is required")
        .isEmail()
        .withMessage("Invalid email format")
        .normalizeEmail(),
    body("password").notEmpty().withMessage("Password is required"),
    validate,
];

// ===== TEAM VALIDATIONS =====
const createTeamValidation = [
    body("name")
        .trim()
        .notEmpty()
        .withMessage("Team name is required")
        .isLength({ min: 2, max: 100 })
        .withMessage("Team name must be between 2 and 100 characters"),
    body("description")
        .optional()
        .trim()
        .isLength({ max: 500 })
        .withMessage("Description must be less than 500 characters"),
    body("color")
        .optional()
        .matches(/^#[0-9A-Fa-f]{6}$/)
        .withMessage("Color must be a valid hex color (e.g., #6366f1)"),
    validate,
];

// ===== PAGINATION VALIDATION =====
const paginationValidation = [
    query("page")
        .optional()
        .isInt({ min: 1 })
        .withMessage("Page must be a positive integer")
        .toInt(),
    query("limit")
        .optional()
        .isInt({ min: 1, max: 100 })
        .withMessage("Limit must be between 1 and 100")
        .toInt(),
    validate,
];

// ===== UUID PARAM VALIDATION =====
const uuidParamValidation = [
    param("id").isUUID().withMessage("Invalid ID format"),
    validate,
];

module.exports = {
    validate,
    registerValidation,
    loginValidation,
    createTeamValidation,
    paginationValidation,
    uuidParamValidation,
};
