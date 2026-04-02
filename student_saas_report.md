# 🎓 Student SaaS – Comprehensive Project Report

This document outlines all critical details of the `Student-SaaS-App` project. It is broken down into four key sections covering website deployment, mobile application publishing, system features, and a technical breakdown of the frontend and backend architectures.

---

## 🚀 1. Important Details for Deploying the Website

To successfully deploy the SaaS application on a live server (e.g., AWS EC2, DigitalOcean Droplet, VPS), ensure the following prerequisites and steps are taken:

### Backend Deployment Steps:
1. **Prerequisites Checklist**:  
   - Node.js (v18.x or v20.x recommended)
   - MySQL Server (Port 3306)
   - Process manager (e.g., PM2) to run the backend continuously.
2. **Environment Variables (`.env`) Configuration**: 
   You must create an `.env` file in the `backend/` folder before launching. Crucial variables include:
   - Database Connection: `DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`, `DB_PORT`, `DB_DIALECT` (MySQL)
   - Application Hosting: `HOST` (usually `0.0.0.0`), `PORT`, `FRONTEND_URL` (for CORS)
   - Security: Must define `JWT_SECRET` for secure authentication.
   - Payment Gateway: `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET`
   - Email Gateway (SMTP): Google/AWS SES/SendGrid config for `EMAIL_HOST`, `EMAIL_USER`, `EMAIL_PASS`.
3. **Database Initialization**: 
   The application uses `Sequelize ORM` which orchestrates table creations and indexing. 
4. **Execution Tools**:
   - Start the node backend via PM2: `pm2 start server.js --name "saas-backend"`

### Frontend Deployment Steps:
1. **API Endpoints**: Ensure your frontend Axios configurations point to your actual LIVE backend domain (e.g., `https://api.yourdomain.com`).
2. **Build the Distributable**:
   Run `npm run build` in the `frontend/` directory. Vite will compile the React code into static assets inside the `dist/` folder.
