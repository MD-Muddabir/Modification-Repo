// backend/middlewares/firstLoginCheck.js
const { User } = require('../models');

const firstLoginCheck = async (req, res, next) => {
    try {
        // Only applies to authenticated students
        if (req.user && req.user.role === 'student') {
            const user = await User.findByPk(req.user.id);
            if (user && user.is_first_login) {
                return res.status(403).json({
                    success: false,
                    is_first_login: true,
                    message: "You must change your password before accessing the system."
                });
            }
        }
        next();
    } catch (error) {
        res.status(500).json({ success: false, message: "Error checking login status" });
    }
};

module.exports = firstLoginCheck;
