/**
 * @swagger
 * tags:
 *   name: Chatbot
 *   description: Chatbot conversation endpoints
 */

/**
 * @swagger
 * /api/chatbot:
 *   post:
 *     tags: [Chatbot]
 *     summary: Get chatbot response
 *     description: Send message to chatbot and get response
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userMessage
 *               - taskName
 *               - currentData
 *             properties:
 *               userMessage:
 *                 type: string
 *                 description: Message from user
 *                 example: "Hello"
 *               taskName:
 *                 type: string
 *                 description: Current task name
 *                 example: "CV_SKILLS"
 *               currentData:
 *                 type: object
 *                 description: Current data context
 *                 example: {}
 *     responses:
 *       200:
 *         description: Successful response
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
 *                   example: Hello
 *       400:
 *         description: Invalid input data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: error
 *                 errors:
 *                   type: array
 *                   items:
 *                     type: string
 *                   example: ["UserMessage is required"]
 *       500:
 *         description: Server error
 */

const express = require('express');
const chatbotController = require('../controllers/chatbotController');
const router = express.Router();

// Routes
router.post('/', chatbotController.getChatResponse);

module.exports = router; 