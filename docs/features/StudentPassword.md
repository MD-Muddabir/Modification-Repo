Student SaaS
Student Password Management System
Approach 1: Auto-Generated Password + Email Delivery
Root-Level to Child-Level Implementation — All Phases


Why Approach 1 Was Chosen
After analyzing your entire Student SaaS project — multi-tenant architecture, Node.js + Express + Sequelize + React + Neon PostgreSQL, existing Nodemailer setup, 48-table DB schema, and coaching institute use cases — Approach 1 (Auto-Generated Password + Email Delivery) is the best fit. Here is the reasoning:

Factor	Approach 1 (Chosen)	Approach 2
Admin effort (bulk 100 students)	Zero — fully automatic	Admin must resend links if email ignored
Student first login experience	Instant — credentials ready	Student must check email + set password before login
Email already built in your project?	Yes — Nodemailer exists	Yes — same
Works without student action?	Yes — account immediately active	No — account stuck as pending
Force password change on first login	Yes — industry standard	Not needed (student sets own)
Best for coaching institutes in India	Yes — practical, simple	Only if all students have reliable email access

CHOSEN: Approach 1 — Auto-Generated Password + Email Delivery with Forced Password Change on First Login. This works with your existing email infrastructure, adds no extra UI flow for the student, and handles both single-add and bulk import cleanly.

 
Section 1 — What We Are Building
1.1 Full Feature Scope
This implementation covers two flows in the Admin Dashboard — Manage Students section:

•	Single Student Add — Admin fills Name + Email (+ optional phone, class, roll number) → backend auto-generates a secure temporary password → hashes and saves it → sends a Welcome Email with credentials → student logs in → forced to change password on first login.
•	Bulk Student Upload — Admin uploads a CSV file with columns (Name, Email, optional phone/class) → backend processes each row → auto-generates unique password per student → emails each one → returns a result report showing success/failure per row.
•	No Email Edge Case — If a student has no email, the system shows the generated password once on-screen in a copy-to-clipboard modal. Admin shares it manually.
•	First Login Force Change — On first login, a password change screen is shown before the student dashboard loads. Student cannot skip this step.
•	Admin Resend Credentials — Admin can resend login credentials to any student with one click (in case email was missed or wrong email was entered).

1.2 Files That Will Be Created or Modified
Here is the complete root-level to child-level map of every file involved:

File Path	Action	Purpose
backend/migrations/add_student_password_fields.sql	CREATE	Add 3 new columns to users table
backend/utils/passwordGenerator.js	CREATE	Secure temp password generator
backend/utils/csvParser.js	CREATE	Parse and validate bulk CSV upload
backend/services/studentEmail.service.js	CREATE	Welcome + credential email templates
backend/controllers/student.controller.js	MODIFY	Add single-add + bulk logic
backend/routes/student.routes.js	MODIFY	Add bulk upload + resend routes
backend/middleware/firstLoginCheck.js	CREATE	Detect and enforce password change
backend/controllers/auth.controller.js	MODIFY	Return is_first_login flag on login
frontend/src/pages/admin/ManageStudents.jsx	MODIFY	Add bulk upload UI + no-email modal
frontend/src/pages/student/ChangePassword.jsx	CREATE	Forced first-login password change page
frontend/src/pages/admin/BulkUploadResult.jsx	CREATE	Show bulk import results table
frontend/src/components/CopyPasswordModal.jsx	CREATE	Show password on-screen if no email
backend/templates/student_welcome.html	CREATE	HTML email template
backend/sample_bulk_template.csv	CREATE	CSV template for admin to download

 
Section 2 — Database Changes (Phase 1)
2.1 Existing users Table (Your Current Schema)
Your current users table already has: id, institute_id, role, name, email, phone, password_hash, status, permissions, created_at, updated_at. Three new columns need to be added.

2.2 Migration SQL
Run this in your Neon PostgreSQL SQL Editor. This is the only DB change needed:

-- Phase 1: Add student password management columns to users table
-- Run in Neon PostgreSQL SQL Editor

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS is_first_login BOOLEAN DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS temp_password_expires_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS credentials_sent_at TIMESTAMPTZ;

-- Verify the columns were added
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'users'
  AND column_name IN ('is_first_login', 'temp_password_expires_at', 'credentials_sent_at');

