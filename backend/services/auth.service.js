const { Institute, User, Plan, Subscription } = require("../models");
const { hashPassword, comparePassword } = require("../utils/hashPassword");

exports.registerInstitute = async (data) => {
    // Handle both snake_case and camelCase inputs
    const instituteName = data.instituteName || data.name;
    const planId = data.planId || data.plan_id;
    const { email, password, phone, address, city, state, pincode, zip_code } = data;
    const finalZipCode = zip_code || pincode; // Handle both keys

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
            } else {
                // If paid plan, subscription starts AFTER payment
                subscriptionStart = null;
                subscriptionEnd = null;
            }
        }
    }

    // Create Institute
    const institute = await Institute.create({
        name: instituteName,
        email,
        phone,
        address,
        city,
        state,
        zip_code: finalZipCode,
        plan_id: planId || null,
        status: instituteStatus,
        subscription_start: instituteStatus === 'active' ? subscriptionStart : null,
        subscription_end: instituteStatus === 'active' ? subscriptionEnd : null,
        // Snapshot limits
        current_limit_students: plan ? plan.max_students : 50,
        current_limit_faculty: plan ? plan.max_faculty : 5,
        current_limit_classes: plan ? plan.max_classes : 5,
        current_limit_admins: plan ? plan.max_admin_users : 1,

        // Snapshot features
        current_feature_attendance: plan ? plan.feature_attendance : 'basic',
        current_feature_fees: plan ? plan.feature_fees : false,
        current_feature_reports: plan ? plan.feature_reports : 'none',
        current_feature_announcements: plan ? plan.feature_announcements : false,
        current_feature_export: plan ? plan.feature_export : false,
        current_feature_whatsapp: plan ? plan.feature_whatsapp : false,
        current_feature_custom_branding: plan ? plan.feature_custom_branding : false,
        current_feature_multi_branch: plan ? plan.feature_multi_branch : false,
        current_feature_api_access: plan ? plan.feature_api_access : false,
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
        const paymentStatus = instituteStatus === "active" ? "paid" : "pending";
        const amountPaid = instituteStatus === "active" ? 0 : 0; // Even if paid (free), amount is 0. If pending (paid), amount is 0 until payment.

        await Subscription.create({
            institute_id: institute.id,
            plan_id: planId,
            start_date: subscriptionStart,
            end_date: subscriptionEnd, // This might be null if pending
            payment_status: paymentStatus,
            amount_paid: amountPaid,
        });
    }

    return { institute, adminUser };
};

exports.loginUser = async (email, password) => {
    const user = await User.findOne({
        where: { email },
        include: [
            {
                model: Institute,
                include: [{ model: Plan }] // Include Plan to check limits
            }
        ]
    });

    if (!user) throw new Error("User not found");

    // Check Password match
    const isMatch = await comparePassword(password, user.password_hash);
    if (!isMatch) throw new Error("Invalid credentials");

    // --- Admin Limit Enforcement ---
    // If user is an admin, check if they are within the allowed limit (Grandfathering Logic)
    if (user.role === 'admin' && user.Institute) {
        const institute = user.Institute;
        // Determine Limit (Snapshot > Plan)
        const adminLimit = institute.current_limit_admins || (institute.Plan ? institute.Plan.max_admin_users : 1);

        // Fetch all active admins sorted by creation time (Oldest first)
        const allAdmins = await User.findAll({
            where: {
                institute_id: user.institute_id,
                role: 'admin',
                status: 'active'
            },
            order: [['created_at', 'ASC']],
            attributes: ['id', 'created_at']
        });

        // The first 'adminLimit' users are allowed. Others are blocked.
        const allowedAdmins = allAdmins.slice(0, adminLimit);
        const isAllowed = allowedAdmins.some(admin => admin.id === user.id);

        if (!isAllowed) {
            throw new Error(`Your plan allows only ${adminLimit} admin(s). You are restricted as an additional admin. Please upgrade your plan.`);
        }
    }

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
        include: [{
            model: Institute,
            attributes: ['name', 'status', 'plan_id'],
            include: [{ model: Plan, attributes: ['id', 'name', 'price'] }] // Include Plan details
        }]
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
