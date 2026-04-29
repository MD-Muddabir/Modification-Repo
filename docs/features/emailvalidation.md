ZF Solution Platform
OTP Email Verification System
Register & Forgot Password — Complete Implementation Guide
Version 1.0  |  April 2026
Stack	Node.js + Express	MySQL + Sequelize	React + Vite	

 
1. Overview & Purpose
This document provides a complete step-by-step implementation guide for adding OTP (One-Time Password) email verification to your ZF Solution platform. It covers two critical flows: Registration with email OTP verification and Forgot Password with email OTP reset. Every edge case, security consideration, and database change required is documented in phases.

1.1 Why OTP Verification Is Essential
•	Prevents fake registrations with invalid or other people's email addresses
•	Ensures only the real email owner can activate an institute account
•	Protects the forgot password flow from unauthorized access
•	Industry standard for SaaS applications — institutes will expect this
•	Reduces spam and bot registrations on your public registration page

1.2 The Two Flows Covered
	Flow 1: Registration OTP	Flow 2: Forgot Password OTP
Trigger	User fills registration form and clicks Create Account	User clicks Forgot Password on login page
OTP Sent To	Email entered in registration form	Email entered in forgot password form
Purpose	Verify email ownership before activating account	Verify identity before allowing password reset
OTP Expiry	10 minutes	10 minutes
Max Attempts	5 wrong attempts then lock	5 wrong attempts then lock
Resend Limit	3 times per registration attempt	3 times per reset attempt
Account Status	Stays pending until OTP verified	Password updated after OTP verified

 
2. Complete Flow Diagrams
2.1 Registration OTP Flow
Step 1	User fills registration form	Institute Name, Email, Phone, Password, Select Plan
Step 2	User clicks 'Create Account & Continue'	Frontend validates all fields before calling API
Step 3	Backend receives registration data	POST /api/auth/register-init
Step 4	Backend checks if email already exists	If exists and verified → return error. If exists unverified → resend OTP
Step 5	Generate 6-digit OTP	crypto.randomInt(100000, 999999)
Step 6	Save OTP to otp_verifications table	With expiry = now + 10 minutes, attempt_count = 0
Step 7	Send OTP email via Nodemailer	Professional HTML email template
Step 8	Frontend shows OTP input screen	With countdown timer and Resend button
Step 9	User enters OTP from email	POST /api/auth/verify-otp
Step 10	Backend validates OTP	Check: exists, not expired, not used, attempt count < 5
Step 11	If OTP valid — create institute account	Insert into institutes table, status = active
Step 12	Mark OTP as used	is_used = true in otp_verifications
Step 13	Return JWT token	User automatically logged in after verification


2.2 Forgot Password OTP Flow
Step 1	User clicks 'Forgot Password' on login page	Link visible below login button
Step 2	Frontend shows email input form	User enters registered email
Step 3	POST /api/auth/forgot-password	Backend checks if email exists in institutes table
Step 4	If email not found	Return generic message — do NOT reveal if email exists or not
Step 5	Generate 6-digit OTP and save	Same otp_verifications table, type = 'password_reset'
Step 6	Send OTP email	Different email template — password reset themed
Step 7	Frontend shows OTP + New Password form	User enters OTP + new password + confirm password
Step 8	POST /api/auth/reset-password	Backend validates OTP then updates password
Step 9	Hash new password with bcrypt	Never store plain text password
Step 10	Mark OTP as used	Invalidate token immediately after use
Step 11	Return success	Frontend redirects to login page with success message


 
3. Database Changes
3.1 New Table: otp_verifications
Create this new table in your MySQL database. This single table handles both registration OTP and forgot password OTP by using the type column.
CREATE TABLE otp_verifications (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  email         VARCHAR(255) NOT NULL,
  otp           VARCHAR(6)   NOT NULL,
  type          ENUM('registration', 'password_reset') NOT NULL,
  is_used       BOOLEAN      DEFAULT FALSE,
  attempt_count INT          DEFAULT 0,
  resend_count  INT          DEFAULT 0,
  expires_at    DATETIME     NOT NULL,
  created_at    DATETIME     DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_email_type (email, type)
);

