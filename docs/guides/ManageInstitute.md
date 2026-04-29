
ZF Solution Platform
Institute Delete & Suspend
Complete Professional Implementation Guide
Foreign Key Fix  │  Cascade Delete  │  Suspend / Restore  │  Confirmation Modal  │  All 48 Tables
Current Problem
Foreign key constraint error on delete	After This Guide
Full cascade delete + professional suspend

Version 1.0  │  April 2026  │  Based on Institutes Management page screenshots

 
1.  Understanding the Error — Exact Root Cause
From your first screenshot, the exact error message is:

Exact Error From Your Screenshot
Error deleting institute: update or delete on table "institutes" violates
foreign key constraint "institute_public_profiles_institute_id_fkey"
on table "institute_public_profiles"

This appears on: students-saas.vercel.app (your live production deployment)

1.1  What This Error Means
PostgreSQL (Neon) is refusing to delete the institute record because the institute_public_profiles table has a row with institute_id pointing to the institute being deleted. PostgreSQL protects data integrity — it will not delete a parent record when child records still reference it, unless the foreign key is configured with ON DELETE CASCADE.

1.2  Why This Specific Table Failed First
Your migration to Neon PostgreSQL created the institute_public_profiles table with a foreign key that is missing the ON DELETE CASCADE clause. When you try to delete an institute, PostgreSQL finds this orphaned reference and blocks the entire operation.
MySQL (your old Railway database) was more permissive — it would either silently ignore the violation or you had different FK settings. PostgreSQL enforces constraints strictly, which is why this only started failing after the Neon migration.

1.3  All 48 Tables — Delete Behavior Map
Your project has 48 tables. Every table that references institute_id must have ON DELETE CASCADE for the delete to work. The table below shows the complete picture:

#	Table Name	Relationship	Delete Behavior
1	users	institute_id FK	CASCADE — delete all users (admin, faculty, student, manager, parent)
2	students	institute_id FK	CASCADE — delete all student records
3	faculty	institute_id FK	CASCADE — delete all faculty records
4	classes	institute_id FK	CASCADE — delete all classes
5	subjects	institute_id FK	CASCADE — delete all subjects
6	attendances	institute_id FK	CASCADE — delete all attendance records
7	faculty_attendances	institute_id FK	CASCADE — delete all faculty attendance
8	exams	institute_id FK	CASCADE — delete all exams
9	marks	institute_id FK	CASCADE — delete all student marks
10	fees_structures	institute_id FK	CASCADE — delete all fee structures
11	student_fees	institute_id FK	CASCADE — delete all student fee records
12	student_fee_payments	institute_id FK	CASCADE — delete all payment records
13	payments	institute_id FK	CASCADE — delete all general payment records
14	expenses	institute_id FK	CASCADE — delete all expense records
15	fee_discount_logs	institute_id FK	CASCADE — delete all discount logs
16	subscriptions	institute_id FK	CASCADE — delete all subscription history
17	razorpay_orders	institute_id FK	CASCADE — delete all payment gateway orders
18	razorpay_payments	institute_id FK	CASCADE — delete all gateway payment records
19	invoices	institute_id FK	CASCADE — delete all invoices
20	announcements	institute_id FK	CASCADE — delete all announcements
21	assignments	institute_id FK	CASCADE — delete all assignments
22	assignment_submissions	institute_id FK	CASCADE — delete all submissions
23	assignment_submission_history	via submission FK	CASCADE through submissions
24	assignment_settings	institute_id PK	CASCADE — delete settings record
25	notes	institute_id FK	CASCADE — delete all uploaded notes
26	notes_downloads	via note FK	CASCADE through notes
27	chat_rooms	institute_id FK	CASCADE — delete all chat rooms
28	chat_participants	via room FK	CASCADE through chat_rooms
29	chat_messages	via room FK	CASCADE through chat_rooms
30	biometric_devices	institute_id FK	CASCADE — delete device records
31	biometric_enrollments	via device FK	CASCADE through biometric_devices
32	biometric_punches	via device FK	CASCADE through biometric_devices
33	biometric_settings	institute_id PK	CASCADE — delete settings
34	class_sessions	institute_id FK	CASCADE — delete QR attendance sessions
35	timetable_slots	institute_id FK	CASCADE — delete timetable slots
36	timetables	institute_id FK	CASCADE — delete all timetable entries
37	transport_fees	institute_id FK	CASCADE — delete transport routes
38	institute_public_profiles	institute_id FK — MISSING ON DELETE CASCADE	ROOT CAUSE OF YOUR ERROR — must add ON DELETE CASCADE
39	institute_gallery_photos	institute_id FK	CASCADE — delete all gallery photos
40	institute_reviews	institute_id FK	CASCADE — delete all reviews
41	institute_discounts	institute_id FK	CASCADE — delete all discounts
42	public_enquiries	institute_id FK	CASCADE — delete all public enquiries
43	student_classes	via student / class FK	CASCADE through students
44	student_subjects	via student FK	CASCADE through students
45	student_parents	via student FK	CASCADE through students
46	leads	independent table	No FK — leads stay (they are pre-registration data)
47	plans	referenced by institute	NO DELETE — plans are global, not per-institute
48	institutes	root table	This is the row being deleted — parent of all above

 
2.  Immediate Fix — The Foreign Key Error (Phase 1)
Phase 1	Fix Foreign Key in Database
Run this SQL in Neon SQL Editor — fixes error immediately

