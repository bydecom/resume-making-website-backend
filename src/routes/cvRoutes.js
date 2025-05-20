const express = require('express');
const { protect } = require('../middlewares/authMiddleware');
const {
  createCV,
  createTempCV,
  updateCV,
  updateCVName,
  getUserCVs,
  getCVById,
  deleteCV,
  getUserCVsWithEvaluations,
  getCVWithEvaluation
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
 *               template:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                     example: "professionalBlue"
 *                     default: "professionalBlue"
 *                   name:
 *                     type: string
 *                     example: "Professional Blue"
 *                     default: "Professional Blue"
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
 *       400:
 *         description: User already has a CV
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: error
 *                 code:
 *                   type: string
 *                   example: CV_LIMIT_EXCEEDED
 *                 message:
 *                   type: string
 *                   example: User can only have one CV. Please update your existing CV instead.
 *       401:
 *         description: Not authorized, no token
 *       500:
 *         description: Server error
 */
router.post('/', protect, createCV);

/**
 * @swagger
 * /api/cv/temp:
 *   post:
 *     summary: Create a temporary CV
 *     tags: [CV]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CV'
 *     responses:
 *       201:
 *         description: Temporary CV created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   $ref: '#/components/schemas/CV'
 *                 message:
 *                   type: string
 *                   example: Temporary CV created successfully
 *       401:
 *         description: Not authorized, no token
 *       500:
 *         description: Server error
 */
router.post('/temp', protect, createTempCV);

/**
 * @swagger
 * /api/cv:
 *   get:
 *     summary: Get the user's CV with evaluation data
 *     tags: [CV]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User's CV with evaluation retrieved successfully
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
 *                       status:
 *                         type: string
 *                       isDefault:
 *                         type: boolean
 *                       template:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                             example: "professionalBlue"
 *                           name:
 *                             type: string
 *                             example: "Professional Blue"
 *                       evaluation:
 *                         type: object
 *                         properties:
 *                           _id:
 *                             type: string
 *                           cv:
 *                             type: string
 *                           score:
 *                             type: number
 *                             example: 75
 *                           progress:
 *                             type: number
 *                             example: 80
 *                           strengths:
 *                             type: array
 *                             items:
 *                               type: string
 *                           improvements:
 *                             type: array
 *                             items:
 *                               type: string
 *                           isAutoGenerated:
 *                             type: boolean
 *                           evaluationDate:
 *                             type: string
 *                           createdAt:
 *                             type: string
 *                           updatedAt:
 *                             type: string
 *                         nullable: true
 *                 message:
 *                   type: string
 *                   example: CV retrieved successfully
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
 *     summary: Get a CV by ID with evaluation data
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
 *         description: CV with evaluation retrieved successfully
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
 *                     personalInfo:
 *                       type: object
 *                     summary:
 *                       type: string
 *                     education:
 *                       type: array
 *                     experience:
 *                       type: array
 *                     skills:
 *                       type: array
 *                     projects:
 *                       type: array
 *                     certifications:
 *                       type: array
 *                     languages:
 *                       type: array
 *                     additionalInfo:
 *                       type: object
 *                     customFields:
 *                       type: array
 *                     status:
 *                       type: string
 *                     isDefault:
 *                       type: boolean
 *                     template:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                           example: "professionalBlue"
 *                         name:
 *                           type: string
 *                           example: "Professional Blue"
 *                     createdAt:
 *                       type: string
 *                     updatedAt:
 *                       type: string
 *                     evaluation:
 *                       type: object
 *                       properties:
 *                         _id:
 *                           type: string
 *                         cv:
 *                           type: string
 *                         score:
 *                           type: number
 *                           example: 75
 *                         progress:
 *                           type: number
 *                           example: 80
 *                         strengths:
 *                           type: array
 *                           items:
 *                             type: string
 *                         improvements:
 *                           type: array
 *                           items:
 *                             type: string
 *                         isAutoGenerated:
 *                           type: boolean
 *                         evaluationDate:
 *                           type: string
 *                         createdAt:
 *                           type: string
 *                         updatedAt:
 *                           type: string
 *                       nullable: true
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

/**
 * @swagger
 * /api/cv/with-evaluations:
 *   get:
 *     summary: Get the user's CV with evaluation data
 *     tags: [CV]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User's CV with evaluation retrieved successfully
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
 *                       personalInfo:
 *                         type: object
 *                       summary:
 *                         type: string
 *                       education:
 *                         type: array
 *                       experience:
 *                         type: array
 *                       skills:
 *                         type: array
 *                       evaluation:
 *                         type: object
 *                         properties:
 *                           score:
 *                             type: number
 *                           progress:
 *                             type: number
 *                           strengths:
 *                             type: array
 *                           improvements:
 *                             type: array
 *                 message:
 *                   type: string
 *                   example: CV with evaluation retrieved successfully
 *       401:
 *         description: Not authorized, no token
 *       500:
 *         description: Server error
 */
router.get('/with-evaluations', protect, getUserCVsWithEvaluations);

/**
 * @swagger
 * /api/cv/{id}/with-evaluation:
 *   get:
 *     summary: Get a CV with its evaluation
 *     tags: [CV]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the CV
 *     responses:
 *       200:
 *         description: CV with evaluation retrieved successfully
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
 *                     personalInfo:
 *                       type: object
 *                     summary:
 *                       type: string
 *                     education:
 *                       type: array
 *                     experience:
 *                       type: array
 *                     skills:
 *                       type: array
 *                     evaluation:
 *                       type: object
 *                       properties:
 *                         score:
 *                           type: number
 *                         progress:
 *                           type: number
 *                         strengths:
 *                           type: array
 *                         improvements:
 *                           type: array
 *                 message:
 *                   type: string
 *       401:
 *         description: Not authorized, no token
 *       404:
 *         description: CV not found or not authorized
 *       500:
 *         description: Server error
 */
router.get('/:id/with-evaluation', protect, getCVWithEvaluation);

module.exports = router; 