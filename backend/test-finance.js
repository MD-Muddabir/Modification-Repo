const db = require('./models');
const { Payment, Expense, FacultySalary } = db;
const { fn, col, literal, Op } = require('sequelize');

async function test() {
    try {
        const institute_id = 1;

        console.log("Fetching payments...");
        const months = [];
        for (let i = 11; i >= 0; i--) {
            const d = new Date();
            d.setDate(1);
            d.setMonth(d.getMonth() - i);
            months.push(d.toISOString().slice(0, 7));
        }

        const revenueRows = await Payment.findAll({
            attributes: [
                [literal("TO_CHAR(payment_date, 'YYYY-MM')"), "month_year"],
                [fn("SUM", col("amount_paid")), "total"]
            ],
            where: {
                //status: "success",
                payment_date: {
                    [Op.gte]: new Date(months[0] + "-01")
                }
            },
            group: [literal("TO_CHAR(payment_date, 'YYYY-MM')")],
            order: [[literal("TO_CHAR(payment_date, 'YYYY-MM')"), "ASC"]],
            raw: true
        });

        console.log("Revenue Rows:", JSON.stringify(revenueRows, null, 2));

        const expenseRows = await Expense.findAll({
            attributes: [
                "category",
                [fn("SUM", col("amount")), "amount"]
            ],
            group: ["category"],
            order: [[fn("SUM", col("amount")), "DESC"]],
            raw: true
        });
        
        console.log("Expense Rows:", JSON.stringify(expenseRows, null, 2));

    } catch (err) {
        console.error("Test Error:", err);
    }
    process.exit(0);
}

test();