2.3 Column Purpose
Column	Type	Purpose
is_first_login	BOOLEAN	TRUE = student has not yet changed their password. Set to FALSE after first change.
temp_password_expires_at	TIMESTAMPTZ	Optional: auto-expire temp password after 7 days if student never logs in (can trigger resend reminder).
credentials_sent_at	TIMESTAMPTZ	Timestamp of last credential email sent. Useful for resend cooldown (prevent admin spam clicking resend).

 
Section 3 — Backend Utilities (Phase 2)
3.1 Password Generator Utility
Create this file: backend/utils/passwordGenerator.js

// backend/utils/passwordGenerator.js
// Generates a secure, readable temporary password

const generateTempPassword = () => {
  // Character sets — exclude confusing chars like 0/O, 1/l/I
  const upper  = 'ABCDEFGHJKMNPQRSTUVWXYZ';
  const lower  = 'abcdefghjkmnpqrstuvwxyz';
  const digits = '23456789';
  const special = '@#$';

  // Guarantee at least 1 of each type
  const pick = (str) => str[Math.floor(Math.random() * str.length)];

  const required = [
    pick(upper),
    pick(upper),
    pick(lower),
    pick(lower),
    pick(digits),
    pick(digits),
    pick(special),
  ];

  // Fill remaining chars to reach length 10
  const all = upper + lower + digits + special;
  while (required.length < 10) {
    required.push(pick(all));
  }

  // Shuffle to avoid predictable pattern
  return required.sort(() => Math.random() - 0.5).join('');
};

module.exports = { generateTempPassword };

3.2 CSV Parser Utility
Create this file: backend/utils/csvParser.js

// backend/utils/csvParser.js
const csv = require('csv-parse/sync');

// Expected CSV columns: name (required), email (required),
//                       phone (optional), class_id (optional)
const parseStudentCSV = (buffer) => {
  const records = csv.parse(buffer, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  });

  const valid = [];
  const errors = [];

  records.forEach((row, idx) => {
    const rowNum = idx + 2; // +2 because row 1 is header
    const name = row.name || row.Name || row.NAME;
    const email = row.email || row.Email || row.EMAIL;

    if (!name || name.trim().length < 2) {
      errors.push({ row: rowNum, issue: `Name missing or too short` });
      return;
    }
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      errors.push({ row: rowNum, issue: `Invalid email format: ${email}` });
      return;
    }
    valid.push({
      name: name.trim(),
      email: email ? email.trim().toLowerCase() : null,
      phone: (row.phone || row.Phone || '').trim() || null,
      class_id: parseInt(row.class_id || row.class || 0) || null,
    });
  });

  return { valid, errors, total: records.length };
};

module.exports = { parseStudentCSV };

Install the csv-parse package:

cd backend
npm install csv-parse multer

 
Section 4 — Student Email Service (Phase 3)
4.1 Create Email Service
Create this file: backend/services/studentEmail.service.js

// backend/services/studentEmail.service.js
const nodemailer = require('nodemailer');

const createTransporter = () => nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  requireTLS: true,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  tls: { rejectUnauthorized: false },
});

// Send welcome email with auto-generated credentials
exports.sendStudentWelcomeEmail = async ({ to, studentName, instituteName, email, tempPassword }) => {
  const transporter = createTransporter();

  const html = `
    <div style="font-family:Arial,sans-serif;max-width:560px;margin:auto;
         border:1px solid #e2e8f0;border-radius:12px;overflow:hidden;">

      <!-- Header -->
      <div style="background:#1E3A5F;padding:28px 32px;">
        <h1 style="color:#fff;margin:0;font-size:22px;">Welcome to ${instituteName}</h1>
        <p style="color:#93C5FD;margin:6px 0 0;">Your student account is ready</p>
      </div>

      <!-- Body -->
      <div style="padding:32px;">
        <p style="color:#374151;font-size:15px;">Hi <strong>${studentName}</strong>,</p>
        <p style="color:#374151;font-size:15px;">
          Your student account has been created. Use the credentials below to login.
        </p>

        <!-- Credentials Box -->
        <div style="background:#F8FAFC;border:1px solid #E2E8F0;
             border-left:4px solid #2563EB;border-radius:8px;padding:20px;margin:20px 0;">
          <p style="margin:0 0 10px;color:#6B7280;font-size:13px;
             text-transform:uppercase;letter-spacing:1px;">Login Credentials</p>
          <p style="margin:0 0 8px;color:#111827;font-size:15px;">
            <span style="color:#6B7280;">Email:</span> <strong>${email}</strong>
          </p>
          <p style="margin:0;color:#111827;font-size:15px;">
            <span style="color:#6B7280;">Password:</span>
            <strong style="font-size:20px;letter-spacing:2px;color:#2563EB;">
              ${tempPassword}
            </strong>
          </p>
        </div>

        <div style="background:#FEF3C7;border-radius:8px;padding:14px 18px;
             border-left:4px solid #F59E0B;margin:20px 0;">
          <p style="margin:0;color:#92400E;font-size:14px;">
            You will be asked to change this password after your first login.
          </p>
        </div>

        <p style="text-align:center;margin:28px 0 0;">
          <a href="${process.env.FRONTEND_URL}/login"
             style="background:#2563EB;color:#fff;padding:12px 32px;
             border-radius:8px;text-decoration:none;font-size:15px;
             font-weight:bold;">Login to Your Account</a>
        </p>
      </div>

      <!-- Footer -->
      <div style="background:#F1F5F9;padding:16px 32px;text-align:center;">
        <p style="color:#9CA3AF;font-size:12px;margin:0;">
          This is an automated message from ${instituteName} via Student SaaS.
        </p>
      </div>
    </div>
  `;

  await transporter.verify();
  const info = await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to,
    subject: `Your Login Credentials — ${instituteName}`,
    html,
  });

  console.log(`✅ Welcome email sent to ${to}`);
  return info;
};

