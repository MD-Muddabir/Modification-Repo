/**
 * Lifetime Access Routes
 * Public: GET /api/lifetime/info
 * Admin: POST /api/lifetime/order, POST /api/lifetime/verify
 * Super Admin: POST /api/lifetime/activate/:id, POST /api/lifetime/revoke/:id
 */

const express = require('express');
const router = express.Router();
const verifyToken = require('../middlewares/auth.middleware');
const allowRoles = require('../middlewares/role.middleware');
const lifetimeCtrl = require('../controllers/lifetime.controller');

// Public — no auth required
router.get('/info', lifetimeCtrl.getLifetimePlanInfo);

// Institute admin only — initiate and verify lifetime purchase
router.post('/order', verifyToken, allowRoles('admin'), lifetimeCtrl.createLifetimeOrder);
router.post('/verify', verifyToken, allowRoles('admin'), lifetimeCtrl.verifyLifetimePayment);

// Super Admin only — manual activation and revoke
router.post('/activate/:institute_id', verifyToken, allowRoles('super_admin'), lifetimeCtrl.manualActivateLifetime);
router.post('/revoke/:institute_id', verifyToken, allowRoles('super_admin'), lifetimeCtrl.revokeLifetimeAccess);

module.exports = router;
