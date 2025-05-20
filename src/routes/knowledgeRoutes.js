/**
 * @swagger
 * /api/knowledge:
 *   post:
 *     tags: [Knowledge]
 *     summary: Create new knowledge
 *     description: Create a new knowledge entry
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Knowledge'
 *     responses:
 *       201:
 *         description: Knowledge created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   $ref: '#/components/schemas/Knowledge'
 *       400:
 *         description: Invalid input data
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /api/knowledge:
 *   get:
 *     tags: [Knowledge]
 *     summary: Get all knowledge entries
 *     parameters:
 *       - in: query
 *         name: taskName
 *         schema:
 *           type: string
 *         description: Filter by task name (e.g. CV_SKILLS)
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [GENERAL, SPECIFIC]
 *         description: Filter by knowledge type
 *     responses:
 *       200:
 *         description: List of knowledge entries
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
 *                     $ref: '#/components/schemas/Knowledge'
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /api/knowledge/{id}:
 *   get:
 *     tags: [Knowledge]
 *     summary: Get knowledge by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Knowledge ID
 *     responses:
 *       200:
 *         description: Knowledge entry found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   $ref: '#/components/schemas/Knowledge'
 *       404:
 *         description: Knowledge not found
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /api/knowledge/{id}:
 *   put:
 *     tags: [Knowledge]
 *     summary: Update knowledge
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Knowledge ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Knowledge'
 *     responses:
 *       200:
 *         description: Knowledge updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   $ref: '#/components/schemas/Knowledge'
 *       404:
 *         description: Knowledge not found
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /api/knowledge/{id}:
 *   delete:
 *     tags: [Knowledge]
 *     summary: Delete knowledge
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Knowledge ID
 *     responses:
 *       200:
 *         description: Knowledge deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 message:
 *                   type: string
 *                   example: Knowledge deleted successfully
 *       404:
 *         description: Knowledge not found
 *       500:
 *         description: Server error
 */

const express = require('express');
const knowledgeController = require('../controllers/knowledgeController');
const router = express.Router();

// Routes
router.post('/', knowledgeController.createKnowledge);
router.get('/', knowledgeController.getAllKnowledge);
router.get('/:id', knowledgeController.getKnowledgeById);
router.put('/:id', knowledgeController.updateKnowledge);
router.put('/task/:taskName', knowledgeController.updateKnowledgeByTaskName);
router.delete('/:id', knowledgeController.deleteKnowledge);

module.exports = router; 