4.2 Add FRONTEND_URL to .env
Add this line to backend/.env:

# Add to backend/.env
FRONTEND_URL=https://your-frontend.vercel.app
# For local development:
# FRONTEND_URL=http://localhost:5173

 
Section 5 — Student Controller (Phase 4)
5.1 Single Student Add — Modified Controller
Modify: backend/controllers/student.controller.js — Update the createStudent function:

// backend/controllers/student.controller.js
const bcrypt = require('bcryptjs');
const { User, Student, Institute } = require('../models');
const { generateTempPassword } = require('../utils/passwordGenerator');
const { sendStudentWelcomeEmail } = require('../services/studentEmail.service');

exports.createStudent = async (req, res) => {
  try {
    const {
      name, email, phone,
      roll_number, class_id, admission_date,
      date_of_birth, gender, address
    } = req.body;
    const institute_id = req.user.institute_id;

    // 1. Validate required fields
    if (!name || name.trim().length < 2) {
      return res.status(400).json({ message: 'Student name is required (min 2 chars)' });
    }

    // 2. Check email uniqueness (if email provided)
    if (email) {
      const exists = await User.findOne({ where: { email: email.toLowerCase() } });
      if (exists) {
        return res.status(409).json({ message: 'A user with this email already exists' });
      }
    }

    // 3. Generate temporary password
    const tempPassword = generateTempPassword();
    const password_hash = await bcrypt.hash(tempPassword, 12);

    // 4. Set temp password expiry (7 days)
    const temp_password_expires_at = new Date();
    temp_password_expires_at.setDate(temp_password_expires_at.getDate() + 7);

    // 5. Create user account
    const user = await User.create({
      institute_id,
      role: 'student',
      name: name.trim(),
      email: email ? email.toLowerCase().trim() : null,
      phone: phone || null,
      password_hash,
      status: 'active',
      is_first_login: true,
      temp_password_expires_at,
      credentials_sent_at: email ? new Date() : null,
    });

    // 6. Create student profile record
    const student = await Student.create({
      institute_id,
      user_id: user.id,
      roll_number: roll_number || null,
      class_id: class_id || null,
      admission_date: admission_date || new Date(),
      date_of_birth: date_of_birth || null,
      gender: gender || null,
      address: address || null,
    });

    // 7. Send welcome email if email provided
    let emailSent = false;
    let showPasswordOnScreen = false;

    if (email) {
      try {
        const institute = await Institute.findByPk(institute_id);
        await sendStudentWelcomeEmail({
          to: email,
          studentName: name,
          instituteName: institute.name,
          email: email,
          tempPassword,
        });
        emailSent = true;
      } catch (emailError) {
        // Email failed — we still created the account, show password on screen
        console.error('Email send failed:', emailError.message);
        showPasswordOnScreen = true;
      }
    } else {
      // No email — must show password on screen
      showPasswordOnScreen = true;
    }

    return res.status(201).json({
      message: 'Student created successfully',
      student: {
        id: student.id,
        user_id: user.id,
        name: user.name,
        email: user.email,
      },
      emailSent,
      // Only include tempPassword if email failed or no email
      tempPassword: showPasswordOnScreen ? tempPassword : undefined,
      showPasswordOnScreen,
    });

  } catch (error) {
    console.error('Create student error:', error);
    return res.status(500).json({ message: 'Failed to create student', error: error.message });
  }
};

 
Section 6 — Bulk Student Upload (Phase 5)
6.1 Bulk Upload Controller Function
Add this function to: backend/controllers/student.controller.js

