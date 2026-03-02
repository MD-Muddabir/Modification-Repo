const allowRoles = (...roles) => {
    return (req, res, next) => {
        let allowed = roles.includes(req.user.role);

        // Let manager act as admin for routes requiring 'admin' 
        // Security logic is handled heavily on Frontend UI and specific controllers
        if (!allowed && req.user.role === 'manager' && roles.includes('admin')) {
            allowed = true;
        }

        if (!allowed) {
            return res.status(403).json({ error: "Access forbidden" });
        }
        next();
    };
};

module.exports = allowRoles;