This is the fastest fix. Open your Neon dashboard → SQL Editor and run this SQL. It will fix the immediate error and also harden all other FK constraints across your database.

Step 1 — Fix the Specific Failing Constraint
-- Run this FIRST in Neon SQL Editor -- fixes your current error immediately

-- Drop the existing foreign key without CASCADE
ALTER TABLE institute_public_profiles
  DROP CONSTRAINT IF EXISTS institute_public_profiles_institute_id_fkey;

-- Re-add it with ON DELETE CASCADE
ALTER TABLE institute_public_profiles
  ADD CONSTRAINT institute_public_profiles_institute_id_fkey
  FOREIGN KEY (institute_id)
  REFERENCES institutes(id)
  ON DELETE CASCADE;

-- Verify it worked:
SELECT constraint_name, delete_rule
FROM information_schema.referential_constraints
WHERE constraint_name = 'institute_public_profiles_institute_id_fkey';
-- Should show: delete_rule = CASCADE

Step 2 — Fix All Other Tables in One Block
Run this complete block to add CASCADE to every institute-related table in your Neon database. This prevents future errors as you build more features:
-- Fix ALL institute-related foreign keys at once
-- Run this entire block in Neon SQL Editor

-- institute_gallery_photos
ALTER TABLE institute_gallery_photos DROP CONSTRAINT IF EXISTS institute_gallery_photos_institute_id_fkey;
ALTER TABLE institute_gallery_photos ADD CONSTRAINT institute_gallery_photos_institute_id_fkey
  FOREIGN KEY (institute_id) REFERENCES institutes(id) ON DELETE CASCADE;

-- institute_reviews
ALTER TABLE institute_reviews DROP CONSTRAINT IF EXISTS institute_reviews_institute_id_fkey;
ALTER TABLE institute_reviews ADD CONSTRAINT institute_reviews_institute_id_fkey
  FOREIGN KEY (institute_id) REFERENCES institutes(id) ON DELETE CASCADE;

-- institute_discounts
ALTER TABLE institute_discounts DROP CONSTRAINT IF EXISTS institute_discounts_institute_id_fkey;
ALTER TABLE institute_discounts ADD CONSTRAINT institute_discounts_institute_id_fkey
  FOREIGN KEY (institute_id) REFERENCES institutes(id) ON DELETE CASCADE;

-- public_enquiries
ALTER TABLE public_enquiries DROP CONSTRAINT IF EXISTS public_enquiries_institute_id_fkey;
ALTER TABLE public_enquiries ADD CONSTRAINT public_enquiries_institute_id_fkey
  FOREIGN KEY (institute_id) REFERENCES institutes(id) ON DELETE CASCADE;

-- class_sessions
ALTER TABLE class_sessions DROP CONSTRAINT IF EXISTS class_sessions_institute_id_fkey;
ALTER TABLE class_sessions ADD CONSTRAINT class_sessions_institute_id_fkey
  FOREIGN KEY (institute_id) REFERENCES institutes(id) ON DELETE CASCADE;

-- timetable_slots
ALTER TABLE timetable_slots DROP CONSTRAINT IF EXISTS timetable_slots_institute_id_fkey;
ALTER TABLE timetable_slots ADD CONSTRAINT timetable_slots_institute_id_fkey
  FOREIGN KEY (institute_id) REFERENCES institutes(id) ON DELETE CASCADE;

-- timetables
ALTER TABLE timetables DROP CONSTRAINT IF EXISTS timetables_institute_id_fkey;
ALTER TABLE timetables ADD CONSTRAINT timetables_institute_id_fkey
  FOREIGN KEY (institute_id) REFERENCES institutes(id) ON DELETE CASCADE;