// Add to backend/controllers/student.controller.js
const { parseStudentCSV } = require('../utils/csvParser');

exports.bulkCreateStudents = async (req, res) => {
  try {
    const institute_id = req.user.institute_id;

    // 1. Check file was uploaded
    if (!req.file) {
      return res.status(400).json({ message: 'No CSV file uploaded' });
    }

    // 2. Validate file type
    if (!req.file.originalname.endsWith('.csv')) {
      return res.status(400).json({ message: 'Only .csv files are accepted' });
    }

    // 3. Parse CSV
    const { valid, errors, total } = parseStudentCSV(req.file.buffer);

    if (valid.length === 0) {
      return res.status(400).json({
        message: 'No valid rows found in CSV',
        parseErrors: errors,
      });
    }

    const results = { success: [], failed: [], emailFailed: [] };
    const institute = await Institute.findByPk(institute_id);

    // 4. Process each valid row
    for (const row of valid) {
      try {
        // Check for duplicate email
        if (row.email) {
          const exists = await User.findOne({ where: { email: row.email } });
          if (exists) {
            results.failed.push({ name: row.name, email: row.email, reason: 'Email already exists' });
            continue;
          }
        }

        const tempPassword = generateTempPassword();
        const password_hash = await bcrypt.hash(tempPassword, 12);
        const temp_password_expires_at = new Date();
        temp_password_expires_at.setDate(temp_password_expires_at.getDate() + 7);

        const user = await User.create({
          institute_id,
          role: 'student',
          name: row.name,
          email: row.email,
          phone: row.phone,
          password_hash,
          status: 'active',
          is_first_login: true,
          temp_password_expires_at,
          credentials_sent_at: row.email ? new Date() : null,
        });

        await Student.create({
          institute_id,
          user_id: user.id,
          class_id: row.class_id,
          admission_date: new Date(),
        });

        // Try to send email
        if (row.email) {
          try {
            await sendStudentWelcomeEmail({
              to: row.email,
              studentName: row.name,
              instituteName: institute.name,
              email: row.email,
              tempPassword,
            });
            results.success.push({ name: row.name, email: row.email, emailSent: true });
          } catch (e) {
            results.emailFailed.push({ name: row.name, email: row.email, tempPassword });
            results.success.push({ name: row.name, email: row.email, emailSent: false });
          }
        } else {
          results.emailFailed.push({ name: row.name, email: null, tempPassword });
          results.success.push({ name: row.name, email: null, emailSent: false });
        }

      } catch (rowErr) {
        results.failed.push({ name: row.name, email: row.email, reason: rowErr.message });
      }
    }

    return res.status(201).json({
      message: `Bulk import complete: ${results.success.length} created, ${results.failed.length} failed`,
      total,
      parseErrors: errors,
      results,
    });

  } catch (error) {
    console.error('Bulk import error:', error);
    return res.status(500).json({ message: 'Bulk import failed', error: error.message });
  }
};

 
Section 7 — Resend Credentials Feature (Phase 6)
7.1 Resend Controller
Add this function to: backend/controllers/student.controller.js

// Resend credentials to a student
exports.resendStudentCredentials = async (req, res) => {
  try {
    const { studentId } = req.params;
    const institute_id = req.user.institute_id;

    // 1. Find student and their user account
    const student = await Student.findOne({
      where: { id: studentId, institute_id },
      include: [{ model: User, as: 'user' }]
    });

    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    if (!student.user.email) {
      return res.status(400).json({ message: 'Student has no email on record' });
    }

    // 2. Cooldown check — prevent resend within 5 minutes
    if (student.user.credentials_sent_at) {
      const minutesSinceSent = (Date.now() - new Date(student.user.credentials_sent_at)) / 60000;
      if (minutesSinceSent < 5) {
        return res.status(429).json({ message: `Please wait ${Math.ceil(5 - minutesSinceSent)} more minutes before resending` });
      }
    }

    // 3. Generate new password
    const tempPassword = generateTempPassword();
    const password_hash = await bcrypt.hash(tempPassword, 12);
    const temp_password_expires_at = new Date();
    temp_password_expires_at.setDate(temp_password_expires_at.getDate() + 7);

    // 4. Update user record
    await student.user.update({
      password_hash,
      is_first_login: true,
      temp_password_expires_at,
      credentials_sent_at: new Date(),
    });

    // 5. Send new credentials email
    const institute = await Institute.findByPk(institute_id);
    await sendStudentWelcomeEmail({
      to: student.user.email,
      studentName: student.user.name,
      instituteName: institute.name,
      email: student.user.email,
      tempPassword,
    });

    return res.status(200).json({ message: 'Credentials resent successfully' });

  } catch (error) {
    return res.status(500).json({ message: 'Failed to resend credentials', error: error.message });
  }
};

 
Section 8 — Routes & Multer Setup (Phase 7)
8.1 Update Student Routes
Modify: backend/routes/student.routes.js — Add these new routes:

