const { Institute } = require("../models");
const { sendError } = require("../utils/apiResponse");
const { ROLES, STATUS } = require("../utils/constants");

// Cache for 60 seconds
const subscriptionCache = new Map();

async function checkSubscription(req, res, next) {
    // Super admin bypasses this check
    if (req.user.role === ROLES.SUPER_ADMIN) return next();

    try {
        const instituteId = req.user.institute_id;
        let subData = subscriptionCache.get(instituteId);

        if (!subData || Date.now() - subData.time > 60000) {
            const institute = await Institute.findByPk(instituteId, { attributes: ['status', 'subscription_end'] });
            if (!institute) {
                return sendError(res, "Institute not found", 404);
            }

            let isExpired = false;
            if (institute.subscription_end) {
                const today = new Date();
                const end = new Date(institute.subscription_end);
                end.setHours(23, 59, 59, 999);
                if (today > end) isExpired = true;
            }

            subData = {
                status: institute.status,
                isExpired,
                time: Date.now()
            };
            subscriptionCache.set(instituteId, subData);
        }

        // Only enforce blocks strictly for POST/PUT/DELETE
        if (req.method !== 'GET') {
            if (subData.status === STATUS.PENDING) {
                return sendError(res, 'Please complete your payment to activate your account.', 402, { code: 'PAYMENT_REQUIRED' });
            }
            if (subData.isExpired) {
                return sendError(res, 'Your account is in Read-Only Mode. Please upgrade your plan to perform actions.', 403, { code: 'PLAN_EXPIRED_READONLY' });
            }
        }

        next();
    } catch (error) {
        next(error);
    }
}

module.exports = checkSubscription;
module.exports.clearSubscriptionCache = (id) => subscriptionCache.delete(id);
