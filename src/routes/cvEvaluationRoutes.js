const express = require('express');
const { protect } = require('../middlewares/authMiddleware');
const {
  createCVEvaluation,
  generateAutomaticEvaluation,
  generateAutomaticEvaluationFromData,
  getCVEvaluation
} = require('../controllers/cvEvaluationController');

const router = express.Router({ mergeParams: true });

/**
 * @swagger
 * /api/cv/{cvId}/evaluation:
 *   post:
 *     summary: Create or update CV evaluation
 *     tags: [CV Evaluation]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: cvId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the CV
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               score:
 *                 type: number
 *                 example: 75
 *                 description: Overall score of the CV (0-100)
 *               progress:
 *                 type: number
 *                 example: 85
 *                 description: Completion progress percentage (0-100)
 *               strengths:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["Clear work history", "Well-formatted skills section", "Good education background"]
 *               improvements:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["Add more quantifiable achievements", "Enhance summary section", "Include more keywords from industry"]
 *     responses:
 *       201:
 *         description: CV evaluation created successfully
 *       200:
 *         description: CV evaluation updated successfully
 *       404:
 *         description: CV not found or not authorized
 *       500:
 *         description: Server error
 */
router.post('/', protect, createCVEvaluation);

/**
 * @swagger
 * /api/cv/{cvId}/auto-evaluation:
 *   post:
 *     summary: Generate automatic evaluation for CV using AI
 *     tags: [CV Evaluation]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: cvId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the CV
 *     responses:
 *       200:
 *         description: CV evaluated automatically
 *       404:
 *         description: CV not found or not authorized
 *       500:
 *         description: Server error
 */
router.post('/auto-evaluation', protect, generateAutomaticEvaluation);

/**
 * @swagger
 * /api/cv/{cvId}/evaluation:
 *   get:
 *     summary: Get CV evaluation
 *     tags: [CV Evaluation]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: cvId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the CV
 *     responses:
 *       200:
 *         description: CV evaluation retrieved successfully
 *       404:
 *         description: CV not found or evaluation not found
 *       500:
 *         description: Server error
 */
router.get('/', protect, getCVEvaluation);

module.exports = router; 