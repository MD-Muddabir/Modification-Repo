const { Institute, User, Plan, Subscription } = require("../models");
const { hashPassword, comparePassword } = require("../utils/hashPassword");

exports.registerInstitute = async (data) => {
    const { instituteName, email, password, phone, planId, address } = data;

    if (!instituteName || !email || !password || !phone || !address || !planId) {
        throw new Error("All fields are required, including plan selection.");
    }

    let subscriptionStart = null;
    let subscriptionEnd = null;
    let instituteStatus = "pending";
    let plan = null;

    if (planId) {
        plan = await Plan.findByPk(planId);
        if (plan) {
            subscriptionStart = new Date();
            const endDate = new Date();
            endDate.setDate(endDate.getDate() + 30); // Default 30 days
            subscriptionEnd = endDate;

            // If free plan, activate immediately
            if (Number(plan.price) === 0) {
                instituteStatus = "active";
            }
        }
    }

    // Create Institute
    const institute = await Institute.create({
        name: instituteName,
        email,
        phone,
        address,
        plan_id: planId || null,
        status: instituteStatus,
        subscription_start: subscriptionStart,
        subscription_end: subscriptionEnd,
    });

    // Hash Password
    const hashedPassword = await hashPassword(password);

    // Create Admin User
    const adminUser = await User.create({
        institute_id: institute.id,
        role: "admin",
        name: instituteName, // Use institute name as admin name initially
        email,
        phone,
        password_hash: hashedPassword,
        status: "active",
    });

    // Create Pending Subscription
    if (planId && plan) {
        await Subscription.create({
            institute_id: institute.id,
            plan_id: planId,
            start_date: subscriptionStart,
            end_date: subscriptionEnd,
            payment_status: instituteStatus === "active" ? "paid" : "pending", // Mark as paid if active (free)
            amount_paid: instituteStatus === "active" ? 0 : 0,
        });
    }

    return { institute, adminUser };
};

exports.loginUser = async (email, password) => {
    const user = await User.findOne({
        where: { email },
        include: [{ model: Institute, attributes: ['name'] }]
    });

    if (!user) throw new Error("User not found");

    const isMatch = await comparePassword(password, user.password_hash);

    if (!isMatch) throw new Error("Invalid credentials");

    return user;
};

exports.changePassword = async (userId, oldPassword, newPassword) => {
    const user = await User.findByPk(userId);
    if (!user) throw new Error("User not found");

    const isMatch = await comparePassword(oldPassword, user.password_hash);
    if (!isMatch) throw new Error("Incorrect old password");

    const hashedPassword = await hashPassword(newPassword);
    await user.update({ password_hash: hashedPassword });

    return true;
};

exports.getProfile = async (userId) => {
    const user = await User.findByPk(userId, {
        attributes: ['id', 'name', 'email', 'role', 'institute_id'],
        include: [{ model: Institute, attributes: ['name'] }]
    });
    if (!user) throw new Error("User not found");
    return user;
};

exports.updateProfile = async (userId, data) => {
    const user = await User.findByPk(userId);
    if (!user) throw new Error("User not found");

    await user.update(data);
    return {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        institute_id: user.institute_id
    };
};