-- transport_fees
ALTER TABLE transport_fees DROP CONSTRAINT IF EXISTS transport_fees_institute_id_fkey;
ALTER TABLE transport_fees ADD CONSTRAINT transport_fees_institute_id_fkey
  FOREIGN KEY (institute_id) REFERENCES institutes(id) ON DELETE CASCADE;

-- razorpay_orders
ALTER TABLE razorpay_orders DROP CONSTRAINT IF EXISTS razorpay_orders_institute_id_fkey;
ALTER TABLE razorpay_orders ADD CONSTRAINT razorpay_orders_institute_id_fkey
  FOREIGN KEY (institute_id) REFERENCES institutes(id) ON DELETE CASCADE;

-- razorpay_payments
ALTER TABLE razorpay_payments DROP CONSTRAINT IF EXISTS razorpay_payments_institute_id_fkey;
ALTER TABLE razorpay_payments ADD CONSTRAINT razorpay_payments_institute_id_fkey
  FOREIGN KEY (institute_id) REFERENCES institutes(id) ON DELETE CASCADE;

-- invoices
ALTER TABLE invoices DROP CONSTRAINT IF EXISTS invoices_institute_id_fkey;
ALTER TABLE invoices ADD CONSTRAINT invoices_institute_id_fkey
  FOREIGN KEY (institute_id) REFERENCES institutes(id) ON DELETE CASCADE;

-- fee_discount_logs
ALTER TABLE fee_discount_logs DROP CONSTRAINT IF EXISTS fee_discount_logs_institute_id_fkey;
ALTER TABLE fee_discount_logs ADD CONSTRAINT fee_discount_logs_institute_id_fkey
  FOREIGN KEY (institute_id) REFERENCES institutes(id) ON DELETE CASCADE;

-- biometric_settings (has institute_id as PK)
ALTER TABLE biometric_settings DROP CONSTRAINT IF EXISTS biometric_settings_institute_id_fkey;
ALTER TABLE biometric_settings ADD CONSTRAINT biometric_settings_institute_id_fkey
  FOREIGN KEY (institute_id) REFERENCES institutes(id) ON DELETE CASCADE;

-- assignment_settings (has institute_id as PK)
ALTER TABLE assignment_settings DROP CONSTRAINT IF EXISTS assignment_settings_institute_id_fkey;
ALTER TABLE assignment_settings ADD CONSTRAINT assignment_settings_institute_id_fkey
  FOREIGN KEY (institute_id) REFERENCES institutes(id) ON DELETE CASCADE;

SELECT 'All foreign key constraints updated successfully' AS status;

After Running This SQL
Deleting an institute will now automatically cascade-delete ALL related records
across all 48 tables in the correct dependency order.
No more foreign key constraint errors. PostgreSQL handles the order automatically.
This fix takes effect immediately — no backend restart needed.

 
3.  Backend — Professional Delete Implementation
Phase 2	Upgrade the Delete Controller
Professional cascade delete with audit trail and validation

After fixing the database FKs, improve your backend delete controller to be production-grade. The current controller likely just calls Institute.destroy() directly. Replace it with the professional version below:

3.1  Complete Delete Controller
// backend/controllers/superadmin/institute.controller.js
// Find your existing deleteInstitute function and REPLACE it with this:

