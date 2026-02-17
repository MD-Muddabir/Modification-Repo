# Plan-Based Features & Validations

## Overview
The system now implements comprehensive plan-based validations and feature restrictions based on the subscription plan selected during registration.

## Database Schema Updates

### Plans Table
- `student_limit` (INTEGER) - Maximum number of students allowed
- `faculty_limit` (INTEGER) - Maximum number of faculty members allowed
- `feature_attendance` (BOOLEAN) - Attendance system access
- `feature_fees` (BOOLEAN) - Fee management access
- `feature_reports` (BOOLEAN) - Analytics & reports access
- `feature_parent_portal` (BOOLEAN) - Parent portal access

### Institutes Table
- `plan_id` (INTEGER) - Foreign key to Plans table
- `subscription_start` (DATE) - Subscription start date
- `subscription_end` (DATE) - Subscription end date
- `status` (ENUM) - active, pending, expired, suspended

## Registration Flow

### 1. Plan Selection (Required)
- Users must select a plan from the Pricing page
- Direct access to `/register` without a plan shows a popup and redirects to Pricing
- Plan ID is passed via URL parameter: `/register?plan={plan_id}`

### 2. Registration Form
Required fields:
- Institute Name
- Email
- Phone
- Address
- Password
- Confirm Password
- Plan ID (auto-filled from URL)

### 3. Backend Processing
When a user registers:
1. Validates all required fields
2. Fetches plan details from database
3. Calculates subscription dates (start: now, end: now + 30 days)
4. Sets institute status:
   - **Free Plan (price = 0)**: Status = `active` (immediate access)
   - **Paid Plans**: Status = `pending` (awaiting payment)
5. Creates Institute record with plan_id and subscription dates
6. Creates Admin user account
7. Creates Subscription record

## Plan-Based Validations

### Student Limit Validation
**Location**: `backend/controllers/student.controller.js`

When adding a new student:
```javascript
// Checks current student count against plan limit
if (studentCount >= plan.student_limit) {
    return 403 error: "Plan limit reached. Upgrade to add more students."
}
```

### Faculty Limit Validation
**Location**: `backend/controllers/faculty.controller.js`

When adding a new faculty member:
```javascript
// Checks current faculty count against plan limit
if (facultyCount >= plan.faculty_limit) {
    return 403 error: "Plan limit reached. Upgrade to add more faculty."
}
```

### Feature Access Validation
**Location**: `backend/middlewares/checkFeatureAccess.js`

Middleware that checks if institute's plan includes specific features:
- `feature_attendance` - Required for attendance routes
- `feature_fees` - Required for fee management routes
- `feature_reports` - Required for analytics routes
- `feature_parent_portal` - Required for parent portal access

**Applied to routes**:
- `/api/attendance/*` - Requires `feature_attendance`
- `/api/fees/*` - Requires `feature_fees`

If feature not included in plan:
```javascript
return 403 error: "Upgrade Required: Your plan does not include [FEATURE]"
```

## Frontend Display

### Pricing Page
Displays all plan features:
- ✓ **{student_limit}** Students
- ✓ **{faculty_limit}** Faculty Members
- ✓/× Attendance System
- ✓/× Fee Management
- ✓/× Analytics & Reports
- ✓/× Parent Portal Access

### Admin Dashboard
Should display:
- Current plan name
- Student count / limit
- Faculty count / limit
- Available features
- Upgrade button (if on limited plan)

## Access Control Flow

```
User Action (Add Student/Faculty/Access Feature)
    ↓
Authentication Middleware (verifyToken)
    ↓
Role Middleware (allowRoles)
    ↓
Subscription Middleware (checkSubscription)
    ↓
Feature Access Middleware (checkFeatureAccess) [if applicable]
    ↓
Limit Validation (in controller) [if applicable]
    ↓
Action Executed or Error Returned
```

## Error Messages

### Limit Reached
```json
{
  "success": false,
  "message": "Plan limit reached. Your plan allows a maximum of {limit} {resource}. Upgrade your plan to add more."
}
```

### Feature Not Available
```json
{
  "success": false,
  "message": "Upgrade Required: Your current plan does not include {FEATURE}. Please upgrade your subscription."
}
```

### No Plan Selected (Registration)
```json
{
  "success": false,
  "message": "All fields are required, including plan selection."
}
```

## Testing Checklist

- [ ] Register with Free Trial plan - should activate immediately
- [ ] Register with Paid plan - should set status to pending
- [ ] Try adding students beyond plan limit - should show error
- [ ] Try adding faculty beyond plan limit - should show error
- [ ] Try accessing attendance without feature - should show upgrade message
- [ ] Try accessing fees without feature - should show upgrade message
- [ ] Access /register without plan - should show popup and redirect
- [ ] Verify plan_id is saved in Institutes table
- [ ] Verify subscription dates are set correctly
- [ ] Verify all plan features display on Pricing page

## Database Migration Scripts

Created scripts to safely add new columns:
- `backend/scripts/add_plan_id_safe.js` - Adds plan_id to Institutes
- `backend/scripts/add_faculty_limit.js` - Adds faculty_limit to Plans

Run these if columns are missing:
```bash
node backend/scripts/add_plan_id_safe.js
node backend/scripts/add_faculty_limit.js
```

## Next Steps

1. **Payment Integration**: Implement payment gateway for paid plans
2. **Plan Upgrade**: Allow institutes to upgrade their plan
3. **Usage Analytics**: Track feature usage per institute
4. **Notifications**: Alert admins when approaching limits
5. **Grace Period**: Implement grace period for expired subscriptions