3.2 Column Details
Column	Type	Default	Purpose
id	INT	AUTO	Primary key
email	VARCHAR(255)	Required	Email address OTP was sent to
otp	VARCHAR(6)	Required	6-digit OTP code (store as string)
type	ENUM	Required	registration or password_reset
is_used	BOOLEAN	FALSE	Marks OTP as consumed — prevents reuse
attempt_count	INT	0	Wrong OTP entries — lock after 5 attempts
resend_count	INT	0	How many times OTP was resent — limit at 3
expires_at	DATETIME	now+10min	OTP invalid after this timestamp

3.3 Update Institutes Table
Add one column to your existing institutes table to track email verification status:
ALTER TABLE institutes
  ADD COLUMN email_verified BOOLEAN DEFAULT FALSE,
  ADD COLUMN status ENUM('pending','active','suspended') DEFAULT 'pending';

-- New institutes start as 'pending' until email is verified
-- After OTP verified successfully, update to 'active'

 
4. Backend Implementation — Phase by Phase
Phase 1	Install Dependencies
Add Nodemailer and configure email service

Run this in your backend folder:
npm install nodemailer dotenv

Configure Gmail SMTP in .env
# .env
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=youremail@gmail.com
EMAIL_PASS=your_gmail_app_password
EMAIL_FROM=ZF Solution <youremail@gmail.com>
OTP_EXPIRY_MINUTES=10
OTP_MAX_ATTEMPTS=5
OTP_MAX_RESEND=3

Important — Gmail App Password Required
You cannot use your regular Gmail password. Go to Google Account > Security > 2-Step
Verification > App Passwords. Generate a 16-character app password for 'Mail'.
Use that 16-character code as EMAIL_PASS in your .env file.

Phase 2	Create OTP Model
Sequelize model for otp_verifications table

Create file: backend/models/otpVerification.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const OtpVerification = sequelize.define('OtpVerification', {
  email:         { type: DataTypes.STRING,  allowNull: false },
  otp:           { type: DataTypes.STRING(6), allowNull: false },
  type:          { type: DataTypes.ENUM('registration','password_reset'), allowNull: false },
  is_used:       { type: DataTypes.BOOLEAN, defaultValue: false },
  attempt_count: { type: DataTypes.INTEGER, defaultValue: 0 },
  resend_count:  { type: DataTypes.INTEGER, defaultValue: 0 },
  expires_at:    { type: DataTypes.DATE,    allowNull: false },
}, { tableName: 'otp_verifications', timestamps: true });

module.exports = OtpVerification;

Phase 3	Create Email Service
Nodemailer setup + professional HTML templates

Create file: backend/services/email.service.js
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: false,
  auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS }
});

exports.sendOtpEmail = async (email, otp, type) => {
  const isReset = type === 'password_reset';
  const subject = isReset
    ? 'Password Reset OTP - ZF Solution'
    : 'Verify Your Email - ZF Solution';

  const html = `
    <div style='font-family:Arial;max-width:500px;margin:auto;padding:30px;
         border:1px solid #e2e8f0;border-radius:12px;'>
      <h2 style='color:#1E3A5F;'>${isReset ? 'Reset Your Password' : 'Verify Your Email'}</h2>
      <p>Your OTP code is:</p>
      <div style='font-size:36px;font-weight:bold;letter-spacing:10px;
           color:#2563EB;text-align:center;padding:20px;background:#EFF6FF;
           border-radius:8px;'>${otp}</div>
      <p style='color:#6B7280;margin-top:20px;'>
        This code expires in <strong>10 minutes</strong>.<br>
        Do not share this OTP with anyone.
      </p>
    </div>`,

  await transporter.sendMail({ from: process.env.EMAIL_FROM, to: email, subject, html });
};

