🎯 FEATURE: Faculty QR Generator (Auto Attendance System)
📌 Concept

Faculty starts class.

System generates a temporary QR code.

Students scan the QR using their dashboard.

Attendance marked automatically.

QR expires after session ends.

🧱 PHASE 1 — Database Design
1️⃣ Create class_sessions Table

This represents a live attendance session.

id
institute_id
class_id
faculty_id
session_token
start_time
end_time
is_active (boolean)
created_at

2️⃣ Update Attendance Table

Ensure unique constraint:

(institute_id, student_id, class_id, date)


Prevents duplicate attendance.

🔐 PHASE 2 — Session Token Generation

When faculty clicks:

👉 “Start Attendance”

Backend should:

1️⃣ Generate secure token

crypto.randomBytes(32).toString("hex")


2️⃣ Save session:

class_id

faculty_id

institute_id

token

is_active = true

expiry = now + 10 minutes

🖥 PHASE 3 — Faculty Dashboard

Add:

Button:
Start Attendance


When clicked:

Call:

POST /api/attendance/start-session


Response returns:

{
  session_token,
  expires_at
}


Frontend:

Generate QR using token

Show countdown timer

Show “Session Active”

Use library:

qrcode.react

📱 PHASE 4 — Student Dashboard Scanner

Add:

Scan Attendance QR


Use:

react-qr-reader


When scanned:

Call:

POST /api/attendance/mark-by-qr
{
   session_token
}

⚙️ PHASE 5 — Backend Validation Logic

When student sends token:

Backend checks:

✔ Session exists
✔ is_active = true
✔ Not expired
✔ Student belongs to same class
✔ Student not already marked

If valid:

Attendance.create({
   student_id,
   class_id,
   institute_id,
   status: "present",
   date: today,
   marked_by: faculty_id
});


Return:

Attendance Marked Successfully

🔄 PHASE 6 — Session End Logic

Faculty clicks:

End Session


Call:

PUT /api/attendance/end-session/:id


Update:

is_active = false
end_time = now


After this:

QR becomes invalid.

⏱ PHASE 7 — Auto Expiry (Important)

Even if faculty forgets to end session:

Add expiry check:

if (now > expires_at)
   reject request


Session auto-invalid after 10 minutes.

🛡 PHASE 8 — Security Protection

Add:

✔ Token bound to institute
✔ Token bound to class
✔ Token expires in 5–10 minutes
✔ Prevent duplicate attendance
✔ Prevent reuse after session end
✔ Validate subscription feature

🎛 PHASE 9 — Plan-Based Feature Control

Add in plans table:

feature_auto_attendance BOOLEAN


In routes:

router.use(checkFeatureAccess("feature_auto_attendance"));

📊 PHASE 10 — Real Classroom Flow
Faculty → Start Session
         ↓
QR Generated
         ↓
Students Scan
         ↓
Backend Validates
         ↓
Attendance Marked
         ↓
Faculty Ends Session

🏗 PHASE 11 — Production Improvements (Advanced)
🔥 Add These Later:

1️⃣ Prevent screenshot cheating
→ Add 5-minute expiry

2️⃣ GPS validation
→ Check student location

3️⃣ Device binding
→ Mark student device ID

4️⃣ Face verification (Enterprise Plan)

🚀 FINAL PROFESSIONAL ARCHITECTURE
Faculty Dashboard
    ↓
Start Session API
    ↓
Session Stored in DB
    ↓
QR Generated
    ↓
Student Scanner
    ↓
Mark Attendance API
    ↓
Attendance Table
    ↓
End Session

🎯 Total Implementation Phases Summary
Phase	Task
1	Create session table
2	Token generation
3	Faculty QR UI
4	Student scanner UI
5	Backend validation
6	Attendance marking
7	Session end logic
8	Security hardening
9	Plan integration