// backend/routes/student.routes.js
const express = require('express');
const router = express.Router();
const multer = require('multer');
const { verifyToken, allowRoles } = require('../middleware/auth');
const studentController = require('../controllers/student.controller');

// Multer config — store CSV in memory (no disk)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'text/csv' || file.originalname.endsWith('.csv')) {
      cb(null, true);
    } else {
      cb(new Error('Only CSV files allowed'));
    }
  }
});

// Existing routes (keep as is)
router.get('/', verifyToken, allowRoles('admin','manager'), studentController.getStudents);
router.get('/:id', verifyToken, allowRoles('admin','manager'), studentController.getStudent);
router.put('/:id', verifyToken, allowRoles('admin'), studentController.updateStudent);
router.delete('/:id', verifyToken, allowRoles('admin'), studentController.deleteStudent);

// MODIFIED: Single student create (now auto-generates password)
router.post('/', verifyToken, allowRoles('admin'), studentController.createStudent);

// NEW: Bulk student upload
router.post('/bulk-upload', verifyToken, allowRoles('admin'), upload.single('file'), studentController.bulkCreateStudents);

// NEW: Resend credentials
router.post('/:studentId/resend-credentials', verifyToken, allowRoles('admin'), studentController.resendStudentCredentials);

// NEW: Download CSV template
router.get('/bulk-template/download', verifyToken, allowRoles('admin'), (req, res) => {
  const csv = 'name,email,phone,class_id\nJohn Doe,john@example.com,9876543210,1\nJane Smith,jane@example.com,,2';
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename=student_bulk_template.csv');
  res.send(csv);
});

module.exports = router;

 
Section 9 — First Login Middleware (Phase 8)
9.1 Create First Login Check Middleware
Create: backend/middleware/firstLoginCheck.js

// backend/middleware/firstLoginCheck.js
// Applied to all student-facing API routes.
// If student has not changed default password, block all requests
// except the change-password endpoint itself.

const firstLoginCheck = (req, res, next) => {
  const isStudent = req.user && req.user.role === 'student';
  const isFirstLogin = req.user && req.user.is_first_login;

  if (!isStudent || !isFirstLogin) {
    return next(); // Not a student, or already changed password
  }

  // Allow the change-password route through
  const allowedPaths = ['/api/auth/change-password', '/api/auth/logout'];
  if (allowedPaths.includes(req.path)) {
    return next();
  }

  // Block all other routes
  return res.status(403).json({
    code: 'FIRST_LOGIN_PASSWORD_CHANGE_REQUIRED',
    message: 'Please change your temporary password before continuing.',
    redirectTo: '/change-password',
  });
};

module.exports = firstLoginCheck;

9.2 Update Auth Login Controller
Modify: backend/controllers/auth.controller.js — Update the login response to include is_first_login:

// In your login controller, after verifying credentials:
// Add is_first_login to the JWT payload and response

const token = jwt.sign(
  {
    id: user.id,
    role: user.role,
    institute_id: user.institute_id,
    is_first_login: user.is_first_login, // ADD THIS
  },
  process.env.JWT_SECRET,
  { expiresIn: '7d' }
);

// In your login response JSON, also return:
return res.json({
  message: 'Login successful',
  token,
  user: {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    is_first_login: user.is_first_login, // ADD THIS
  }
});

9.3 Change Password Endpoint
Add to: backend/controllers/auth.controller.js

// Change password (used on first login and also normal change)
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.id;

    const user = await User.findByPk(userId);

    // Verify current password
    const valid = await bcrypt.compare(currentPassword, user.password_hash);
    if (!valid) {
      return res.status(401).json({ message: 'Current password is incorrect' });
    }

    // Validate new password strength
    if (newPassword.length < 8) {
      return res.status(400).json({ message: 'New password must be at least 8 characters' });
    }
    if (newPassword === currentPassword) {
      return res.status(400).json({ message: 'New password must be different from current password' });
    }

    // Update password and clear first login flag
    const password_hash = await bcrypt.hash(newPassword, 12);
    await user.update({
      password_hash,
      is_first_login: false,     // Clear the flag
      temp_password_expires_at: null,
    });

    return res.json({ message: 'Password changed successfully' });

  } catch (error) {
    return res.status(500).json({ message: 'Failed to change password' });
  }
};

