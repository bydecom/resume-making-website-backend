/**
 * @swagger
 * tags:
 *   name: Chatbot
 *   description: Chatbot conversation endpoints with intent detection
 */

/**
 * @swagger
 * /api/chatbot:
 *   post:
 *     tags: [Chatbot]
 *     summary: Get chatbot response with intent detection
 *     description: Send message to chatbot, detect intent, and get response based on the detected or provided task
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
 *                 example: "Help me improve my skills section"
 *               taskName:
 *                 type: string
 *                 description: Default task name (will be overridden if intent is detected with high confidence)
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
 *                 output:
 *                   type: object
 *                   properties:
 *                     outputMessage:
 *                       type: string
 *                       example: "Here's how you can improve your skills section..."
 *                     actionRequired:
 *                       type: string
 *                       nullable: true
 *                       example: "Please provide more specific technical skills"
 *                     currentTask:
 *                       type: string
 *                       example: "CV_SKILLS"
 *                 detectedIntent:
 *                   type: object
 *                   properties:
 *                     intent:
 *                       type: string
 *                       example: "improve_skills"
 *                     confidence:
 *                       type: number
 *                       example: 0.85
 *                     taskName:
 *                       type: string
 *                       example: "CV_SKILLS"
 *                 knowledge:
 *                   type: array
 *                   items:
 *                     type: object
 *                   description: Knowledge base entries used for response
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