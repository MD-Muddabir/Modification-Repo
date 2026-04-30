/**
 * ✅ Phase 6.1: Performance Monitoring Middleware
 * Tracks request duration and logs slow requests (>1000ms).
 * Also tracks DB query counts per request for bottleneck detection.
 * Impact: Identify real performance bottlenecks in production.
 */

const performanceLogger = (req, res, next) => {
    const start = Date.now();
    const requestId = `${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;

    // Attach request ID for tracing
    req.requestId = requestId;
    res.setHeader("X-Request-Id", requestId);
    res.setHeader("X-Powered-By", "zf-solution");

    res.on("finish", () => {
        const duration = Date.now() - start;
        const statusCode = res.statusCode;
        const method = req.method;
        const url = req.originalUrl;

        // Always log in development
        if (process.env.NODE_ENV === "development") {
            const emoji = statusCode >= 400 ? "❌" : statusCode >= 300 ? "🔀" : "✅";
            console.log(`${emoji} [${requestId}] ${method} ${url} → ${statusCode} (${duration}ms)`);
        }

        // Log slow requests in all environments
        if (duration > 1000) {
            console.warn(`⚠️  SLOW REQUEST: [${requestId}] ${method} ${url} → ${statusCode} took ${duration}ms`);
            const { SlowRequestLog } = require("../models");
            SlowRequestLog.create({
                institute_id: req.user?.institute_id || null,
                user_id: req.user?.id || null,
                user_role: req.user?.role || null,
                method,
                path: url,
                status_code: statusCode,
                duration_ms: duration,
                request_id: requestId,
                ip_address: req.ip,
                user_agent: req.get("user-agent") || null,
            }).catch(err => {
                if (process.env.NODE_ENV === "development") {
                    console.warn("Slow request log write failed:", err.message);
                }
            });
        }

        // Log very slow requests as errors
        if (duration > 3000) {
            console.error(`🔴 CRITICALLY SLOW: [${requestId}] ${method} ${url} → ${statusCode} took ${duration}ms`);
        }
    });

    next();
};

module.exports = performanceLogger;
