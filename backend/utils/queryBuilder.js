const { Op } = require('sequelize');

/**
 * Query Builder Helper
 * Automatically injects the institute_id to ensure multi-tenant isolation.
 */

/**
 * Build a standard where clause with institute_id included.
 * @param {Object} req - Express request object containing req.user
 * @param {Object} extraConditions - Additional query conditions to merge
 * @returns {Object} Sequelize where clause object
 */
const buildQuery = (req, extraConditions = {}) => {
    const where = {};

    // Critical: Always enforce multi-tenant isolation
    if (req.user && req.user.institute_id) {
        where.institute_id = req.user.institute_id;
    }

    // Merge extra conditions safely
    return { ...where, ...extraConditions };
};

/**
 * Get standard pagination parameters for Sequelize
 * @param {Object} req - Express request object containing req.query
 * @param {number} defaultLimit - Default limit if not provided
 * @param {number} maxLimit - Maximum allowed limit to prevent overwhelming the DB
 * @returns {Object} { limit, offset, order }
 */
const getPagination = (req, defaultLimit = 20, maxLimit = 100) => {
    let limit = parseInt(req.query.limit, 10) || defaultLimit;
    if (limit > maxLimit) limit = maxLimit;
    if (limit < 1) limit = defaultLimit;

    const page = parseInt(req.query.page, 10) || 1;
    const offset = (page - 1) * limit;

    let order = [['createdAt', 'DESC']]; // default order
    if (req.query.sortBy) {
        const sortDirection = req.query.sortDesc === 'true' ? 'DESC' : 'ASC';
        order = [[req.query.sortBy, sortDirection]];
    }

    return { limit, offset, order };
};

/**
 * Build a search filter for LIKE queries across multiple fields
 * @param {Array<string>} fields - Fields to search within
 * @param {string} searchTerm - The search term
 * @returns {Object|null} Sequelize Op.or object or null if no searchTerm
 */
const buildSearchFilter = (fields, searchTerm) => {
    if (!searchTerm || !fields || fields.length === 0) return null;

    const orConditions = fields.map(field => ({
        [field]: {
            [Op.like]: `%${searchTerm}%`
        }
    }));

    return {
        [Op.or]: orConditions
    };
};

module.exports = {
    buildQuery,
    getPagination,
    buildSearchFilter
};