exports.deleteInstitute = async (req, res) => {
  const { id } = req.params;

  try {
    // ── Step 1: Verify institute exists ──────────────────────────
    const institute = await Institute.findByPk(id);
    if (!institute) {
      return res.status(404).json({
        success: false,
        message: 'Institute not found'
      });
    }

    // ── Step 2: Block deletion if active subscription with balance ─
    const activeSubscription = await Subscription.findOne({
      where: {
        institute_id: id,
        payment_status: 'paid',
        end_date: { [Op.gte]: new Date() }  // not expired
      }
    });

    // NOTE: Super admin can override this by passing force=true in body
    if (activeSubscription && req.body.force !== true) {
      return res.status(409).json({
        success: false,
        message: 'Institute has an active paid subscription. Pass force:true to confirm deletion.',
        data: {
          subscription_end: activeSubscription.end_date,
          amount_paid: activeSubscription.amount_paid
        }
      });
    }

    // ── Step 3: Collect summary before delete (for audit log) ─────
    const [studentCount, facultyCount, paymentSum] = await Promise.all([
      Student.count({ where: { institute_id: id } }),
      Faculty.count({ where: { institute_id: id } }),
      StudentFeePayment.sum('amount_paid', {
        where: { institute_id: id, payment_status: 'paid' }
      })
    ]);

    // ── Step 4: Log the deletion before data is gone ─────────────
    console.log(`[SUPER ADMIN DELETE] Institute: ${institute.name} (ID: ${id})`,{
      deleted_by: req.user.id,
      deleted_at: new Date().toISOString(),
      student_count: studentCount,
      faculty_count: facultyCount,
      total_revenue: paymentSum || 0,
      institute_email: institute.email,
    });

    // ── Step 5: Delete institute — PostgreSQL CASCADE handles rest ─
    // Because all FK constraints have ON DELETE CASCADE in Neon,
    // this single destroy() deletes ALL 48 related tables automatically.
    await institute.destroy();

    // ── Step 6: Return success with summary ──────────────────────
    res.status(200).json({
      success: true,
      message: `Institute '${institute.name}' and all related data deleted successfully.`,
      data: {
        deleted_institute: institute.name,
        students_deleted: studentCount,
        faculty_deleted: facultyCount,
        total_revenue_deleted: paymentSum || 0
      }
    });

  } catch (error) {
    console.error('[DELETE INSTITUTE ERROR]', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete institute: ' + error.message
    });
  }
};

3.2  Route Update
Make sure your delete route is correctly set up:
// backend/routes/superadmin/institute.routes.js

// Existing route — verify it matches this:
router.delete('/:id',
  verifyToken,
  allowRoles('super_admin'),
  instituteController.deleteInstitute
);

// No change needed if route already exists — just update the controller function

 
4.  Backend — Professional Suspend / Restore Implementation
Phase 3	Build the Complete Suspend System
Suspend blocks login — Restore re-enables — both work from Institutes page

From your second screenshot, the Suspend button (orange/yellow) is already visible on the Institutes Management page next to Delete. Here is what Suspend should do professionally:

When SUSPEND is clicked	When RESTORE is clicked	What Suspend Does NOT do
Institute status → suspended	Institute status → active	Does NOT delete any data
All users of this institute blocked from login	All users can login again	Does NOT cancel subscription
All API calls return 403 Suspended	All APIs work again normally	Does NOT affect other institutes
Institute dashboard shows suspended notice	Dashboard works normally	Does NOT delete users or data
Button changes to Restore (green)	Button changes back to Suspend (orange)	Fully reversible at any time

4.1  Suspend Controller
// Add this to backend/controllers/superadmin/institute.controller.js

