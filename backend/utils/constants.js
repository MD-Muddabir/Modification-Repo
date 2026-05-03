/**
 * Centralized Constants
 * Prevents string typos across the codebase.
 */

const ROLES = {
    SUPER_ADMIN: 'super_admin',
    OWNER: 'owner',
    ADMIN: 'admin',
    MANAGER: 'manager',
    FACULTY: 'faculty',
    STUDENT: 'student',
    PARENT: 'parent'
};

const STATUS = {
    ACTIVE: 'active',
    INACTIVE: 'inactive',
    BLOCKED: 'blocked',
    PENDING: 'pending',
    DELETED: 'deleted'
};

const PLAN_TYPES = {
    MONTHLY: 'monthly',
    YEARLY: 'yearly',
    LIFETIME: 'lifetime',
    FREE: 'free'
};

const PAYMENT_STATUS = {
    PAID: 'paid',
    PENDING: 'pending',
    FAILED: 'failed',
    REFUNDED: 'refunded',
    PARTIAL: 'partial'
};

const ATTENDANCE_STATUS = {
    PRESENT: 'present',
    ABSENT: 'absent',
    LATE: 'late',
    HALF_DAY: 'half_day',
    HOLIDAY: 'holiday'
};

module.exports = {
    ROLES,
    STATUS,
    PLAN_TYPES,
    PAYMENT_STATUS,
    ATTENDANCE_STATUS
};
