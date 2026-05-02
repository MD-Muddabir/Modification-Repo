const { sendError } = require("../utils/apiResponse");
const { ROLES } = require("../utils/constants");

const allowRoles = (...roles) => {
    return (req, res, next) => {
        let allowed = roles.includes(req.user.role);

        // Let manager act as admin for routes requiring 'admin' 
        // Security logic is handled heavily on Frontend UI and specific controllers
        if (!allowed && req.user.role === ROLES.MANAGER && roles.includes(ROLES.ADMIN)) {
            allowed = true;
        }

        if (!allowed) {
            return sendError(res, "Access forbidden. Insufficient permissions.", 403);
        }
        next();
    };
};

module.exports = allowRoles;
