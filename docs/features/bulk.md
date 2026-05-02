
Student SaaS
Bulk Import System
Students • Parents • Faculty
Complete Phase-by-Phase Implementation Guide
 
1. Overview & Why Bulk Import
The Manage Students, Manage Parents, and Manage Faculty sections currently support one-at-a-time record creation. For an institute that has 200 students, 150 parents, and 40 faculty members already recorded in Excel sheets, entering each person manually is impractical and a reason institutes will reject your SaaS.

Bulk Import solves this. An admin uploads a pre-filled Excel or CSV file and the system validates, previews, and inserts all rows in one operation.

What This Covers
Bulk import for Students, Parents, and Faculty — with download templates, frontend upload UI, backend validation, preview modals, error reporting, and auto-linking of parents to students using roll number.

2. The Two Best Approaches
After analyzing your project architecture (React + Node/Express + Neon PostgreSQL + Sequelize + multi-tenant institute_id isolation), there are two real-world approaches. Here is a clear comparison:

Dimension	Approach A — Client-Side Parse (Recommended)	Approach B — Server-Side Parse
How it works	React reads the Excel file using SheetJS. Parses, validates, and shows a preview table in the browser. Only clean rows are sent to the backend as JSON.	Admin uploads the raw file to the server. Backend parses it with ExcelJS, validates row-by-row, and returns a result JSON with errors and inserts.
Speed	Faster — no file upload needed for preview. Errors show instantly before any API call.	Slower — file must upload fully before any feedback. 500-row file can take 5-8 seconds.
Security	Backend still re-validates all data — frontend parse is just for UX. No security gap.	Identical security. Backend validates regardless of where parsing happens.
File storage	No file ever stored on server. JSON is sent directly. Cleaner.	File must be temporarily stored (disk or memory buffer). Needs cleanup logic.
Error UX	Errors highlighted row-by-row in the browser preview before submitting. Best UX.	Errors returned after upload. User must fix file, re-upload, and wait again.
Works offline?	Parse and validation works without internet. Submit still needs connection.	Requires connection even to see errors.
Complexity	SheetJS (read-only) is simple. Frontend handles more logic but stays clean.	Multer + ExcelJS on backend. Slightly more backend complexity.
Verdict	RECOMMENDED. Best UX, fastest feedback, no file storage concerns.	Use only if your users have very poor internet and large files time out in the browser.

Decision
This guide implements Approach A (Client-Side Parse with SheetJS). The backend still validates all incoming data — the frontend parse is purely for instant UX. Both approaches share the same backend API, so you can switch later without changing the server code.
 
3. Database Preparation
Your 48-table Neon PostgreSQL schema already has all the tables needed for bulk import. No new tables are required. However, you need one new table to log bulk import jobs for audit trail and error recovery.

3.1  New Table — bulk_import_logs
This table stores a record of every bulk import attempt — who uploaded, how many rows succeeded, how many failed, and the full error report. The admin can see this in a Bulk Import History tab.

Column	Type	Required	Purpose
id	SERIAL PK	YES	Auto increment primary key
institute_id	INT, FK	YES	Multi-tenant isolation — same as all tables
import_type	VARCHAR(20)	YES	'students', 'parents', 'faculty'
imported_by	INT, FK users	YES	User who triggered the import
total_rows	INT	YES	Total rows in uploaded file
success_rows	INT	YES	Rows successfully inserted
failed_rows	INT	YES	Rows that had errors
error_report	JSONB	NO	Array of {row, field, error} for each failed row
status	VARCHAR(20)	YES	'completed', 'partial', 'failed'
created_at	TIMESTAMPTZ	YES	When the import happened

3.2  SQL Migration
Run this in your Neon SQL Editor:

CREATE TABLE IF NOT EXISTS bulk_import_logs (
  id SERIAL PRIMARY KEY,
  institute_id INT NOT NULL REFERENCES institutes(id),
  import_type VARCHAR(20) NOT NULL,
  imported_by INT NOT NULL REFERENCES users(id),
  total_rows INT DEFAULT 0,
  success_rows INT DEFAULT 0,
  failed_rows INT DEFAULT 0,
  error_report JSONB,
  status VARCHAR(20) DEFAULT 'completed',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
 
4. Excel Template Design
Each import type needs its own downloadable template. The admin downloads the template, fills it in Excel, and uploads it back. The templates must match your exact database schema.

4.1  Student Import Template Columns
Column Header	Required	Format	Notes / Validation
name	YES	Text	Min 2 chars, max 100. Maps to users.name
email	YES	Email	Must be valid email. Must not already exist in users table
phone	YES	10 digits	Numeric, 10 digits for India
roll_number	YES	Text	Unique per institute. Used for parent linking
class_name	YES	Text	Must match an existing class name in the institute
gender	YES	male/female/other	Case-insensitive. One of the three values only
date_of_birth	YES	DD/MM/YYYY	Must be a valid date. Student must be at least 5 years old
admission_date	NO	DD/MM/YYYY	Defaults to today if blank
address	NO	Text	Optional. Max 500 chars
password	NO	Text	Min 8 chars. If blank, system generates: student@roll_number

4.2  Parent Import Template Columns
Column Header	Required	Format	Notes / Validation
name	YES	Text	Parent full name. Min 2 chars, max 100
email	YES	Email	Must be valid email. Unique in users table
phone	YES	10 digits	Primary contact number
student_roll_number	YES	Text	CRITICAL — must match roll_number of an existing student in this institute. Used to auto-create student_parents link
relationship	YES	father/mother/guardian	Case-insensitive. One of the three ENUM values
password	NO	Text	Min 8 chars. If blank, system generates: parent@phone

4.3  Faculty Import Template Columns
Column Header	Required	Format	Notes / Validation
name	YES	Text	Faculty full name. Min 2 chars, max 100
email	YES	Email	Must be valid email. Unique in users table
phone	YES	10 digits	Primary contact number
designation	NO	Text	e.g. Senior Teacher, HOD. Max 100 chars
salary	NO	Number	Monthly salary in INR. Decimal allowed. E.g. 25000.00
join_date	NO	DD/MM/YYYY	Date of joining. Defaults to today if blank
password	NO	Text	Min 8 chars. If blank, system generates: faculty@phone
 
5. Backend Implementation
Phase 1 — Install Package
SheetJS is only needed on the frontend (Approach A). The backend receives clean JSON. No new backend packages are required. Only the new bulk_import_logs model needs to be added.

Phase 2 — BulkImportLog Sequelize Model
Create this file: backend/models/BulkImportLog.js

const { DataTypes } = require('sequelize');
module.exports = (sequelize) => {
  return sequelize.define('BulkImportLog', {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    institute_id: { type: DataTypes.INTEGER, allowNull: false },
    import_type: { type: DataTypes.STRING(20), allowNull: false },
    imported_by: { type: DataTypes.INTEGER, allowNull: false },
    total_rows: { type: DataTypes.INTEGER, defaultValue: 0 },
    success_rows: { type: DataTypes.INTEGER, defaultValue: 0 },
    failed_rows: { type: DataTypes.INTEGER, defaultValue: 0 },
    error_report: { type: DataTypes.JSONB },
    status: { type: DataTypes.STRING(20), defaultValue: 'completed' },
  }, { tableName: 'bulk_import_logs', timestamps: true, updatedAt: false });
};

Phase 3 — Bulk Student Import Controller
Create: backend/controllers/bulkImport/bulkStudents.controller.js

Controller Logic (Full Flow)
1. Receive rows[] array from frontend. 2. Re-validate every row (server-side, never trust frontend). 3. Check for duplicate emails within the batch and against the DB. 4. Resolve class_name to class_id for each row. 5. Wrap entire insert in a DB transaction — all-or-nothing for valid rows. 6. Create user record (role=student) + student record + bcrypt password. 7. Log results to bulk_import_logs. 8. Return success count, fail count, and error details.

const bcrypt = require('bcryptjs');
const { User, Student, Class, BulkImportLog, sequelize } = require('../../models');

exports.bulkImportStudents = async (req, res) => {
  const { rows } = req.body;
  const institute_id = req.user.institute_id;
  const errors = [], successRows = [];

  // Load all classes once for O(1) lookup
  const classes = await Class.findAll({ where: { institute_id } });
  const classMap = Object.fromEntries(classes.map(c => [c.name.toLowerCase(), c.id]));

  // Check existing emails in DB in one query
  const incomingEmails = rows.map(r => r.email?.toLowerCase());
  const existing = await User.findAll({ where: { email: incomingEmails }, attributes: ['email'] });
  const existingSet = new Set(existing.map(u => u.email));

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i]; const rowNum = i + 2;
    const rowErrors = [];
    if (!row.name?.trim()) rowErrors.push('name is required');
    if (!row.email || !/^[^@]+@[^@]+$/.test(row.email)) rowErrors.push('invalid email');
    if (existingSet.has(row.email?.toLowerCase())) rowErrors.push('email already exists');
    if (!row.roll_number?.trim()) rowErrors.push('roll_number is required');
    const class_id = classMap[row.class_name?.toLowerCase()];
    if (!class_id) rowErrors.push(`class '${row.class_name}' not found`);
    if (rowErrors.length) { errors.push({ row: rowNum, errors: rowErrors }); continue; }
    successRows.push({ ...row, class_id });
  }

  // Insert valid rows in a transaction
  const t = await sequelize.transaction();
  try {
    for (const r of successRows) {
      const pw = r.password || `student@${r.roll_number}`;
      const user = await User.create({ institute_id, role: 'student',
        name: r.name, email: r.email.toLowerCase(), phone: r.phone,
        password_hash: await bcrypt.hash(pw, 10), status: 'active' }, { transaction: t });
      await Student.create({ institute_id, user_id: user.id, roll_number: r.roll_number,
        class_id: r.class_id, gender: r.gender?.toLowerCase(), address: r.address,
        date_of_birth: r.date_of_birth, admission_date: r.admission_date || new Date() }, { transaction: t });
    }
    await t.commit();
  } catch (err) { await t.rollback(); throw err; }

  // Log the import
  await BulkImportLog.create({ institute_id, import_type: 'students',
    imported_by: req.user.id, total_rows: rows.length,
    success_rows: successRows.length, failed_rows: errors.length,
    error_report: errors, status: errors.length ? 'partial' : 'completed' });

  res.json({ success: true, inserted: successRows.length,
    failed: errors.length, errors });
};

Phase 4 — Parent & Faculty Controllers
Create parallel controller files for parents and faculty. The parent controller has one extra step — after inserting the parent user, it looks up the student by roll_number and creates a student_parents junction row.

Parent Controller Extra Step
After creating the parent user: const student = await Student.findOne({ where: { institute_id, roll_number: r.student_roll_number } }); then await StudentParent.create({ student_id: student.id, parent_id: parentUser.id, relationship: r.relationship });

Phase 5 — Routes
Add to your existing backend/routes/ files, protected by verifyToken + allowRoles('admin','manager'):

Method	Endpoint	Purpose
POST	/api/students/bulk-import	Bulk insert students
POST	/api/parents/bulk-import	Bulk insert parents + link to students
POST	/api/faculty/bulk-import	Bulk insert faculty
GET	/api/bulk-import/template/:type	Download template for students/parents/faculty
GET	/api/bulk-import/logs	Get import history for the institute
 
6. Frontend Implementation
Phase 6 — Install SheetJS
# In your frontend folder:
npm install xlsx

Phase 7 — BulkImportButton Component
Create a reusable component: frontend/src/components/BulkImportButton.jsx. This single component handles all three import types (students, parents, faculty) based on the type prop. It will be used in three separate pages.

Component Responsibilities
1. Download template button  |  2. File input (hidden, accepts .xlsx/.csv only)  |  3. SheetJS parse on file select  |  4. Row-by-row frontend validation with error highlighting  |  5. Preview modal showing valid/invalid rows  |  6. Submit button calling the API  |  7. Progress indicator and result toast

import * as XLSX from 'xlsx';
import { useState, useRef } from 'react';

