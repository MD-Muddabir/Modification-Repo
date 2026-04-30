const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const AuditLog = sequelize.define("AuditLog", {
    institute_id: DataTypes.INTEGER,
    user_id: DataTypes.INTEGER,
    user_role: DataTypes.STRING(30),
    user_name: DataTypes.STRING,
    method: DataTypes.STRING(10),
    path: DataTypes.STRING(500),
    action: DataTypes.STRING(80),
    resource: DataTypes.STRING(80),
    status_code: DataTypes.INTEGER,
    ip_address: DataTypes.STRING(80),
    user_agent: DataTypes.TEXT,
    request_id: DataTypes.STRING(80),
    metadata: {
        type: DataTypes.JSONB,
        defaultValue: {},
    },
}, {
    tableName: "audit_logs",
    timestamps: true,
    updatedAt: false,
});

module.exports = AuditLog;
