Great! Here's a complete phase-by-phase implementation guide for adding the Free Trial system into your EduManage Pro project.

🗺️ Overview — Total 5 Phases
Phase 1 → Database & Backend Foundation
Phase 2 → Trial Logic & Restrictions
Phase 3 → Frontend (Web + App)
Phase 4 → Automation (Emails, WhatsApp, SMS)
Phase 5 → Analytics & Conversion Tracking
Estimated total time: 3–4 weeks for a solo developer.

✅ PHASE 1 — Database & Backend Foundation
Duration: 3–4 days
1.1 — Add Trial Fields to Your Database
sql-- Add to your institutes / users table
ALTER TABLE institutes ADD COLUMN plan_type ENUM(
  'free_trial', 'starter', 'basic', 'professional', 'enterprise'
) DEFAULT 'free_trial';

ALTER TABLE institutes ADD COLUMN platform_type ENUM(
  'web', 'web_mobile'
) DEFAULT 'web';

ALTER TABLE institutes ADD COLUMN billing_cycle ENUM(
  'monthly', 'yearly'
) DEFAULT 'monthly';

ALTER TABLE institutes ADD COLUMN trial_start_date DATE;
ALTER TABLE institutes ADD COLUMN trial_end_date DATE;
ALTER TABLE institutes ADD COLUMN trial_plan ENUM(
  'starter', 'basic', 'professional', 'enterprise'
);
ALTER TABLE institutes ADD COLUMN trial_status ENUM(
  'active', 'expired', 'converted', 'freemium'
) DEFAULT 'active';

ALTER TABLE institutes ADD COLUMN trial_reminder_day INT DEFAULT 0;
-- tracks which reminder was last sent (1, 3, 7, 10, 13)

ALTER TABLE institutes ADD COLUMN is_data_deleted BOOLEAN DEFAULT FALSE;
ALTER TABLE institutes ADD COLUMN data_delete_scheduled_at DATE;
1.2 — Trial Limits Config (Keep in a config file)
javascript// config/trialLimits.js

const TRIAL_LIMITS = {
  starter: {
    days: 14,
    max_students: 20,
    max_admins: 2,
    max_faculty: 5,
    features: 12,
    mobile_app: true,
    data_export: false,
    api_access: false,
    watermark: true,
  },
  basic: {
    days: 14,
    max_students: 50,
    max_admins: 4,
    max_faculty: 15,
    features: 18,
    mobile_app: true,
    data_export: false,
    api_access: false,
    watermark: true,
  },
  professional: {
    days: 14,
    max_students: 100,
    max_admins: 8,
    max_faculty: 30,
    features: 24,
    mobile_app: true,
    data_export: false,
    api_access: false,
    watermark: true,
  },
  enterprise: {
    days: 15,
    max_students: 200,
    max_admins: 10,
    max_faculty: 50,
    features: 26,
    mobile_app: true,
    data_export: false,
    api_access: false,
    watermark: true,
  }
};

const FREEMIUM_LIMITS = {
  max_students: 10,
  max_faculty: 2,
  features: ['attendance', 'notes', 'announcements'],
  mobile_app: false,
  watermark: true,
};

module.exports = { TRIAL_LIMITS, FREEMIUM_LIMITS };

✅ PHASE 2 — Trial Logic & Restrictions
Duration: 4–5 days
2.1 — Trial Registration API
javascript// POST /api/auth/register-trial

const startTrial = async (req, res) => {
  const { institute_name, email, phone, chosen_plan, platform } = req.body;

  const today = new Date();
  const trialDays = TRIAL_LIMITS[chosen_plan].days; // 14 or 15
  const trialEndDate = new Date(today);
  trialEndDate.setDate(today.getDate() + trialDays);

  // Data delete scheduled = trial end + 30 days
  const deleteDate = new Date(trialEndDate);
  deleteDate.setDate(trialEndDate.getDate() + 30);

  await Institute.create({
    institute_name,
    email,
    phone,
    plan_type: 'free_trial',
    trial_plan: chosen_plan,
    platform_type: platform, // 'web' or 'web_mobile'
    trial_start_date: today,
    trial_end_date: trialEndDate,
    trial_status: 'active',
    data_delete_scheduled_at: deleteDate,
  });

  // Trigger Day 0 welcome email
  await sendWelcomeEmail(email, institute_name, chosen_plan);

  res.json({ success: true, message: 'Trial started!' });
};
2.2 — Trial Check Middleware (Most Important)
javascript// middleware/trialGuard.js
// Add this to EVERY protected route