Phase 4	Create OTP Utility Functions
Generate, save, validate, and invalidate OTPs

Create file: backend/utils/otp.util.js
const crypto = require('crypto');
const OtpVerification = require('../models/otpVerification');
const { Op } = require('sequelize');

// Generate 6-digit OTP
exports.generateOtp = () => {
  return String(crypto.randomInt(100000, 999999));
};

// Save or replace OTP for email + type
exports.saveOtp = async (email, otp, type) => {
  // Delete any old unused OTPs for this email+type
  await OtpVerification.destroy({ where: { email, type, is_used: false } });

  const expiryMinutes = parseInt(process.env.OTP_EXPIRY_MINUTES) || 10;
  const expires_at = new Date(Date.now() + expiryMinutes * 60 * 1000);

  return OtpVerification.create({ email, otp, type, expires_at });
};

// Validate OTP — returns { valid, message, record }
exports.validateOtp = async (email, otp, type) => {
  const record = await OtpVerification.findOne({
    where: { email, type, is_used: false },
    order: [['created_at', 'DESC']]
  });

  if (!record) return { valid: false, message: 'OTP not found. Please request a new one.' };
  if (new Date() > record.expires_at) return { valid: false, message: 'OTP has expired. Please request a new one.' };
  if (record.attempt_count >= 5) return { valid: false, message: 'Too many attempts. Please request a new OTP.' };

  if (record.otp !== otp) {
    await record.increment('attempt_count');
    const remaining = 5 - (record.attempt_count + 1);
    return { valid: false, message: `Incorrect OTP. ${remaining} attempts remaining.` };
  }

  return { valid: true, record };
};

// Mark OTP as used
exports.invalidateOtp = async (record) => {
  await record.update({ is_used: true });
};

 
Phase 5	Create Auth Controller Functions
Register Init, Verify OTP, Forgot Password, Reset Password

Add these functions inside your existing backend/controllers/auth.controller.js:
5.1 registerInit — Step 1 of Registration
const { generateOtp, saveOtp } = require('../utils/otp.util');
const { sendOtpEmail }         = require('../services/email.service');
const { Institute }            = require('../models');

