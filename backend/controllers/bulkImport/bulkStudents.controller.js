// backend/controllers/bulkImport/bulkStudents.controller.js
// Handles POST /api/students/bulk-import
// Flow: plan limit check → load classes → batch email/roll uniqueness check
//       → row-by-row validation → DB transaction insert → log → respond

const bcrypt = require('bcrypt');
const {
  User, Student, Class, Institute, BulkImportLog, sequelize
} = require('../../models');
const { validateStudentRow, parseExcelDate } = require('../../utils/bulkValidation');

exports.bulkImportStudents = async (req, res) => {
  try {
    const { rows } = req.body;
    const institute_id = req.user.institute_id;

    // Guard: rows must be an array
    if (!Array.isArray(rows) || rows.length === 0) {
      return res.json({ success: true, inserted: 0, failed: 0, errors: [] });
    }

    // ── 1. Guard: max rows per batch ─────────────────────────────────────────
    if (rows.length > 500) {
      return res.status(400).json({
        success: false,
        message: 'Maximum 500 rows per import. Please split your file.',
      });
    }

    const errors = [];
    const validRows = [];

    // ── 2. Plan limit check ──────────────────────────────────────────────────
    const inst = await Institute.findByPk(institute_id, {
      attributes: ['current_limit_students'],
    });
    if (inst && inst.current_limit_students != null) {
      const existingCount = await Student.count({ where: { institute_id } });
      const slotsLeft = inst.current_limit_students - existingCount;
      if (rows.length > slotsLeft) {
        return res.status(400).json({
          success: false,
          message: `Plan limit: only ${slotsLeft} student slot(s) remaining. Your file has ${rows.length} rows. Please upgrade or split the import.`,
        });
      }
    }

    // ── 3. Load all classes once for O(1) lookup ─────────────────────────────
    const classes = await Class.findAll({
      where: { institute_id },
      attributes: ['id', 'name'],
    });
    const classMap = {};
    classes.forEach(c => {
      classMap[c.name.toLowerCase().trim()] = c.id;
    });

    // ── 4. Batch email existence check ───────────────────────────────────────
    const incomingEmails = rows
      .map(r => r.email?.toLowerCase().trim())
      .filter(Boolean);
    const existingUsers = await User.findAll({
      where: { email: incomingEmails },
      attributes: ['email'],
    });
    const takenEmails = new Set(existingUsers.map(u => u.email));
    const seenInBatch = new Set();

    // ── 5. Batch roll_number uniqueness check ────────────────────────────────
    const incomingRolls = rows
      .map(r => r.roll_number?.trim())
      .filter(Boolean);
    const existingRolls = await Student.findAll({
      where: { institute_id, roll_number: incomingRolls },
      attributes: ['roll_number'],
    });
    const takenRolls = new Set(existingRolls.map(s => s.roll_number));
    const seenRollsInBatch = new Set();

    // ── 6. Validate each row ─────────────────────────────────────────────────
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rowNum = i + 2; // row 1 = header in Excel
      const rowErrors = validateStudentRow(row);

      const email = row.email?.toLowerCase().trim();
      if (email) {
        if (takenEmails.has(email))   rowErrors.push('email already exists in system');
        if (seenInBatch.has(email))   rowErrors.push('duplicate email within file');
        else                          seenInBatch.add(email);
      }

      const roll = row.roll_number?.trim();
      if (roll) {
        if (takenRolls.has(roll))          rowErrors.push('roll number already exists in institute');
        if (seenRollsInBatch.has(roll))    rowErrors.push('duplicate roll number within file');
        else                               seenRollsInBatch.add(roll);
      }

      const class_id = classMap[row.class_name?.toLowerCase().trim()];
      if (!class_id) rowErrors.push(`class '${row.class_name}' not found in institute`);

      if (rowErrors.length) {
        errors.push({ row: rowNum, name: row.name || '', errors: rowErrors });
      } else {
        validRows.push({ ...row, email, class_id });
      }
    }

    // ── 7. Insert all valid rows in a single DB transaction ──────────────────
        const t = await sequelize.transaction();
    const emailsToDispatch = [];
    const { generateTempPassword } = require('../../utils/passwordGenerator');
    const { sendStudentWelcomeEmail } = require('../../services/email.service');
    let instituteName = "Your Institute";
    try {
      const institute = await Institute.findByPk(institute_id);
      if (institute) instituteName = institute.name;
    } catch(e) {}

    try {
      for (const r of validRows) {
        const pw = generateTempPassword();
        const temp_password_expires_at = new Date();
        temp_password_expires_at.setDate(temp_password_expires_at.getDate() + 7);

        const user = await User.create({
          institute_id,
          role: 'student',
          name: r.name.trim(),
          email: r.email,
          phone: r.phone?.trim() || null,
          password_hash: await bcrypt.hash(pw, 10),
          status: 'active',
          is_first_login: true,
          temp_password_expires_at,
          credentials_sent_at: r.email ? new Date() : null,
          initial_password: pw
        }, { transaction: t });

        await Student.create({
          institute_id,
          user_id: user.id,
          roll_number: r.roll_number.trim(),
          class_id: r.class_id,
          gender: r.gender?.toLowerCase(),
          date_of_birth: parseExcelDate(r.date_of_birth),
          admission_date: parseExcelDate(r.admission_date) || new Date(),
          address: r.address?.trim() || null,
        }, { transaction: t });

        if (r.email) {
          emailsToDispatch.push({
            to: r.email,
            studentName: r.name.trim(),
            instituteName,
            email: r.email,
            tempPassword: pw
          });
        }
      }
      await t.commit();
    } catch (err) {
      await t.rollback();
      throw err;
    }

    // Dispatch emails asynchronously in the background so we don't block the response
    if (emailsToDispatch.length > 0) {
      setTimeout(async () => {
        for (const emailData of emailsToDispatch) {
          try {
            await sendStudentWelcomeEmail(emailData);
          } catch(e) { console.error("Bulk Email Error:", e.message); }
        }
      }, 100);
    }

    // ── 8. Log the import ────────────────────────────────────────────────────
    await BulkImportLog.create({
      institute_id,
      import_type: 'students',
      imported_by: req.user.id,
      total_rows: rows.length,
      success_rows: validRows.length,
      failed_rows: errors.length,
      error_report: errors,
      status: errors.length === rows.length ? 'failed' : errors.length ? 'partial' : 'completed',
    });

    return res.json({
      success: true,
      inserted: validRows.length,
      failed: errors.length,
      errors,
    });

  } catch (err) {
    console.error('❌ Bulk student import error:', err);
    return res.status(500).json({
      success: false,
      message: 'Server error during bulk student import. Please try again.',
    });
  }
};