const trialGuard = async (req, res, next) => {
  const institute = await Institute.findById(req.user.institute_id);

  // Check if trial expired
  if (institute.trial_status === 'active') {
    const today = new Date();
    const trialEnd = new Date(institute.trial_end_date);

    if (today > trialEnd) {
      // Trial expired — move to freemium
      await Institute.update(
        { trial_status: 'freemium' },
        { where: { id: institute.id } }
      );
      institute.trial_status = 'freemium';
    }
  }

  // Attach plan limits to request
  if (institute.trial_status === 'active') {
    req.limits = TRIAL_LIMITS[institute.trial_plan];
    req.plan = 'trial_' + institute.trial_plan;
  } else if (institute.trial_status === 'freemium') {
    req.limits = FREEMIUM_LIMITS;
    req.plan = 'freemium';
  } else {
    req.limits = PAID_PLAN_LIMITS[institute.plan_type];
    req.plan = institute.plan_type;
  }

  next();
};
2.3 — Feature Gate (Block Restricted Features)
javascript// middleware/featureGate.js

const featureGate = (requiredFeature) => {
  return (req, res, next) => {
    const blockedFeatures = {
      trial_starter: ['faculty_attendance', 'finances', 'exams', 'timetable'],
      trial_basic: ['biometric', 'faculty_performance', 'api_access'],
      freemium: ['fees', 'exams', 'timetable', 'parents', 'faculty'],
    };

    const blocked = blockedFeatures[req.plan] || [];

    if (blocked.includes(requiredFeature)) {
      return res.status(403).json({
        success: false,
        message: 'This feature is not available in your current plan.',
        upgrade_required: true,
        current_plan: req.plan,
      });
    }
    next();
  };
};

// Usage on routes:
// router.get('/finances', trialGuard, featureGate('finances'), getFinances);
2.4 — Student/Faculty Limit Check
javascript// Before adding a student
const addStudent = async (req, res) => {
  const currentCount = await Student.count({
    where: { institute_id: req.user.institute_id }
  });

  if (currentCount >= req.limits.max_students) {
    return res.status(403).json({
      success: false,
      message: `Your trial allows max ${req.limits.max_students} students. Upgrade to add more.`,
      upgrade_required: true
    });
  }

  // Proceed to add student...
};

✅ PHASE 3 — Frontend Implementation
Duration: 5–6 days
3.1 — Pricing Page (Web)
Add a toggle switch on your pricing page:
[ Monthly ]  ←→  [ Yearly ]     [ Web Only ]  ←→  [ Web + Mobile ]

These 2 toggles dynamically update all plan prices on the page.
Each plan card shows:

Price (dynamic based on toggles)
Features list
"Start Free Trial" button (primary CTA)
Small text: "14 days free • No credit card"

3.2 — Trial Banner (Show inside Dashboard)
┌─────────────────────────────────────────────────────────┐
│ 🕐 Your FREE TRIAL ends in 7 days  |  [Upgrade Now →]  │
└─────────────────────────────────────────────────────────┘

Show this banner on every page inside the admin dashboard
Color changes: Green (Day 1–7) → Orange (Day 8–12) → Red (Day 13–14)
Clicking "Upgrade Now" opens payment modal

3.3 — Watermark on Reports
javascript// When generating any report PDF during trial
if (req.limits.watermark) {
  addWatermarkToPDF(pdf, "TRIAL VERSION — EduManage Pro");
}
3.4 — Upgrade Modal (Trigger on Feature Block)
When user tries a locked feature, show a popup:
┌──────────────────────────────────────────┐
│  🔒 This feature requires Basic Plan     │
│                                          │
│  You're on: Starter Trial                │
│  Upgrade to Basic → ₹2,499/mo           │
│                                          │
│  [Upgrade Now]     [Maybe Later]         │
└──────────────────────────────────────────┘
3.5 — Trial Expired Screen
When trial ends and user logs in:
┌──────────────────────────────────────────┐
│  ⏰ Your Trial Has Ended                 │
│                                          │
│  Your data is saved for 30 more days.   │
│  Upgrade now to continue without losing  │
│  any of your school data.               │
│                                          │
│  [Choose a Plan →]                       │
│                                          │
│  Or continue with FREE plan (10 students)│
└──────────────────────────────────────────┘

✅ PHASE 4 — Automation (Emails, WhatsApp, SMS)
Duration: 3–4 days
4.1 — Cron Job (Run Every Day at 9 AM)
javascript// cron/trialReminder.js
// Run daily at 9:00 AM

const cron = require('node-cron');

