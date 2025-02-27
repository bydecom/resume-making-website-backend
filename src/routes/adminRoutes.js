const express = require('express');
const { protect, hasRole } = require('../middlewares/authMiddleware');
const { getAdminLogs } = require('../controllers/adminLogController');

const router = express.Router();

// Bảo vệ tất cả các routes
router.use(protect);
router.use(hasRole(['admin']));

/**
 * @swagger
 * /api/admin/logs:
 *   get:
 *     tags:
 *       - Admin
 *     summary: Get admin logs
 *     description: Retrieve logs of admin activities with filtering options
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of items per page
 *       - in: query
 *         name: adminId
 *         schema:
 *           type: string
 *         description: Filter by admin ID
 *       - in: query
 *         name: action
 *         schema:
 *           type: string
 *           enum: [login, create_user, update_user, delete_user, create_template, update_template, delete_template, system_config, other]
 *         description: Filter by action type
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter from date (YYYY-MM-DD)
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter to date (YYYY-MM-DD)
 *     responses:
 *       200:
 *         description: Admin logs retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/AdminLog'
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     page:
 *                       type: integer
 *                       example: 1
 *                     limit:
 *                       type: integer
 *                       example: 10
 *                     total:
 *                       type: integer
 *                       example: 50
 *                     pages:
 *                       type: integer
 *                       example: 5
 *                 message:
 *                   type: string
 *                   example: Admin logs retrieved successfully
 */
router.get('/logs', getAdminLogs);

// Các routes khác của admin...

module.exports = router; 