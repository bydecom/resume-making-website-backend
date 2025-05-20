const express = require('express');
const { protect } = require('../middlewares/authMiddleware');
const {
  createJobDescription,
  getUserJobDescriptions,
  getJobDescriptionById,
  updateJobDescription,
  deleteJobDescription
} = require('../controllers/jobDescriptionController');

const router = express.Router();

/**
 * @swagger
 * /api/job-descriptions:
 *   post:
 *     summary: Create a new job description
 *     tags: [Job Description]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *                 example: "Senior Software Engineer"
 *               department:
 *                 type: string
 *                 example: "Engineering"
 *               companyName:
 *                 type: string
 *                 example: "Tech Corp"
 *               location:
 *                 type: string
 *                 example: "Ho Chi Minh City"
 *               jobLevel:
 *                 type: string
 *                 enum: [Intern, Junior, Mid, Senior, Lead, Manager, Director, Executive]
 *                 default: Mid
 *               employmentType:
 *                 type: string
 *                 enum: [Full-time, Part-time, Internship, Freelance, Contract]
 *                 default: Full-time
 *               summary:
 *                 type: string
 *               responsibilities:
 *                 type: array
 *                 items:
 *                   type: string
 *               requirements:
 *                 type: array
 *                 items:
 *                   type: string
 *               preferredQualifications:
 *                 type: array
 *                 items:
 *                   type: string
 *               skillsRequired:
 *                 type: array
 *                 items:
 *                   type: string
 *               benefits:
 *                 type: array
 *                 items:
 *                   type: string
 *               postingDate:
 *                 type: string
 *                 format: date-time
 *               closingDate:
 *                 type: string
 *                 format: date-time
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *               language:
 *                 type: string
 *                 enum: [en, vi]
 *                 default: en
 *               status:
 *                 type: string
 *                 enum: [draft, published]
 *                 default: draft
 *     responses:
 *       201:
 *         description: Job description created successfully
 *       401:
 *         description: Not authorized, no token
 *       500:
 *         description: Server error
 */
router.post('/', protect, createJobDescription);

/**
 * @swagger
 * /api/job-descriptions:
 *   get:
 *     summary: Get all job descriptions for the logged-in user
 *     tags: [Job Description]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Job descriptions retrieved successfully
 *       401:
 *         description: Not authorized, no token
 *       500:
 *         description: Server error
 */
router.get('/', protect, getUserJobDescriptions);

/**
 * @swagger
 * /api/job-descriptions/{id}:
 *   get:
 *     summary: Get a job description by ID
 *     tags: [Job Description]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Job description ID
 *     responses:
 *       200:
 *         description: Job description retrieved successfully
 *       400:
 *         description: Invalid job description ID format
 *       401:
 *         description: Not authorized, no token
 *       404:
 *         description: Job description not found or not authorized to access
 *       500:
 *         description: Server error
 */
router.get('/:id', protect, getJobDescriptionById);

/**
 * @swagger
 * /api/job-descriptions/{id}:
 *   put:
 *     summary: Update a job description
 *     tags: [Job Description]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Job description ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Job description updated successfully
 *       400:
 *         description: Invalid job description ID format
 *       401:
 *         description: Not authorized, no token
 *       404:
 *         description: Job description not found or not authorized to update
 *       500:
 *         description: Server error
 */
router.put('/:id', protect, updateJobDescription);

/**
 * @swagger
 * /api/job-descriptions/{id}:
 *   delete:
 *     summary: Delete a job description
 *     tags: [Job Description]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Job description ID
 *     responses:
 *       200:
 *         description: Job description deleted successfully
 *       400:
 *         description: Invalid job description ID format
 *       401:
 *         description: Not authorized, no token
 *       404:
 *         description: Job description not found or not authorized to delete
 *       500:
 *         description: Server error
 */
router.delete('/:id', protect, deleteJobDescription);

module.exports = router; 