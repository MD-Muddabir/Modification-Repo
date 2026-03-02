const { Institute, Subscription, Plan, Student, Faculty, User, Class, Subject, Attendance, FeesStructure, Payment, Announcement, Exam, Mark, ClassSession, Expense } = require("../models");
const { Op, fn, col } = require("sequelize");

exports.getDashboardStats = async (req, res) => {
    try {
        const totalInstitutes = await Institute.count();

        const activeInstitutes = await Institute.count({
            where: { status: "active" },
        });

        const expiredInstitutes = await Institute.count({
            where: { status: "expired" },
        });

        const totalStudents = await Student.count();
        const totalFaculty = await Faculty.count();

        // Total Revenue Calculation (Active Subscriptions)
        const paidSubscriptions = await Subscription.findAll({
            where: { payment_status: "paid" },
            include: [{ model: Plan }],
        });

        let totalRevenue = 0;

        paidSubscriptions.forEach((sub) => {
            if (sub.Plan) {
                totalRevenue += parseFloat(sub.Plan.price);
            }
        });

        res.json({
            totalInstitutes,
            activeInstitutes,
            expiredInstitutes,
            totalRevenue,
            totalStudents,
            totalFaculty
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.getAllInstitutes = async (req, res) => {
    try {
        const institutes = await Institute.findAll({
            include: [{ model: Plan }],
        });

        res.json(institutes);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.updateInstituteStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        await Institute.update(
            { status },
            { where: { id } }
        );

        res.json({ message: "Institute status updated" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.deleteInstitute = async (req, res) => {
    try {
        const { id } = req.params;

        const institute = await Institute.findByPk(id);
        if (!institute) {
            return res.status(404).json({ error: "Institute not found" });
        }

        // Manual Cascade Delete due to missing onDelete:'CASCADE' in schema associations
        // We need to find all students belonging to this institute first, then delete their StudentClass entries
        const studentsInInstitute = await Student.findAll({
            attributes: ['id'],
            where: { institute_id: id }
        });
        const studentIds = studentsInInstitute.map(student => student.id);

        if (studentIds.length > 0) {
            await StudentClass.destroy({ where: { student_id: studentIds } });
        }

        await User.destroy({ where: { institute_id: id } });
        await Class.destroy({ where: { institute_id: id } });
        await Student.destroy({ where: { institute_id: id } });
        await Faculty.destroy({ where: { institute_id: id } });
        await Subject.destroy({ where: { institute_id: id } });
        await Attendance.destroy({ where: { institute_id: id } });
        await FeesStructure.destroy({ where: { institute_id: id } });
        await Payment.destroy({ where: { institute_id: id } });
        await Announcement.destroy({ where: { institute_id: id } });
        await Exam.destroy({ where: { institute_id: id } });
        await Mark.destroy({ where: { institute_id: id } });
        await Subscription.destroy({ where: { institute_id: id } });
        await ClassSession.destroy({ where: { institute_id: id } });

        await institute.destroy();

        res.json({ message: "Institute deleted successfully" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.upgradePlan = async (req, res) => {
    try {
        const { instituteId } = req.params;
        const { newPlanId, durationMonths } = req.body;

        const institute = await Institute.findByPk(instituteId);
        if (!institute) {
            return res.status(404).json({ error: "Institute not found" });
        }

        const newPlan = await Plan.findByPk(newPlanId);
        if (!newPlan) {
            return res.status(404).json({ error: "Plan not found" });
        }

        const startDate = new Date();
        const endDate = new Date();
        endDate.setMonth(endDate.getMonth() + durationMonths);

        // Create new subscription
        await Subscription.create({
            institute_id: instituteId,
            plan_id: newPlanId,
            start_date: startDate,
            end_date: endDate,
            payment_status: "paid",
            amount_paid: newPlan.price,
        });

        // Update institute current plan
        await institute.update({
            plan_id: newPlanId,
            subscription_start: startDate,
            subscription_end: endDate,
            status: "active",
        });

        res.json({
            message: "Plan upgraded successfully",
            newPlan: newPlan.name,
            validTill: endDate,
        });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.getAnalytics = async (req, res) => {
    try {

        // Monthly Revenue
        const monthlyRevenue = await Subscription.findAll({
            attributes: [
                [fn("MONTH", col("start_date")), "month"],
                [fn("SUM", col("amount_paid")), "totalRevenue"]
            ],
            where: { payment_status: "paid" },
            group: [fn("MONTH", col("start_date"))],
            order: [[fn("MONTH", col("start_date")), "ASC"]]
        });

        // Plan Distribution
        const planDistribution = await Subscription.findAll({
            attributes: [
                "plan_id",
                [fn("COUNT", col("plan_id")), "count"]
            ],
            group: ["plan_id"]
        });

        // Active vs Expired Institutes
        const activeCount = await Institute.count({ where: { status: "active" } });
        const expiredCount = await Institute.count({ where: { status: "expired" } });

        res.json({
            monthlyRevenue,
            planDistribution,
            instituteStatus: {
                active: activeCount,
                expired: expiredCount
            }
        });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};