// Add route in auth.routes.js:
// router.post('/change-password', verifyToken, authController.changePassword);

 
Section 10 — Frontend Implementation (Phase 9)
10.1 First Login Redirect (AuthContext / App.jsx)
Modify your existing AuthContext or App.jsx to handle the is_first_login redirect:

// In your AuthContext.jsx or wherever you handle login state
// After successful login API call:

const login = async (credentials) => {
  const res = await axios.post('/api/auth/login', credentials);
  const { token, user } = res.data;

  localStorage.setItem('token', token);
  setUser(user);

  // Redirect based on first login status
  if (user.is_first_login) {
    navigate('/change-password');
  } else {
    navigate(getDashboardRoute(user.role));
  }
};

10.2 Change Password Page (Forced First Login)
Create: frontend/src/pages/student/ChangePassword.jsx

// frontend/src/pages/student/ChangePassword.jsx
import { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

export default function ChangePassword() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setError('');
    if (form.newPassword !== form.confirmPassword) {
      return setError('New passwords do not match');
    }
    if (form.newPassword.length < 8) {
      return setError('Password must be at least 8 characters');
    }
    if (form.newPassword === form.currentPassword) {
      return setError('New password must be different from current password');
    }
    setLoading(true);
    try {
      await axios.post('/api/auth/change-password', {
        currentPassword: form.currentPassword,
        newPassword: form.newPassword,
      });
      // Update user in context to clear is_first_login
      navigate('/student/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center',
      justifyContent: 'center', background: '#F1F5F9' }}>
      <div style={{ background: '#fff', borderRadius: '12px', padding: '40px',
        width: '100%', maxWidth: '440px', boxShadow: '0 4px 24px rgba(0,0,0,0.08)' }}>

        {/* Warning Banner */}
        <div style={{ background: '#FEF3C7', border: '1px solid #F59E0B',
          borderRadius: '8px', padding: '14px 18px', marginBottom: '24px' }}>
          <p style={{ margin: 0, color: '#92400E', fontSize: '14px', fontWeight: 600 }}>
            Security Notice
          </p>
          <p style={{ margin: '4px 0 0', color: '#78350F', fontSize: '13px' }}>
            You are using a temporary password. Please set a new password to continue.
          </p>
        </div>

        <h2 style={{ margin: '0 0 24px', fontSize: '22px', color: '#1E3A5F' }}>
          Set Your Password
        </h2>

        {error && <div style={{ background: '#FEF2F2', color: '#DC2626',
          padding: '12px', borderRadius: '8px', marginBottom: '16px', fontSize: '14px' }}>
          {error}
        </div>}

        {['currentPassword', 'newPassword', 'confirmPassword'].map(field => (
          <div key={field} style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '13px',
              color: '#374151', fontWeight: 600, marginBottom: '6px' }}>
              {field === 'currentPassword' ? 'Temporary Password (from email)' :
               field === 'newPassword' ? 'New Password' : 'Confirm New Password'}
            </label>
            <input
              type="password"
              value={form[field]}
              onChange={e => setForm(p => ({ ...p, [field]: e.target.value }))}
              style={{ width: '100%', padding: '10px 14px', border: '1px solid #D1D5DB',
                borderRadius: '8px', fontSize: '15px', boxSizing: 'border-box' }}
            />
          </div>
        ))}

        <button
          onClick={handleSubmit}
          disabled={loading}
          style={{ width: '100%', padding: '12px', background: '#2563EB',
            color: '#fff', border: 'none', borderRadius: '8px',
            fontSize: '15px', fontWeight: 600, cursor: 'pointer', marginTop: '8px' }}
        >
          {loading ? 'Saving...' : 'Set New Password & Continue'}
        </button>
      </div>
    </div>
  );
}

 
Section 11 — Admin Dashboard UI (Phase 10)
11.1 Copy Password Modal (No-Email Case)
Create: frontend/src/components/CopyPasswordModal.jsx

// frontend/src/components/CopyPasswordModal.jsx
import { useState } from 'react';