cron.schedule('0 9 * * *', async () => {
  const today = new Date();
  const allTrials = await Institute.findAll({
    where: { trial_status: 'active' }
  });

  for (const institute of allTrials) {
    const daysLeft = getDaysLeft(institute.trial_end_date);
    const daysSinceStart = getDaysSinceStart(institute.trial_start_date);

    // Day 1
    if (daysSinceStart === 1 && institute.trial_reminder_day < 1) {
      await sendWhatsApp(institute.phone, 'day1_checkin', institute);
      await updateReminderDay(institute.id, 1);
    }

    // Day 3
    if (daysSinceStart === 3 && institute.trial_reminder_day < 3) {
      await sendEmail(institute.email, 'day3_tips', institute);
      await updateReminderDay(institute.id, 3);
    }

    // Day 7
    if (daysSinceStart === 7 && institute.trial_reminder_day < 7) {
      await sendEmail(institute.email, 'day7_halfway', institute);
      await updateReminderDay(institute.id, 7);
    }

    // Day 10 — Urgency + Offer
    if (daysLeft === 4 && institute.trial_reminder_day < 10) {
      await sendEmail(institute.email, 'day10_offer', institute);
      await sendSMS(institute.phone, 'day10_sms', institute);
      await updateReminderDay(institute.id, 10);
    }

    // Day 13 — Final
    if (daysLeft === 1 && institute.trial_reminder_day < 13) {
      await sendWhatsApp(institute.phone, 'day13_final', institute);
      await sendEmail(institute.email, 'day13_final', institute);
      await updateReminderDay(institute.id, 13);
    }

    // Day 14 — Expire
    if (daysLeft <= 0) {
      await Institute.update(
        { trial_status: 'freemium' },
        { where: { id: institute.id } }
      );
      await sendEmail(institute.email, 'trial_expired', institute);
    }
  }

  // Data deletion check (Day 45)
  const toDelete = await Institute.findAll({
    where: {
      trial_status: 'freemium',
      data_delete_scheduled_at: { [Op.lte]: today },
      is_data_deleted: false
    }
  });

  for (const inst of toDelete) {
    await deleteInstituteData(inst.id);
    await Institute.update(
      { is_data_deleted: true },
      { where: { id: inst.id } }
    );
  }
});
4.2 — Tools to Use
PurposeRecommended ToolCostEmailNodemailer + Gmail SMTP (free to start) or BrevoFree / ₹0–₹999/moWhatsAppMeta Business API or Interakt or Wati₹2,000–₹5,000/moSMSMSG91 or Fast2SMS₹0.15–₹0.25 per SMSCron Jobsnode-cron (self-hosted) or Vercel CronFree

✅ PHASE 5 — Analytics & Conversion Tracking
Duration: 2–3 days
5.1 — Track These Numbers (Your Admin Dashboard)
Trial Signups This Month        → 45
Active Trials Right Now         → 28
Trials Expired (Not Converted)  → 12
Converted to Paid               → 8
Conversion Rate                 → 22.2%
Freemium Users                  → 5
Revenue This Month              → ₹34,500
5.2 — Key Metrics to Watch
MetricWhat It Tells YouTrial → Paid conversion rateTarget: 20–30% is goodWhich plan do most trials pick?Focus marketing thereWhich day do most people upgrade?Optimize reminder on that dayWhich features are used most in trial?Highlight those in marketingChurn after 1st month paidFix onboarding if high
5.3 — Simple Tracking Code
javascript// Log every important trial event
const trackEvent = async (institute_id, event, metadata = {}) => {
  await TrialEvent.create({
    institute_id,
    event, // 'trial_started', 'feature_blocked', 'upgrade_clicked', 'paid'
    metadata: JSON.stringify(metadata),
    created_at: new Date()
  });
};

// Use it everywhere:
await trackEvent(id, 'trial_started', { plan: 'basic', platform: 'web_mobile' });
await trackEvent(id, 'feature_blocked', { feature: 'biometric' });
await trackEvent(id, 'upgrade_clicked', { from_plan: 'basic_trial', to_plan: 'professional' });
await trackEvent(id, 'paid', { plan: 'basic', billing: 'yearly', amount: 34990 });

🗓️ Full Timeline Summary
PhaseWhatDaysPhase 1Database + Config setupDay 1–4Phase 2Backend trial logic + middlewareDay 5–9Phase 3Frontend — pricing page, banner, modalsDay 10–15Phase 4Email + WhatsApp + SMS automationDay 16–19Phase 5Analytics dashboard + event trackingDay 20–22TestingFull end-to-end testingDay 23–25LaunchGo live 🚀Day 26