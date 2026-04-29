
ZF Solution Platform
MySQL → Neon (PostgreSQL) Migration
Complete Professional Migration Guide — All 48 Tables
Zero Data Loss  │  Production-Safe  │  Sequelize Compatible  │  Free Tier Ready
Current
MySQL (Railway)	Target
Neon PostgreSQL	Tables
48 Tables	Method
Zero-downtime

Version 1.0  │  April 2026  │  Based on 48 Live Tables from Uploaded Database File

 
1.  Why Migrate to Neon PostgreSQL
Your project is currently on MySQL hosted on Railway. This migration moves your database to Neon — a serverless PostgreSQL platform. Here is the complete reasoning and what changes in your stack.

Topic	MySQL on Railway	Neon PostgreSQL
Free tier	500MB, can cost money	512MB free, 0.5 compute units, never charged without upgrade
Serverless / Scale to zero	Always running, costs on idle	Auto-pauses after 5 min — true serverless, ideal for SaaS
Connection pooling	Manual setup needed	PgBouncer built-in — handles thousands of connections
Branching (dev/prod split)	Not available	Database branching — test migrations on branch safely
Render.com compatibility	Works via Railway URL	Works perfectly — standard PostgreSQL URL
Vercel / Edge compatibility	Needs special setup	Native Vercel integration — one-click connect
Production reliability	Good	Multi-region, auto-failover, point-in-time restore
ORM support	Sequelize mysql2	Sequelize pg — same API, different dialect

Important Reality Check
PostgreSQL and MySQL are both SQL databases but NOT identical. There are syntax differences
that must be handled carefully. This guide covers every difference found in your 48 tables.
The migration is fully achievable — roughly 2-4 hours of work done correctly.
Your Sequelize models need dialect change + a few column type adjustments. Controllers stay the same.

 
2.  MySQL to PostgreSQL — Data Type Mapping (Your 48 Tables)
Based on reading every column across all 48 tables in your uploaded database file, here is the complete type conversion map. Every MySQL type used in your project is listed with its PostgreSQL equivalent.

MySQL Type	PostgreSQL Type	Notes & Where Used	Risk
INT / int	INTEGER or SERIAL	All id columns, institute_id, student_id, etc. AUTO_INCREMENT becomes SERIAL	Low
AUTO_INCREMENT	SERIAL or GENERATED ALWAYS AS IDENTITY	Change every PRI + auto_increment column	Medium
TINYINT(1)	BOOLEAN	Used for: is_late, is_half_day, is_full_course, theme_dark, signature_verified etc. TRUE/FALSE in PG	Medium
BIGINT	BIGINT	Used in biometric_punches.id — no change needed	Low
VARCHAR(n)	VARCHAR(n)	No change — same syntax, same limits	None
TEXT	TEXT	No change — used in content, description, remarks etc.	None
DATETIME	TIMESTAMPTZ	All created_at, updated_at, datetime columns. Use TIMESTAMPTZ (timezone-aware)	Medium
DATE	DATE	Used in exam_date, due_date, admission_date — no change	None
TIME	TIME	Used in timetable_slots, biometric_settings — no change	None
DECIMAL(n,m)	NUMERIC(n,m)	All money columns: amount, salary, marks_obtained etc. NUMERIC is PG equivalent	Low
JSON	JSONB	Used in: permissions, allowed_file_types, notes, usp_points etc. JSONB is faster than JSON in PG	Low
CHAR(36)	UUID	Used in expenses.id — use gen_random_uuid() default in PG	Medium
ENUM(...)	VARCHAR + CHECK constraint OR custom TYPE	MySQL ENUMs don't transfer directly — 3 strategies explained in Section 3	High
TINYINT (not bool)	SMALLINT	Any tinyint used as number, not flag — check context	Low

 
3.  ENUM Handling — Most Critical Difference
Your database has 38 ENUM columns across 19 tables. MySQL ENUMs cannot be directly migrated to PostgreSQL. You have 3 options — this guide recommends Option B (VARCHAR + CHECK) for your project as it is safest with Sequelize.

3.1  All ENUM Columns in Your 48 Tables
#	Table	Column	ENUM Values
1	announcements	target_audience	all, students, faculty
2	announcements	priority	normal, high, urgent
3	assignment_submissions	status	pending, submitted, late, graded, resubmit_requested
4	assignments	status	draft, published, closed
5	attendances	status	present, absent, late, holiday, half_day
6	attendances	marked_by_type	manual, biometric, mobile_otp, qr_code
7	biometric_devices	device_type	fingerprint, face, rfid, mobile
8	biometric_devices	status	active, inactive, offline
9	biometric_enrollments	user_role	student, faculty
10	biometric_enrollments	status	active, inactive
11	biometric_punches	punch_type	in, out, break
12	chat_rooms	type	subject, group, direct
13	chat_rooms	target_gender	male, female, both
14	faculty_attendances	status	present, absent, late, half_day, holiday
15	institute_discounts	discount_type	percentage, fixed
16	institute_discounts	status	active, used, expired
17	institutes	status	active, expired, suspended, pending
18	institutes	current_feature_attendance	none, basic, advanced
19	institutes	current_feature_reports	none, basic, advanced
20	invoices	invoice_type	subscription, student_fee, refund
21	leads	status	new, contacted, demo_scheduled, closed_won, closed_lost
22	payments	status	success, failed, pending
23	plans	feature_attendance	none, basic, advanced
24	plans	feature_reports	none, basic, advanced
25	plans	status	active, inactive, archived
26	public_enquiries	status	new, contacted, enrolled, closed
27	razorpay_orders	order_type	subscription, student_fee, addon
28	razorpay_orders	status	pending, paid, failed, cancelled
29	student_fee_payments	payment_status	pending, paid, failed
30	student_fees	status	pending, partial, paid
31	student_parents	relationship	father, mother, guardian
32	students	gender	male, female, other
33	subscriptions	payment_status	paid, unpaid, failed, pending
34	timetables	day_of_week	Monday, Tuesday, Wednesday, Thursday, Friday, Saturday
35	users	role	super_admin, admin, manager, faculty, student, parent
36	users	status	active, blocked
37	users	theme_style	simple, pro
38	class_sessions	(implicit booleans)	is_active — tinyint(1) becomes BOOLEAN

3.2  Recommended ENUM Strategy — VARCHAR + CHECK Constraint
Use VARCHAR with a CHECK constraint in PostgreSQL. This is the simplest approach and works perfectly with Sequelize's STRING type. In Sequelize models, change DataTypes.ENUM to DataTypes.STRING and add a validate block:
// MySQL Sequelize model (your current code):
status: {
  type: DataTypes.ENUM('active','expired','suspended','pending')
}

// PostgreSQL Sequelize model (new code):
status: {
  type: DataTypes.STRING(20),
  validate: {
    isIn: [['active','expired','suspended','pending']]
  }
}

// OR — use pg native ENUM type (better for strict enforcement):
// In migration file only — NOT in Sequelize model:
// queryInterface.sequelize.query(
//   "CREATE TYPE institute_status AS ENUM('active','expired','suspended','pending');"
// )

 
4.  Neon Account Setup & Database Creation
Phase 1	Create Neon Account & Database
Free tier — no credit card required

Step-by-step Neon setup
1.	Go to neon.tech — click Sign Up. Use GitHub login for fastest setup.
2.	Click Create Project. Name it: zf-solution-production
3.	Select Region: Asia Pacific (Singapore) — closest to India for low latency
4.	Database name: student_saas (same as your current MySQL DB name)
5.	Click Create Project — takes about 10 seconds
6.	You will see your Connection String. Copy the full URL — it looks like this:

