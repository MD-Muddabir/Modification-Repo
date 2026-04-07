const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const StudentFeePayment = sequelize.define("StudentFeePayment", {
    institute_id: { type: DataTypes.INTEGER, allowNull: false },
    student_fee_id: { type: DataTypes.INTEGER, allowNull: false },
    student_id: { type: DataTypes.INTEGER, allowNull: false },
    razorpay_order_id: { type: DataTypes.STRING(100), allowNull: true },
    razorpay_payment_id: { type: DataTypes.STRING(100), allowNull: true },
    amount_paid: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
    payment_method: { type: DataTypes.STRING(50), allowNull: true },
    payment_status: { 
        type: DataTypes.STRING(20), 
        validate: { isIn: [['pending','paid','failed']] }, 
        defaultValue: 'pending' 
    },
    receipt_number: { type: DataTypes.STRING(50), unique: true, allowNull: true },
    paid_at: { type: DataTypes.DATE, allowNull: true },
    collected_by: { type: DataTypes.INTEGER, allowNull: true }, // admin/manager
}, {
    tableName: "student_fee_payments",
    timestamps: true
});

module.exports = StudentFeePayment;
