const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const OtpVerification = sequelize.define('OtpVerification', {
  email:         { type: DataTypes.STRING,  allowNull: false },
  otp:           { type: DataTypes.STRING(6), allowNull: false },
  type:          { 
      type: DataTypes.STRING(20), 
      validate: { isIn: [['registration', 'password_reset']] }, 
      allowNull: false 
  },
  is_used:       { type: DataTypes.BOOLEAN, defaultValue: false },
  attempt_count: { type: DataTypes.INTEGER, defaultValue: 0 },
  resend_count:  { type: DataTypes.INTEGER, defaultValue: 0 },
  expires_at:    { type: DataTypes.DATE,    allowNull: false },
}, { 
  tableName: 'otp_verifications', 
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

module.exports = OtpVerification;
