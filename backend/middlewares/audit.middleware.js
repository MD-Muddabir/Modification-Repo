const MUTATING_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);
const IGNORED_PREFIXES = ["/api/auth/login", "/api/auth/profile", "/api/leads/page-view"];

const getResource = (path = "") => {
    const parts = path.split("?")[0].split("/").filter(Boolean);
    if (parts[0] === "api") return parts[1] || "api";
    return parts[0] || "unknown";
};

const getAction = (method, path = "") => {
    const lowerPath = path.toLowerCase();
    if (method === "POST") return lowerPath.includes("login") ? "login" : "create";
    if (method === "PUT" || method === "PATCH") return "update";
    if (method === "DELETE") return "delete";
    return method.toLowerCase();
};

const auditMiddleware = (req, res, next) => {
    res.on("finish", () => {
        if (!MUTATING_METHODS.has(req.method)) return;
        if (IGNORED_PREFIXES.some(prefix => req.originalUrl.startsWith(prefix))) return;
        if (!req.user || !["super_admin", "admin", "manager"].includes(req.user.role)) return;

        const { AuditLog } = require("../models");
        const resource = getResource(req.originalUrl);

        AuditLog.create({
            institute_id: req.user.institute_id || null,
            user_id: req.user.id || null,
            user_role: req.user.role,
            user_name: req.user.name || null,
            method: req.method,
            path: req.originalUrl,
            action: getAction(req.method, req.originalUrl),
            resource,
            status_code: res.statusCode,
            ip_address: req.ip,
            user_agent: req.get("user-agent") || null,
            request_id: req.requestId || null,
            metadata: {
                params: req.params || {},
                query: req.query || {},
                success: res.statusCode >= 200 && res.statusCode < 400,
            },
        }).catch(err => {
            if (process.env.NODE_ENV === "development") {
                console.warn("Audit log write failed:", err.message);
            }
        });
    });

    next();
};

module.exports = auditMiddleware;
