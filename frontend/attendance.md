🎯 ATTENDANCE MODULE – PROFESSIONAL FUNCTIONAL BLUEPRINT

We will explain everything in structured phases.

🏗 PHASE 1 — ACCESS CONTROL STRUCTURE

Attendance should NOT be accessible to everyone.

🎭 Role-Based Access
Role	Access Level
Super Admin	View only (analytics)
Institute Admin	View + Edit + Report
Faculty	Mark attendance for assigned class
Student	View only (their own)
Parent	View only (child only)
🧠 PHASE 2 — PLAN-BASED FEATURE CONTROL

Before allowing attendance access:

System checks:

1️⃣ Is subscription active?
2️⃣ Does current plan allow attendance?

If plan.feature_attendance = false:

Hide attendance menu in frontend

Block attendance APIs in backend

Return message:

“Upgrade your plan to use Attendance feature”

🔐 PHASE 3 — SUBSCRIPTION VALIDATION FLOW

Every attendance request must pass:

1. JWT verified
2. Institute status = active
3. Subscription status = active
4. Subscription end_date >= today
5. Plan.feature_attendance = true


If any fails → block access.

🏢 PHASE 4 — WHO CAN MARK ATTENDANCE?
🧑‍🏫 Faculty Rules

Faculty can:

Mark attendance only for their assigned class

Cannot mark attendance for other classes

Cannot modify attendance of previous days (optional rule)

🏫 Institute Admin Rules

Admin can:

Mark attendance

Edit attendance

Delete attendance

View reports for all classes

👨‍🎓 Student Rules

Student can:

View only their own attendance

Cannot modify

📅 PHASE 5 — ATTENDANCE WORKFLOW
Daily Workflow

Faculty logs in

Selects class

System loads student list

Faculty marks:

Present

Absent

Late

Submit

System behavior:

Prevent duplicate marking for same date

Store attendance with institute_id

Store marked_by user_id

Store date

🔄 PHASE 6 — EDITING ATTENDANCE

Professional rules:

Option A (Strict System)

Attendance cannot be modified after 24 hours

Option B (Flexible System)

Only admin can edit past attendance

When editing:

Log previous value

Store updated_at timestamp

📊 PHASE 7 — ATTENDANCE REPORTING

Reports must support:

1️⃣ Daily Report
2️⃣ Monthly Report
3️⃣ Student-wise Percentage
4️⃣ Class-wise Summary

Student Attendance % Formula
( Total Present / Total Working Days ) × 100


This must be calculated dynamically.

🛑 PHASE 8 — STUDENT LIMIT ENFORCEMENT

If plan.student_limit = 100

Attendance should:

Only load students under that institute

Never mix students from other institutes

Multi-tenant isolation must be strict

🔒 PHASE 9 — MULTI-TENANT SAFETY RULE

Every attendance record must:

Have institute_id


Every query must:

Filter by institute_id


This prevents:

Data leak between institutes

Cross-tenant data exposure

This is critical for SaaS.

📈 PHASE 10 — ANALYTICS LAYER

Attendance dashboard should show:

Today’s attendance %

Monthly average %

Top attendance class

Students below 75%

Super admin sees:

Attendance usage per institute

Feature adoption metrics

🚨 PHASE 11 — EXPIRY BEHAVIOR

If subscription expires:

Faculty cannot mark attendance

Admin cannot edit attendance

Student cannot view attendance

Show renewal page

System must block access completely.

📬 PHASE 12 — OPTIONAL PROFESSIONAL FEATURES

Advanced SaaS attendance includes:

Bulk marking

Biometric integration

QR code attendance

WhatsApp absence alert

SMS notification

Attendance export to Excel

Leave request system

But these are Phase 2 features.

🎯 COMPLETE PROFESSIONAL ATTENDANCE FLOW
User logs in
    ↓
JWT validated
    ↓
Subscription validated
    ↓
Plan feature validated
    ↓
Role validated
    ↓
Class assignment validated
    ↓
Attendance marked
    ↓
Duplicate check applied
    ↓
Saved with institute_id

🏆 PROFESSIONAL RULE SUMMARY

Attendance module must ensure:

✔ Role-based access
✔ Plan-based control
✔ Subscription validation
✔ Multi-tenant isolation
✔ Duplicate prevention
✔ Report generation
✔ Editing control rules
✔ Expiry blocking