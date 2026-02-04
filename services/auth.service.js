const jwt = require("jsonwebtoken");
const { v4: uuidv4, v7: uuidv7 } = require("uuid");

const JWT_SECRET = process.env.JWT_SECRET || "your_super_secret_jwt_key";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "15m";
const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || "7d";

/**
 * Generate access token
 */
const generateAccessToken = (user) => {
    return jwt.sign(
        {
            id: user.id,
            email: user.email,
            role: user.role,
            teamId: user.teamId,
        },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRES_IN }
    );
};

/**
 * Generate refresh token
 */
const generateRefreshToken = () => {
    return uuidv7();
};

/**
 * Calculate refresh token expiry date
 */
const getRefreshTokenExpiry = () => {
    const duration = JWT_REFRESH_EXPIRES_IN;
    const value = parseInt(duration);
    const unit = duration.slice(-1);

    const now = new Date();
    switch (unit) {
        case "d":
            now.setDate(now.getDate() + value);
            break;
        case "h":
            now.setHours(now.getHours() + value);
            break;
        case "m":
            now.setMinutes(now.getMinutes() + value);
            break;
        default:
            now.setDate(now.getDate() + 7);
    }
    return now;
};

/**
 * Verify access token
 */
const verifyAccessToken = (token) => {
    try {
        return jwt.verify(token, JWT_SECRET);
    } catch (error) {
        return null;
    }
};

/**
 * Decode token without verification
 */
const decodeToken = (token) => {
    try {
        return jwt.decode(token);
    } catch (error) {
        return null;
    }
};

module.exports = {
    generateAccessToken,
    generateRefreshToken,
    getRefreshTokenExpiry,
    verifyAccessToken,
    decodeToken,
    JWT_SECRET,
};
