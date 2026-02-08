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



module.exports = {
    validate,
    registerValidation,
    loginValidation,
};