export default function BulkImportButton({ type, onSuccess }) {
  const [rows, setRows] = useState([]);
  const [errors, setErrors] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const fileRef = useRef();

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      const wb = XLSX.read(evt.target.result, { type: 'binary', cellDates: true });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const data = XLSX.utils.sheet_to_json(ws, { raw: false, dateNF: 'DD/MM/YYYY' });
      const { validRows, rowErrors } = validateRows(data, type);
      setRows(validRows); setErrors(rowErrors); setShowModal(true);
    };
    reader.readAsBinaryString(file);
  };

  const handleSubmit = async () => {
    if (!rows.length) return;
    setLoading(true);
    try {
      const res = await api.post(`/api/${type}/bulk-import`, { rows });
      onSuccess(res.data);
      setShowModal(false);
    } finally { setLoading(false); }
  };
  // ... render with modal, preview table, and submit button
}

Phase 8 — Validation Functions
Create: frontend/src/utils/bulkValidation.js — A single validation utility handles all three import types based on the type string.

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^[6-9]\d{9}$/;

export function validateRows(rows, type) {
  const validRows = [], rowErrors = [];
  const seenEmails = new Set();
  rows.forEach((row, i) => {
    const errs = [];
    // Common validations
    if (!row.name?.trim()) errs.push('name required');
    if (!EMAIL_REGEX.test(row.email)) errs.push('invalid email');
    if (seenEmails.has(row.email?.toLowerCase())) errs.push('duplicate email in file');
    else seenEmails.add(row.email?.toLowerCase());
    if (row.phone && !PHONE_REGEX.test(row.phone)) errs.push('phone must be 10 digits');
    // Type-specific validations
    if (type === 'students') {
      if (!row.roll_number?.trim()) errs.push('roll_number required');
      if (!row.class_name?.trim()) errs.push('class_name required');
      if (!['male','female','other'].includes(row.gender?.toLowerCase())) errs.push('gender invalid');
    }
    if (type === 'parents') {
      if (!row.student_roll_number?.trim()) errs.push('student_roll_number required');
      if (!['father','mother','guardian'].includes(row.relationship?.toLowerCase())) errs.push('relationship invalid');
    }
    errs.length ? rowErrors.push({ row: i+2, errors: errs }) : validRows.push(row);
  });
  return { validRows, rowErrors };
}

Phase 9 — Add Button to Manage Pages
Add the BulkImportButton component to three existing pages in your frontend. The button goes in the header area next to the existing Add Student / Add Parent / Add Faculty button.

Page File	Import Type	Placement
ManageStudents.jsx	type='students'	Next to the Add Student button in the page header
ManageParents.jsx	type='parents'	Next to the Add Parent button in the page header
ManageFaculty.jsx	type='faculty'	Next to the Add Faculty button in the page header

// In ManageStudents.jsx header:
<div className='page-header'>
  <button onClick={openAddModal}>+ Add Student</button>
  <BulkImportButton type='students' onSuccess={handleBulkSuccess} />
</div>
 
7. Preview Modal Design
The preview modal is the most important UX element in the entire bulk import flow. The admin sees exactly what will happen before anything is inserted. Here is what the modal contains:

UI Section	What It Shows
Summary bar	Green badge: X rows ready to import  |  Red badge: Y rows have errors  |  Total rows in file
Valid rows tab	Table showing all rows that passed validation. Green row background. Each row has a checkbox (selected by default) allowing admin to deselect rows they don't want to import.
Error rows tab	Table showing rows that failed validation. Red row background. Each cell that failed is highlighted in red. Specific error message shown per row (e.g. Row 5: email already exists, roll_number required).
Action bar	Cancel button (closes modal, no changes) and Import X Records button (disabled if 0 valid rows, shows spinner when loading).
 
8. Complete Validation Rules
These 20 validation rules apply across all three import types. Frontend catches them before the API call. Backend re-validates as a security layer regardless.

#	Field	Rule	Error Message	Applies To
1	name	Min 2 chars, max 100, not empty	Name is required	All types
2	email	Valid email format	Invalid email format	All types
3	email	No duplicates within the file	Duplicate email in file (Row X)	All types
4	email	Not already in users table	Email already exists in system	All types (backend only)
5	phone	10 digits, starts with 6-9	Phone must be 10 digits	All types
6	password	Min 8 chars if provided	Password must be min 8 characters	All types
7	roll_number	Not empty, unique per institute	Roll number is required / already taken	Students only
8	class_name	Must match existing class in institute	Class 'X' not found	Students only (backend)
9	gender	male / female / other only	Gender must be male, female, or other	Students only
10	date_of_birth	Valid DD/MM/YYYY, age >= 5	Invalid date or student too young	Students only
11	student_roll_number	Not empty	Student roll number is required	Parents only
12	student_roll_number	Must match existing student in institute	No student found with roll number X	Parents only (backend)
13	relationship	father / mother / guardian only	Relationship must be father, mother, or guardian	Parents only
14	salary	If provided, must be positive number	Salary must be a positive number	Faculty only
15	File	Only .xlsx or .csv accepted	Only Excel (.xlsx) or CSV files allowed	All types (frontend)
16	File	Max 5MB file size	File size must be under 5MB	All types (frontend)
17	Rows	At least 1 row in file	File has no data rows	All types
18	Rows	Maximum 500 rows per upload	Max 500 rows per import. Split into multiple files.	All types
19	Headers	Required columns must be present	Missing required column: X	All types (frontend)
20	institute_id	Always injected server-side from JWT	N/A — security rule, not shown to user	All types (backend)
 
9. Plan Limit Enforcement
This is critical. Your subscription plans have max_students, max_faculty limits stored in the plans table. The bulk import controller must check these limits before inserting.

Backend Check Before Insert
1. Get institute's current_limit_students from institutes table.  2. Count existing students for this institute.  3. If (existing + rows.length) > current_limit_students, reject with: 'Plan limit exceeded. You can import X more students. Your plan allows Y total.'  4. Same logic applies for faculty using current_limit_faculty.

// In bulkStudents.controller.js, before inserting:
const institute = await Institute.findByPk(institute_id);
const currentCount = await Student.count({ where: { institute_id } });
const remaining = institute.current_limit_students - currentCount;
if (successRows.length > remaining) {
  return res.status(400).json({
    error: 'PLAN_LIMIT_EXCEEDED',
    message: `Plan limit exceeded. You can add ${remaining} more students.`
  });
}
 
10. Implementation Checklist
Complete these tasks in order. Each phase builds on the previous.

#	Task	Phase	Files Changed
[ ]	Run SQL migration for bulk_import_logs table	Phase 1 — DB	Neon SQL Editor
[ ]	Create BulkImportLog Sequelize model	Phase 2 — Backend	models/BulkImportLog.js
[ ]	Register BulkImportLog in models/index.js	Phase 2 — Backend	models/index.js
[ ]	Create bulkStudents controller	Phase 3 — Backend	controllers/bulkImport/bulkStudents.controller.js
[ ]	Create bulkParents controller with student linking	Phase 4 — Backend	controllers/bulkImport/bulkParents.controller.js
[ ]	Create bulkFaculty controller	Phase 4 — Backend	controllers/bulkImport/bulkFaculty.controller.js
[ ]	Add 5 new routes (bulk-import endpoints)	Phase 5 — Backend	routes/students.routes.js + others
[ ]	npm install xlsx in frontend	Phase 6 — Frontend	frontend/package.json
[ ]	Create BulkImportButton component	Phase 7 — Frontend	components/BulkImportButton.jsx
[ ]	Create bulkValidation.js utility	Phase 8 — Frontend	utils/bulkValidation.js
[ ]	Add BulkImportButton to ManageStudents.jsx	Phase 9 — Frontend	ManageStudents.jsx
[ ]	Add BulkImportButton to ManageParents.jsx	Phase 9 — Frontend	ManageParents.jsx
[ ]	Add BulkImportButton to ManageFaculty.jsx	Phase 9 — Frontend	ManageFaculty.jsx
[ ]	Build and test Preview Modal with valid/error tab	Phase 10 — QA	BulkImportModal.jsx
[ ]	Test plan limit enforcement with near-limit institute	Phase 10 — QA	Backend controller
[ ]	Test parent import with student_roll_number linking	Phase 10 — QA	Backend + DB
[ ]	Verify multi-tenant isolation (import_id for wrong institute blocked)	Phase 10 — QA	Backend security

Files Changed Summary
New files: 4 (3 controllers + 1 model). Modified files: 6 (models/index.js, 3 route files, ManageStudents.jsx, ManageParents.jsx, ManageFaculty.jsx). New frontend files: 2 (BulkImportButton.jsx, bulkValidation.js). DB change: 1 new table only.

Student SaaS — Bulk Import Guide




cd /home/claude && cat > bulk_impl.js << 'ENDOFFILE'
const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  AlignmentType, HeadingLevel, BorderStyle, WidthType, ShadingType,
  LevelFormat, PageBreak, VerticalAlign
} = require('docx');
const fs = require('fs');