exports.registerInit = async (req, res) => {
  try {
    const { name, email, phone, password, plan_id } = req.body;

    // 1. Check if email already registered and verified
    const existing = await Institute.findOne({ where: { email } });
    if (existing && existing.email_verified) {
      return res.status(409).json({ success: false, message: 'Email already registered. Please login.' });
    }

    // 2. Store pending registration in session or temp table
    //    Simple approach: store in request session or JWT temp token
    const otp = generateOtp();
    await saveOtp(email, otp, 'registration');
    await sendOtpEmail(email, otp, 'registration');

    res.status(200).json({
      success: true,
      message: 'OTP sent to your email. Please verify to complete registration.',
      data: { email, name, phone, plan_id } // return data for frontend to hold
    });
  } catch (error) {
    console.error('registerInit error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

5.2 verifyRegistrationOtp — Step 2 of Registration
const bcrypt = require('bcrypt');
const jwt    = require('jsonwebtoken');
const { validateOtp, invalidateOtp } = require('../utils/otp.util');

exports.verifyRegistrationOtp = async (req, res) => {
  try {
    const { email, otp, name, phone, password, plan_id } = req.body;

    // 1. Validate OTP
    const { valid, message, record } = await validateOtp(email, otp, 'registration');
    if (!valid) return res.status(400).json({ success: false, message });

    // 2. Hash password
    const hashed = await bcrypt.hash(password, 12);

    // 3. Create Institute account
    const institute = await Institute.create({
      name, email, phone,
      password: hashed,
      plan_id,
      email_verified: true,
      status: 'active'
    });

    // 4. Invalidate OTP
    await invalidateOtp(record);

    // 5. Generate JWT
    const token = jwt.sign(
      { id: institute.id, role: 'admin', institute_id: institute.id },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({ success: true, message: 'Account created successfully!', token,
      data: { id: institute.id, name: institute.name, email: institute.email }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

5.3 forgotPassword
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    // Always return same message — never reveal if email exists
    const institute = await Institute.findOne({ where: { email } });
    if (!institute) {
      return res.status(200).json({
        success: true,
        message: 'If this email is registered, you will receive an OTP.'
      });
    }

    const otp = generateOtp();
    await saveOtp(email, otp, 'password_reset');
    await sendOtpEmail(email, otp, 'password_reset');

    res.status(200).json({
      success: true,
      message: 'OTP sent to your email address.',
      data: { email }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

5.4 resetPassword
exports.resetPassword = async (req, res) => {
  try {
    const { email, otp, new_password, confirm_password } = req.body;

    if (new_password !== confirm_password) {
      return res.status(400).json({ success: false, message: 'Passwords do not match.' });
    }
    if (new_password.length < 8) {
      return res.status(400).json({ success: false, message: 'Password must be at least 8 characters.' });
    }

    const { valid, message, record } = await validateOtp(email, otp, 'password_reset');
    if (!valid) return res.status(400).json({ success: false, message });

    const hashed = await bcrypt.hash(new_password, 12);
    await Institute.update({ password: hashed }, { where: { email } });
    await invalidateOtp(record);

    res.status(200).json({ success: true, message: 'Password reset successfully. Please login.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

5.5 resendOtp
exports.resendOtp = async (req, res) => {
  try {
    const { email, type } = req.body;

    // Check resend limit
    const existing = await OtpVerification.findOne({
      where: { email, type, is_used: false },
      order: [['created_at', 'DESC']]
    });

    if (existing && existing.resend_count >= 3) {
      return res.status(429).json({
        success: false,
        message: 'Maximum resend limit reached. Please restart the process.'
      });
    }

    // Increment resend count on old record
    if (existing) await existing.increment('resend_count');

    const otp = generateOtp();
    await saveOtp(email, otp, type);
    await sendOtpEmail(email, otp, type);

    res.status(200).json({ success: true, message: 'New OTP sent to your email.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

 
Phase 6	Add Routes
Connect all new controller functions to API endpoints

Update backend/routes/auth.routes.js — add these new routes:
const router = require('express').Router();
const auth   = require('../controllers/auth.controller');

// Existing
router.post('/login', auth.login);

// NEW — Registration with OTP
router.post('/register-init',         auth.registerInit);
router.post('/verify-registration',   auth.verifyRegistrationOtp);
router.post('/resend-otp',            auth.resendOtp);

// NEW — Forgot Password with OTP
router.post('/forgot-password',       auth.forgotPassword);
router.post('/reset-password',        auth.resetPassword);

module.exports = router;

API Endpoint Summary
POST /api/auth/register-init         — Send OTP to new user email
POST /api/auth/verify-registration   — Verify OTP and create account
POST /api/auth/resend-otp            — Resend OTP (max 3 times)
POST /api/auth/forgot-password       — Send OTP for password reset
POST /api/auth/reset-password        — Verify OTP and update password

 
5. Frontend Implementation
Phase 7	Registration Page Update
Add OTP verification step after form submission

Your registration page now needs two steps: Step 1 is the existing form, Step 2 is the new OTP input screen. The page state controls which screen is shown.
// In your Register.jsx — add state for OTP step
const [step, setStep] = useState(1);   // 1 = form, 2 = OTP screen
const [otpValue, setOtpValue] = useState('');
const [timer, setTimer] = useState(600); // 10 min countdown
const [formData, setFormData] = useState({}); // hold form values

// Step 1: Submit form — call register-init
const handleFormSubmit = async (e) => {
  e.preventDefault();
  try {
    const res = await api.post('/auth/register-init', formData);
    if (res.data.success) {
      setStep(2);          // Show OTP screen
      startTimer();        // Start 10 min countdown
    }
  } catch (err) {
    alert(err.response?.data?.message || 'Error sending OTP');
  }
};

// Step 2: Submit OTP — call verify-registration
const handleOtpSubmit = async () => {
  try {
    const res = await api.post('/auth/verify-registration', {
      ...formData,
      otp: otpValue
    });
    if (res.data.success) {
      localStorage.setItem('token', res.data.token);
      navigate('/admin/dashboard');
    }
  } catch (err) {
    alert(err.response?.data?.message || 'Invalid OTP');
  }
};

// Resend OTP
const handleResend = async () => {
  await api.post('/auth/resend-otp', { email: formData.email, type: 'registration' });
  setTimer(600); // reset timer
};

OTP Input Screen UI (Step 2)
{step === 2 && (
  <div className='otp-screen'>
    <h2>Verify Your Email</h2>
    <p>We sent a 6-digit code to <strong>{formData.email}</strong></p>
    <p style={{color:'#6B7280'}}>Check your inbox and spam folder</p>

    <div className='otp-inputs'>
      {/* 6 separate single-digit inputs for better UX */}
      {[0,1,2,3,4,5].map(i => (
        <input key={i} maxLength={1} className='otp-box'
          onChange={(e) => handleOtpDigit(i, e.target.value)} />
      ))}
    </div>

    <p>Code expires in: <strong>{formatTime(timer)}</strong></p>

    <button onClick={handleOtpSubmit} className='btn btn-primary'>
      Verify & Create Account
    </button>

    <button onClick={handleResend} className='btn btn-link'>
      Resend OTP
    </button>
  </div>
)}

Phase 8	Forgot Password Page
Add Forgot Password flow with 3 steps

Add a new page ForgotPassword.jsx with three internal steps: email input, OTP input, and new password input.
const [step, setStep] = useState(1);  // 1=email, 2=OTP, 3=newPassword
const [email, setEmail] = useState('');
const [otp, setOtp]     = useState('');

// Step 1: Request OTP
const handleEmailSubmit = async () => {
  await api.post('/auth/forgot-password', { email });
  setStep(2); // Always move to step 2 regardless (security)
};

// Step 2: Verify OTP — move to password reset
const handleOtpVerify = async () => {
  // Don't call API yet — just verify format and move to step 3
  // Actual OTP validation happens when new password is submitted
  if (otp.length === 6) setStep(3);
};

// Step 3: Reset Password
const handlePasswordReset = async () => {
  const res = await api.post('/auth/reset-password', {
    email, otp, new_password, confirm_password
  });
  if (res.data.success) navigate('/login', { state: { message: 'Password reset!' } });
};

Add route in App.jsx
import ForgotPassword from "./pages/ForgotPassword";
<Route path="/forgot-password" element={<ForgotPassword />} />

In your Login.jsx, add the link below the login button:
<Link to="/forgot-password">Forgot Password?</Link>

 
6. Security Checklist
	Security Rule	Why It Matters
1	OTP expires in 10 minutes	Prevents old OTPs from being brute forced
2	Max 5 wrong OTP attempts then lock	Stops automated brute force attacks
3	Max 3 OTP resends allowed	Prevents email spam abuse
4	OTP is marked used immediately after success	Prevents replay attacks — same OTP cannot be used twice
5	Forgot password — never reveal if email exists	Prevents email enumeration attacks
6	OTP generated with crypto.randomInt (not Math.random)	Cryptographically secure random — cannot be predicted
7	Old unused OTPs deleted when new one generated	Keeps database clean and prevents confusion
8	Password hashed with bcrypt (cost factor 12)	Protects user passwords even if database is breached
9	HTTPS only in production	Prevents OTP interception in transit
10	Rate limit /register-init and /forgot-password	Prevents mass email spam attacks on your mail server

6.1 Add Rate Limiting (Important)
Install express-rate-limit and add to your auth routes:
npm install express-rate-limit

// In auth.routes.js
const rateLimit = require('express-rate-limit');

const otpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,                    // max 5 OTP requests per IP per 15 min
  message: { success: false, message: 'Too many requests. Please try again later.' }
});

router.post('/register-init',   otpLimiter, auth.registerInit);
router.post('/forgot-password', otpLimiter, auth.forgotPassword);

 
7. Edge Cases & How to Handle Them
#	Edge Case	Correct Handling
1	User enters wrong OTP	Increment attempt_count. Show remaining attempts. Lock after 5.
2	OTP expires (after 10 min)	Show 'OTP expired' message with Resend button
3	User requests OTP again before expiry	Delete old OTP, generate new one, send fresh email
4	Email not received	Resend OTP button. Also instruct to check spam folder
5	User registers with already verified email	Return: 'Email already registered. Please login.'
6	User registers, OTP sent, never verified, tries again	Delete old record, generate fresh OTP, resend
7	User refreshes OTP page accidentally	Frontend holds email in state/localStorage so page survives refresh
8	Gmail SMTP limit reached	Handle error gracefully — show: 'Email service unavailable, please try later'
9	User tries to reset password for unregistered email	Return same generic message — do not reveal email existence
10	User submits blank OTP	Frontend validation — ensure 6 digits before calling API
11	New password same as old password	Optional: allow it — not a security risk, just UX choice
12	OTP locked (5 attempts), user wants to try again	Show 'Request new OTP' button which calls resendOtp

 
8. Testing Checklist
8.1 Registration OTP Tests
#	Test Scenario	Expected Result	Priority
1	Register with valid details — check email inbox	OTP email arrives within 30 seconds	Critical
2	Enter correct OTP — account created	JWT returned, redirected to dashboard	Critical
3	Enter wrong OTP 5 times	Locked after 5th attempt	Critical
4	Wait 10+ minutes then submit OTP	OTP expired message shown	Critical
5	Click Resend OTP 3 times then 4th time	4th resend blocked with limit message	High
6	Register with already verified email	Correct error: email already registered	High

8.2 Forgot Password OTP Tests
#	Test Scenario	Expected Result	Priority
1	Enter registered email — check inbox	OTP email arrives	Critical
2	Enter correct OTP + new password	Password updated, redirected to login	Critical
3	Enter unregistered email	Generic success message (no error reveal)	Critical
4	New password and confirm password mismatch	Error: passwords do not match	High
5	Try to reuse same OTP after reset	Error: OTP already used	High
6	Login with new password after reset	Login successful	Critical

 
9. Implementation Summary
Phase	Area	What to Create / Change	Status
1	Backend	npm install nodemailer, add .env variables	To Do
2	Database	Create otp_verifications table, alter institutes table	To Do
3	Backend Model	Create models/otpVerification.js	To Do
4	Backend Service	Create services/email.service.js with HTML template	To Do
5	Backend Utility	Create utils/otp.util.js — generate, save, validate, invalidate	To Do
6	Backend Controller	Add 5 new functions to auth.controller.js	To Do
7	Backend Routes	Add 5 new routes in auth.routes.js	To Do
8	Backend Security	Add express-rate-limit to OTP endpoints	To Do
9	Frontend	Update Register.jsx — add OTP step 2 screen	To Do
10	Frontend	Create ForgotPassword.jsx with 3-step flow	To Do
11	Frontend	Add /forgot-password route in App.jsx	To Do
12	Frontend	Add 'Forgot Password?' link in Login.jsx	To Do
13	Testing	Run all test cases from Section 8	To Do

Final Note — Free Email Service
Gmail SMTP is free and works well for up to a few hundred emails per day. For production
with many institutes registering, consider upgrading to Brevo (formerly Sendinblue) which
gives 300 free emails per day, or Resend.com which is developer-friendly with a generous
free tier and much better deliverability than raw Gmail SMTP.

Install Brevo instead:  npm install @sendinblue/client
Or use Resend:          npm install resend