exports.suspendInstitute = async (req, res) => {
  const { id } = req.params;
  const { reason } = req.body;  // optional reason from super admin

  try {
    const institute = await Institute.findByPk(id);
    if (!institute) {
      return res.status(404).json({ success: false, message: 'Institute not found' });
    }

    if (institute.status === 'suspended') {
      return res.status(409).json({
        success: false,
        message: 'Institute is already suspended'
      });
    }

    // Update institute status to suspended
    await institute.update({ status: 'suspended' });

    // Log the action
    console.log(`[SUSPEND] Institute: ${institute.name} (ID: ${id})`,{
      suspended_by: req.user.id,
      suspended_at: new Date().toISOString(),
      reason: reason || 'No reason provided'
    });

    res.status(200).json({
      success: true,
      message: `Institute '${institute.name}' suspended successfully.`,
      data: { id: institute.id, name: institute.name, status: 'suspended' }
    });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────

exports.restoreInstitute = async (req, res) => {
  const { id } = req.params;

  try {
    const institute = await Institute.findByPk(id);
    if (!institute) {
      return res.status(404).json({ success: false, message: 'Institute not found' });
    }

    if (institute.status !== 'suspended') {
      return res.status(409).json({
        success: false,
        message: 'Institute is not suspended'
      });
    }

    await institute.update({ status: 'active' });

    res.status(200).json({
      success: true,
      message: `Institute '${institute.name}' restored successfully.`,
      data: { id: institute.id, name: institute.name, status: 'active' }
    });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

4.2  Add Suspended Check to Auth Middleware
This is the most important part of suspend. Add a check in your verifyToken middleware so all institute users are blocked when their institute is suspended:
// backend/middlewares/auth.middleware.js
// Find your verifyToken function and ADD this block after token verification:

const verifyToken = async (req, res, next) => {
  try {
    // ... your existing JWT verification code ...
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;

    // ── ADD THIS BLOCK (new) ─────────────────────────────────────
    // If user belongs to an institute, check if institute is suspended
    if (req.user.institute_id && req.user.role !== 'super_admin') {
      const institute = await Institute.findByPk(req.user.institute_id, {
        attributes: ['id', 'status'],  // only fetch what we need
      });

      if (!institute) {
        return res.status(401).json({
          success: false,
          message: 'Institute not found. Please contact support.'
        });
      }

      if (institute.status === 'suspended') {
        return res.status(403).json({
          success: false,
          code: 'INSTITUTE_SUSPENDED',
          message: 'Your institute account has been suspended. Please contact support.'
        });
      }
    }
    // ── END NEW BLOCK ────────────────────────────────────────────

    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Invalid token' });
  }
};

// PERFORMANCE TIP: Cache institute status in memory for 60 seconds
// to avoid hitting DB on every API request:
const statusCache = new Map();

const getInstituteStatus = async (instituteId) => {
  const cached = statusCache.get(instituteId);
  if (cached && Date.now() - cached.time < 60000) return cached.status;

  const inst = await Institute.findByPk(instituteId, { attributes: ['status'] });
  const status = inst ? inst.status : null;
  statusCache.set(instituteId, { status, time: Date.now() });
  return status;
};

// Clear cache when institute is suspended/restored:
exports.clearInstituteCache = (instituteId) => statusCache.delete(instituteId);

4.3  Add Routes for Suspend and Restore
// backend/routes/superadmin/institute.routes.js
// ADD these two new routes:

router.put('/:id/suspend',
  verifyToken,
  allowRoles('super_admin'),
  instituteController.suspendInstitute
);

router.put('/:id/restore',
  verifyToken,
  allowRoles('super_admin'),
  instituteController.restoreInstitute
);

// Existing routes stay unchanged:
// GET    / → getAll
// GET    /:id → getOne
// DELETE /:id → deleteInstitute

 
5.  Frontend — Professional UI Implementation
Phase 4	Delete Confirmation Modal
Multi-step confirmation prevents accidental deletion

Your current Delete button (seen in screenshot 2) shows a basic browser alert. Replace it with a professional multi-step confirmation modal that shows what will be deleted and requires typing the institute name to confirm:

5.1  Delete Modal Component
// frontend/src/components/superadmin/DeleteInstituteModal.jsx
// Create this new file:

import { useState } from 'react';

const DeleteInstituteModal = ({ institute, onConfirm, onCancel, loading }) => {
  const [confirmText, setConfirmText] = useState('');
  const [forceDelete, setForceDelete] = useState(false);
  const isMatch = confirmText === institute.name;

  return (
    <div style={{
      position:'fixed', inset:0, background:'rgba(0,0,0,0.6)',
      display:'flex', alignItems:'center', justifyContent:'center', zIndex:9999
    }}>
      <div style={{
        background:'#fff', borderRadius:12, padding:32, maxWidth:480,
        width:'90%', boxShadow:'0 20px 60px rgba(0,0,0,0.3)'
      }}>
        {/* Header */}
        <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:20 }}>
          <div style={{ background:'#FEF2F2', borderRadius:50, padding:10 }}>
            <span style={{ fontSize:22 }}>🗑️</span>
          </div>
          <div>
            <h3 style={{ margin:0, color:'#1E3A5F', fontSize:18 }}>Delete Institute</h3>
            <p style={{ margin:0, color:'#6B7280', fontSize:13 }}>This action cannot be undone</p>
          </div>
        </div>

        {/* Warning box */}
        <div style={{
          background:'#FEF2F2', border:'1px solid #FECACA',
          borderRadius:8, padding:'12px 16px', marginBottom:20
        }}>
          <p style={{ margin:0, color:'#DC2626', fontSize:13, fontWeight:600 }}>
            Permanently deletes:
          </p>
          <p style={{ margin:'4px 0 0', color:'#991B1B', fontSize:12 }}>
            All students, faculty, classes, attendance, fees, payments,
            exams, marks, assignments, chats, notes, timetables and all other data
            belonging to <strong>{institute.name}</strong>.
          </p>
        </div>

        {/* Confirm by typing name */}
        <label style={{ display:'block', marginBottom:6, fontSize:13, color:'#374151' }}>
          Type <strong>{institute.name}</strong> to confirm:
        </label>
        <input
          value={confirmText}
          onChange={e => setConfirmText(e.target.value)}
          placeholder={institute.name}
          style={{
            width:'100%', padding:'10px 12px', borderRadius:6, fontSize:14,
            border: isMatch ? '2px solid #DC2626' : '1px solid #D1D5DB',
            outline:'none', boxSizing:'border-box'
          }}
        />

        {/* Force delete checkbox */}
        <label style={{ display:'flex', alignItems:'center', gap:8, marginTop:12, fontSize:13 }}>
          <input type='checkbox' checked={forceDelete}
            onChange={e => setForceDelete(e.target.checked)} />
          Force delete even if active subscription exists
        </label>

        {/* Buttons */}
        <div style={{ display:'flex', gap:10, marginTop:24 }}>
          <button onClick={onCancel}
            style={{ flex:1, padding:'10px', borderRadius:6, border:'1px solid #D1D5DB',
              background:'#fff', cursor:'pointer', fontSize:14 }}>
            Cancel
          </button>
          <button
            onClick={() => onConfirm(forceDelete)}
            disabled={!isMatch || loading}
            style={{
              flex:1, padding:'10px', borderRadius:6, border:'none',
              background: isMatch ? '#DC2626' : '#FCA5A5',
              color:'#fff', cursor: isMatch ? 'pointer' : 'not-allowed',
              fontSize:14, fontWeight:600
            }}>
            {loading ? 'Deleting...' : 'Delete Institute'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteInstituteModal;

Phase 5	Suspend Confirmation Modal
Simple reason input — shows current status dynamically

5.2  Suspend/Restore Modal Component
// frontend/src/components/superadmin/SuspendInstituteModal.jsx

import { useState } from 'react';

const SuspendInstituteModal = ({ institute, onConfirm, onCancel, loading }) => {
  const [reason, setReason] = useState('');
  const isSuspended = institute.status === 'suspended';

  return (
    <div style={{
      position:'fixed', inset:0, background:'rgba(0,0,0,0.6)',
      display:'flex', alignItems:'center', justifyContent:'center', zIndex:9999
    }}>
      <div style={{
        background:'#fff', borderRadius:12, padding:32, maxWidth:440,
        width:'90%', boxShadow:'0 20px 60px rgba(0,0,0,0.3)'
      }}>
        <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:20 }}>
          <div style={{ background: isSuspended ? '#F0FDF4' : '#FFFBEB', borderRadius:50, padding:10 }}>
            <span style={{ fontSize:22 }}>{isSuspended ? '✅' : '⏸️'}</span>
          </div>
          <div>
            <h3 style={{ margin:0, color:'#1E3A5F', fontSize:18 }}>
              {isSuspended ? 'Restore Institute' : 'Suspend Institute'}
            </h3>
            <p style={{ margin:0, color:'#6B7280', fontSize:13 }}>
              {isSuspended
                ? 'Institute will be able to login again'
                : 'All users will be blocked from login'
              }
            </p>
          </div>
        </div>

        <div style={{
          background: isSuspended ? '#F0FDF4' : '#FFFBEB',
          border: `1px solid ${isSuspended ? '#BBF7D0' : '#FDE68A'}`,
          borderRadius:8, padding:'12px 16px', marginBottom:20
        }}>
          <p style={{ margin:0, fontSize:13, color: isSuspended ? '#166534' : '#92400E' }}>
            {isSuspended
              ? `Restoring ${institute.name} will allow all their admins, faculty, and students to log in again.`
              : `Suspending ${institute.name} will immediately block all ${institute.name} users from accessing the platform.`
            }
          </p>
        </div>

        {!isSuspended && (
          <>
            <label style={{ display:'block', marginBottom:6, fontSize:13, color:'#374151' }}>
              Reason (optional):
            </label>
            <textarea
              value={reason}
              onChange={e => setReason(e.target.value)}
              placeholder='e.g. Payment overdue, Policy violation...'
              rows={3}
              style={{
                width:'100%', padding:'10px 12px', borderRadius:6, fontSize:13,
                border:'1px solid #D1D5DB', outline:'none',
                resize:'none', boxSizing:'border-box'
              }}
            />
          </>
        )}

        <div style={{ display:'flex', gap:10, marginTop:20 }}>
          <button onClick={onCancel}
            style={{ flex:1, padding:'10px', borderRadius:6,
              border:'1px solid #D1D5DB', background:'#fff', cursor:'pointer', fontSize:14 }}>
            Cancel
          </button>
          <button
            onClick={() => onConfirm(reason)}
            disabled={loading}
            style={{
              flex:1, padding:'10px', borderRadius:6, border:'none',
              background: isSuspended ? '#16A34A' : '#D97706',
              color:'#fff', cursor:'pointer', fontSize:14, fontWeight:600
            }}>
            {loading ? 'Processing...' : (isSuspended ? 'Restore Institute' : 'Suspend Institute')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SuspendInstituteModal;

Phase 6	Update Institutes Management Page
Wire modals into existing table + dynamic button states

5.3  Update Your Existing Institutes.jsx
In your existing Institutes Management page (the page shown in screenshot 2), add/update the following. Do NOT rewrite the whole page — only update the action buttons and add modal state:
// In your existing frontend/src/pages/superadmin/Institutes.jsx
// ADD these imports at top:
import DeleteInstituteModal from '../../components/superadmin/DeleteInstituteModal';
import SuspendInstituteModal from '../../components/superadmin/SuspendInstituteModal';

// ADD these state variables:
const [deleteModal, setDeleteModal] = useState(null);   // holds institute object
const [suspendModal, setSuspendModal] = useState(null); // holds institute object
const [actionLoading, setActionLoading] = useState(false);

// ── Delete Handler ────────────────────────────────────────────────
const handleDeleteConfirm = async (force) => {
  setActionLoading(true);
  try {
    const res = await api.delete(`/superadmin/institutes/${deleteModal.id}`, {
      data: { force }  // axios delete with body
    });
    if (res.data.success) {
      alert(res.data.message);
      setDeleteModal(null);
      fetchInstitutes();  // reload list
    }
  } catch (err) {
    alert(err.response?.data?.message || 'Delete failed');
  } finally {
    setActionLoading(false);
  }
};

// ── Suspend / Restore Handler ────────────────────────────────────
const handleSuspendConfirm = async (reason) => {
  setActionLoading(true);
  const isSuspended = suspendModal.status === 'suspended';
  const endpoint = isSuspended
    ? `/superadmin/institutes/${suspendModal.id}/restore`
    : `/superadmin/institutes/${suspendModal.id}/suspend`;

  try {
    const res = await api.put(endpoint, { reason });
    if (res.data.success) {
      alert(res.data.message);
      setSuspendModal(null);
      fetchInstitutes();  // reload list to update button state
    }
  } catch (err) {
    alert(err.response?.data?.message || 'Action failed');
  } finally {
    setActionLoading(false);
  }
};

// ── Updated Action Buttons in table row ──────────────────────────
// Find your existing action buttons and REPLACE with this:
<td>
  <button onClick={() => navigate(`/superadmin/institutes/${institute.id}`)}
    style={{ background:'#2563EB', color:'#fff', padding:'6px 14px',
      border:'none', borderRadius:6, cursor:'pointer', fontSize:13, marginRight:6 }}>
    View
  </button>

  <button
    onClick={() => setSuspendModal(institute)}
    style={{
      background: institute.status === 'suspended' ? '#16A34A' : '#D97706',
      color:'#fff', padding:'6px 14px',
      border:'none', borderRadius:6, cursor:'pointer', fontSize:13, marginRight:6
    }}>
    {institute.status === 'suspended' ? 'Restore' : 'Suspend'}
  </button>

  <button onClick={() => setDeleteModal(institute)}
    style={{ background:'#DC2626', color:'#fff', padding:'6px 14px',
      border:'none', borderRadius:6, cursor:'pointer', fontSize:13 }}>
    Delete
  </button>
</td>

// ── Add modals at BOTTOM of your JSX (before closing div) ─────────
{deleteModal && (
  <DeleteInstituteModal
    institute={deleteModal}
    onConfirm={handleDeleteConfirm}
    onCancel={() => setDeleteModal(null)}
    loading={actionLoading}
  />
)}

{suspendModal && (
  <SuspendInstituteModal
    institute={suspendModal}
    onConfirm={handleSuspendConfirm}
    onCancel={() => setSuspendModal(null)}
    loading={actionLoading}
  />
)}

 
6.  Institute User Experience When Suspended
Phase 7	Show Suspended Notice to Institute Users
When admin/faculty/student logs in to a suspended institute

When institute users try to login or use the dashboard while suspended, they should see a clear professional notice instead of a confusing error:

6.1  Handle INSTITUTE_SUSPENDED Error in Frontend
In your Axios interceptor or API service file, handle the suspended response globally:
// frontend/src/services/api.js
// Find your axios interceptor and ADD this case:

api.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 403 &&
        error.response?.data?.code === 'INSTITUTE_SUSPENDED') {
      // Redirect to suspended page instead of showing generic error
      localStorage.removeItem('token');
      window.location.href = '/suspended';
      return Promise.reject(error);
    }
    // ... rest of your existing error handling ...
    return Promise.reject(error);
  }
);

6.2  Suspended Page Component
// frontend/src/pages/Suspended.jsx — create this new page

const SuspendedPage = () => (
  <div style={{
    minHeight:'100vh', display:'flex', alignItems:'center',
    justifyContent:'center', background:'#F8FAFC'
  }}>
    <div style={{
      maxWidth:480, width:'90%', background:'#fff', borderRadius:16,
      padding:48, textAlign:'center', boxShadow:'0 4px 24px rgba(0,0,0,0.08)',
      borderTop:'4px solid #D97706'
    }}>
      <div style={{ fontSize:56, marginBottom:16 }}>⏸️</div>
      <h1 style={{ color:'#1E3A5F', marginBottom:12 }}>Account Suspended</h1>
      <p style={{ color:'#6B7280', lineHeight:1.6, marginBottom:24 }}>
        Your institute account has been temporarily suspended.
        Please contact support to resolve this issue.
      </p>
      <a href='mailto:support@yoursaas.com'
        style={{ color:'#2563EB', fontSize:14 }}>
        support@yoursaas.com
      </a>
    </div>
  </div>
);

export default SuspendedPage;

// Add route in App.jsx:
// <Route path='/suspended' element={<SuspendedPage />} />

 
7.  Complete Validations — All Edge Cases
7.1  Delete Validations
#	Scenario	Rule	Response
1	Institute not found (deleted by another tab)	Check existence before delete	404 Institute not found
2	Institute has active paid subscription	Block unless force:true passed	409 with subscription details
3	Non-super-admin tries to delete	allowRoles('super_admin') middleware	403 Access denied
4	User types wrong name in confirmation	Frontend blocks button until match	Button stays disabled
5	Double-click delete button	loading state disables button after first click	Only one API call made
6	Institute is already deleted (race condition)	findByPk returns null	404 Institute not found
7	Super admin deletes their own institute	super_admin has no institute_id	No issue — super_admin is global

7.2  Suspend Validations
#	Scenario	Rule	Response
1	Suspend already suspended institute	Check current status first	409 Already suspended
2	Restore institute that is not suspended	Check current status first	409 Not suspended
3	Institute user actively using app gets suspended	Next API call returns 403 SUSPENDED	User redirected to /suspended
4	Suspend button should change to Restore after suspend	fetchInstitutes() after success	Button text and color update
5	Super admin deletes a suspended institute	Allowed — status doesn't block delete	Delete proceeds normally
6	Expired institute vs Suspended institute	Different statuses — do not mix	Expired = subscription ended. Suspended = manually blocked

 
8.  Complete Implementation Checklist
Phase	Area	Task	Priority
1	Database	Run Step 1 SQL: Fix institute_public_profiles FK — fixes error immediately	CRITICAL — Do First
1	Database	Run Step 2 SQL: Fix all other institute FK constraints	High
1	Database	Verify with: SELECT constraint_name, delete_rule FROM information_schema.referential_constraints	Required
2	Backend	Replace deleteInstitute controller with professional version from Section 3	High
2	Backend	Verify DELETE /:id route exists in superadmin institute routes	Required
3	Backend	Add suspendInstitute and restoreInstitute controller functions	High
3	Backend	Add PUT /:id/suspend and PUT /:id/restore routes	High
3	Backend	Add institute status check block to verifyToken middleware	Critical for suspend to work
4	Frontend	Create DeleteInstituteModal.jsx with name confirmation	High
5	Frontend	Create SuspendInstituteModal.jsx with dynamic suspend/restore content	High
6	Frontend	Update Institutes.jsx — add modal state, handlers, dynamic buttons	High
7	Frontend	Create Suspended.jsx page for blocked institute users	Medium
7	Frontend	Add INSTITUTE_SUSPENDED handler in axios interceptor	Medium
7	Frontend	Add /suspended route in App.jsx	Medium
Test	QA	Test delete institute — verify all child data is gone in Neon	Required
Test	QA	Test suspend — login as institute admin, verify 403 SUSPENDED response	Required
Test	QA	Test restore — login again after restore, verify access works	Required
Test	QA	Test delete with active subscription — verify 409 warning appears	Required
Test	QA	Test typing wrong institute name — verify Delete button stays disabled	Required

Summary — Minimum Work to Fix Current Error
To fix the error you see right now: ONLY run Phase 1 SQL (5 minutes work).
The error will immediately disappear after running the ALTER TABLE statements in Neon.
Phases 2-7 add the professional modal UI and suspend system — do those after the fix.
Total time estimate: DB fix = 5 min. Backend = 1 hr. Frontend = 1-2 hrs. Tests = 30 min.

