const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Invoice = sequelize.define("Invoice", {
    institute_id: { type: DataTypes.INTEGER, allowNull: false },
    payment_id: { type: DataTypes.INTEGER, allowNull: true },
    invoice_type: { 
        type: DataTypes.STRING(20), 
        validate: { isIn: [['subscription', 'student_fee', 'refund']] }, 
        allowNull: false 
    },
    invoice_number: { type: DataTypes.STRING(50), unique: true, allowNull: false },
    invoice_date: { type: DataTypes.DATEONLY, allowNull: false },
    subtotal: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
    tax_percent: { type: DataTypes.DECIMAL(5, 2), defaultValue: 18.00 },
    tax_amount: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
    total_amount: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
    pdf_url: { type: DataTypes.STRING(500), allowNull: true },
}, {
    tableName: "invoices",
    timestamps: true
});

module.exports = Invoice;
