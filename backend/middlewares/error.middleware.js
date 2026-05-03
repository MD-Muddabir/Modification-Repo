/**
 * Global Error Handling Middleware
 * Centralized error handler for all Express errors
 */

const { sendError, sendValidationError } = require('../utils/apiResponse');

const errorHandler = (err, req, res, next) => {
    if (process.env.NODE_ENV !== "production") {
        console.error("❌ Global Error:", err);
    }

    // Sequelize Validation errors
    if (err.name === "SequelizeValidationError") {
        const errors = err.errors.map((e) => ({ field: e.path, message: e.message }));
        return sendValidationError(res, errors);
    }

    // Sequelize unique constraint errors
    if (err.name === "SequelizeUniqueConstraintError") {
        return sendError(res, `Duplicate entry: ${err.errors[0]?.path || ''}`, 409);
    }

    // JWT errors
    if (err.name === "JsonWebTokenError") {
        return sendError(res, "Invalid token", 401);
    }

    if (err.name === "TokenExpiredError") {
        return sendError(res, "Token expired", 401);
    }

    // Joi Validation Error
    if (err.isJoi) {
        const errors = err.details.map((e) => ({ field: e.path.join('.'), message: e.message }));
        return sendValidationError(res, errors);
    }

    // Multer file size error
    if (err.code === "LIMIT_FILE_SIZE") {
        return sendError(res, "File size too large. Maximum 5MB allowed.", 400);
    }

    // Default error
    const statusCode = err.status || 500;
    const message = statusCode === 500 && process.env.NODE_ENV === "production" ? "Internal server error" : (err.message || "Internal server error");
    const stack = process.env.NODE_ENV === "development" ? { stack: err.stack } : null;

    return sendError(res, message, statusCode, stack);
};

module.exports = errorHandler;
