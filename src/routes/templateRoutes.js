const express = require('express');
const router = express.Router();
const templateController = require('../controllers/templateController');
const { protect, hasRole } = require('../middlewares/authMiddleware');

/**
 * @swagger
 * /api/templates:
 *   get:
 *     summary: Get all templates (admin)
 *     tags: [Templates]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of all templates
 */
router.get('/', protect, hasRole(['admin']), templateController.getAllTemplates);

/**
 * @swagger
 * /api/templates/active:
 *   get:
 *     summary: Get all active templates
 *     tags: [Templates]
 *     responses:
 *       200:
 *         description: List of active templates
 */
router.get('/active', templateController.getActiveTemplates);

/**
 * @swagger
 * /api/templates/sync:
 *   post:
 *     summary: Sync templates from frontend
 *     tags: [Templates]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Templates synchronized successfully
 */
router.post('/sync', protect, hasRole(['admin']), templateController.syncTemplates);

/**
 * @swagger
 * /api/templates/stats:
 *   get:
 *     summary: Get statistics for all templates
 *     tags: [Templates]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [7d, 30d, 90d, 365d, 1y]
 *         description: Time period for statistics
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date for custom period (YYYY-MM-DD)
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: End date for custom period (YYYY-MM-DD)
 *     responses:
 *       200:
 *         description: Statistics for all templates retrieved successfully
 */
router.get('/stats', protect, hasRole(['admin']), templateController.getAllTemplateStats);

/**
 * @swagger
 * /api/templates/{templateId}:
 *   get:
 *     summary: Get template by ID
 *     tags: [Templates]
 *     parameters:
 *       - in: path
 *         name: templateId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Template details
 */
router.get('/:templateId', templateController.getTemplateById);

/**
 * @swagger
 * /api/templates/{templateId}:
 *   put:
 *     summary: Update template metadata
 *     tags: [Templates]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: templateId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Template updated successfully
 */
router.put('/:templateId', protect, hasRole(['admin']), templateController.updateTemplate);

/**
 * @swagger
 * /api/templates/{templateId}/stats:
 *   get:
 *     summary: Get statistics for a specific template
 *     tags: [Templates]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: templateId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [7d, 30d, 90d, 365d, 1y]
 *         description: Time period for statistics
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date for custom period (YYYY-MM-DD)
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: End date for custom period (YYYY-MM-DD)
 *     responses:
 *       200:
 *         description: Template statistics retrieved successfully
 */
router.get('/:templateId/stats', protect, hasRole(['admin']), templateController.getTemplateStats);

module.exports = router; 