// ── helpers ──────────────────────────────────────────────────────────────────
const b1 = { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" };
const borders = { top: b1, bottom: b1, left: b1, right: b1 };
const hb = { style: BorderStyle.SINGLE, size: 1, color: "1E3A5F" };
const hBorders = { top: hb, bottom: hb, left: hb, right: hb };

function cell(text, w, shade, bold=false, color="333333", size=20) {
  return new TableCell({
    borders, width:{ size:w, type:WidthType.DXA },
    shading: shade?{ fill:shade, type:ShadingType.CLEAR }:undefined,
    margins:{ top:80, bottom:80, left:120, right:120 },
    children:[new Paragraph({ children:[new TextRun({ text, bold, color, font:"Arial", size })] })]
  });
}
function hCell(text, w, fill="1E3A5F") {
  return new TableCell({
    borders:hBorders, width:{ size:w, type:WidthType.DXA },
    shading:{ fill, type:ShadingType.CLEAR },
    margins:{ top:80, bottom:80, left:120, right:120 },
    children:[new Paragraph({ alignment:AlignmentType.CENTER,
      children:[new TextRun({ text, bold:true, color:"FFFFFF", font:"Arial", size:20 })] })]
  });
}
function para(text, { bold=false, size=22, color="333333", before=100, after=100 }={}) {
  return new Paragraph({ spacing:{ before, after },
    children:[new TextRun({ text, bold, size, color, font:"Arial" })] });
}
function h1(text) { return new Paragraph({ heading:HeadingLevel.HEADING_1, spacing:{ before:320, after:160 },
  children:[new TextRun({ text, font:"Arial" })] }); }
function h2(text) { return new Paragraph({ heading:HeadingLevel.HEADING_2, spacing:{ before:240, after:120 },
  children:[new TextRun({ text, font:"Arial" })] }); }
function h3(text) { return new Paragraph({ heading:HeadingLevel.HEADING_3, spacing:{ before:180, after:80 },
  children:[new TextRun({ text, font:"Arial" })] }); }
function bullet(text) { return new Paragraph({ numbering:{ reference:"bullets", level:0 }, spacing:{ before:60, after:60 },
  children:[new TextRun({ text, font:"Arial", size:22, color:"333333" })] }); }
function numbered(text) { return new Paragraph({ numbering:{ reference:"numbers", level:0 }, spacing:{ before:60, after:60 },
  children:[new TextRun({ text, font:"Arial", size:22, color:"333333" })] }); }
function sp() { return new Paragraph({ spacing:{ before:60, after:60 }, children:[new TextRun({ text:"" })] }); }
function box(label, text, fill, accent) {
  return new Table({ width:{ size:9360, type:WidthType.DXA }, columnWidths:[9360],
    rows:[new TableRow({ children:[new TableCell({
      borders:{ top:{ style:BorderStyle.SINGLE, size:4, color:accent }, bottom:b1,
                left:{ style:BorderStyle.SINGLE, size:4, color:accent }, right:b1 },
      width:{ size:9360, type:WidthType.DXA },
      shading:{ fill, type:ShadingType.CLEAR },
      margins:{ top:120, bottom:120, left:180, right:120 },
      children:[
        new Paragraph({ spacing:{ before:0, after:60 }, children:[new TextRun({ text:label, bold:true, color:accent, font:"Arial", size:20 })] }),
        new Paragraph({ spacing:{ before:0, after:0 }, children:[new TextRun({ text, color:"333333", font:"Arial", size:20 })] })
      ]
    })]})]}); }
function code(lines) {
  return new Table({ width:{ size:9360, type:WidthType.DXA }, columnWidths:[9360],
    rows:[new TableRow({ children:[new TableCell({
      borders, width:{ size:9360, type:WidthType.DXA },
      shading:{ fill:"1A1A2E", type:ShadingType.CLEAR },
      margins:{ top:120, bottom:120, left:180, right:120 },
      children: lines.map(([txt, col="DDDDDD"]) =>
        new Paragraph({ spacing:{ before:0, after:0 }, children:[new TextRun({ text:txt, color:col, font:"Courier New", size:18 })] })
      )
    })]})]}); }

// ─────────────────────────────────────────────────────────────────────────────
const doc = new Document({
  numbering:{ config:[
    { reference:"bullets", levels:[{ level:0, format:LevelFormat.BULLET, text:"\u2022", alignment:AlignmentType.LEFT,
        style:{ paragraph:{ indent:{ left:720, hanging:360 } } } }] },
    { reference:"numbers", levels:[{ level:0, format:LevelFormat.DECIMAL, text:"%1.", alignment:AlignmentType.LEFT,
        style:{ paragraph:{ indent:{ left:720, hanging:360 } } } }] },
  ]},
  styles:{
    default:{ document:{ run:{ font:"Arial", size:22 } } },
    paragraphStyles:[
      { id:"Heading1", name:"Heading 1", basedOn:"Normal", next:"Normal", quickFormat:true,
        run:{ size:36, bold:true, font:"Arial", color:"1E3A5F" },
        paragraph:{ spacing:{ before:360, after:180 }, outlineLevel:0 } },
      { id:"Heading2", name:"Heading 2", basedOn:"Normal", next:"Normal", quickFormat:true,
        run:{ size:28, bold:true, font:"Arial", color:"2E75B6" },
        paragraph:{ spacing:{ before:240, after:120 }, outlineLevel:1 } },
      { id:"Heading3", name:"Heading 3", basedOn:"Normal", next:"Normal", quickFormat:true,
        run:{ size:24, bold:true, font:"Arial", color:"1F6394" },
        paragraph:{ spacing:{ before:180, after:80 }, outlineLevel:2 } },
    ]
  },
  sections:[{
    properties:{ page:{ size:{ width:12240, height:15840 }, margin:{ top:1440, right:1440, bottom:1440, left:1440 } } },
    children:[

// ── COVER ────────────────────────────────────────────────────────────────────
new Paragraph({ alignment:AlignmentType.CENTER, spacing:{ before:1440, after:120 },
  children:[new TextRun({ text:"Student SaaS", bold:true, size:56, color:"1E3A5F", font:"Arial" })] }),
new Paragraph({ alignment:AlignmentType.CENTER, spacing:{ before:120, after:120 },
  children:[new TextRun({ text:"Bulk Import — Approach A", bold:true, size:44, color:"2E75B6", font:"Arial" })] }),
new Paragraph({ alignment:AlignmentType.CENTER, spacing:{ before:120, after:480 },
  children:[new TextRun({ text:"Client-Side Parse (SheetJS) — Root to Child Implementation", size:26, color:"666666", font:"Arial" })] }),
new Paragraph({ alignment:AlignmentType.CENTER, spacing:{ before:0, after:0 },
  children:[new TextRun({ text:"Students  \u2022  Parents  \u2022  Faculty", size:24, color:"888888", font:"Arial" })] }),
new Paragraph({ children:[new PageBreak()] }),

// ── WHY APPROACH A ───────────────────────────────────────────────────────────
h1("Why Approach A Was Chosen for Your Project"),
para("After reading your full project (React + Vite frontend, Node.js + Express backend, Neon PostgreSQL, Sequelize ORM, multi-tenant institute_id isolation, Vercel frontend + Render backend deployment), Approach A — Client-Side Parse with SheetJS — is the correct choice for these specific reasons:"),
sp(),
new Table({ width:{ size:9360, type:WidthType.DXA }, columnWidths:[3000, 6360],
  rows:[
    new TableRow({ children:[hCell("Your Project Factor",3000), hCell("Why It Points to Approach A",6360)] }),
    new TableRow({ children:[cell("Vercel frontend",3000,"F5F5F5",true), cell("Vercel has a 4.5 MB request body limit. If you use Approach B (server-side), a 500-row Excel file upload would hit this limit. With Approach A, only JSON (text) is sent to the backend — always under 1 MB.",6360)] }),
    new TableRow({ children:[cell("Render free backend",3000,"F5F5F5",true), cell("Your Render free tier sleeps after inactivity. Approach B uploads a binary file, which can time out when Render wakes up. Approach A separates parse (browser, instant) from submit (API call).",6360)] }),
    new TableRow({ children:[cell("React + Vite stack",3000,"F5F5F5",true), cell("SheetJS (xlsx) is a standard React ecosystem package. It installs in 10 seconds. No backend changes, no Multer, no temp file storage needed.",6360)] }),
    new TableRow({ children:[cell("No file storage setup",3000,"F5F5F5",true), cell("Your project uses Cloudinary for media. Approach B would need Multer + temp disk storage on Render just for imports. Approach A skips all of this.",6360)] }),
    new TableRow({ children:[cell("Instant error UX",3000,"F5F5F5",true), cell("Your users are institute admins and managers entering 100-500 rows. They need to see errors row-by-row immediately without waiting for an upload. Approach A shows all errors before a single API call is made.",6360)] }),
  ]
}),
sp(),
box("Verdict","Approach A is the only correct choice for your specific deployment setup. Approach B would create Vercel request size problems, Render cold-start timeouts, and unnecessary temp file complexity. The rest of this document is the complete root-to-child implementation of Approach A.","EFF6FF","1E5799"),
new Paragraph({ children:[new PageBreak()] }),

// ── FOLDER STRUCTURE ─────────────────────────────────────────────────────────
h1("Complete Folder Structure — What Gets Added"),
para("Here is the exact root-to-child folder tree showing every new file you create and every existing file you modify. Nothing else changes."),
sp(),
code([
  ["Modification-Repo/                    (root)", "AADDFF"],
  ["├── backend/", "DDDDDD"],
  ["│   ├── controllers/", "DDDDDD"],
  ["│   │   ├── bulkImport/              ← NEW FOLDER", "AAFFAA"],
  ["│   │   │   ├── bulkStudents.controller.js   ← NEW", "AAFFAA"],
  ["│   │   │   ├── bulkParents.controller.js    ← NEW", "AAFFAA"],
  ["│   │   │   └── bulkFaculty.controller.js    ← NEW", "AAFFAA"],
  ["│   │   └── (existing controllers untouched)", "888888"],
  ["│   ├── models/", "DDDDDD"],
  ["│   │   ├── BulkImportLog.js         ← NEW", "AAFFAA"],
  ["│   │   └── index.js                 ← MODIFY (register new model)", "FFDD88"],
  ["│   ├── routes/", "DDDDDD"],
  ["│   │   ├── students.routes.js       ← MODIFY (add 1 route)", "FFDD88"],
  ["│   │   ├── parents.routes.js        ← MODIFY (add 1 route)", "FFDD88"],
  ["│   │   ├── faculty.routes.js        ← MODIFY (add 1 route)", "FFDD88"],
  ["│   │   └── bulkImport.routes.js     ← NEW (template download + logs)", "AAFFAA"],
  ["│   ├── utils/", "DDDDDD"],
  ["│   │   └── bulkValidation.js        ← NEW (shared validation helpers)", "AAFFAA"],
  ["│   └── (server.js, middleware — NO CHANGES)", "888888"],
  ["│", "DDDDDD"],
  ["└── frontend/", "DDDDDD"],
  ["    ├── src/", "DDDDDD"],
  ["    │   ├── components/", "DDDDDD"],
  ["    │   │   ├── BulkImportButton.jsx  ← NEW (reusable trigger button)", "AAFFAA"],
  ["    │   │   └── BulkImportModal.jsx   ← NEW (preview + submit modal)", "AAFFAA"],
  ["    │   ├── utils/", "DDDDDD"],
  ["    │   │   └── bulkValidation.js     ← NEW (frontend validation)", "AAFFAA"],
  ["    │   ├── pages/admin/", "DDDDDD"],
  ["    │   │   ├── ManageStudents.jsx    ← MODIFY (add 1 component + handler)", "FFDD88"],
  ["    │   │   ├── ManageParents.jsx     ← MODIFY (add 1 component + handler)", "FFDD88"],
  ["    │   │   └── ManageFaculty.jsx     ← MODIFY (add 1 component + handler)", "FFDD88"],
  ["    │   └── (App.jsx, routes — NO CHANGES)", "888888"],
  ["    └── package.json                 ← MODIFY (add xlsx dependency)", "FFDD88"],
]),
sp(),
new Table({ width:{ size:9360, type:WidthType.DXA }, columnWidths:[2200, 2400, 2400, 2360],
  rows:[
    new TableRow({ children:[hCell("Type",2200), hCell("Count",2400), hCell("Files",2400), hCell("Impact",2360)] }),
    new TableRow({ children:[cell("New files",2200,"E8F5E9",true,"2E7D32"), cell("9 files",2400,"E8F5E9"), cell("3 controllers, 1 model, 2 routes, 1 util, 2 components",2400,"E8F5E9"), cell("Zero risk — only additions",2360,"E8F5E9")] }),
    new TableRow({ children:[cell("Modified files",2200,"FFF8E1",true,"E65100"), cell("7 files",2400,"FFF8E1"), cell("index.js, 3 routes, 3 manage pages, package.json",2400,"FFF8E1"), cell("1–5 lines added to each",2360,"FFF8E1")] }),
    new TableRow({ children:[cell("DB change",2200,"F5F5F5",true), cell("1 new table",2400), cell("bulk_import_logs",2400), cell("Run 1 SQL in Neon",2360)] }),
  ]
}),
new Paragraph({ children:[new PageBreak()] }),

// ── PHASE 1: DB ───────────────────────────────────────────────────────────────
h1("Phase 1 — Database (Neon SQL Editor)"),
para("This is the only database change. Open your Neon console, go to the SQL Editor, and run this query. It creates the audit log table and takes under 1 second."),
sp(),
code([
  ["-- Run this in Neon SQL Editor","98C379"],
  ["CREATE TABLE IF NOT EXISTS bulk_import_logs (","AAFFAA"],
  ["  id           SERIAL PRIMARY KEY,","DDDDDD"],
  ["  institute_id INT NOT NULL REFERENCES institutes(id) ON DELETE CASCADE,","DDDDDD"],
  ["  import_type  VARCHAR(20) NOT NULL CHECK (import_type IN ('students','parents','faculty')),","DDDDDD"],
  ["  imported_by  INT NOT NULL REFERENCES users(id),","DDDDDD"],
  ["  total_rows   INT DEFAULT 0,","DDDDDD"],
  ["  success_rows INT DEFAULT 0,","DDDDDD"],
  ["  failed_rows  INT DEFAULT 0,","DDDDDD"],
  ["  error_report JSONB,","DDDDDD"],
  ["  status       VARCHAR(20) DEFAULT 'completed'","DDDDDD"],
  ["              CHECK (status IN ('completed','partial','failed')),","DDDDDD"],
  ["  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()","DDDDDD"],
  [");","AAFFAA"],
  ["","DDDDDD"],
  ["-- Index for fast lookup by institute","98C379"],
  ["CREATE INDEX IF NOT EXISTS idx_bulk_logs_institute","DDDDDD"],
  ["  ON bulk_import_logs(institute_id, created_at DESC);","DDDDDD"],
]),
sp(),
box("Verify","After running, check it worked: SELECT COUNT(*) FROM bulk_import_logs; — should return 0 (empty table, no error).","E8F5E9","2E7D32"),
new Paragraph({ children:[new PageBreak()] }),

// ── PHASE 2: MODEL ────────────────────────────────────────────────────────────
h1("Phase 2 — Backend: BulkImportLog Model"),
h2("Step 2.1 — Create the file"),
para("Create this new file: backend/models/BulkImportLog.js"),
sp(),
code([
  ["// backend/models/BulkImportLog.js","98C379"],
  ["const { DataTypes } = require('sequelize');","AADDFF"],
  ["","DDDDDD"],
  ["module.exports = (sequelize) => {","DDDDDD"],
  ["  return sequelize.define('BulkImportLog', {","DDDDDD"],
  ["    id:           { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },","DDDDDD"],
  ["    institute_id: { type: DataTypes.INTEGER, allowNull: false },","DDDDDD"],
  ["    import_type:  { type: DataTypes.STRING(20), allowNull: false },","DDDDDD"],
  ["    imported_by:  { type: DataTypes.INTEGER, allowNull: false },","DDDDDD"],
  ["    total_rows:   { type: DataTypes.INTEGER, defaultValue: 0 },","DDDDDD"],
  ["    success_rows: { type: DataTypes.INTEGER, defaultValue: 0 },","DDDDDD"],
  ["    failed_rows:  { type: DataTypes.INTEGER, defaultValue: 0 },","DDDDDD"],
  ["    error_report: { type: DataTypes.JSONB },","DDDDDD"],
  ["    status:       { type: DataTypes.STRING(20), defaultValue: 'completed' },","DDDDDD"],
  ["  }, {","DDDDDD"],
  ["    tableName:  'bulk_import_logs',","DDDDDD"],
  ["    timestamps: true,","DDDDDD"],
  ["    updatedAt:  false,   // log entries are never updated","DDDDDD"],
  ["  });","DDDDDD"],
  ["};","DDDDDD"],
]),
sp(),
h2("Step 2.2 — Register in models/index.js"),
para("Open backend/models/index.js. Find the block where you register other models (User, Student, Faculty, etc.). Add these two lines in the same pattern:"),
sp(),
code([
  ["// In backend/models/index.js","98C379"],
  ["// Find where you already have lines like:","98C379"],
  ["//   db.User    = require('./User')(sequelize, DataTypes);","888888"],
  ["//   db.Student = require('./Student')(sequelize, DataTypes);","888888"],
  ["// Add this line in the same block:","98C379"],
  ["db.BulkImportLog = require('./BulkImportLog')(sequelize);","AAFFAA"],
]),
new Paragraph({ children:[new PageBreak()] }),

// ── PHASE 3: UTILS ────────────────────────────────────────────────────────────
h1("Phase 3 — Backend: Shared Validation Utility"),
para("Create: backend/utils/bulkValidation.js — This utility is used by all three controllers. Centralising validation here means one fix applies everywhere."),
sp(),
code([
  ["// backend/utils/bulkValidation.js","98C379"],
  ["const EMAIL_RE = /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/;","DDDDDD"],
  ["const PHONE_RE = /^[6-9]\\d{9}$/;","DDDDDD"],
  ["","DDDDDD"],
  ["// Validate a single row — returns array of error strings","98C379"],
  ["function validateStudentRow(row) {","DDDDDD"],
  ["  const e = [];","DDDDDD"],
  ["  if (!row.name?.trim())                           e.push('name is required');","DDDDDD"],
  ["  if (!EMAIL_RE.test(row.email || ''))             e.push('invalid email');","DDDDDD"],
  ["  if (row.phone && !PHONE_RE.test(row.phone))      e.push('phone must be 10 digits (6-9 start)');","DDDDDD"],
  ["  if (!row.roll_number?.trim())                    e.push('roll_number is required');","DDDDDD"],
  ["  if (!row.class_name?.trim())                     e.push('class_name is required');","DDDDDD"],
  ["  const g = row.gender?.toLowerCase();","DDDDDD"],
  ["  if (!['male','female','other'].includes(g))      e.push('gender must be male/female/other');","DDDDDD"],
  ["  if (!row.date_of_birth)                          e.push('date_of_birth is required (DD/MM/YYYY)');","DDDDDD"],
  ["  return e;","DDDDDD"],
  ["}","DDDDDD"],
  ["","DDDDDD"],
  ["function validateParentRow(row) {","DDDDDD"],
  ["  const e = [];","DDDDDD"],
  ["  if (!row.name?.trim())                           e.push('name is required');","DDDDDD"],
  ["  if (!EMAIL_RE.test(row.email || ''))             e.push('invalid email');","DDDDDD"],
  ["  if (!row.phone?.trim())                          e.push('phone is required');","DDDDDD"],
  ["  if (!row.student_roll_number?.trim())            e.push('student_roll_number is required');","DDDDDD"],
  ["  const r = row.relationship?.toLowerCase();","DDDDDD"],
  ["  if (!['father','mother','guardian'].includes(r)) e.push('relationship must be father/mother/guardian');","DDDDDD"],
  ["  return e;","DDDDDD"],
  ["}","DDDDDD"],
  ["","DDDDDD"],
  ["function validateFacultyRow(row) {","DDDDDD"],
  ["  const e = [];","DDDDDD"],
  ["  if (!row.name?.trim())                     e.push('name is required');","DDDDDD"],
  ["  if (!EMAIL_RE.test(row.email || ''))       e.push('invalid email');","DDDDDD"],
  ["  if (!row.phone?.trim())                    e.push('phone is required');","DDDDDD"],
  ["  if (row.salary && isNaN(Number(row.salary))) e.push('salary must be a number');","DDDDDD"],
  ["  return e;","DDDDDD"],
  ["}","DDDDDD"],
  ["","DDDDDD"],
  ["module.exports = { validateStudentRow, validateParentRow, validateFacultyRow };","AADDFF"],
]),
new Paragraph({ children:[new PageBreak()] }),

// ── PHASE 4: CONTROLLERS ──────────────────────────────────────────────────────
h1("Phase 4 — Backend: Three Bulk Import Controllers"),
h2("Step 4.1 — Create folder"),
para("Create the folder: backend/controllers/bulkImport/  (just mkdir it — no index.js needed)"),
sp(),
h2("Step 4.2 — bulkStudents.controller.js"),
para("Create: backend/controllers/bulkImport/bulkStudents.controller.js"),
sp(),
code([
  ["// backend/controllers/bulkImport/bulkStudents.controller.js","98C379"],
  ["const bcrypt = require('bcryptjs');","AADDFF"],
  ["const { User, Student, Class, BulkImportLog, sequelize } = require('../../models');","AADDFF"],
  ["const { validateStudentRow } = require('../../utils/bulkValidation');","AADDFF"],
  ["","DDDDDD"],
  ["exports.bulkImportStudents = async (req, res) => {","DDDDDD"],
  ["  try {","DDDDDD"],
  ["    const { rows } = req.body;  // Array of row objects from frontend","DDDDDD"],
  ["    const institute_id = req.user.institute_id;","DDDDDD"],
  ["    const errors = [];","DDDDDD"],
  ["    const validRows = [];","DDDDDD"],
  ["","DDDDDD"],
  ["    // ── 1. Load plan limit ──────────────────────────────────────────────","98C379"],
  ["    const { Institute } = require('../../models');","DDDDDD"],
  ["    const inst = await Institute.findByPk(institute_id, { attributes: ['current_limit_students'] });","DDDDDD"],
  ["    const existing = await Student.count({ where: { institute_id } });","DDDDDD"],
  ["    const slotsLeft = inst.current_limit_students - existing;","DDDDDD"],
  ["    if (rows.length > slotsLeft) {","DDDDDD"],
  ["      return res.status(400).json({ success:false,","DDDDDD"],
  ["        message: `Plan limit: only ${slotsLeft} student slots remaining. Your file has ${rows.length} rows.` });","DDDDDD"],
  ["    }","DDDDDD"],
  ["","DDDDDD"],
  ["    // ── 2. Load all classes once for O(1) lookup ────────────────────────","98C379"],
  ["    const classes = await Class.findAll({ where:{ institute_id }, attributes:['id','name'] });","DDDDDD"],
  ["    const classMap = {};","DDDDDD"],
  ["    classes.forEach(c => classMap[c.name.toLowerCase().trim()] = c.id);","DDDDDD"],
  ["","DDDDDD"],
  ["    // ── 3. Batch email existence check ──────────────────────────────────","98C379"],
  ["    const emails = rows.map(r => r.email?.toLowerCase().trim()).filter(Boolean);","DDDDDD"],
  ["    const existingUsers = await User.findAll({ where:{ email: emails }, attributes:['email'] });","DDDDDD"],
  ["    const takenEmails = new Set(existingUsers.map(u => u.email));","DDDDDD"],
  ["    const seenInBatch = new Set();","DDDDDD"],
  ["","DDDDDD"],
  ["    // ── 4. Batch roll_number uniqueness check ───────────────────────────","98C379"],
  ["    const rolls = rows.map(r => r.roll_number?.trim()).filter(Boolean);","DDDDDD"],
  ["    const existingRolls = await Student.findAll({ where:{ institute_id, roll_number: rolls }, attributes:['roll_number'] });","DDDDDD"],
  ["    const takenRolls = new Set(existingRolls.map(s => s.roll_number));","DDDDDD"],
  ["    const seenRollsInBatch = new Set();","DDDDDD"],
  ["","DDDDDD"],
  ["    // ── 5. Validate each row ─────────────────────────────────────────────","98C379"],
  ["    for (let i = 0; i < rows.length; i++) {","DDDDDD"],
  ["      const row = rows[i];","DDDDDD"],
  ["      const rowNum = i + 2;  // Excel row number (row 1 = header)","DDDDDD"],
  ["      const rowErrors = validateStudentRow(row);","DDDDDD"],
  ["","DDDDDD"],
  ["      const email = row.email?.toLowerCase().trim();","DDDDDD"],
  ["      if (takenEmails.has(email))    rowErrors.push('email already exists in system');","DDDDDD"],
  ["      if (seenInBatch.has(email))    rowErrors.push('duplicate email within file');","DDDDDD"],
  ["      else seenInBatch.add(email);","DDDDDD"],
  ["","DDDDDD"],
  ["      const roll = row.roll_number?.trim();","DDDDDD"],
  ["      if (takenRolls.has(roll))      rowErrors.push('roll number already exists');","DDDDDD"],
  ["      if (seenRollsInBatch.has(roll)) rowErrors.push('duplicate roll number in file');","DDDDDD"],
  ["      else seenRollsInBatch.add(roll);","DDDDDD"],
  ["","DDDDDD"],
  ["      const class_id = classMap[row.class_name?.toLowerCase().trim()];","DDDDDD"],
  ["      if (!class_id) rowErrors.push(`class '${row.class_name}' does not exist`);","DDDDDD"],
  ["","DDDDDD"],
  ["      if (rowErrors.length) { errors.push({ row: rowNum, name: row.name||'', errors: rowErrors }); }","DDDDDD"],
  ["      else { validRows.push({ ...row, class_id, email: email }); }","DDDDDD"],
  ["    }","DDDDDD"],
  ["","DDDDDD"],
  ["    // ── 6. Insert all valid rows in a single transaction ─────────────────","98C379"],
  ["    const t = await sequelize.transaction();","DDDDDD"],
  ["    try {","DDDDDD"],
  ["      for (const r of validRows) {","DDDDDD"],
  ["        const pw = r.password?.trim() || `student@${r.roll_number}`;","DDDDDD"],
  ["        const user = await User.create({","DDDDDD"],
  ["          institute_id, role:'student', name: r.name.trim(),","DDDDDD"],
  ["          email: r.email, phone: r.phone?.trim() || null,","DDDDDD"],
  ["          password_hash: await bcrypt.hash(pw, 10),","DDDDDD"],
  ["          status: 'active',","DDDDDD"],
  ["        }, { transaction: t });","DDDDDD"],
  ["        await Student.create({","DDDDDD"],
  ["          institute_id, user_id: user.id,","DDDDDD"],
  ["          roll_number:   r.roll_number.trim(),","DDDDDD"],
  ["          class_id:      r.class_id,","DDDDDD"],
  ["          gender:        r.gender?.toLowerCase(),","DDDDDD"],
  ["          date_of_birth: r.date_of_birth || null,","DDDDDD"],
  ["          admission_date: r.admission_date || new Date(),","DDDDDD"],
  ["          address:       r.address?.trim() || null,","DDDDDD"],
  ["        }, { transaction: t });","DDDDDD"],
  ["      }","DDDDDD"],
  ["      await t.commit();","DDDDDD"],
  ["    } catch (err) {","DDDDDD"],
  ["      await t.rollback();","DDDDDD"],
  ["      throw err;","DDDDDD"],
  ["    }","DDDDDD"],
  ["","DDDDDD"],
  ["    // ── 7. Log the import ────────────────────────────────────────────────","98C379"],
  ["    await BulkImportLog.create({ institute_id, import_type:'students',","DDDDDD"],
  ["      imported_by: req.user.id, total_rows: rows.length,","DDDDDD"],
  ["      success_rows: validRows.length, failed_rows: errors.length,","DDDDDD"],
  ["      error_report: errors,","DDDDDD"],
  ["      status: errors.length === rows.length ? 'failed' : errors.length ? 'partial' : 'completed'","DDDDDD"],
  ["    });","DDDDDD"],
  ["","DDDDDD"],
  ["    res.json({ success:true, inserted: validRows.length, failed: errors.length, errors });","DDDDDD"],
  ["  } catch (err) {","DDDDDD"],
  ["    console.error('Bulk student import error:', err);","DDDDDD"],
  ["    res.status(500).json({ success:false, message:'Server error during import' });","DDDDDD"],
  ["  }","DDDDDD"],
  ["};","DDDDDD"],
]),
sp(),
h2("Step 4.3 — bulkParents.controller.js"),
para("Create: backend/controllers/bulkImport/bulkParents.controller.js  — The key difference from students: after creating the parent user, this controller resolves student_roll_number to a student_id and creates the student_parents junction row."),
sp(),
code([
  ["// backend/controllers/bulkImport/bulkParents.controller.js","98C379"],
  ["const bcrypt = require('bcryptjs');","AADDFF"],
  ["const { User, Student, BulkImportLog, sequelize } = require('../../models');","AADDFF"],
  ["const { validateParentRow } = require('../../utils/bulkValidation');","AADDFF"],
  ["","DDDDDD"],
  ["exports.bulkImportParents = async (req, res) => {","DDDDDD"],
  ["  try {","DDDDDD"],
  ["    const { rows } = req.body;","DDDDDD"],
  ["    const institute_id = req.user.institute_id;","DDDDDD"],
  ["    const errors = [], validRows = [];","DDDDDD"],
  ["","DDDDDD"],
  ["    // Load all students in institute for roll lookup ─────────────────────","98C379"],
  ["    const students = await Student.findAll({","DDDDDD"],
  ["      where: { institute_id }, attributes: ['id','roll_number']","DDDDDD"],
  ["    });","DDDDDD"],
  ["    const rollToStudentId = {};","DDDDDD"],
  ["    students.forEach(s => rollToStudentId[s.roll_number.trim()] = s.id);","DDDDDD"],
  ["","DDDDDD"],
  ["    // Batch email check ────────────────────────────────────────────────────","98C379"],
  ["    const emails = rows.map(r => r.email?.toLowerCase().trim()).filter(Boolean);","DDDDDD"],
  ["    const existingUsers = await User.findAll({ where:{ email: emails }, attributes:['email'] });","DDDDDD"],
  ["    const takenEmails = new Set(existingUsers.map(u => u.email));","DDDDDD"],
  ["    const seenInBatch = new Set();","DDDDDD"],
  ["","DDDDDD"],
  ["    // Validate ────────────────────────────────────────────────────────────","98C379"],
  ["    for (let i = 0; i < rows.length; i++) {","DDDDDD"],
  ["      const row = rows[i]; const rowNum = i + 2;","DDDDDD"],
  ["      const rowErrors = validateParentRow(row);","DDDDDD"],
  ["      const email = row.email?.toLowerCase().trim();","DDDDDD"],
  ["      if (takenEmails.has(email))   rowErrors.push('email already exists');","DDDDDD"],
  ["      if (seenInBatch.has(email))   rowErrors.push('duplicate email in file');","DDDDDD"],
  ["      else seenInBatch.add(email);","DDDDDD"],
  ["      const sid = rollToStudentId[row.student_roll_number?.trim()];","DDDDDD"],
  ["      if (!sid) rowErrors.push(`no student found with roll '${row.student_roll_number}'`);","DDDDDD"],
  ["      if (rowErrors.length) errors.push({ row: rowNum, name: row.name||'', errors: rowErrors });","DDDDDD"],
  ["      else validRows.push({ ...row, email, student_id: sid });","DDDDDD"],
  ["    }","DDDDDD"],
  ["","DDDDDD"],
  ["    // Insert in transaction ───────────────────────────────────────────────","98C379"],
  ["    const t = await sequelize.transaction();","DDDDDD"],
  ["    try {","DDDDDD"],
  ["      for (const r of validRows) {","DDDDDD"],
  ["        const pw = r.password?.trim() || `parent@${r.phone}`;","DDDDDD"],
  ["        const user = await User.create({","DDDDDD"],
  ["          institute_id, role:'parent', name: r.name.trim(),","DDDDDD"],
  ["          email: r.email, phone: r.phone?.trim(),","DDDDDD"],
  ["          password_hash: await bcrypt.hash(pw, 10), status:'active'","DDDDDD"],
  ["        }, { transaction: t });","DDDDDD"],
  ["        // Link parent to student via junction table","98C379"],
  ["        await sequelize.query(","DDDDDD"],
  ["          `INSERT INTO student_parents (student_id, parent_id, relationship, created_at, updated_at)","DDDDDD"],
  ["           VALUES (:sid, :pid, :rel, NOW(), NOW())`,","DDDDDD"],
  ["          { replacements:{ sid: r.student_id, pid: user.id, rel: r.relationship.toLowerCase() },","DDDDDD"],
  ["            transaction: t }","DDDDDD"],
  ["        );","DDDDDD"],
  ["      }","DDDDDD"],
  ["      await t.commit();","DDDDDD"],
  ["    } catch (err) { await t.rollback(); throw err; }","DDDDDD"],
  ["","DDDDDD"],
  ["    await BulkImportLog.create({ institute_id, import_type:'parents',","DDDDDD"],
  ["      imported_by: req.user.id, total_rows: rows.length,","DDDDDD"],
  ["      success_rows: validRows.length, failed_rows: errors.length,","DDDDDD"],
  ["      error_report: errors, status: errors.length === rows.length?'failed':errors.length?'partial':'completed' });","DDDDDD"],
  ["    res.json({ success:true, inserted: validRows.length, failed: errors.length, errors });","DDDDDD"],
  ["  } catch (err) {","DDDDDD"],
  ["    console.error('Bulk parent import error:', err);","DDDDDD"],
  ["    res.status(500).json({ success:false, message:'Server error during import' });","DDDDDD"],
  ["  }","DDDDDD"],
  ["};","DDDDDD"],
]),
sp(),
h2("Step 4.4 — bulkFaculty.controller.js"),
para("Create: backend/controllers/bulkImport/bulkFaculty.controller.js"),
sp(),
code([
  ["// backend/controllers/bulkImport/bulkFaculty.controller.js","98C379"],
  ["const bcrypt = require('bcryptjs');","AADDFF"],
  ["const { User, Faculty, Institute, BulkImportLog, sequelize } = require('../../models');","AADDFF"],
  ["const { validateFacultyRow } = require('../../utils/bulkValidation');","AADDFF"],
  ["","DDDDDD"],
  ["exports.bulkImportFaculty = async (req, res) => {","DDDDDD"],
  ["  try {","DDDDDD"],
  ["    const { rows } = req.body;","DDDDDD"],
  ["    const institute_id = req.user.institute_id;","DDDDDD"],
  ["    const errors = [], validRows = [];","DDDDDD"],
  ["","DDDDDD"],
  ["    // Plan limit check ────────────────────────────────────────────────────","98C379"],
  ["    const inst = await Institute.findByPk(institute_id, { attributes:['current_limit_faculty'] });","DDDDDD"],
  ["    const existingCount = await Faculty.count({ where:{ institute_id } });","DDDDDD"],
  ["    const slotsLeft = inst.current_limit_faculty - existingCount;","DDDDDD"],
  ["    if (rows.length > slotsLeft) return res.status(400).json({ success:false,","DDDDDD"],
  ["      message: `Plan limit: only ${slotsLeft} faculty slots remaining.` });","DDDDDD"],
  ["","DDDDDD"],
  ["    // Email uniqueness ────────────────────────────────────────────────────","98C379"],
  ["    const emails = rows.map(r => r.email?.toLowerCase().trim()).filter(Boolean);","DDDDDD"],
  ["    const existing = await User.findAll({ where:{ email: emails }, attributes:['email'] });","DDDDDD"],
  ["    const takenEmails = new Set(existing.map(u => u.email));","DDDDDD"],
  ["    const seenInBatch = new Set();","DDDDDD"],
  ["","DDDDDD"],
  ["    // Validate ────────────────────────────────────────────────────────────","98C379"],
  ["    for (let i = 0; i < rows.length; i++) {","DDDDDD"],
  ["      const row = rows[i]; const rowNum = i + 2;","DDDDDD"],
  ["      const rowErrors = validateFacultyRow(row);","DDDDDD"],
  ["      const email = row.email?.toLowerCase().trim();","DDDDDD"],
  ["      if (takenEmails.has(email))  rowErrors.push('email already exists');","DDDDDD"],
  ["      if (seenInBatch.has(email))  rowErrors.push('duplicate email in file');","DDDDDD"],
  ["      else seenInBatch.add(email);","DDDDDD"],
  ["      if (rowErrors.length) errors.push({ row: rowNum, name: row.name||'', errors: rowErrors });","DDDDDD"],
  ["      else validRows.push({ ...row, email });","DDDDDD"],
  ["    }","DDDDDD"],
  ["","DDDDDD"],
  ["    // Insert in transaction ───────────────────────────────────────────────","98C379"],
  ["    const t = await sequelize.transaction();","DDDDDD"],
  ["    try {","DDDDDD"],
  ["      for (const r of validRows) {","DDDDDD"],
  ["        const pw = r.password?.trim() || `faculty@${r.phone}`;","DDDDDD"],
  ["        const user = await User.create({","DDDDDD"],
  ["          institute_id, role:'faculty', name: r.name.trim(),","DDDDDD"],
  ["          email: r.email, phone: r.phone?.trim(),","DDDDDD"],
  ["          password_hash: await bcrypt.hash(pw, 10), status:'active'","DDDDDD"],
  ["        }, { transaction: t });","DDDDDD"],
  ["        await Faculty.create({","DDDDDD"],
  ["          institute_id, user_id: user.id,","DDDDDD"],
  ["          designation: r.designation?.trim() || null,","DDDDDD"],
  ["          salary:      r.salary ? Number(r.salary) : null,","DDDDDD"],
  ["          join_date:   r.join_date || new Date(),","DDDDDD"],
  ["        }, { transaction: t });","DDDDDD"],
  ["      }","DDDDDD"],
  ["      await t.commit();","DDDDDD"],
  ["    } catch (err) { await t.rollback(); throw err; }","DDDDDD"],
  ["","DDDDDD"],
  ["    await BulkImportLog.create({ institute_id, import_type:'faculty',","DDDDDD"],
  ["      imported_by: req.user.id, total_rows: rows.length,","DDDDDD"],
  ["      success_rows: validRows.length, failed_rows: errors.length,","DDDDDD"],
  ["      error_report: errors, status: errors.length===rows.length?'failed':errors.length?'partial':'completed' });","DDDDDD"],
  ["    res.json({ success:true, inserted: validRows.length, failed: errors.length, errors });","DDDDDD"],
  ["  } catch (err) {","DDDDDD"],
  ["    console.error('Bulk faculty import error:', err);","DDDDDD"],
  ["    res.status(500).json({ success:false, message:'Server error during import' });","DDDDDD"],
  ["  }","DDDDDD"],
  ["};","DDDDDD"],
]),
new Paragraph({ children:[new PageBreak()] }),

// ── PHASE 5: ROUTES ───────────────────────────────────────────────────────────
h1("Phase 5 — Backend: Routes"),
h2("Step 5.1 — Add to students.routes.js"),
para("Open backend/routes/students.routes.js and add these two lines — one import and one route. The rest of the file stays exactly as it is."),
sp(),
code([
  ["// In backend/routes/students.routes.js","98C379"],
  ["// At the top, add:","98C379"],
  ["const { bulkImportStudents } = require('../controllers/bulkImport/bulkStudents.controller');","AAFFAA"],
  ["","DDDDDD"],
  ["// Find where your other POST routes are (like router.post('/...')) and add:","98C379"],
  ["router.post('/bulk-import', verifyToken, allowRoles('admin','manager'), bulkImportStudents);","AAFFAA"],
]),
sp(),
h2("Step 5.2 — Add to parents.routes.js"),
sp(),
code([
  ["const { bulkImportParents } = require('../controllers/bulkImport/bulkParents.controller');","AAFFAA"],
  ["router.post('/bulk-import', verifyToken, allowRoles('admin','manager'), bulkImportParents);","AAFFAA"],
]),
sp(),
h2("Step 5.3 — Add to faculty.routes.js"),
sp(),
code([
  ["const { bulkImportFaculty } = require('../controllers/bulkImport/bulkFaculty.controller');","AAFFAA"],
  ["router.post('/bulk-import', verifyToken, allowRoles('admin','manager'), bulkImportFaculty);","AAFFAA"],
]),
sp(),
h2("Step 5.4 — Create bulkImport.routes.js (template download + logs)"),
para("Create: backend/routes/bulkImport.routes.js"),
sp(),
code([
  ["// backend/routes/bulkImport.routes.js","98C379"],
  ["const express = require('express');","AADDFF"],
  ["const router  = express.Router();","AADDFF"],
  ["const { verifyToken, allowRoles } = require('../middleware/auth');","AADDFF"],
  ["const { BulkImportLog } = require('../models');","AADDFF"],
  ["","DDDDDD"],
  ["// GET /api/bulk-import/logs — import history for the institute","98C379"],
  ["router.get('/logs', verifyToken, allowRoles('admin','manager'), async (req, res) => {","DDDDDD"],
  ["  const logs = await BulkImportLog.findAll({","DDDDDD"],
  ["    where: { institute_id: req.user.institute_id },","DDDDDD"],
  ["    order: [['created_at','DESC']],","DDDDDD"],
  ["    limit: 50,","DDDDDD"],
  ["  });","DDDDDD"],
  ["  res.json({ success:true, logs });","DDDDDD"],
  ["});","DDDDDD"],
  ["","DDDDDD"],
  ["module.exports = router;","AADDFF"],
]),
sp(),
h2("Step 5.5 — Register bulkImport routes in server.js"),
para("Open backend/server.js (or app.js). Find where you already register other routes and add one line:"),
sp(),
code([
  ["// In backend/server.js, find the existing route registrations:","98C379"],
  ["// app.use('/api/students', require('./routes/students.routes'));   // already there","888888"],
  ["// app.use('/api/faculty',  require('./routes/faculty.routes'));    // already there","888888"],
  ["// Add this one new line:","98C379"],
  ["app.use('/api/bulk-import', require('./routes/bulkImport.routes'));","AAFFAA"],
]),
new Paragraph({ children:[new PageBreak()] }),

// ── PHASE 6: FRONTEND INSTALL ─────────────────────────────────────────────────
h1("Phase 6 — Frontend: Install SheetJS"),
para("Run this inside your frontend folder. SheetJS (xlsx) is the only new frontend package."),
sp(),
code([
  ["# Terminal — inside the frontend folder","98C379"],
  ["cd frontend","DDDDDD"],
  ["npm install xlsx","AAFFAA"],
  ["# That is the only npm change needed.","98C379"],
]),
sp(),
box("Why only xlsx?","SheetJS reads .xlsx and .csv files entirely in the browser. No server upload needed for parsing. The package is 1.2 MB and well-maintained. It is used in production by companies like Notion, Airtable, and Google Sheets.","EFF6FF","1E5799"),
new Paragraph({ children:[new PageBreak()] }),

// ── PHASE 7: FRONTEND VALIDATION ─────────────────────────────────────────────
h1("Phase 7 — Frontend: Validation Utility"),
para("Create: frontend/src/utils/bulkValidation.js — Mirror of the backend validation, but runs in the browser for instant feedback before any API call."),
sp(),
code([
  ["// frontend/src/utils/bulkValidation.js","98C379"],
  ["const EMAIL_RE = /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/;","DDDDDD"],
  ["const PHONE_RE = /^[6-9]\\d{9}$/;","DDDDDD"],
  ["","DDDDDD"],
  ["// ── Students ─────────────────────────────────────────────────────────────","98C379"],
  ["function validateStudentRow(row, seenEmails, seenRolls) {","DDDDDD"],
  ["  const e = [];","DDDDDD"],
  ["  if (!row.name?.trim())                              e.push('name required');","DDDDDD"],
  ["  if (!EMAIL_RE.test(row.email||''))                  e.push('invalid email');","DDDDDD"],
  ["  else if (seenEmails.has(row.email.toLowerCase()))   e.push('duplicate email in file');","DDDDDD"],
  ["  else seenEmails.add(row.email.toLowerCase());","DDDDDD"],
  ["  if (row.phone && !PHONE_RE.test(row.phone))         e.push('phone must be 10 digits');","DDDDDD"],
  ["  if (!row.roll_number?.trim())                       e.push('roll_number required');","DDDDDD"],
  ["  else if (seenRolls.has(row.roll_number.trim()))     e.push('duplicate roll_number in file');","DDDDDD"],
  ["  else seenRolls.add(row.roll_number.trim());","DDDDDD"],
  ["  if (!row.class_name?.trim())                        e.push('class_name required');","DDDDDD"],
  ["  const g = row.gender?.toLowerCase();","DDDDDD"],
  ["  if (!['male','female','other'].includes(g))         e.push('gender: male/female/other only');","DDDDDD"],
  ["  if (!row.date_of_birth)                             e.push('date_of_birth required DD/MM/YYYY');","DDDDDD"],
  ["  if (row.password && row.password.length < 8)        e.push('password min 8 chars');","DDDDDD"],
  ["  return e;","DDDDDD"],
  ["}","DDDDDD"],
  ["","DDDDDD"],
  ["// ── Parents ──────────────────────────────────────────────────────────────","98C379"],
  ["function validateParentRow(row, seenEmails) {","DDDDDD"],
  ["  const e = [];","DDDDDD"],
  ["  if (!row.name?.trim())                              e.push('name required');","DDDDDD"],
  ["  if (!EMAIL_RE.test(row.email||''))                  e.push('invalid email');","DDDDDD"],
  ["  else if (seenEmails.has(row.email.toLowerCase()))   e.push('duplicate email in file');","DDDDDD"],
  ["  else seenEmails.add(row.email.toLowerCase());","DDDDDD"],
  ["  if (!row.phone?.trim())                             e.push('phone required');","DDDDDD"],
  ["  if (!row.student_roll_number?.trim())               e.push('student_roll_number required');","DDDDDD"],
  ["  const r = row.relationship?.toLowerCase();","DDDDDD"],
  ["  if (!['father','mother','guardian'].includes(r))    e.push('relationship: father/mother/guardian');","DDDDDD"],
  ["  return e;","DDDDDD"],
  ["}","DDDDDD"],
  ["","DDDDDD"],
  ["// ── Faculty ──────────────────────────────────────────────────────────────","98C379"],
  ["function validateFacultyRow(row, seenEmails) {","DDDDDD"],
  ["  const e = [];","DDDDDD"],
  ["  if (!row.name?.trim())                    e.push('name required');","DDDDDD"],
  ["  if (!EMAIL_RE.test(row.email||''))        e.push('invalid email');","DDDDDD"],
  ["  else if (seenEmails.has(row.email.toLowerCase())) e.push('duplicate email in file');","DDDDDD"],
  ["  else seenEmails.add(row.email.toLowerCase());","DDDDDD"],
  ["  if (!row.phone?.trim())                   e.push('phone required');","DDDDDD"],
  ["  if (row.salary && isNaN(Number(row.salary))) e.push('salary must be a number');","DDDDDD"],
  ["  return e;","DDDDDD"],
  ["}","DDDDDD"],
  ["","DDDDDD"],
  ["// ── Master validator ─────────────────────────────────────────────────────","98C379"],
  ["export function validateRows(rawRows, type) {","DDDDDD"],
  ["  const seenEmails = new Set();","DDDDDD"],
  ["  const seenRolls  = new Set();","DDDDDD"],
  ["  const validRows  = [];","DDDDDD"],
  ["  const errorRows  = [];","DDDDDD"],
  ["","DDDDDD"],
  ["  rawRows.forEach((row, i) => {","DDDDDD"],
  ["    let errs = [];","DDDDDD"],
  ["    if      (type === 'students') errs = validateStudentRow(row, seenEmails, seenRolls);","DDDDDD"],
  ["    else if (type === 'parents')  errs = validateParentRow(row, seenEmails);","DDDDDD"],
  ["    else if (type === 'faculty')  errs = validateFacultyRow(row, seenEmails);","DDDDDD"],
  ["    if (errs.length) errorRows.push({ rowNum: i + 2, data: row, errors: errs });","DDDDDD"],
  ["    else             validRows.push(row);","DDDDDD"],
  ["  });","DDDDDD"],
  ["  return { validRows, errorRows };","DDDDDD"],
  ["}","DDDDDD"],
]),
new Paragraph({ children:[new PageBreak()] }),

// ── PHASE 8: COMPONENTS ───────────────────────────────────────────────────────
h1("Phase 8 — Frontend: BulkImportButton Component"),
para("Create: frontend/src/components/BulkImportButton.jsx — A single reusable button that handles file selection, parsing, and opens the modal. Used on all three Manage pages."),
sp(),
code([
  ["// frontend/src/components/BulkImportButton.jsx","98C379"],
  ["import * as XLSX from 'xlsx';","AADDFF"],
  ["import { useRef, useState } from 'react';","AADDFF"],
  ["import BulkImportModal from './BulkImportModal';","AADDFF"],
  ["import { validateRows } from '../utils/bulkValidation';","AADDFF"],
  ["","DDDDDD"],
  ["// type: 'students' | 'parents' | 'faculty'","98C379"],
  ["// onSuccess: called with { inserted, failed } after successful import","98C379"],
  ["export default function BulkImportButton({ type, onSuccess }) {","DDDDDD"],
  ["  const fileRef = useRef();","DDDDDD"],
  ["  const [modalData, setModalData] = useState(null);","DDDDDD"],
  ["","DDDDDD"],
  ["  const REQUIRED_HEADERS = {","DDDDDD"],
  ["    students: ['name','email','phone','roll_number','class_name','gender','date_of_birth'],","DDDDDD"],
  ["    parents:  ['name','email','phone','student_roll_number','relationship'],","DDDDDD"],
  ["    faculty:  ['name','email','phone'],","DDDDDD"],
  ["  };","DDDDDD"],
  ["","DDDDDD"],
  ["  const handleFile = (e) => {","DDDDDD"],
  ["    const file = e.target.files[0];","DDDDDD"],
  ["    e.target.value = '';  // reset so same file can be re-selected","DDDDDD"],
  ["    if (!file) return;","DDDDDD"],
  ["","DDDDDD"],
  ["    // File type check","98C379"],
  ["    if (!file.name.match(/\\.(xlsx|csv)$/i)) {","DDDDDD"],
  ["      alert('Only .xlsx or .csv files are allowed.'); return;","DDDDDD"],
  ["    }","DDDDDD"],
  ["    // File size check (5 MB)","98C379"],
  ["    if (file.size > 5 * 1024 * 1024) {","DDDDDD"],
  ["      alert('File size must be under 5 MB.'); return;","DDDDDD"],
  ["    }","DDDDDD"],
  ["","DDDDDD"],
  ["    const reader = new FileReader();","DDDDDD"],
  ["    reader.onload = (evt) => {","DDDDDD"],
  ["      const wb = XLSX.read(evt.target.result, { type:'binary', cellDates:true });","DDDDDD"],
  ["      const ws = wb.Sheets[wb.SheetNames[0]];","DDDDDD"],
  ["      const raw = XLSX.utils.sheet_to_json(ws, { raw:false, dateNF:'DD/MM/YYYY', defval:'' });","DDDDDD"],
  ["","DDDDDD"],
  ["      if (!raw.length) { alert('File has no data rows.'); return; }","DDDDDD"],
  ["      if (raw.length > 500) { alert('Maximum 500 rows per import. Split the file.'); return; }","DDDDDD"],
  ["","DDDDDD"],
  ["      // Check required headers","98C379"],
  ["      const headers = Object.keys(raw[0]).map(k => k.toLowerCase().trim());","DDDDDD"],
  ["      const missing = REQUIRED_HEADERS[type].filter(h => !headers.includes(h));","DDDDDD"],
  ["      if (missing.length) { alert(`Missing required columns: ${missing.join(', ')}`); return; }","DDDDDD"],
  ["","DDDDDD"],
  ["      // Normalise keys to lowercase","98C379"],
  ["      const rows = raw.map(r => {","DDDDDD"],
  ["        const out = {};","DDDDDD"],
  ["        Object.entries(r).forEach(([k,v]) => out[k.toLowerCase().trim()] = v?.toString().trim());","DDDDDD"],
  ["        return out;","DDDDDD"],
  ["      });","DDDDDD"],
  ["","DDDDDD"],
  ["      const { validRows, errorRows } = validateRows(rows, type);","DDDDDD"],
  ["      setModalData({ validRows, errorRows, totalRows: rows.length });","DDDDDD"],
  ["    };","DDDDDD"],
  ["    reader.readAsBinaryString(file);","DDDDDD"],
  ["  };","DDDDDD"],
  ["","DDDDDD"],
  ["  return (","DDDDDD"],
  ["    <>","DDDDDD"],
  ["      <input ref={fileRef} type='file' accept='.xlsx,.csv' style={{ display:'none' }} onChange={handleFile} />","DDDDDD"],
  ["      <button","DDDDDD"],
  ["        onClick={() => fileRef.current.click()}","DDDDDD"],
  ["        style={{ marginLeft:8, background:'#2E75B6', color:'#fff',","DDDDDD"],
  ["                 border:'none', borderRadius:6, padding:'8px 16px', cursor:'pointer', fontWeight:600 }}","DDDDDD"],
  ["      >","DDDDDD"],
  ["        \\u2191 Bulk Import","DDDDDD"],
  ["      </button>","DDDDDD"],
  ["      {modalData && (","DDDDDD"],
  ["        <BulkImportModal","DDDDDD"],
  ["          type={type}","DDDDDD"],
  ["          {...modalData}","DDDDDD"],
  ["          onClose={() => setModalData(null)}","DDDDDD"],
  ["          onSuccess={(result) => { setModalData(null); onSuccess(result); }}","DDDDDD"],
  ["        />","DDDDDD"],
  ["      )}","DDDDDD"],
  ["    </>","DDDDDD"],
  ["  );","DDDDDD"],
  ["}","DDDDDD"],
]),
new Paragraph({ children:[new PageBreak()] }),

// ── PHASE 9: MODAL ────────────────────────────────────────────────────────────
h1("Phase 9 — Frontend: BulkImportModal Component"),
para("Create: frontend/src/components/BulkImportModal.jsx — This is the main UX. It shows valid and error rows in tabs, lets the admin deselect rows, and submits to the API."),
sp(),
code([
  ["// frontend/src/components/BulkImportModal.jsx","98C379"],
  ["import { useState } from 'react';","AADDFF"],
  ["import axios from 'axios';  // or your existing api instance","AADDFF"],
  ["","DDDDDD"],
  ["const API_MAP = {","DDDDDD"],
  ["  students: '/api/students/bulk-import',","DDDDDD"],
  ["  parents:  '/api/parents/bulk-import',","DDDDDD"],
  ["  faculty:  '/api/faculty/bulk-import',","DDDDDD"],
  ["};","DDDDDD"],
  ["","DDDDDD"],
  ["export default function BulkImportModal({ type, validRows, errorRows, totalRows, onClose, onSuccess }) {","DDDDDD"],
  ["  const [activeTab, setActiveTab] = useState('valid');","DDDDDD"],
  ["  const [selected, setSelected]   = useState(() => new Set(validRows.map((_,i) => i)));","DDDDDD"],
  ["  const [loading, setLoading]     = useState(false);","DDDDDD"],
  ["  const [result, setResult]       = useState(null);","DDDDDD"],
  ["","DDDDDD"],
  ["  const toggleRow = (i) => {","DDDDDD"],
  ["    const next = new Set(selected);","DDDDDD"],
  ["    next.has(i) ? next.delete(i) : next.add(i);","DDDDDD"],
  ["    setSelected(next);","DDDDDD"],
  ["  };","DDDDDD"],
  ["  const toggleAll = () => {","DDDDDD"],
  ["    setSelected(selected.size === validRows.length","DDDDDD"],
  ["      ? new Set() : new Set(validRows.map((_,i) => i)));","DDDDDD"],
  ["  };","DDDDDD"],
  ["","DDDDDD"],
  ["  const handleSubmit = async () => {","DDDDDD"],
  ["    const rowsToSend = validRows.filter((_,i) => selected.has(i));","DDDDDD"],
  ["    if (!rowsToSend.length) { alert('No rows selected.'); return; }","DDDDDD"],
  ["    setLoading(true);","DDDDDD"],
  ["    try {","DDDDDD"],
  ["      const { data } = await axios.post(API_MAP[type], { rows: rowsToSend });","DDDDDD"],
  ["      setResult(data);","DDDDDD"],
  ["      if (data.success && data.inserted > 0) onSuccess(data);","DDDDDD"],
  ["    } catch (err) {","DDDDDD"],
  ["      alert(err.response?.data?.message || 'Import failed. Try again.');","DDDDDD"],
  ["    } finally { setLoading(false); }","DDDDDD"],
  ["  };","DDDDDD"],
  ["","DDDDDD"],
  ["  const labelMap = { students:'Students', parents:'Parents', faculty:'Faculty' };","DDDDDD"],
  ["  const colKeys = {","DDDDDD"],
  ["    students: ['name','email','phone','roll_number','class_name','gender'],","DDDDDD"],
  ["    parents:  ['name','email','phone','student_roll_number','relationship'],","DDDDDD"],
  ["    faculty:  ['name','email','phone','designation','salary'],","DDDDDD"],
  ["  };","DDDDDD"],
  ["","DDDDDD"],
  ["  // ── Styles (inline — matches your existing dark/light theme toggle) ───","98C379"],
  ["  const overlay = { position:'fixed', inset:0, background:'rgba(0,0,0,0.6)', zIndex:9999,","DDDDDD"],
  ["    display:'flex', alignItems:'center', justifyContent:'center' };","DDDDDD"],
  ["  const modal  = { background:'#fff', borderRadius:12, width:'90%', maxWidth:900,","DDDDDD"],
  ["    maxHeight:'90vh', display:'flex', flexDirection:'column', overflow:'hidden',","DDDDDD"],
  ["    boxShadow:'0 20px 60px rgba(0,0,0,0.3)' };","DDDDDD"],
  ["","DDDDDD"],
  ["  if (result) return (","DDDDDD"],
  ["    <div style={overlay}>","DDDDDD"],
  ["      <div style={{ ...modal, padding:32, textAlign:'center' }}>","DDDDDD"],
  ["        <div style={{ fontSize:48 }}>{result.failed === result.inserted ? '\\u274C' : '\\u2705'}</div>","DDDDDD"],
  ["        <h2>Import Complete</h2>","DDDDDD"],
  ["        <p>\\u2705 {result.inserted} {labelMap[type]} imported successfully.</p>","DDDDDD"],
  ["        {result.failed > 0 && <p style={{color:'#e53e3e'}}>\\u274C {result.failed} rows failed on server.</p>}","DDDDDD"],
  ["        <button onClick={onClose} style={{ marginTop:16, padding:'10px 24px',","DDDDDD"],
  ["          background:'#1E3A5F', color:'#fff', border:'none', borderRadius:6, cursor:'pointer' }}>","DDDDDD"],
  ["          Close","DDDDDD"],
  ["        </button>","DDDDDD"],
  ["      </div>","DDDDDD"],
  ["    </div>","DDDDDD"],
  ["  );","DDDDDD"],
  ["","DDDDDD"],
  ["  return (","DDDDDD"],
  ["    <div style={overlay}>","DDDDDD"],
  ["      <div style={modal}>","DDDDDD"],
  ["        {/* Header */}","98C379"],
  ["        <div style={{ padding:'20px 24px', borderBottom:'1px solid #e2e8f0',","DDDDDD"],
  ["          display:'flex', justifyContent:'space-between', alignItems:'center' }}>","DDDDDD"],
  ["          <div>","DDDDDD"],
  ["            <h3 style={{ margin:0, color:'#1E3A5F' }}>Bulk Import — {labelMap[type]}</h3>","DDDDDD"],
  ["            <p style={{ margin:'4px 0 0', fontSize:13, color:'#666' }}>","DDDDDD"],
  ["              Total rows in file: <b>{totalRows}</b>","DDDDDD"],
  ["            </p>","DDDDDD"],
  ["          </div>","DDDDDD"],
  ["          <button onClick={onClose} style={{ background:'none', border:'none', fontSize:20, cursor:'pointer' }}>\\u00D7</button>","DDDDDD"],
  ["        </div>","DDDDDD"],
  ["        {/* Summary bar */}","98C379"],
  ["        <div style={{ padding:'12px 24px', background:'#f7fafc', display:'flex', gap:16, borderBottom:'1px solid #e2e8f0' }}>","DDDDDD"],
  ["          <span style={{ background:'#c6f6d5', color:'#276749', padding:'4px 12px', borderRadius:20, fontWeight:600 }}>","DDDDDD"],
  ["            \\u2705 {validRows.length} ready","DDDDDD"],
  ["          </span>","DDDDDD"],
  ["          {errorRows.length > 0 && (","DDDDDD"],
  ["            <span style={{ background:'#fed7d7', color:'#c53030', padding:'4px 12px', borderRadius:20, fontWeight:600 }}>","DDDDDD"],
  ["              \\u274C {errorRows.length} errors","DDDDDD"],
  ["            </span>","DDDDDD"],
  ["          )}","DDDDDD"],
  ["        </div>","DDDDDD"],
  ["        {/* Tabs */}","98C379"],
  ["        <div style={{ display:'flex', borderBottom:'1px solid #e2e8f0' }}>","DDDDDD"],
  ["          {['valid','errors'].map(tab => (","DDDDDD"],
  ["            <button key={tab} onClick={() => setActiveTab(tab)}","DDDDDD"],
  ["              style={{ padding:'12px 24px', border:'none', background:'none', cursor:'pointer',","DDDDDD"],
  ["                fontWeight: activeTab===tab ? 700 : 400,","DDDDDD"],
  ["                borderBottom: activeTab===tab ? '2px solid #2E75B6' : '2px solid transparent',","DDDDDD"],
  ["                color: activeTab===tab ? '#2E75B6' : '#666' }}>","DDDDDD"],
  ["              {tab === 'valid' ? `\\u2705 Valid Rows (${validRows.length})` : `\\u274C Errors (${errorRows.length})`}","DDDDDD"],
  ["            </button>","DDDDDD"],
  ["          ))}","DDDDDD"],
  ["        </div>","DDDDDD"],
  ["        {/* Table body */}","98C379"],
  ["        <div style={{ flex:1, overflow:'auto', padding:'0 24px' }}>","DDDDDD"],
  ["          {activeTab === 'valid' && (","DDDDDD"],
  ["            <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>","DDDDDD"],
  ["              <thead><tr style={{ background:'#f7fafc' }}>","DDDDDD"],
  ["                <th style={{ padding:'10px 8px', textAlign:'left' }}>","DDDDDD"],
  ["                  <input type='checkbox'","DDDDDD"],
  ["                    checked={selected.size === validRows.length && validRows.length > 0}","DDDDDD"],
  ["                    onChange={toggleAll} />","DDDDDD"],
  ["                </th>","DDDDDD"],
  ["                {colKeys[type].map(k => <th key={k} style={{ padding:'10px 8px', textAlign:'left', textTransform:'capitalize' }}>{k.replace(/_/g,' ')}</th>)}","DDDDDD"],
  ["              </tr></thead>","DDDDDD"],
  ["              <tbody>","DDDDDD"],
  ["                {validRows.map((row, i) => (","DDDDDD"],
  ["                  <tr key={i} style={{ background: selected.has(i)?'#ebf8ff':'#fff',","DDDDDD"],
  ["                    borderBottom:'1px solid #e2e8f0' }}>","DDDDDD"],
  ["                    <td style={{ padding:'8px' }}>","DDDDDD"],
  ["                      <input type='checkbox' checked={selected.has(i)} onChange={() => toggleRow(i)} />","DDDDDD"],
  ["                    </td>","DDDDDD"],
  ["                    {colKeys[type].map(k => <td key={k} style={{ padding:'8px' }}>{row[k]||'-'}</td>)}","DDDDDD"],
  ["                  </tr>","DDDDDD"],
  ["                ))}","DDDDDD"],
  ["              </tbody>","DDDDDD"],
  ["            </table>","DDDDDD"],
  ["          )}","DDDDDD"],
  ["          {activeTab === 'errors' && (","DDDDDD"],
  ["            <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>","DDDDDD"],
  ["              <thead><tr style={{ background:'#fff5f5' }}>","DDDDDD"],
  ["                <th style={{ padding:'10px 8px', textAlign:'left' }}>Row #</th>","DDDDDD"],
  ["                <th style={{ padding:'10px 8px', textAlign:'left' }}>Name</th>","DDDDDD"],
  ["                <th style={{ padding:'10px 8px', textAlign:'left' }}>Errors</th>","DDDDDD"],
  ["              </tr></thead>","DDDDDD"],
  ["              <tbody>","DDDDDD"],
  ["                {errorRows.map((err, i) => (","DDDDDD"],
  ["                  <tr key={i} style={{ background:'#fff5f5', borderBottom:'1px solid #fed7d7' }}>","DDDDDD"],
  ["                    <td style={{ padding:'8px', fontWeight:600 }}>Row {err.rowNum}</td>","DDDDDD"],
  ["                    <td style={{ padding:'8px' }}>{err.data?.name||'-'}</td>","DDDDDD"],
  ["                    <td style={{ padding:'8px', color:'#c53030' }}>{err.errors.join(' | ')}</td>","DDDDDD"],
  ["                  </tr>","DDDDDD"],
  ["                ))}","DDDDDD"],
  ["              </tbody>","DDDDDD"],
  ["            </table>","DDDDDD"],
  ["          )}","DDDDDD"],
  ["        </div>","DDDDDD"],
  ["        {/* Footer */}","98C379"],
  ["        <div style={{ padding:'16px 24px', borderTop:'1px solid #e2e8f0',","DDDDDD"],
  ["          display:'flex', justifyContent:'space-between', alignItems:'center' }}>","DDDDDD"],
  ["          <span style={{ color:'#666', fontSize:13 }}>","DDDDDD"],
  ["            {selected.size} of {validRows.length} rows selected","DDDDDD"],
  ["          </span>","DDDDDD"],
  ["          <div style={{ display:'flex', gap:8 }}>","DDDDDD"],
  ["            <button onClick={onClose} style={{ padding:'10px 20px', background:'#e2e8f0',","DDDDDD"],
  ["              border:'none', borderRadius:6, cursor:'pointer' }}>Cancel</button>","DDDDDD"],
  ["            <button onClick={handleSubmit} disabled={loading || selected.size===0}","DDDDDD"],
  ["              style={{ padding:'10px 20px', background: selected.size===0?'#a0aec0':'#1E3A5F',","DDDDDD"],
  ["                color:'#fff', border:'none', borderRadius:6, cursor: selected.size===0?'not-allowed':'pointer',","DDDDDD"],
  ["                fontWeight:600 }}>","DDDDDD"],
  ["              {loading ? 'Importing...' : `Import ${selected.size} Records`}","DDDDDD"],
  ["            </button>","DDDDDD"],
  ["          </div>","DDDDDD"],
  ["        </div>","DDDDDD"],
  ["      </div>","DDDDDD"],
  ["    </div>","DDDDDD"],
  ["  );","DDDDDD"],
  ["}","DDDDDD"],
]),
new Paragraph({ children:[new PageBreak()] }),

// ── PHASE 10: MANAGE PAGES ────────────────────────────────────────────────────
h1("Phase 10 — Frontend: Add Button to the Three Manage Pages"),
para("This is the smallest change in the whole guide — 3 lines added to 3 files. The BulkImportButton drops right next to your existing Add button."),
sp(),
h2("ManageStudents.jsx — Add 3 things"),
sp(),
code([
  ["// 1. Add import at the top of ManageStudents.jsx","98C379"],
  ["import BulkImportButton from '../../components/BulkImportButton';","AAFFAA"],
  ["","DDDDDD"],
  ["// 2. Add this handler inside the component (next to other handlers)","98C379"],
  ["const handleBulkSuccess = (result) => {","AAFFAA"],
  ["  // Re-fetch the student list to show newly imported students","AAFFAA"],
  ["  fetchStudents();  // call your existing fetch function","AAFFAA"],
  ["  alert(`\\u2705 ${result.inserted} students imported successfully!`);","AAFFAA"],
  ["};","AAFFAA"],
  ["","DDDDDD"],
  ["// 3. Find your existing + Add Student button in the JSX and add next to it","98C379"],
  ["// BEFORE (your existing code):","888888"],
  ["// <button onClick={openAddModal}>+ Add Student</button>","888888"],
  ["","DDDDDD"],
  ["// AFTER (add one line):","98C379"],
  ["<button onClick={openAddModal}>+ Add Student</button>","DDDDDD"],
  ["<BulkImportButton type='students' onSuccess={handleBulkSuccess} />","AAFFAA"],
]),
sp(),
h2("ManageParents.jsx — Same pattern"),
sp(),
code([
  ["import BulkImportButton from '../../components/BulkImportButton';","AAFFAA"],
  ["","DDDDDD"],
  ["const handleBulkSuccess = (result) => {","AAFFAA"],
  ["  fetchParents();","AAFFAA"],
  ["  alert(`\\u2705 ${result.inserted} parents imported and linked successfully!`);","AAFFAA"],
  ["};","AAFFAA"],
  ["","DDDDDD"],
  ["<button onClick={openAddModal}>+ Add Parent</button>","DDDDDD"],
  ["<BulkImportButton type='parents' onSuccess={handleBulkSuccess} />","AAFFAA"],
]),
sp(),
h2("ManageFaculty.jsx — Same pattern"),
sp(),
code([
  ["import BulkImportButton from '../../components/BulkImportButton';","AAFFAA"],
  ["","DDDDDD"],
  ["const handleBulkSuccess = (result) => {","AAFFAA"],
  ["  fetchFaculty();","AAFFAA"],
  ["  alert(`\\u2705 ${result.inserted} faculty imported successfully!`);","AAFFAA"],
  ["};","AAFFAA"],
  ["","DDDDDD"],
  ["<button onClick={openAddModal}>+ Add Faculty</button>","DDDDDD"],
  ["<BulkImportButton type='faculty' onSuccess={handleBulkSuccess} />","AAFFAA"],
]),
new Paragraph({ children:[new PageBreak()] }),

// ── PHASE 11: TESTING ─────────────────────────────────────────────────────────
h1("Phase 11 — Testing Checklist"),
para("Run these tests in order before committing. Each tests a different layer."),
sp(),
new Table({ width:{ size:9360, type:WidthType.DXA }, columnWidths:[400, 600, 3960, 4400],
  rows:[
    new TableRow({ children:[hCell("#",400), hCell("Layer",600), hCell("Test",3960), hCell("Expected Result",4400)] }),
    new TableRow({ children:[cell("1",400,"F5F5F5"), cell("DB",600), cell("SELECT COUNT(*) FROM bulk_import_logs;",3960), cell("Returns 0 with no error",4400)] }),
    new TableRow({ children:[cell("2",400,"F5F5F5"), cell("Backend",600), cell("POST /api/students/bulk-import with no auth token",3960), cell("401 Unauthorized",4400)] }),
    new TableRow({ children:[cell("3",400,"F5F5F5"), cell("Backend",600), cell("POST /api/students/bulk-import with empty rows: []",3960), cell("200 with inserted:0, failed:0",4400)] }),
    new TableRow({ children:[cell("4",400,"F5F5F5"), cell("Backend",600), cell("POST with 1 valid student row",3960), cell("inserted:1, user and student rows created in DB",4400)] }),
    new TableRow({ children:[cell("5",400,"F5F5F5"), cell("Backend",600), cell("POST the same student again (duplicate email)",3960), cell("inserted:0, failed:1, error mentions 'email already exists'",4400)] }),
    new TableRow({ children:[cell("6",400,"F5F5F5"), cell("Backend",600), cell("POST parent row with non-existent student_roll_number",3960), cell("inserted:0, failed:1, error mentions 'no student found'",4400)] }),
    new TableRow({ children:[cell("7",400,"F5F5F5"), cell("Backend",600), cell("POST 1 valid student from a different institute_id (attempt injection)",3960), cell("Blocked — institute_id comes from JWT, not request body",4400)] }),
    new TableRow({ children:[cell("8",400,"F5F5F5"), cell("Frontend",600), cell("Upload .docx file",3960), cell("Alert: 'Only .xlsx or .csv files are allowed'",4400)] }),
    new TableRow({ children:[cell("9",400,"F5F5F5"), cell("Frontend",600), cell("Upload valid .xlsx with 3 good rows and 1 row with blank name",3960), cell("Modal shows: Valid Rows tab (3), Errors tab (1) with 'name required'",4400)] }),
    new TableRow({ children:[cell("10",400,"F5F5F5"), cell("Frontend",600), cell("Deselect 1 row in modal, click Import",3960), cell("Only 2 rows sent to backend. inserted:2 in result screen.",4400)] }),
    new TableRow({ children:[cell("11",400,"F5F5F5"), cell("E2E",600), cell("Import 5 students, then check Manage Students page",3960), cell("5 new students appear in the list immediately after onSuccess callback",4400)] }),
    new TableRow({ children:[cell("12",400,"F5F5F5"), cell("E2E",600), cell("Import parents with student_roll_numbers, check student_parents table",3960), cell("Rows exist in student_parents with correct relationship values",4400)] }),
  ]
}),
sp(),
new Paragraph({ children:[new PageBreak()] }),

// ── FINAL SUMMARY ─────────────────────────────────────────────────────────────
h1("Summary — Everything You Changed"),
sp(),
new Table({ width:{ size:9360, type:WidthType.DXA }, columnWidths:[600, 3000, 2400, 3360],
  rows:[
    new TableRow({ children:[hCell("Phase",600), hCell("Action",3000), hCell("File(s)",2400), hCell("Notes",3360)] }),
    new TableRow({ children:[cell("1",600,"F5F5F5"), cell("Run SQL in Neon",3000), cell("Neon SQL Editor",2400), cell("1 new table: bulk_import_logs",3360)] }),
    new TableRow({ children:[cell("2",600,"F5F5F5"), cell("Create model + register",3000), cell("BulkImportLog.js + index.js",2400), cell("1 new file, 1 line added to index.js",3360)] }),
    new TableRow({ children:[cell("3",600,"F5F5F5"), cell("Create shared backend validator",3000), cell("utils/bulkValidation.js",2400), cell("1 new file",3360)] }),
    new TableRow({ children:[cell("4",600,"F5F5F5"), cell("Create 3 controllers",3000), cell("bulkImport/ folder (3 files)",2400), cell("3 new files",3360)] }),
    new TableRow({ children:[cell("5",600,"F5F5F5"), cell("Add routes",3000), cell("3 existing routes + 1 new route file",2400), cell("1 line added to each existing route",3360)] }),
    new TableRow({ children:[cell("6",600,"F5F5F5"), cell("Install SheetJS",3000), cell("frontend/package.json",2400), cell("npm install xlsx",3360)] }),
    new TableRow({ children:[cell("7",600,"F5F5F5"), cell("Create frontend validator",3000), cell("utils/bulkValidation.js",2400), cell("1 new file (frontend)",3360)] }),
    new TableRow({ children:[cell("8",600,"F5F5F5"), cell("Create BulkImportButton",3000), cell("components/BulkImportButton.jsx",2400), cell("1 new file",3360)] }),
    new TableRow({ children:[cell("9",600,"F5F5F5"), cell("Create BulkImportModal",3000), cell("components/BulkImportModal.jsx",2400), cell("1 new file",3360)] }),
    new TableRow({ children:[cell("10",600,"F5F5F5"), cell("Wire up to 3 Manage pages",3000), cell("ManageStudents.jsx, ManageParents.jsx, ManageFaculty.jsx",2400), cell("3 lines added to each file",3360)] }),
  ]
}),
sp(),
box("Total footprint","9 new files created. 7 existing files modified by 1-5 lines each. 1 SQL statement in Neon. Your entire project structure, all existing routes, all existing controllers, all existing frontend pages — completely untouched.","E8F5E9","2E7D32"),
sp(),
new Paragraph({ alignment:AlignmentType.CENTER, spacing:{ before:480, after:0 },
  children:[new TextRun({ text:"Student SaaS \u2014 Bulk Import Implementation Guide (Approach A)", size:18, color:"AAAAAA", font:"Arial" })] }),

    ]}]
});

Packer.toBuffer(doc).then(buf => {
  fs.writeFileSync('/mnt/user-data/outputs/bulk_import_implementation.docx', buf);
  console.log('Done');
});
ENDOFFILE
echo "Script written"
Output

Script written


