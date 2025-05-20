const express = require('express');
const { protect, hasRole } = require('../middlewares/authMiddleware');
const { getAdminLogs, getUserLogsByUserId, getUserStatsByUserId } = require('../controllers/adminLogController');
const userLogController = require('../controllers/userLogController');
const aiConfigController = require('../controllers/aiConfigController');

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

/**
 * @swagger
 * /api/admin/users/{userId}/logs:
 *   get:
 *     summary: Get activity logs for a specific user (Admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *       - in: query
 *         name: action
 *         schema:
 *           type: string
 *         description: Filter by action type
 *       - in: query
 *         name: entityType
 *         schema:
 *           type: string
 *         description: Filter by entity type
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date (YYYY-MM-DD)
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: End date (YYYY-MM-DD)
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
 *         description: Number of records per page
 *     responses:
 *       200:
 *         description: User logs
 *       403:
 *         description: Forbidden - Admin access required
 */
router.get('/users/:userId/logs', getUserLogsByUserId);

/**
 * @swagger
 * /api/admin/users/{userId}/stats:
 *   get:
 *     summary: Get activity statistics for a specific user (Admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date (YYYY-MM-DD)
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: End date (YYYY-MM-DD)
 *     responses:
 *       200:
 *         description: User statistics
 *       403:
 *         description: Forbidden - Admin access required
 */
router.get('/users/:userId/stats', getUserStatsByUserId);

/**
 * @swagger
 * /api/admin/users/all-logs:
 *   get:
 *     summary: Get activity logs for all users (Admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: userId
 *         schema:
 *           type: string
 *         description: Filter by user ID (optional)
 *       - in: query
 *         name: action
 *         schema:
 *           type: string
 *         description: Filter by action type
 *       - in: query
 *         name: entityType
 *         schema:
 *           type: string
 *         description: Filter by entity type
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date (YYYY-MM-DD)
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: End date (YYYY-MM-DD)
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
 *         description: Number of records per page
 *     responses:
 *       200:
 *         description: User logs retrieved successfully
 *       403:
 *         description: Forbidden - Admin access required
 */
router.get('/users/all-logs', userLogController.getAllUserLogs);

/**
 * @swagger
 * /api/admin/ai-configs:
 *   get:
 *     summary: Lấy danh sách cấu hình Gemini
 *     tags: [AIConfig]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Danh sách cấu hình Gemini
 *   post:
 *     summary: Tạo mới cấu hình Gemini
 *     tags: [AIConfig]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/GeminiApiConfig'
 *     responses:
 *       201:
 *         description: Tạo thành công
 *       400:
 *         description: Lỗi dữ liệu hoặc trùng tên
 */
router.get('/ai-configs', aiConfigController.getAllConfigs);
router.post('/ai-configs', aiConfigController.createConfig);

/**
 * @swagger
 * /api/admin/ai-configs/{id}:
 *   get:
 *     summary: Lấy chi tiết cấu hình Gemini
 *     tags: [AIConfig]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID cấu hình
 *     responses:
 *       200:
 *         description: Chi tiết cấu hình
 *       404:
 *         description: Không tìm thấy
 *   put:
 *     summary: Cập nhật cấu hình Gemini
 *     tags: [AIConfig]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID cấu hình
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/GeminiApiConfig'
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 *       404:
 *         description: Không tìm thấy
 *   delete:
 *     summary: Xóa cấu hình Gemini
 *     tags: [AIConfig]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID cấu hình
 *     responses:
 *       200:
 *         description: Xóa thành công
 *       404:
 *         description: Không tìm thấy
 */
router.get('/ai-configs/:id', aiConfigController.getConfigById);
router.put('/ai-configs/:id', aiConfigController.updateConfig);
router.delete('/ai-configs/:id', aiConfigController.deleteConfig);

/**
 * @swagger
 * /api/admin/ai-configs/{id}/active:
 *   patch:
 *     summary: Đặt cấu hình này là active (chỉ 1 active)
 *     tags: [AIConfig]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID cấu hình
 *     responses:
 *       200:
 *         description: Đặt active thành công
 *       404:
 *         description: Không tìm thấy
 */
router.patch('/ai-configs/:id/active', aiConfigController.setActiveConfig);

/**
 * @swagger
 * /api/admin/ai-configs/task/{taskName}:
 *   get:
 *     summary: Lấy cấu hình Gemini theo taskName
 *     tags: [AIConfig]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: taskName
 *         required: true
 *         schema:
 *           type: string
 *         description: Tên task
 *     responses:
 *       200:
 *         description: Lấy thành công
 *       404:
 *         description: Không tìm thấy
 */
router.get('/ai-configs/task/:taskName', aiConfigController.getConfigByTaskName);

// Các routes khác của admin...

module.exports = router; 