postgresql://student_saas_owner:AbCdEfGh@ep-cool-rain-123456.ap-southeast-1.aws.neon.tech/student_saas?sslmode=require

# The URL has this structure:
# postgresql://[username]:[password]@[host]/[database]?sslmode=require
#
# IMPORTANT: Keep sslmode=require — Neon requires SSL connections

7.	In Neon dashboard go to Connection Details. Copy all 4 values separately:
PGHOST=ep-cool-rain-123456.ap-southeast-1.aws.neon.tech
PGDATABASE=student_saas
PGUSER=student_saas_owner
PGPASSWORD=AbCdEfGhIjKl

# Also get the pooled connection string for production:
# In Neon dashboard -> Connection pooling -> Copy pooled URL
# Format: postgresql://...@ep-...-pooler.ap-southeast-1.aws.neon.tech/student_saas

Neon Free Tier Limits — Know Before You Start
Storage: 512 MB — enough for your current SaaS at early stage
Compute: 0.25 vCPU, 1 GB RAM — scales automatically
Branches: Unlimited on free tier
Connection limit: 100 concurrent connections (use pooler URL in production)
Auto-suspend: After 5 min of inactivity — cold start ~1-2 seconds
To avoid cold starts on production: use Neon's connection pooler URL always

 
5.  Backend Code Changes — Complete
Phase 2	Install PostgreSQL Driver & Update Dependencies
Replace mysql2 with pg

Run in your backend folder:
# 1. Uninstall MySQL driver
npm uninstall mysql2

# 2. Install PostgreSQL driver
npm install pg pg-hstore

# pg        = PostgreSQL driver for Node.js
# pg-hstore = handles hstore data type (needed by Sequelize)

# 3. Verify package.json now shows:
# 'pg': '^8.x.x'
# 'pg-hstore': '^2.x.x'
# mysql2 should be GONE from dependencies

Phase 3	Update Database Config File
Change dialect from mysql to postgres

Open backend/config/database.js (or config/db.js). Replace entire file content:
// backend/config/database.js — COMPLETE REPLACEMENT
const { Sequelize } = require('sequelize');
require('dotenv').config();

const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: 'postgres',
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false,  // Required for Neon SSL
    },
  },
  pool: {
    max: 10,       // Max connections in pool
    min: 0,        // Min connections
    acquire: 30000,// Max ms to wait for connection
    idle: 10000,   // Connection idle timeout
  },
  logging: process.env.NODE_ENV === 'development' ? console.log : false,
  define: {
    underscored: false,       // Keep camelCase column names
    freezeTableName: false,   // Allow plural table names
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  },
});

module.exports = sequelize;

Phase 4	Update .env File
Add Neon connection string

Open backend/.env and add/replace the database connection variables:
# backend/.env — DATABASE SECTION

# Remove old MySQL variables:
# DB_HOST=...
# DB_USER=...
# DB_PASS=...
# DB_NAME=...
# DB_PORT=3306

# Add new Neon PostgreSQL connection string:
DATABASE_URL=postgresql://student_saas_owner:YourPassword@ep-cool-rain-123456.ap-southeast-1.aws.neon.tech/student_saas?sslmode=require

# For production use the POOLED connection URL (from Neon dashboard > Connection pooling):
# DATABASE_URL=postgresql://...@ep-...-pooler.ap-southeast-1.aws.neon.tech/student_saas?sslmode=require

# Keep all other .env variables unchanged:
JWT_SECRET=...
EMAIL_USER=...
RAZORPAY_KEY_ID=...
# etc.

Phase 5	Update All Sequelize Models — Type Changes
Fix ENUM, TINYINT(1), DATETIME, JSON across 48 tables

5.1  Global Model Changes — Apply to Every Model File
Open each model file in backend/models/ and apply these changes throughout:
Find (MySQL)	Replace With (PostgreSQL)	Which Models
DataTypes.ENUM('a','b','c')	DataTypes.STRING(30) + validate:{isIn:[['a','b','c']]}	19 models with ENUM columns
DataTypes.TINYINT(1) or BOOLEAN	DataTypes.BOOLEAN	attendances, students, plans, institutes, users, assignments + 8 more
DataTypes.DATE (for datetime)	DataTypes.DATE (keep — Sequelize handles)	All models with created_at, updated_at
DataTypes.JSON	DataTypes.JSONB	users(permissions), plans, institutes, assignments(allowed_file_types)
DataTypes.INTEGER (for AUTO_INCREMENT PK)	DataTypes.INTEGER (keep) — Sequelize handles SERIAL automatically	All 45 tables with INT PK
CHAR(36) for UUID	DataTypes.UUID with defaultValue: DataTypes.UUIDV4	expenses table only

5.2  Complete Updated Models — Key Files
Below are the complete updated versions of your most important models. Copy these exactly:
User Model — users.js
// backend/models/user.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const User = sequelize.define('User', {
  id:           { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  institute_id: { type: DataTypes.INTEGER, allowNull: true },
  role: {
    type: DataTypes.STRING(20),
    validate: { isIn: [['super_admin','admin','manager','faculty','student','parent']] }
  },
  name:         { type: DataTypes.STRING(255) },
  email:        { type: DataTypes.STRING(255), unique: true },
  phone:        { type: DataTypes.STRING(255) },
  password_hash:{ type: DataTypes.STRING(255) },
  status: {
    type: DataTypes.STRING(10),
    validate: { isIn: [['active','blocked']] }
  },
  theme_dark:   { type: DataTypes.BOOLEAN, defaultValue: false },
  theme_style: {
    type: DataTypes.STRING(10),
    defaultValue: 'simple',
    validate: { isIn: [['simple','pro']] }
  },
  permissions:             { type: DataTypes.JSONB },
  last_announcement_seen_at:{ type: DataTypes.DATE },
  last_chat_seen_at:        { type: DataTypes.DATE },
}, {
  tableName: 'users',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

module.exports = User;

Institute Model — institute.js
// backend/models/institute.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Institute = sequelize.define('Institute', {
  id:           { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  plan_id:      { type: DataTypes.INTEGER },
  name:         { type: DataTypes.STRING(255) },
  email:        { type: DataTypes.STRING(255), allowNull: false, unique: true },
  phone:        { type: DataTypes.STRING(255) },
  address:      { type: DataTypes.TEXT },
  city:         { type: DataTypes.STRING(255) },
  state:        { type: DataTypes.STRING(255) },
  zip_code:     { type: DataTypes.STRING(255) },
  logo:         { type: DataTypes.STRING(255) },
  subscription_start: { type: DataTypes.DATEONLY },
  subscription_end:   { type: DataTypes.DATEONLY },
  status: {
    type: DataTypes.STRING(15),
    validate: { isIn: [['active','expired','suspended','pending']] }
  },
  has_used_trial:                   { type: DataTypes.BOOLEAN, defaultValue: false },
  current_limit_students:           { type: DataTypes.INTEGER, defaultValue: 50 },
  current_limit_faculty:            { type: DataTypes.INTEGER, defaultValue: 5 },
  current_limit_classes:            { type: DataTypes.INTEGER, defaultValue: 5 },
  current_limit_admins:             { type: DataTypes.INTEGER, defaultValue: 1 },
  current_feature_attendance: {
    type: DataTypes.STRING(10),
    defaultValue: 'basic',
    validate: { isIn: [['none','basic','advanced']] }
  },
  current_feature_auto_attendance:  { type: DataTypes.BOOLEAN, defaultValue: false },
  current_feature_fees:             { type: DataTypes.BOOLEAN, defaultValue: false },
  current_feature_reports: {
    type: DataTypes.STRING(10),
    defaultValue: 'none',
    validate: { isIn: [['none','basic','advanced']] }
  },
  current_feature_announcements:    { type: DataTypes.BOOLEAN, defaultValue: false },
  current_feature_export:           { type: DataTypes.BOOLEAN, defaultValue: false },
  current_feature_timetable:        { type: DataTypes.BOOLEAN, defaultValue: false },
  current_feature_whatsapp:         { type: DataTypes.BOOLEAN, defaultValue: false },
  current_feature_custom_branding:  { type: DataTypes.BOOLEAN, defaultValue: false },
  current_feature_multi_branch:     { type: DataTypes.BOOLEAN, defaultValue: false },
  current_feature_api_access:       { type: DataTypes.BOOLEAN, defaultValue: false },
  current_feature_public_page:      { type: DataTypes.BOOLEAN, defaultValue: false },
}, {
  tableName: 'institutes',
  timestamps: true, createdAt: 'created_at', updatedAt: 'updated_at',
});
module.exports = Institute;

