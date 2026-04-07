const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const RazorpayOrder = sequelize.define("RazorpayOrder", {
    institute_id: { type: DataTypes.INTEGER, allowNull: true },
    order_type: { 
        type: DataTypes.STRING(20), 
        validate: { isIn: [['subscription', 'student_fee', 'addon']] }, 
        allowNull: false 
    },
    reference_id: { type: DataTypes.INTEGER, allowNull: true },
    razorpay_order_id: { type: DataTypes.STRING(100), unique: true, allowNull: false },
    amount: { type: DataTypes.INTEGER, allowNull: false }, // stored in paise
    amount_display: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
    currency: { type: DataTypes.STRING(10), defaultValue: 'INR' },
    receipt: { type: DataTypes.STRING(100), unique: true, allowNull: true },
    status: { 
        type: DataTypes.STRING(20), 
        validate: { isIn: [['pending', 'paid', 'failed', 'cancelled']] }, 
        defaultValue: 'pending' 
    },
    notes: { type: DataTypes.JSONB, allowNull: true },
}, {
    tableName: "razorpay_orders",
    timestamps: true
});

module.exports = RazorpayOrder;
