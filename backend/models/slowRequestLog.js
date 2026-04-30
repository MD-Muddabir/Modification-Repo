const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const SlowRequestLog = sequelize.define("SlowRequestLog", {
    institute_id: DataTypes.INTEGER,
    user_id: DataTypes.INTEGER,
    user_role: DataTypes.STRING(30),
    method: DataTypes.STRING(10),
    path: DataTypes.STRING(500),
    status_code: DataTypes.INTEGER,
    duration_ms: DataTypes.INTEGER,
    request_id: DataTypes.STRING(80),
    ip_address: DataTypes.STRING(80),
    user_agent: DataTypes.TEXT,
}, {
    tableName: "slow_request_logs",
    timestamps: true,
    updatedAt: false,
});

module.exports = SlowRequestLog;