Attendance Model — attendance.js
// backend/models/attendance.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Attendance = sequelize.define('Attendance', {
  id:           { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  institute_id: { type: DataTypes.INTEGER },
  student_id:   { type: DataTypes.INTEGER },
  class_id:     { type: DataTypes.INTEGER },
  subject_id:   { type: DataTypes.INTEGER },
  date:         { type: DataTypes.DATEONLY },
  status: {
    type: DataTypes.STRING(10),
    validate: { isIn: [['present','absent','late','holiday','half_day']] }
  },
  marked_by:    { type: DataTypes.INTEGER },
  remarks:      { type: DataTypes.TEXT },
  marked_by_type: {
    type: DataTypes.STRING(15),
    defaultValue: 'manual',
    validate: { isIn: [['manual','biometric','mobile_otp','qr_code']] }
  },
  biometric_punch_id: { type: DataTypes.BIGINT },
  time_in:      { type: DataTypes.TIME },
  time_out:     { type: DataTypes.TIME },
  is_late:      { type: DataTypes.BOOLEAN, defaultValue: false },
  late_by_minutes:{ type: DataTypes.INTEGER, defaultValue: 0 },
  is_half_day:  { type: DataTypes.BOOLEAN, defaultValue: false },
}, {
  tableName: 'attendances',
  timestamps: true, createdAt: 'created_at', updatedAt: 'updated_at',
});
module.exports = Attendance;

Expenses Model — expense.js (UUID primary key)
// backend/models/expense.js
// SPECIAL: expenses uses CHAR(36) UUID primary key — not integer
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Expense = sequelize.define('Expense', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,  // auto-generate UUID
    primaryKey: true,
  },
  institute_id: { type: DataTypes.INTEGER },
  title:        { type: DataTypes.STRING(255), allowNull: false },
  amount:       { type: DataTypes.NUMERIC(10,2), allowNull: false },
  category:     { type: DataTypes.STRING(255), allowNull: false },
  date:         { type: DataTypes.DATEONLY, allowNull: false },
  description:  { type: DataTypes.TEXT },
  created_by:   { type: DataTypes.INTEGER },
}, {
  tableName: 'expenses',
  timestamps: true, createdAt: 'created_at', updatedAt: 'updated_at',
});
module.exports = Expense;

 
6.  Complete PostgreSQL Schema — All 48 Tables
This is the complete CREATE TABLE SQL for all 48 tables converted to PostgreSQL syntax. Run this in Neon SQL Editor to create your entire schema in one go.

How to Run This SQL
In Neon dashboard: Click your project > SQL Editor tab > paste each block > Run.
OR use psql from terminal: psql YOUR_NEON_CONNECTION_STRING -f schema.sql
All ENUM types are converted to VARCHAR + CHECK constraints for Sequelize compatibility.
Run all blocks in order — foreign keys depend on parent tables existing first.

