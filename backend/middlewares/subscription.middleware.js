const { Subscription } = require("../models");
const { Op } = require("sequelize");

async function checkSubscription(req, res, next) {
    // Super admin bypasses this check
    if (req.user.role === 'super_admin') return next();

    try {
        const { Institute } = require("../models");
        const institute = await Institute.findByPk(req.user.institute_id);
        
        let isExpired = false;
        if (institute && institute.subscription_end) {
            const today = new Date();
            const end = new Date(institute.subscription_end);
            end.setHours(23, 59, 59, 999);
            if (today > end) isExpired = true;
        }

        // Only enforce blocks strictly for POST/PUT/DELETE
        if (req.method !== 'GET') {
            if (institute?.status === 'pending') {
                return res.status(402).json({
                    success: false,
                    code: 'PAYMENT_REQUIRED',
                    message: 'Please complete your payment to activate your account.'
                });
            }
            if (isExpired) {
                return res.status(403).json({
                    success: false,
                    code: 'PLAN_EXPIRED_READONLY',
                    message: 'Your account is in Read-Only Mode. Please upgrade your plan to perform actions.'
                });
            }
        }

        next();
    } catch (error) {
        console.error("Subscription Check Error:", error);
        return res.status(500).json({ success: false, message: "Internal Server Error verifying subscription" });
    }
}

module.exports = checkSubscription;
