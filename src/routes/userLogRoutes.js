const express = require('express');
const router = express.Router();
const userLogController = require('../controllers/userLogController');
const { protect, hasRole } = require('../middlewares/authMiddleware');

/**
 * @swagger
 * /api/user-logs/current:
 *   get:
 *     summary: Get current user's activity logs
 *     tags: [Logs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: action
 *         schema:
 *           type: string
 *         description: Filter by action type
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
 *     responses:
 *       200:
 *         description: User logs retrieved successfully
 *       401:
 *         description: Not authenticated
 */
router.get('/current', protect, userLogController.getCurrentUserLogs);

/**
 * @swagger
 * /api/user-logs/current/stats:
 *   get:
 *     summary: Get current user's activity statistics
 *     tags: [Logs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
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
 *         description: User activity statistics retrieved successfully
 *       401:
 *         description: Not authenticated
 */
router.get('/current/stats', protect, userLogController.getCurrentUserActivityStats);

/**
 * @swagger
 * /api/user-logs/statistics:
 *   get:
 *     summary: Get document statistics (CV and Resume)
 *     tags: [Logs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
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
 *         description: Document statistics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   type: object
 *                   properties:
 *                     cv:
 *                       type: object
 *                       properties:
 *                         totalCreated:
 *                           type: integer
 *                           description: Total number of CVs created
 *                         activeCount:
 *                           type: integer
 *                           description: Number of active CVs
 *                         totalDownloads:
 *                           type: integer
 *                           description: Total number of CV downloads
 *                     resume:
 *                       type: object
 *                       properties:
 *                         totalCreated:
 *                           type: integer
 *                           description: Total number of Resumes created
 *                         activeCount:
 *                           type: integer
 *                           description: Number of active Resumes
 *                         totalDownloads:
 *                           type: integer
 *                           description: Total number of Resume downloads
 *                     timeBasedStats:
 *                       type: object
 *                       properties:
 *                         creationByMonth:
 *                           type: array
 *                           items:
 *                             type: object
 *                             properties:
 *                               month:
 *                                 type: string
 *                               cvCount:
 *                                 type: integer
 *                               resumeCount:
 *                                 type: integer
 *                         downloadsByMonth:
 *                           type: array
 *                           items:
 *                             type: object
 *                             properties:
 *                               month:
 *                                 type: string
 *                               cvDownloads:
 *                                 type: integer
 *                               resumeDownloads:
 *                                 type: integer
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Not authorized (Admin only)
 */
router.get('/statistics', protect, hasRole(['admin']), userLogController.getDocumentStatistics);

/**
 * @swagger
 * /api/user-logs/template-download-stats:
 *   get:
 *     summary: Get download statistics by template (CV & Resume)
 *     tags: [Logs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
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
 *         name: period
 *         schema:
 *           type: string
 *           enum: [7d, 30d, 90d, 365d, all]
 *         description: Quick filter by period
 *     responses:
 *       200:
 *         description: Download statistics by template
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
 *                     type: object
 *                     properties:
 *                       templateId:
 *                         type: string
 *                       templateName:
 *                         type: string
 *                       cvDownloads:
 *                         type: integer
 *                       resumeDownloads:
 *                         type: integer
 *                       totalDownloads:
 *                         type: integer
 *                 message:
 *                   type: string
 *                   example: Thống kê lượt download theo template thành công
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Not authorized (Admin only)
 */
router.get('/template-download-stats', protect, hasRole(['admin']), userLogController.getTemplateDownloadStats);

module.exports = router; 