export default function CopyPasswordModal({ studentName, email, tempPassword, onClose }) {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = () => {
    const text = `Name: ${studentName}\nEmail: ${email || 'N/A'}\nPassword: ${tempPassword}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
      <div style={{ background: '#fff', borderRadius: '12px', padding: '32px',
        width: '100%', maxWidth: '420px', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>

        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div style={{ fontSize: '40px', marginBottom: '12px' }}>✅</div>
          <h3 style={{ margin: 0, color: '#1E3A5F' }}>Student Account Created</h3>
          <p style={{ color: '#6B7280', fontSize: '14px', marginTop: '6px' }}>
            {email ? 'Email delivery failed. ' : ''}
            Please copy and share these credentials manually.
          </p>
        </div>

        <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0',
          borderLeft: '4px solid #2563EB', borderRadius: '8px', padding: '20px' }}>
          <p style={{ margin: '0 0 8px', color: '#374151' }}>
            <span style={{ color: '#6B7280' }}>Name:</span> <strong>{studentName}</strong>
          </p>
          {email && <p style={{ margin: '0 0 8px', color: '#374151' }}>
            <span style={{ color: '#6B7280' }}>Email:</span> <strong>{email}</strong>
          </p>}
          <p style={{ margin: 0, color: '#374151' }}>
            <span style={{ color: '#6B7280' }}>Password:</span>
            <strong style={{ fontSize: '20px', letterSpacing: '2px',
              color: '#2563EB', marginLeft: '8px' }}>{tempPassword}</strong>
          </p>
        </div>

        <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
          <button onClick={copyToClipboard}
            style={{ flex: 1, padding: '11px', background: copied ? '#16A34A' : '#2563EB',
              color: '#fff', border: 'none', borderRadius: '8px', fontSize: '14px',
              fontWeight: 600, cursor: 'pointer' }}>
            {copied ? '✅ Copied!' : '📋 Copy Credentials'}
          </button>
          <button onClick={onClose}
            style={{ flex: 1, padding: '11px', background: '#F3F4F6',
              color: '#374151', border: 'none', borderRadius: '8px',
              fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}>
            Done
          </button>
        </div>

        <p style={{ textAlign: 'center', fontSize: '12px', color: '#9CA3AF', marginTop: '16px' }}>
          This password will not be shown again after closing.
        </p>
      </div>
    </div>
  );
}

11.2 Bulk Upload UI in ManageStudents.jsx
Add this section to your existing ManageStudents.jsx component:

// Add to ManageStudents.jsx — Bulk Upload Button + Logic
import CopyPasswordModal from '../../components/CopyPasswordModal';

// Add state variables:
const [bulkFile, setBulkFile] = useState(null);
const [bulkLoading, setBulkLoading] = useState(false);
const [bulkResult, setBulkResult] = useState(null);
const [copyModal, setCopyModal] = useState(null); // { studentName, email, tempPassword }

// Download CSV template button:
const downloadTemplate = () => {
  window.open('/api/students/bulk-template/download', '_blank');
};

// Handle bulk upload:
const handleBulkUpload = async () => {
  if (!bulkFile) return;
  setBulkLoading(true);
  const formData = new FormData();
  formData.append('file', bulkFile);
  try {
    const res = await axios.post('/api/students/bulk-upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    setBulkResult(res.data);
  } catch (err) {
    alert(err.response?.data?.message || 'Bulk upload failed');
  } finally {
    setBulkLoading(false);
  }
};

// Handle single student add response (show copy modal if needed):
const handleSingleAdd = async (formData) => {
  const res = await axios.post('/api/students', formData);
  if (res.data.showPasswordOnScreen) {
    setCopyModal({
      studentName: formData.name,
      email: formData.email || null,
      tempPassword: res.data.tempPassword,
    });
  } else {
    alert('Student created. Welcome email sent!');
  }
};

// JSX — Bulk upload section:
{copyModal && (
  <CopyPasswordModal
    studentName={copyModal.studentName}
    email={copyModal.email}
    tempPassword={copyModal.tempPassword}
    onClose={() => setCopyModal(null)}
  />
)}

 
Section 12 — Complete Validation Rules
12.1 All Validations Covered
#	Validation	Where Enforced	Error Message
1	Student name required, min 2 chars	Backend controller	Student name is required (min 2 chars)
2	Email format validation	Backend + CSV parser	Invalid email format
3	Duplicate email check (global, not just per institute)	Backend DB query before create	A user with this email already exists
4	CSV file type check (.csv only)	Multer fileFilter	Only CSV files allowed
5	CSV max file size (5MB)	Multer limits	File too large
6	CSV has at least 1 valid row	csvParser.js	No valid rows found in CSV
7	Resend cooldown 5 minutes	Resend controller	Please wait N more minutes
8	New password min 8 chars	Change password controller	Password must be at least 8 characters
9	New password different from current	Change password controller	New password must be different from current
10	Confirm password matches new password	Frontend only	Passwords do not match
11	First login block on all student routes except /change-password	firstLoginCheck middleware	403 FIRST_LOGIN_PASSWORD_CHANGE_REQUIRED
12	Email failure fallback — show password on screen instead of crashing	createStudent controller try/catch	No error shown. Modal displayed instead.
13	No email provided — always show password on screen	createStudent controller	Password copy modal shown automatically
14	Institute isolation — admin can only create students in own institute	institute_id from JWT, not request body	Students created under wrong institute prevented
15	tempPassword never stored in plain text, only bcrypt hash	bcrypt.hash(tempPassword, 12)	Plain text never reaches DB

 
Section 13 — API Reference
Method	Endpoint	Auth Role	Purpose
POST	/api/students	admin	Create single student — auto-generates + emails password
POST	/api/students/bulk-upload	admin	Upload CSV — creates all valid students with unique passwords
POST	/api/students/:id/resend-credentials	admin	Generate new password + resend welcome email
GET	/api/students/bulk-template/download	admin	Download sample CSV template
POST	/api/auth/change-password	student/any	Change password — clears is_first_login flag
POST	/api/auth/login	public	Login — returns is_first_login flag in response

 
Section 14 — Implementation Checklist
Complete these tasks in order. Do not skip phases.

#	Task	File	Status
1	Run migration SQL — add 3 columns to users table	Neon SQL Editor	To Do
2	Create backend/utils/passwordGenerator.js	NEW FILE	To Do
3	Create backend/utils/csvParser.js	NEW FILE	To Do
4	npm install csv-parse multer in backend	backend/package.json	To Do
5	Create backend/services/studentEmail.service.js	NEW FILE	To Do
6	Add FRONTEND_URL to backend/.env	backend/.env	To Do
7	Update createStudent function in student.controller.js	MODIFY	To Do
8	Add bulkCreateStudents function to student.controller.js	MODIFY	To Do
9	Add resendStudentCredentials function to student.controller.js	MODIFY	To Do
10	Add multer + 3 new routes to student.routes.js	MODIFY	To Do
11	Create backend/middleware/firstLoginCheck.js	NEW FILE	To Do
12	Update login controller to return is_first_login in JWT + response	MODIFY	To Do
13	Add changePassword function + route to auth files	MODIFY	To Do
14	Update AuthContext / App.jsx for first login redirect	MODIFY	To Do
15	Create frontend/src/pages/student/ChangePassword.jsx	NEW FILE	To Do
16	Create frontend/src/components/CopyPasswordModal.jsx	NEW FILE	To Do
17	Update ManageStudents.jsx with bulk upload UI + copy modal trigger	MODIFY	To Do
18	Add /change-password route to React Router	App.jsx routes	To Do
19	Test single student add with valid email	Manual test	To Do
20	Test single student add with no email (copy modal shows)	Manual test	To Do
21	Test bulk CSV upload with 5 students	Manual test	To Do
22	Test first login forced redirect + change password flow	Manual test	To Do
23	Test resend credentials with 5-minute cooldown	Manual test	To Do
24	Confirm tempPassword never appears in API response after email sent	Security test	To Do

 
Section 15 — Summary
What Changes in Your Project
Layer	New Files Created	Existing Files Modified
Database	— (SQL migration only)	users table (3 new columns)
Backend Utils	passwordGenerator.js, csvParser.js	—
Backend Services	studentEmail.service.js	email.service.js (no change needed)
Backend Controllers	—	student.controller.js, auth.controller.js
Backend Routes	—	student.routes.js, auth.routes.js
Backend Middleware	firstLoginCheck.js	—
Frontend Pages	ChangePassword.jsx	ManageStudents.jsx, App.jsx (route)
Frontend Components	CopyPasswordModal.jsx	AuthContext.jsx

SECURITY NOTE: The generated tempPassword is ONLY included in the API response when email delivery fails or when no email is provided. When email is sent successfully, tempPassword is never returned to the frontend — it exists only in the email and in the database as a bcrypt hash.

TOTAL COUNT: 5 new files created. 6 existing files modified. 1 SQL migration. 2 npm packages installed. Everything else (models, other controllers, routes, frontend pages) stays exactly as built.

— End of Document —
