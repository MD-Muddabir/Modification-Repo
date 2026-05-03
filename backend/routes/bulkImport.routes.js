// backend/routes/bulkImport.routes.js
// Routes for bulk import history (audit log) and template download endpoint.

const express = require('express');
const router  = express.Router();
const verifyToken = require('../middlewares/auth.middleware');
const allowRoles  = require('../middlewares/role.middleware');
const { BulkImportLog } = require('../models');

/**
 * GET /api/bulk-import/logs
 * Returns the last 50 import jobs for the institute (most recent first).
 * Used by the admin to review past import history.
 */
router.get(
  '/logs',
  verifyToken,
  allowRoles('admin', 'manager'),
  async (req, res) => {
    try {
      const logs = await BulkImportLog.findAll({
        where: { institute_id: req.user.institute_id },
        order: [['created_at', 'DESC']],
        limit: 50,
      });
      res.json({ success: true, logs });
    } catch (err) {
      console.error('❌ Error fetching bulk import logs:', err);
      res.status(500).json({ success: false, message: 'Failed to fetch import logs' });
    }
  }
);

module.exports = router;
