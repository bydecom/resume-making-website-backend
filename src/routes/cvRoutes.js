const express = require('express');
const { protect } = require('../middlewares/authMiddleware');
const {
  createCV,
  updateCV,
  updateCVName,
  getUserCVs,
  getCVById,
  deleteCV
} = require('../controllers/cvController');

const router = express.Router();

/**
 * @swagger
 * /api/cv:
 *   post:
 *     summary: Create a new CV
 *     tags: [CV]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: "My Professional CV"
 *               personalInfo:
 *                 type: object
 *                 properties:
 *                   firstName:
 *                     type: string
 *                   lastName:
 *                     type: string
 *                   email:
 *                     type: string
 *                   phone:
 *                     type: string
 *                   location:
 *                     type: string
 *                   country:
 *                     type: string
 *                   website:
 *                     type: string
 *                   linkedin:
 *                     type: string
 *               summary:
 *                 type: string
 *               education:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     degree:
 *                       type: string
 *                     school:
 *                       type: string
 *                     startDate:
 *                       type: string
 *                     endDate:
 *                       type: string
 *                     description:
 *                       type: string
 *                     isPresent:
 *                       type: boolean
 *               experience:
 *                 type: array
 *                 items:
 *                   type: object
 *               skills:
 *                 type: array
 *                 items:
 *                   type: string
 *               projects:
 *                 type: array
 *                 items:
 *                   type: object
 *               certifications:
 *                 type: array
 *                 items:
 *                   type: object
 *               languages:
 *                 type: array
 *                 items:
 *                   type: object
 *               additionalInfo:
 *                 type: object
 *               customFields:
 *                 type: array
 *                 items:
 *                   type: object
 *     responses:
 *       201:
 *         description: CV created successfully
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
 *                     _id:
 *                       type: string
 *                     name:
 *                       type: string
 *                 message:
 *                   type: string
 *                   example: CV created successfully
 *       401:
 *         description: Not authorized, no token
 *       500:
 *         description: Server error
 */
router.post('/', protect, createCV);

/**
 * @swagger
 * /api/cv:
 *   get:
 *     summary: Get all CVs for the logged-in user
 *     tags: [CV]
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
 *     responses:
 *       200:
 *         description: List of CVs retrieved successfully
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
 *                       _id:
 *                         type: string
 *                       name:
 *                         type: string
 *                       createdAt:
 *                         type: string
 *                       updatedAt:
 *                         type: string
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     page:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *                     total:
 *                       type: integer
 *                     pages:
 *                       type: integer
 *                 message:
 *                   type: string
 *                   example: CVs retrieved successfully
 *       401:
 *         description: Not authorized, no token
 *       500:
 *         description: Server error
 */
router.get('/', protect, getUserCVs);

/**
 * @swagger
 * /api/cv/{id}:
 *   get:
 *     summary: Get a CV by ID
 *     tags: [CV]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: CV ID
 *     responses:
 *       200:
 *         description: CV retrieved successfully
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
 *                 message:
 *                   type: string
 *                   example: CV retrieved successfully
 *       400:
 *         description: Invalid CV ID format
 *       401:
 *         description: Not authorized, no token
 *       404:
 *         description: CV not found or not authorized to access
 *       500:
 *         description: Server error
 */
router.get('/:id', protect, getCVById);

/**
 * @swagger
 * /api/cv/{id}:
 *   put:
 *     summary: Update a CV
 *     tags: [CV]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: CV ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: CV updated successfully
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
 *                 message:
 *                   type: string
 *                   example: CV updated successfully
 *       400:
 *         description: Invalid CV ID format
 *       401:
 *         description: Not authorized, no token
 *       404:
 *         description: CV not found or not authorized to update
 *       500:
 *         description: Server error
 */
router.put('/:id', protect, updateCV);

/**
 * @swagger
 * /api/cv/{id}/name:
 *   patch:
 *     summary: Update just the name of a CV
 *     tags: [CV]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: CV ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: "My Updated CV Name"
 *             required:
 *               - name
 *     responses:
 *       200:
 *         description: CV name updated successfully
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
 *                     _id:
 *                       type: string
 *                     name:
 *                       type: string
 *                 message:
 *                   type: string
 *                   example: CV name updated successfully
 *       400:
 *         description: Invalid CV ID format or name is empty
 *       401:
 *         description: Not authorized, no token
 *       404:
 *         description: CV not found or not authorized to update
 *       500:
 *         description: Server error
 */
router.patch('/:id/name', protect, updateCVName);

/**
 * @swagger
 * /api/cv/{id}:
 *   delete:
 *     summary: Delete a CV
 *     tags: [CV]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: CV ID
 *     responses:
 *       200:
 *         description: CV deleted successfully
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
 *                   example: CV deleted successfully
 *       400:
 *         description: Invalid CV ID format
 *       401:
 *         description: Not authorized, no token
 *       404:
 *         description: CV not found or not authorized to delete
 *       500:
 *         description: Server error
 */
router.delete('/:id', protect, deleteCV);

module.exports = router; 