3. **Hosting & SSL**:
   Take the contents of the `dist/` folder and host them on a service like Vercel, Netlify, or serve them using Nginx/Apache. SSL Certificates (Let's Encrypt) must be provisioned.

---

## 📱 2. Important Details for Publishing the Mobile Application

The mobile application is built using **React, Vite, and Ionic Capacitor** (allowing web code to run as native apps).

### Mobile Variants Architecture
The frontend `package.json` reveals that the app has scripts to produce different "variants" or "flavours" of the app using a special script (`patch-capacitor-app.cjs`):
- `build:mobile:student`: Specific App for Students.
- `build:mobile:parent`: App for Parents.
- `build:mobile:faculty`: App for Faculty/Teachers.
- `build:mobile:universal`: Multi-role universal App.

### Critical Production Updates (Before Uploading to Play Store):
1. **Fix Capacitor Config Security Risks**:
   - Ensure the `"cleartext": true` setting in `capacitor.config.json` is set to `false` or removed entirely. Play Store/App Store will reject apps attempting HTTP cleartext traffic in production. All APIs must be HTTPS.
2. **Application Identifiers**: 
   - Define a unique `appId` (e.g., `com.studentsaas.studentapp`) for every variant if publishing separate apps.
3. **Android Studio Compilation**:
   - Run the desired build command from the frontend directory, e.g., `npm run build:mobile:universal`.
   - Run `npx cap open android` to open Android Studio.
4. **Permissions**: The application relies on plugins like `@capacitor/push-notifications` and specific HTML5 tools like the camera (`html5-qrcode`). Ensure `AndroidManifest.xml` correctly requests:
   - `android.permission.INTERNET`
   - `android.permission.CAMERA`
5. **App Bundle Signature**: In Android Studio, generate a signed `AAB` (Android App Bundle) using your Keystore file (.jks) and App-specific credentials to publish on the Google Play Console.

---

## ✨ 3. All Features & Modules

The platform is designed as a Multi-Tenant/Coaching ERP architecture (meaning multiple distinct coaching institutes can manage their own data independently within the same central platform). Every major module is data-isolated per institute level.

**1. Accounts, Routing & Authentication:**
- Role-based Access (Superadmin, Institute Admin, Faculty, Student, Parent).
- Secure JWT-based access with account status control ("Active" vs "Blocked").

**2. Academic Management Flow:**
- Class, Subject & Timetables management.
- Creation of Assignments and Tracking Student Submissions.
- Upload/Download Study Notes and track Notes distribution.

**3. Attendance Systems:**
- Standard Teacher/Admin Manual Attendance System.
- Advanced Biometric Attendance Hardware Integration (Biometric device registration, biometrics enrollment mapping, and remote punch integrations).

**4. Exams & Grading:**
- Detailed Exam creation linked to Subjects.
- Mark entries with automated system calculations for Total and Percentages.

**5. Payments & Subscriptions (SaaS aspect):**
- Super Admin Level Plans (Basic, Pro, Premium) with 14-day Free Trial capabilities.
- Revenue Management Dashboard & Subscriptions handled securely via **Razorpay Webhooks**.
- Fully automated Email/PDF Invoicing for subscriptions with Subscription Expiry Middlewares.

**6. Student Fees Management:**
- Setup Fee Structures & Track Payments by Students.
- Transport Fees configurations and Discounter logs.

**7. In-App Communication:**
- Real-time Chat capabilities (Chat Rooms, Chat Messages, Chat Participants).
- Instant System Announcements.

**8. Public Pages & Lead Generation:**
- Public Profiles, Enquiries, Photo Galleries, and Reviews pages per individual coaching institute to serve as marketing landing pages to capture leads.

---

## 🛠️ 4. Technical Architecture: Frontend & Backend Breakdown

### Overview & How They Connect
The project uses a standard decoupled "Client-Server API" approach:
- **How they connect**: The frontend securely talks to the backend via RESTful HTTP calls (using the `axios` library). Authorization validates sessions by passing JSON Web Tokens (`JWT`) hidden in the Authorization Header (`Bearer <Token>`).
- **Where data is stored**: In a centralized relational database – **MySQL**.

### A. The Backend (Node.js & Express)
A robust structured API, utilizing the Clean Modular Architecture layer pattern (Models -> Services -> Controllers -> Routes).
* **Database Access**: Relies heavily on **Sequelize ORM**, allowing complex joins to query nested entity logic (e.g., Student -> User -> Marks -> Attendance).
* **Payments & Economics**: Integegrates `razorpay` to facilitate plan payments. A webhook endpoint allows Razorpay to securely signal the system when a transaction succeeds to extend an institute's SaaS billing expiry date.
* **Media Parsing**: Employs `multer` heavily for file uploads (institute logos, user avatars, study notes, student assignment submissions) to save locally in the backend `uploads/` directory.
* **Security Layer**: 
   - `bcrypt` hashing for all passwords (preventing plaintext storage in the DB).
   - Strict Middlewares that evaluate User Identity and block unauthorized users from touching alien resources (e.g., verifying `req.user.institute_id` implicitly).
* **Automated Processes**: Utilizes `node-cron` for scheduling tasks in the background (like subscription checks) and `nodemailer` for email alerts (Welcome messages, Reminders). Invoice PDFs are drawn and piped directly via `pdfkit`.

### B. The Frontend (React & Vite)
The User Interface operates as a Single Page Application (SPA), providing high performance by doing page refreshes purely via Javascript manipulation rather than reloading whole pages.
* **Core Technology**: React.js 18 built upon a Vite development server wrapper resulting in lighting fast Hot Module Reloading speeds during development.
* **Routing**: Implements `react-router-dom` to maintain standard URLs (e.g., `/admin/students`) and to restrict views depending on user roles logged in.
* **State Management**: Rather than heavy frameworks like Redux, it prioritizes React's native `Context API` (`AuthContext` for user states, `InstituteContext` for current org setups, and `ThemeContext`).
* **Design Strategy**: It uses dynamic and beautiful CSS structuring heavily relying on CSS variables and modularization (`/src/styles`). It incorporates dynamic universal mobile table responsiveness strategies (like applying custom `mobile-keep` layouts) without requiring Tailwind.
* **Complex Add-ons**: 
   - Interactive Graphics & Data visually rendered using `chart.js` & `react-chartjs-2`.
   - Real-time QR Code scanning inside browsers using `html5-qrcode`.
   - Direct frontend Excel extraction parsing via `xlsx`.
   - Cross-native device capability driven via Capacitor wrappers (`@capacitor/camera`, `@capacitor/push-notifications`).

---
_End of Report_