Block 1 — Core Tables (users, institutes, plans)
-- Enable UUID extension (for expenses table)
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. plans
CREATE TABLE plans (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  price NUMERIC(10,2) NOT NULL,
  is_free_trial BOOLEAN DEFAULT FALSE,
  trial_days INT DEFAULT 0,
  max_students INT NOT NULL DEFAULT 100,
  max_faculty INT NOT NULL DEFAULT 5,
  max_classes INT NOT NULL DEFAULT 5,
  max_admin_users INT NOT NULL DEFAULT 1,
  feature_students BOOLEAN DEFAULT TRUE,
  feature_faculty BOOLEAN DEFAULT TRUE,
  feature_classes BOOLEAN DEFAULT TRUE,
  feature_subjects BOOLEAN DEFAULT TRUE,
  feature_attendance VARCHAR(10) DEFAULT 'basic' CHECK (feature_attendance IN ('none','basic','advanced')),
  feature_auto_attendance BOOLEAN DEFAULT FALSE,
  feature_fees BOOLEAN DEFAULT FALSE,
  feature_reports VARCHAR(10) DEFAULT 'none' CHECK (feature_reports IN ('none','basic','advanced')),
  feature_announcements BOOLEAN DEFAULT FALSE,
  feature_exams BOOLEAN DEFAULT FALSE,
  feature_export BOOLEAN DEFAULT FALSE,
  feature_email BOOLEAN DEFAULT FALSE,
  feature_sms BOOLEAN DEFAULT FALSE,
  feature_whatsapp BOOLEAN DEFAULT FALSE,
  feature_timetable BOOLEAN DEFAULT FALSE,
  feature_notes BOOLEAN DEFAULT FALSE,
  feature_chat BOOLEAN DEFAULT FALSE,
  feature_custom_branding BOOLEAN DEFAULT FALSE,
  feature_multi_branch BOOLEAN DEFAULT FALSE,
  feature_api_access BOOLEAN DEFAULT FALSE,
  feature_parent_portal BOOLEAN DEFAULT FALSE,
  feature_mobile_app BOOLEAN DEFAULT FALSE,
  feature_public_page BOOLEAN DEFAULT FALSE,
  status VARCHAR(10) DEFAULT 'active' CHECK (status IN ('active','inactive','archived')),
  is_popular BOOLEAN DEFAULT FALSE,
  razorpay_plan_id VARCHAR(255),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. institutes
CREATE TABLE institutes (
  id SERIAL PRIMARY KEY,
  plan_id INT REFERENCES plans(id),
  name VARCHAR(255),
  email VARCHAR(255) NOT NULL UNIQUE,
  phone VARCHAR(255),
  address TEXT,
  city VARCHAR(255),
  state VARCHAR(255),
  zip_code VARCHAR(255),
  logo VARCHAR(255),
  subscription_start DATE,
  subscription_end DATE,
  status VARCHAR(15) DEFAULT 'pending' CHECK (status IN ('active','expired','suspended','pending')),
  has_used_trial BOOLEAN DEFAULT FALSE,
  current_limit_students INT DEFAULT 50,
  current_limit_faculty INT DEFAULT 5,
  current_limit_classes INT DEFAULT 5,
  current_limit_admins INT DEFAULT 1,
  current_feature_attendance VARCHAR(10) DEFAULT 'basic' CHECK (current_feature_attendance IN ('none','basic','advanced')),
  current_feature_auto_attendance BOOLEAN DEFAULT FALSE,
  current_feature_fees BOOLEAN DEFAULT FALSE,
  current_feature_reports VARCHAR(10) DEFAULT 'none' CHECK (current_feature_reports IN ('none','basic','advanced')),
  current_feature_announcements BOOLEAN DEFAULT FALSE,
  current_feature_export BOOLEAN DEFAULT FALSE,
  current_feature_timetable BOOLEAN DEFAULT FALSE,
  current_feature_whatsapp BOOLEAN DEFAULT FALSE,
  current_feature_custom_branding BOOLEAN DEFAULT FALSE,
  current_feature_multi_branch BOOLEAN DEFAULT FALSE,
  current_feature_api_access BOOLEAN DEFAULT FALSE,
  current_feature_public_page BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. users
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  institute_id INT REFERENCES institutes(id) ON DELETE CASCADE,
  role VARCHAR(15) CHECK (role IN ('super_admin','admin','manager','faculty','student','parent')),
  name VARCHAR(255),
  email VARCHAR(255) UNIQUE,
  phone VARCHAR(255),
  password_hash VARCHAR(255),
  status VARCHAR(10) DEFAULT 'active' CHECK (status IN ('active','blocked')),
  theme_dark BOOLEAN DEFAULT FALSE,
  theme_style VARCHAR(10) DEFAULT 'simple' CHECK (theme_style IN ('simple','pro')),
  permissions JSONB,
  last_announcement_seen_at TIMESTAMPTZ,
  last_chat_seen_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_users_institute ON users(institute_id);
CREATE INDEX idx_users_email ON users(email);

Block 2 — Academic Tables (classes, students, faculty, subjects)
-- 4. classes
CREATE TABLE classes (
  id SERIAL PRIMARY KEY,
  institute_id INT REFERENCES institutes(id) ON DELETE CASCADE,
  name VARCHAR(255),
  section VARCHAR(255),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_classes_institute ON classes(institute_id);

-- 5. students
CREATE TABLE students (
  id SERIAL PRIMARY KEY,
  institute_id INT REFERENCES institutes(id) ON DELETE CASCADE,
  user_id INT REFERENCES users(id) ON DELETE SET NULL,
  roll_number VARCHAR(255),
  class_id INT REFERENCES classes(id) ON DELETE SET NULL,
  admission_date DATE,
  leave_date DATE,
  date_of_birth DATE,
  gender VARCHAR(10) CHECK (gender IN ('male','female','other')),
  address TEXT,
  is_full_course BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_students_institute ON students(institute_id);
CREATE INDEX idx_students_user ON students(user_id);

-- 6. faculty
CREATE TABLE faculty (
  id SERIAL PRIMARY KEY,
  institute_id INT REFERENCES institutes(id) ON DELETE CASCADE,
  user_id INT REFERENCES users(id) ON DELETE SET NULL,
  designation VARCHAR(255),
  salary NUMERIC(10,2),
  join_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_faculty_institute ON faculty(institute_id);

-- 7. subjects
CREATE TABLE subjects (
  id SERIAL PRIMARY KEY,
  institute_id INT REFERENCES institutes(id) ON DELETE CASCADE,
  class_id INT REFERENCES classes(id) ON DELETE CASCADE,
  name VARCHAR(255),
  faculty_id INT REFERENCES faculty(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_subjects_class ON subjects(class_id);

-- 8. student_classes (junction)
CREATE TABLE student_classes (
  student_id INT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  class_id INT NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  institute_id INT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (student_id, class_id)
);

-- 9. student_subjects (junction)
CREATE TABLE student_subjects (
  student_id INT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  subject_id INT NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  institute_id INT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (student_id, subject_id)
);

Block 3 — Attendance, Biometric, Exams, Marks
-- 10. attendances
CREATE TABLE attendances (
  id SERIAL PRIMARY KEY,
  institute_id INT REFERENCES institutes(id) ON DELETE CASCADE,
  student_id INT REFERENCES students(id) ON DELETE CASCADE,
  class_id INT REFERENCES classes(id) ON DELETE SET NULL,
  subject_id INT REFERENCES subjects(id) ON DELETE SET NULL,
  date DATE,
  status VARCHAR(10) CHECK (status IN ('present','absent','late','holiday','half_day')),
  marked_by INT REFERENCES users(id) ON DELETE SET NULL,
  remarks TEXT,
  marked_by_type VARCHAR(15) DEFAULT 'manual' CHECK (marked_by_type IN ('manual','biometric','mobile_otp','qr_code')),
  biometric_punch_id BIGINT,
  time_in TIME,
  time_out TIME,
  is_late BOOLEAN DEFAULT FALSE,
  late_by_minutes INT DEFAULT 0,
  is_half_day BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_attend_institute ON attendances(institute_id);
CREATE INDEX idx_attend_student ON attendances(student_id);
CREATE INDEX idx_attend_class ON attendances(class_id);

-- 11. faculty_attendances
CREATE TABLE faculty_attendances (
  id SERIAL PRIMARY KEY,
  institute_id INT REFERENCES institutes(id) ON DELETE CASCADE,
  faculty_id INT REFERENCES faculty(id) ON DELETE CASCADE,
  date DATE,
  status VARCHAR(10) CHECK (status IN ('present','absent','late','half_day','holiday')),
  marked_by INT REFERENCES users(id) ON DELETE SET NULL,
  remarks TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 12. biometric_devices
CREATE TABLE biometric_devices (
  id SERIAL PRIMARY KEY,
  institute_id INT NOT NULL REFERENCES institutes(id) ON DELETE CASCADE,
  device_name VARCHAR(100) NOT NULL,
  device_serial VARCHAR(100) NOT NULL UNIQUE,
  device_type VARCHAR(15) DEFAULT 'fingerprint' CHECK (device_type IN ('fingerprint','face','rfid','mobile')),
  location VARCHAR(100),
  ip_address VARCHAR(45),
  secret_key VARCHAR(255) NOT NULL,
  status VARCHAR(10) DEFAULT 'active' CHECK (status IN ('active','inactive','offline')),
  last_sync TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 13. biometric_enrollments
CREATE TABLE biometric_enrollments (
  id SERIAL PRIMARY KEY,
  institute_id INT NOT NULL,
  device_id INT NOT NULL REFERENCES biometric_devices(id) ON DELETE CASCADE,
  device_user_id VARCHAR(50) NOT NULL,
  user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  user_role VARCHAR(10) CHECK (user_role IN ('student','faculty')),
  enrolled_at TIMESTAMPTZ,
  enrolled_by INT REFERENCES users(id) ON DELETE SET NULL,
  status VARCHAR(10) DEFAULT 'active' CHECK (status IN ('active','inactive')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 14. biometric_punches
CREATE TABLE biometric_punches (
  id BIGSERIAL PRIMARY KEY,
  institute_id INT NOT NULL,
  device_id INT NOT NULL REFERENCES biometric_devices(id),
  device_user_id VARCHAR(50) NOT NULL,
  punch_time TIMESTAMPTZ NOT NULL,
  punch_type VARCHAR(10) DEFAULT 'in' CHECK (punch_type IN ('in','out','break')),
  raw_payload JSONB,
  processed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_punches_device ON biometric_punches(device_id);

-- 15. biometric_settings
CREATE TABLE biometric_settings (
  institute_id INT PRIMARY KEY REFERENCES institutes(id) ON DELETE CASCADE,
  late_threshold_minutes INT DEFAULT 15,
  half_day_threshold_minutes INT DEFAULT 120,
  working_days JSONB,
  class_start_time TIME DEFAULT '09:00:00',
  notify_parent_on_absent BOOLEAN DEFAULT TRUE,
  notify_parent_on_late BOOLEAN DEFAULT FALSE,
  notify_parent_on_present BOOLEAN DEFAULT FALSE,
  duplicate_punch_window_secs INT DEFAULT 300,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 16. exams
CREATE TABLE exams (
  id SERIAL PRIMARY KEY,
  institute_id INT REFERENCES institutes(id) ON DELETE CASCADE,
  class_id INT REFERENCES classes(id) ON DELETE CASCADE,
  subject_id INT REFERENCES subjects(id) ON DELETE SET NULL,
  name VARCHAR(255),
  exam_date DATE,
  total_marks NUMERIC(5,2),
  passing_marks NUMERIC(5,2),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 17. marks
CREATE TABLE marks (
  id SERIAL PRIMARY KEY,
  institute_id INT REFERENCES institutes(id) ON DELETE CASCADE,
  exam_id INT REFERENCES exams(id) ON DELETE CASCADE,
  student_id INT REFERENCES students(id) ON DELETE CASCADE,
  subject_id INT REFERENCES subjects(id) ON DELETE SET NULL,
  marks_obtained NUMERIC(5,2),
  max_marks NUMERIC(5,2),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_marks_exam ON marks(exam_id);
CREATE INDEX idx_marks_student ON marks(student_id);

Block 4 — Fees, Payments, Subscriptions, Finance
-- 18. fees_structures
CREATE TABLE fees_structures (
  id SERIAL PRIMARY KEY,
  institute_id INT REFERENCES institutes(id) ON DELETE CASCADE,
  class_id INT REFERENCES classes(id) ON DELETE SET NULL,
  subject_id INT REFERENCES subjects(id) ON DELETE SET NULL,
  fee_type VARCHAR(255),
  amount NUMERIC(10,2),
  due_date DATE,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 19. student_fees
CREATE TABLE student_fees (
  id SERIAL PRIMARY KEY,
  institute_id INT NOT NULL REFERENCES institutes(id) ON DELETE CASCADE,
  student_id INT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  class_id INT REFERENCES classes(id) ON DELETE SET NULL,
  fee_structure_id INT NOT NULL REFERENCES fees_structures(id) ON DELETE RESTRICT,
  original_amount NUMERIC(10,2) DEFAULT 0,
  discount_amount NUMERIC(10,2) DEFAULT 0,
  final_amount NUMERIC(10,2) DEFAULT 0,
  paid_amount NUMERIC(10,2) DEFAULT 0,
  due_amount NUMERIC(10,2) DEFAULT 0,
  status VARCHAR(10) DEFAULT 'pending' CHECK (status IN ('pending','partial','paid')),
  created_by INT,
  reminder_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_sfees_student ON student_fees(student_id);
CREATE INDEX idx_sfees_institute ON student_fees(institute_id);

-- 20. student_fee_payments
CREATE TABLE student_fee_payments (
  id SERIAL PRIMARY KEY,
  institute_id INT NOT NULL REFERENCES institutes(id) ON DELETE CASCADE,
  student_fee_id INT NOT NULL REFERENCES student_fees(id) ON DELETE RESTRICT,
  student_id INT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  razorpay_order_id VARCHAR(100),
  razorpay_payment_id VARCHAR(100),
  amount_paid NUMERIC(10,2) NOT NULL,
  payment_method VARCHAR(50),
  payment_status VARCHAR(10) DEFAULT 'pending' CHECK (payment_status IN ('pending','paid','failed')),
  receipt_number VARCHAR(50) UNIQUE,
  paid_at TIMESTAMPTZ,
  collected_by INT REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 21. payments (legacy/general payments)
CREATE TABLE payments (
  id SERIAL PRIMARY KEY,
  institute_id INT REFERENCES institutes(id) ON DELETE CASCADE,
  student_id INT REFERENCES students(id) ON DELETE CASCADE,
  fee_structure_id INT REFERENCES fees_structures(id) ON DELETE SET NULL,
  amount_paid NUMERIC(10,2),
  payment_date DATE,
  payment_method VARCHAR(255),
  transaction_id VARCHAR(255),
  status VARCHAR(10) CHECK (status IN ('success','failed','pending')),
  collected_by INT REFERENCES users(id) ON DELETE SET NULL,
  remarks TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 22. expenses (UUID primary key)
CREATE TABLE expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institute_id INT REFERENCES institutes(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  amount NUMERIC(10,2) NOT NULL,
  category VARCHAR(255) NOT NULL,
  date DATE NOT NULL,
  description TEXT,
  created_by INT REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_expenses_institute ON expenses(institute_id);

-- 23. fee_discount_logs
CREATE TABLE fee_discount_logs (
  id SERIAL PRIMARY KEY,
  institute_id INT NOT NULL REFERENCES institutes(id) ON DELETE CASCADE,
  student_fee_id INT NOT NULL REFERENCES student_fees(id) ON DELETE CASCADE,
  discount_amount NUMERIC(10,2) NOT NULL,
  reason VARCHAR(255) NOT NULL,
  approved_by INT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  approved_role VARCHAR(255) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 24. institute_discounts
CREATE TABLE institute_discounts (
  id SERIAL PRIMARY KEY,
  institute_id INT NOT NULL REFERENCES institutes(id) ON DELETE CASCADE,
  discount_type VARCHAR(15) DEFAULT 'fixed' CHECK (discount_type IN ('percentage','fixed')),
  discount_value NUMERIC(10,2) NOT NULL,
  reason VARCHAR(255),
  status VARCHAR(10) DEFAULT 'active' CHECK (status IN ('active','used','expired')),
  applied_by INT REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 25. subscriptions
CREATE TABLE subscriptions (
  id SERIAL PRIMARY KEY,
  institute_id INT REFERENCES institutes(id) ON DELETE CASCADE,
  plan_id INT REFERENCES plans(id) ON DELETE SET NULL,
  start_date DATE,
  end_date DATE,
  payment_status VARCHAR(10) CHECK (payment_status IN ('paid','unpaid','failed','pending')),
  transaction_reference VARCHAR(255),
  amount_paid NUMERIC(10,2),
  discount_amount NUMERIC(10,2) DEFAULT 0,
  razorpay_order_id VARCHAR(100),
  razorpay_payment_id VARCHAR(100),
  coupon_code VARCHAR(50),
  invoice_number VARCHAR(50) UNIQUE,
  tax_amount NUMERIC(10,2) DEFAULT 0,
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 26. razorpay_orders
CREATE TABLE razorpay_orders (
  id SERIAL PRIMARY KEY,
  institute_id INT REFERENCES institutes(id) ON DELETE CASCADE,
  order_type VARCHAR(20) NOT NULL CHECK (order_type IN ('subscription','student_fee','addon')),
  reference_id INT,
  razorpay_order_id VARCHAR(100) NOT NULL UNIQUE,
  amount INT NOT NULL,
  amount_display NUMERIC(10,2) NOT NULL,
  currency VARCHAR(10) DEFAULT 'INR',
  receipt VARCHAR(100) UNIQUE,
  status VARCHAR(15) DEFAULT 'pending' CHECK (status IN ('pending','paid','failed','cancelled')),
  notes JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 27. razorpay_payments
CREATE TABLE razorpay_payments (
  id SERIAL PRIMARY KEY,
  institute_id INT REFERENCES institutes(id) ON DELETE CASCADE,
  order_id INT NOT NULL REFERENCES razorpay_orders(id) ON DELETE RESTRICT,
  razorpay_payment_id VARCHAR(100) NOT NULL UNIQUE,
  razorpay_order_id VARCHAR(100),
  razorpay_signature VARCHAR(500),
  signature_verified BOOLEAN DEFAULT FALSE,
  amount_paid INT NOT NULL,
  payment_method VARCHAR(50),
  bank VARCHAR(100),
  wallet VARCHAR(50),
  vpa VARCHAR(100),
  email VARCHAR(255),
  contact VARCHAR(20),
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 28. invoices
CREATE TABLE invoices (
  id SERIAL PRIMARY KEY,
  institute_id INT NOT NULL REFERENCES institutes(id) ON DELETE CASCADE,
  payment_id INT REFERENCES payments(id) ON DELETE SET NULL,
  invoice_type VARCHAR(20) NOT NULL CHECK (invoice_type IN ('subscription','student_fee','refund')),
  invoice_number VARCHAR(50) NOT NULL UNIQUE,
  invoice_date DATE NOT NULL,
  subtotal NUMERIC(10,2) NOT NULL,
  tax_percent NUMERIC(5,2) DEFAULT 18.00,
  tax_amount NUMERIC(10,2) DEFAULT 0,
  total_amount NUMERIC(10,2) NOT NULL,
  pdf_url VARCHAR(500),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 29. transport_fees
CREATE TABLE transport_fees (
  id SERIAL PRIMARY KEY,
  institute_id INT REFERENCES institutes(id) ON DELETE CASCADE,
  route_name VARCHAR(255) NOT NULL,
  fee_amount NUMERIC(10,2) NOT NULL,
  created_by INT REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

Block 5 — Communication, Chat, Assignments, Notes
-- 30. announcements
CREATE TABLE announcements (
  id SERIAL PRIMARY KEY,
  institute_id INT REFERENCES institutes(id) ON DELETE CASCADE,
  title VARCHAR(255),
  content TEXT,
  target_audience VARCHAR(10) CHECK (target_audience IN ('all','students','faculty')),
  priority VARCHAR(10) DEFAULT 'normal' CHECK (priority IN ('normal','high','urgent')),
  created_by INT REFERENCES users(id) ON DELETE SET NULL,
  subject_id INT REFERENCES subjects(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 31. chat_rooms
CREATE TABLE chat_rooms (
  id SERIAL PRIMARY KEY,
  institute_id INT NOT NULL REFERENCES institutes(id) ON DELETE CASCADE,
  class_id INT REFERENCES classes(id) ON DELETE SET NULL,
  subject_id INT REFERENCES subjects(id) ON DELETE SET NULL,
  faculty_id INT REFERENCES faculty(id) ON DELETE SET NULL,
  type VARCHAR(10) NOT NULL CHECK (type IN ('subject','group','direct')),
  name VARCHAR(255),
  target_gender VARCHAR(10) DEFAULT 'both' CHECK (target_gender IN ('male','female','both')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 32. chat_participants
CREATE TABLE chat_participants (
  id SERIAL PRIMARY KEY,
  room_id INT NOT NULL REFERENCES chat_rooms(id) ON DELETE CASCADE,
  user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role VARCHAR(255) NOT NULL,
  last_read_at TIMESTAMPTZ
);
CREATE INDEX idx_chat_part_room ON chat_participants(room_id);
CREATE INDEX idx_chat_part_user ON chat_participants(user_id);

-- 33. chat_messages
CREATE TABLE chat_messages (
  id SERIAL PRIMARY KEY,
  room_id INT NOT NULL REFERENCES chat_rooms(id) ON DELETE CASCADE,
  sender_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  sender_role VARCHAR(255) NOT NULL,
  message TEXT,
  attachment_url VARCHAR(255),
  attachment_type VARCHAR(255),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_chat_msg_room ON chat_messages(room_id);

-- 34. assignments
CREATE TABLE assignments (
  id SERIAL PRIMARY KEY,
  institute_id INT NOT NULL REFERENCES institutes(id) ON DELETE CASCADE,
  faculty_id INT NOT NULL REFERENCES faculty(id) ON DELETE CASCADE,
  class_id INT NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  subject_id INT NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  reference_file_url VARCHAR(500),
  reference_file_type VARCHAR(50),
  due_date TIMESTAMPTZ NOT NULL,
  max_marks NUMERIC(5,2),
  allowed_file_types JSONB,
  max_file_size_mb INT DEFAULT 10,
  allow_late_submission BOOLEAN DEFAULT TRUE,
  status VARCHAR(15) DEFAULT 'draft' CHECK (status IN ('draft','published','closed')),
  total_submissions INT DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 35. assignment_submissions
CREATE TABLE assignment_submissions (
  id SERIAL PRIMARY KEY,
  institute_id INT NOT NULL REFERENCES institutes(id) ON DELETE CASCADE,
  assignment_id INT NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,
  student_id INT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  submission_file_url VARCHAR(500),
  submission_file_name VARCHAR(255),
  submission_file_type VARCHAR(50),
  submission_file_size_kb INT,
  submitted_at TIMESTAMPTZ,
  is_late BOOLEAN DEFAULT FALSE,
  late_by_minutes INT DEFAULT 0,
  status VARCHAR(25) DEFAULT 'pending' CHECK (status IN ('pending','submitted','late','graded','resubmit_requested')),
  marks_obtained NUMERIC(5,2),
  grade VARCHAR(5),
  feedback TEXT,
  graded_by INT REFERENCES users(id) ON DELETE SET NULL,
  graded_at TIMESTAMPTZ,
  resubmit_reason TEXT,
  attempt_number INT DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 36. assignment_submission_history
CREATE TABLE assignment_submission_history (
  id SERIAL PRIMARY KEY,
  submission_id INT NOT NULL REFERENCES assignment_submissions(id) ON DELETE CASCADE,
  attempt_number INT NOT NULL,
  file_url VARCHAR(500) NOT NULL,
  file_name VARCHAR(255),
  submitted_at TIMESTAMPTZ NOT NULL,
  comment TEXT
);

-- 37. assignment_settings
CREATE TABLE assignment_settings (
  institute_id INT PRIMARY KEY REFERENCES institutes(id) ON DELETE CASCADE,
  allow_late_submission BOOLEAN DEFAULT TRUE,
  late_submission_penalty_percent INT DEFAULT 0,
  max_file_size_mb INT DEFAULT 10,
  allowed_file_types JSONB,
  auto_close_after_days INT DEFAULT 7,
  notify_parent_on_submit BOOLEAN DEFAULT TRUE,
  notify_parent_on_grade BOOLEAN DEFAULT TRUE,
  notify_student_on_new BOOLEAN DEFAULT TRUE,
  allow_resubmission BOOLEAN DEFAULT TRUE,
  max_resubmit_attempts INT DEFAULT 2
);

-- 38. notes
CREATE TABLE notes (
  id SERIAL PRIMARY KEY,
  institute_id INT NOT NULL REFERENCES institutes(id) ON DELETE CASCADE,
  faculty_id INT NOT NULL REFERENCES faculty(id) ON DELETE CASCADE,
  class_id INT NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  subject_id INT NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  file_url VARCHAR(255) NOT NULL,
  file_type VARCHAR(255),
  file_size INT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 39. notes_downloads
CREATE TABLE notes_downloads (
  id SERIAL PRIMARY KEY,
  note_id INT NOT NULL REFERENCES notes(id) ON DELETE CASCADE,
  student_id INT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  downloaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

Block 6 — Public Pages, Timetable, Class Sessions, Leads
-- 40. class_sessions (QR attendance)
CREATE TABLE class_sessions (
  id SERIAL PRIMARY KEY,
  institute_id INT NOT NULL REFERENCES institutes(id) ON DELETE CASCADE,
  class_id INT NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  subject_id INT REFERENCES subjects(id) ON DELETE SET NULL,
  faculty_id INT NOT NULL REFERENCES faculty(id) ON DELETE CASCADE,
  session_token VARCHAR(255) NOT NULL UNIQUE,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT TRUE,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 41. timetable_slots
CREATE TABLE timetable_slots (
  id SERIAL PRIMARY KEY,
  institute_id INT NOT NULL REFERENCES institutes(id) ON DELETE CASCADE,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 42. timetables
CREATE TABLE timetables (
  id SERIAL PRIMARY KEY,
  institute_id INT NOT NULL REFERENCES institutes(id) ON DELETE CASCADE,
  class_id INT NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  subject_id INT NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  faculty_id INT NOT NULL REFERENCES faculty(id) ON DELETE CASCADE,
  slot_id INT NOT NULL REFERENCES timetable_slots(id) ON DELETE CASCADE,
  day_of_week VARCHAR(15) NOT NULL CHECK (day_of_week IN ('Monday','Tuesday','Wednesday','Thursday','Friday','Saturday')),
  room_number VARCHAR(255),
  created_by INT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 43. institute_public_profiles
CREATE TABLE institute_public_profiles (
  id SERIAL PRIMARY KEY,
  institute_id INT NOT NULL UNIQUE REFERENCES institutes(id) ON DELETE CASCADE,
  slug VARCHAR(120) NOT NULL UNIQUE,
  is_published BOOLEAN DEFAULT FALSE,
  tagline VARCHAR(200), description TEXT, about_text TEXT,
  logo_url VARCHAR(500), cover_photo_url VARCHAR(500),
  established_year INT, affiliation VARCHAR(100),
  pass_rate VARCHAR(20), competitive_selections VARCHAR(50),
  years_of_excellence VARCHAR(20), total_students_display VARCHAR(20),
  whatsapp_number VARCHAR(20), map_embed_url TEXT, working_hours VARCHAR(200),
  admission_status VARCHAR(100), enrollment_benefits JSONB, usp_points JSONB,
  social_facebook VARCHAR(300), social_instagram VARCHAR(300), social_youtube VARCHAR(300),
  theme_color VARCHAR(10) DEFAULT '0F2340',
  seo_title VARCHAR(200), seo_description TEXT, footer_description TEXT,
  contact_address TEXT, contact_phone VARCHAR(20), contact_email VARCHAR(150),
  selected_faculty_ids JSONB, selected_subject_ids JSONB,
  course_mode VARCHAR(10) NOT NULL DEFAULT 'auto',
  manual_courses JSONB, faculty_mode VARCHAR(10) NOT NULL DEFAULT 'auto',
  manual_faculty JSONB, youtube_intro_url VARCHAR(500), faculty_images JSONB,
  page_views INT DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 44. institute_gallery_photos
CREATE TABLE institute_gallery_photos (
  id SERIAL PRIMARY KEY,
  institute_id INT NOT NULL REFERENCES institutes(id) ON DELETE CASCADE,
  photo_url VARCHAR(500) NOT NULL,
  label VARCHAR(100),
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 45. institute_reviews
CREATE TABLE institute_reviews (
  id SERIAL PRIMARY KEY,
  institute_id INT NOT NULL REFERENCES institutes(id) ON DELETE CASCADE,
  student_name VARCHAR(100) NOT NULL,
  review_text TEXT NOT NULL,
  rating SMALLINT DEFAULT 5,
  achievement VARCHAR(200),
  is_approved BOOLEAN DEFAULT TRUE,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 46. public_enquiries
CREATE TABLE public_enquiries (
  id SERIAL PRIMARY KEY,
  institute_id INT NOT NULL REFERENCES institutes(id) ON DELETE CASCADE,
  first_name VARCHAR(80) NOT NULL,
  last_name VARCHAR(80),
  mobile VARCHAR(15) NOT NULL,
  email VARCHAR(150),
  course_interest VARCHAR(200),
  current_class VARCHAR(50),
  message TEXT,
  status VARCHAR(15) DEFAULT 'new' CHECK (status IN ('new','contacted','enrolled','closed')),
  ip_address VARCHAR(45),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 47. student_parents (junction)
CREATE TABLE student_parents (
  student_id INT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  parent_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  relationship VARCHAR(15) NOT NULL CHECK (relationship IN ('father','mother','guardian')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (student_id, parent_id)
);

-- 48. leads
CREATE TABLE leads (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  phone VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  institute VARCHAR(255) NOT NULL,
  student_count VARCHAR(255),
  plan VARCHAR(255),
  message TEXT,
  source VARCHAR(255) DEFAULT 'landing-page-contact',
  status VARCHAR(20) DEFAULT 'new' CHECK (status IN ('new','contacted','demo_scheduled','closed_won','closed_lost')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

 
7.  Data Migration — Export MySQL, Import to Neon
Phase 6	Export Data from MySQL (Railway)
Use mysqldump or pgloader

Option A — Use pgloader (Recommended — automatic conversion)
pgloader is the best tool — it reads MySQL and writes to PostgreSQL automatically, handling type conversions.
# Install pgloader
sudo apt-get install pgloader   # Ubuntu/Linux
brew install pgloader           # macOS

# Create a pgloader config file: migrate.load
LOAD DATABASE
  FROM mysql://root:password@railway-host:3306/railway
  INTO postgresql://student_saas_owner:password@ep-cool-rain.neon.tech/student_saas

WITH include drop,
     create tables,
     create indexes,
     reset sequences,
     foreign keys

SET timezone = 'UTC'

CAST type tinyint to boolean using tinyint-to-boolean,
     type datetime to timestamptz,
     type json to jsonb
;

# Run migration:
pgloader migrate.load

# pgloader will:
# 1. Create all tables in Neon
# 2. Convert TINYINT(1) to BOOLEAN automatically
# 3. Convert DATETIME to TIMESTAMPTZ
# 4. Migrate all data row by row
# 5. Recreate indexes and foreign keys

Option B — Manual Export/Import
If pgloader is not available, use this manual approach:
# Step 1: Export MySQL data as CSV from Railway
# In MySQL client or Railway dashboard — run for each table:
SELECT * FROM users INTO OUTFILE '/tmp/users.csv' FIELDS TERMINATED BY ',' ENCLOSED BY '"';

# Step 2: For each table in Neon, use COPY command:
\copy users(id,institute_id,role,name,email,phone,password_hash,status,...)
FROM '/tmp/users.csv' WITH (FORMAT csv, HEADER true);

# Important: Handle tinyint(1) -> boolean manually:
# In PostgreSQL, 0 = false, 1 = true
UPDATE students SET is_full_course = CASE WHEN is_full_course::text = '1' THEN TRUE ELSE FALSE END;

Phase 7	Verify Migration — Check Row Counts
Confirm all data transferred correctly

-- Run in Neon SQL Editor after migration to verify counts:
SELECT
  'users'            AS table_name, COUNT(*) AS row_count FROM users UNION ALL
  SELECT 'institutes',              COUNT(*) FROM institutes UNION ALL
  SELECT 'students',                COUNT(*) FROM students UNION ALL
  SELECT 'faculty',                 COUNT(*) FROM faculty UNION ALL
  SELECT 'classes',                 COUNT(*) FROM classes UNION ALL
  SELECT 'subjects',                COUNT(*) FROM subjects UNION ALL
  SELECT 'attendances',             COUNT(*) FROM attendances UNION ALL
  SELECT 'student_fees',            COUNT(*) FROM student_fees UNION ALL
  SELECT 'student_fee_payments',    COUNT(*) FROM student_fee_payments UNION ALL
  SELECT 'fees_structures',         COUNT(*) FROM fees_structures UNION ALL
  SELECT 'exams',                   COUNT(*) FROM exams UNION ALL
  SELECT 'marks',                   COUNT(*) FROM marks UNION ALL
  SELECT 'assignments',             COUNT(*) FROM assignments UNION ALL
  SELECT 'subscriptions',           COUNT(*) FROM subscriptions UNION ALL
  SELECT 'plans',                   COUNT(*) FROM plans UNION ALL
  SELECT 'leads',                   COUNT(*) FROM leads
ORDER BY row_count DESC;

-- Compare each count with your MySQL counts.
-- They should all match exactly.

 
8.  Common PostgreSQL / Sequelize Issues & Fixes
#	Issue	Why It Happens	Fix
1	column must be of type INTEGER, not VARCHAR	ENUM column defined as STRING but Sequelize validation fails	Add validate:{isIn:[[...]]} to STRING columns
2	operator does not exist: integer = text	MySQL auto-casts types; PostgreSQL is strict about type matching	Cast explicitly: WHERE id = $1::integer
3	column 'created_at' does not exist	Sequelize uses camelCase by default	Add underscored:true or specify createdAt:'created_at'
4	duplicate key value violates unique constraint	SERIAL sequence out of sync after data import	Run: SELECT setval(seq, MAX(id)) for each table
5	function isnull does not exist	MySQL ISNULL() not in PostgreSQL	Use IS NULL or COALESCE() instead
6	LIMIT without ORDER BY	MySQL allows this; PostgreSQL returns non-deterministic results	Always add ORDER BY to queries with LIMIT
7	JSON column not searchable	Using JSON type instead of JSONB	Use JSONB — it's indexed. Change DataTypes.JSON to DataTypes.JSONB
8	tinyint out of range	BOOLEAN values sent as 0/1 integers	Send true/false booleans not 0/1 in JavaScript
9	connection timeout on first request	Neon auto-suspends after 5 min — cold start	Use pooled connection URL from Neon dashboard
10	SSL connection error	Missing SSL config for Neon	Add ssl:{require:true,rejectUnauthorized:false} to dialectOptions

8.1  Fix SERIAL Sequences After Data Import
After importing data from MySQL, PostgreSQL sequences (used for auto-increment IDs) may be out of sync. Run this in Neon SQL Editor after import:
-- Fix all SERIAL sequences after data migration
-- Run this block in Neon SQL Editor:

SELECT setval(pg_get_serial_sequence('users','id'),            COALESCE(MAX(id),1)) FROM users;
SELECT setval(pg_get_serial_sequence('institutes','id'),       COALESCE(MAX(id),1)) FROM institutes;
SELECT setval(pg_get_serial_sequence('plans','id'),            COALESCE(MAX(id),1)) FROM plans;
SELECT setval(pg_get_serial_sequence('students','id'),         COALESCE(MAX(id),1)) FROM students;
SELECT setval(pg_get_serial_sequence('faculty','id'),          COALESCE(MAX(id),1)) FROM faculty;
SELECT setval(pg_get_serial_sequence('classes','id'),          COALESCE(MAX(id),1)) FROM classes;
SELECT setval(pg_get_serial_sequence('subjects','id'),         COALESCE(MAX(id),1)) FROM subjects;
SELECT setval(pg_get_serial_sequence('attendances','id'),      COALESCE(MAX(id),1)) FROM attendances;
SELECT setval(pg_get_serial_sequence('student_fees','id'),     COALESCE(MAX(id),1)) FROM student_fees;
SELECT setval(pg_get_serial_sequence('exams','id'),            COALESCE(MAX(id),1)) FROM exams;
SELECT setval(pg_get_serial_sequence('marks','id'),            COALESCE(MAX(id),1)) FROM marks;
SELECT setval(pg_get_serial_sequence('assignments','id'),      COALESCE(MAX(id),1)) FROM assignments;
SELECT setval(pg_get_serial_sequence('subscriptions','id'),    COALESCE(MAX(id),1)) FROM subscriptions;
SELECT setval(pg_get_serial_sequence('payments','id'),         COALESCE(MAX(id),1)) FROM payments;
SELECT setval(pg_get_serial_sequence('announcements','id'),    COALESCE(MAX(id),1)) FROM announcements;
-- Repeat for all remaining tables...

 
9.  Update Render Deployment
Phase 8	Update Environment Variables on Render
Switch DATABASE_URL to Neon

Go to render.com > Your Web Service > Environment. Update/replace the database variable:
# In Render dashboard > Your backend service > Environment:

# DELETE old MySQL variables:
# DB_HOST, DB_USER, DB_PASS, DB_NAME, DB_PORT

# ADD new variable:
DATABASE_URL = postgresql://student_saas_owner:password@ep-cool-rain-pooler.ap-southeast-1.aws.neon.tech/student_saas?sslmode=require

# NOTE: Use the POOLED connection string (contains '-pooler' in hostname)
# This is critical for production — prevents connection exhaustion

# All other environment variables stay the same:
# JWT_SECRET, EMAIL_*, RAZORPAY_*, etc.

Use Pooled URL in Production — Critical
Neon free tier allows 100 concurrent connections max.
Your Render backend + Sequelize pool + multiple requests can exhaust this quickly.
The pooled connection URL (with -pooler in hostname) uses PgBouncer — handles thousands.
Non-pooled URL: ep-cool-rain-123456.ap-southeast-1.aws.neon.tech
Pooled URL:     ep-cool-rain-123456-pooler.ap-southeast-1.aws.neon.tech (add -pooler)
Always use the pooled URL for your production backend on Render.

 
10.  Complete Migration Checklist
Phase	Area	Task	Status
1	Neon	Create Neon account and new project — zf-solution-production	To Do
1	Neon	Select Singapore region for lowest latency from India	To Do
1	Neon	Copy both regular and pooled connection strings	To Do
2	Backend	npm uninstall mysql2 && npm install pg pg-hstore	To Do
3	Backend	Replace database.js config completely with PostgreSQL version from Section 5	To Do
4	Backend	Update .env — replace DB_HOST/USER/PASS with DATABASE_URL	To Do
5	Models	Update ALL models: change DataTypes.ENUM to DataTypes.STRING + validate	To Do — 19 files
5	Models	Change all TINYINT(1) / BOOLEAN fields to DataTypes.BOOLEAN	To Do
5	Models	Change DataTypes.JSON to DataTypes.JSONB in all models	To Do
5	Models	Fix expenses model — change id to DataTypes.UUID with UUIDV4 default	To Do
6	Schema	Run Block 1 SQL (plans, institutes, users) in Neon SQL Editor	To Do
6	Schema	Run Block 2 SQL (academic tables) in Neon SQL Editor	To Do
6	Schema	Run Block 3 SQL (attendance, biometric, exams) in Neon SQL Editor	To Do
6	Schema	Run Block 4 SQL (fees, payments, finance) in Neon SQL Editor	To Do
6	Schema	Run Block 5 SQL (chat, assignments, notes) in Neon SQL Editor	To Do
6	Schema	Run Block 6 SQL (public pages, timetable, class sessions, leads) in Neon SQL Editor	To Do
7	Data	Export data from MySQL Railway using pgloader or CSV method	To Do
7	Data	Import data to Neon — verify with row count query from Section 7	To Do
7	Data	Fix SERIAL sequences — run setval() block from Section 8	To Do
8	Render	Update DATABASE_URL on Render to Neon pooled connection string	To Do
9	Test	Restart backend — verify no connection errors in Render logs	To Do
9	Test	Test login, student creation, attendance marking, fee collection	To Do
9	Test	Check Neon dashboard — confirm queries hitting the DB successfully	To Do

Final Summary — What Changes vs What Stays
CHANGES: database.js config, .env DATABASE_URL, npm packages (mysql2 out, pg in),
         all Sequelize model ENUM/BOOLEAN/JSON fields (19 model files).
STAYS THE SAME: All controllers, all routes, all middleware, all frontend code,
                JWT auth logic, Razorpay integration, email service, all API endpoints.
TIME ESTIMATE: Schema creation = 30 min. Model updates = 1-2 hrs. Data migration = 30 min.
TOTAL: Approximately 2-4 hours for a complete, production-safe migration.

