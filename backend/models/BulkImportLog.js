// backend/models/BulkImportLog.js
// Stores a record of every bulk import attempt for audit trail and error recovery.
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  return sequelize.define('BulkImportLog', {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    institute_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    import_type: {
      // 'students' | 'parents' | 'faculty'
      type: DataTypes.STRING(20),
      allowNull: false,
    },
    imported_by: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    total_rows: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    success_rows: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    failed_rows: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    error_report: {
      // JSONB array of { row, errors[] } objects
      type: DataTypes.JSONB,
    },
    status: {
      // 'completed' | 'partial' | 'failed'
      type: DataTypes.STRING(20),
      defaultValue: 'completed',
    },
  }, {
    tableName: 'bulk_import_logs',
    timestamps: true,
    updatedAt: false,   // log entries are never updated
    createdAt: 'created_at',
  });
};
