const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { protect, hasRole, hasPermission } = require('../middlewares/authMiddleware');

/**
 * @swagger
 * /api/users/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *               - password
 *             properties:
 *               name:
 *                 type: string
 *                 description: User's full name
 *                 example: John Doe
 *               email:
 *                 type: string
 *                 format: email
 *                 description: User's email address
 *                 example: john@example.com
 *               password:
 *                 type: string
 *                 format: password
 *                 description: User's password (min 6 characters)
 *                 example: password123
 *     responses:
 *       201:
 *         description: User registered successfully
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
 *                     email:
 *                       type: string
 *                     role:
 *                       type: string
 *                     isActive:
 *                       type: boolean
 *                     token:
 *                       type: string
 *                 message:
 *                   type: string
 *       400:
 *         description: Validation error or User already exists
 *       500:
 *         description: Server error
 */
router.post('/register', userController.register);

/**
 * @swagger
 * /api/users/login:
 *   post:
 *     summary: Login user
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 description: User's email address
 *                 example: admin@example1.com
 *               password:
 *                 type: string
 *                 format: password
 *                 description: User's password
 *                 example: admin123
 *     responses:
 *       200:
 *         description: Login successful
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
 *                     email:
 *                       type: string
 *                     role:
 *                       type: string
 *                     isActive:
 *                       type: boolean
 *                     token:
 *                       type: string
 *                 message:
 *                   type: string
 *                   example: Login successful
 *       401:
 *         description: Invalid credentials
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
 *                   example: INVALID_CREDENTIALS
 *                 message:
 *                   type: string
 *                   example: Invalid email or password
 *       500:
 *         description: Server error
 */
router.post('/login', userController.login);

/**
 * @swagger
 * /api/users/change-password:
 *   put:
 *     summary: Change user password
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - currentPassword
 *               - newPassword
 *             properties:
 *               currentPassword:
 *                 type: string
 *                 format: password
 *                 description: Current password
 *                 example: password123
 *               newPassword:
 *                 type: string
 *                 format: password
 *                 description: New password (min 6 characters)
 *                 example: newpassword123
 *     responses:
 *       200:
 *         description: Password changed successfully
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
 *                     token:
 *                       type: string
 *                       description: New JWT token
 *                 message:
 *                   type: string
 *                   example: Password changed successfully
 *       400:
 *         description: Validation error or Same password
 *       401:
 *         description: Invalid current password or Not authorized
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
 */
router.put('/change-password', protect, userController.changePassword);

/**
 * @swagger
 * /api/users/create-admin:
 *   post:
 *     summary: Create admin account
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *               - password
 *               - adminSecret
 *             properties:
 *               name:
 *                 type: string
 *                 description: Admin's full name
 *                 example: Admin User
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Admin's email address
 *                 example: admin@example.com
 *               password:
 *                 type: string
 *                 format: password
 *                 description: Admin's password (min 6 characters)
 *                 example: admin123
 *               adminSecret:
 *                 type: string
 *                 description: Secret key for admin creation
 *                 example: your_admin_secret
 *     responses:
 *       201:
 *         description: Admin created successfully
 *       400:
 *         description: Validation error or Admin exists
 *       401:
 *         description: Invalid admin secret
 *       500:
 *         description: Server error
 */
router.post('/create-admin', userController.createAdmin);

/**
 * @swagger
 * /api/users:
 *   get:
 *     summary: Get all users (admin only)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of all users
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
 *                     $ref: '#/components/schemas/User'
 *                 message:
 *                   type: string
 *       401:
 *         description: Not authorized
 *       403:
 *         description: Not admin
 *       500:
 *         description: Server error
 */
router.get('/', 
    protect, 
    hasRole(['admin']), 
    hasPermission(['view_users']), 
    userController.getAllUsers
);

/**
 * @swagger
 * /api/users/{userId}:
 *   get:
 *     summary: Get user by ID (admin only)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: userId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   $ref: '#/components/schemas/User'
 *                 message:
 *                   type: string
 *                   example: User retrieved successfully
 *       401:
 *         description: Not authorized
 *       403:
 *         description: Not admin
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
 */
router.get('/:userId', 
    protect, 
    hasRole(['admin']), 
    hasPermission(['view_users']), 
    userController.getUserById
);

/**
 * @swagger
 * /api/users/{userId}:
 *   delete:
 *     summary: Delete a user (admin only)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: userId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User deleted successfully
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
 *                   example: User deleted successfully
 *       400:
 *         description: Invalid operation (e.g. admin trying to delete themselves)
 *       401:
 *         description: Not authorized
 *       403:
 *         description: Insufficient permissions
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
 */
router.delete('/:userId', 
    protect, 
    hasRole(['admin']), 
    hasPermission(['manage_users']), 
    userController.deleteUser
);

/**
 * @swagger
 * /api/users/me:
 *   put:
 *     summary: Update user profile (requires current password)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - currentPassword
 *             properties:
 *               name:
 *                 type: string
 *                 description: User's full name
 *                 example: John Updated
 *               email:
 *                 type: string
 *                 format: email
 *                 description: User's email address
 *                 example: john.updated@example.com
 *               currentPassword:
 *                 type: string
 *                 format: password
 *                 description: Current password for verification
 *                 example: password123
 *     responses:
 *       200:
 *         description: Profile updated successfully
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
 *                     email:
 *                       type: string
 *                     role:
 *                       type: string
 *                     isActive:
 *                       type: boolean
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *                     lastLogin:
 *                       type: string
 *                       format: date-time
 *                 message:
 *                   type: string
 *                   example: Profile updated successfully
 *       400:
 *         description: Validation error or Email already in use
 *       401:
 *         description: Not authorized or Current password is incorrect
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
 */
router.put('/me', protect, userController.updateProfile);

/**
 * @swagger
 * /api/users/{userId}:
 *   put:
 *     summary: Update user (admin only)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: userId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: User's full name
 *                 example: John Updated
 *               email:
 *                 type: string
 *                 format: email
 *                 description: User's email address
 *                 example: john.updated@example.com
 *               isActive:
 *                 type: boolean
 *                 description: User's active status
 *                 example: true
 *     responses:
 *       200:
 *         description: User updated successfully
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
 *                     email:
 *                       type: string
 *                     role:
 *                       type: string
 *                     isActive:
 *                       type: boolean
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *                     lastLogin:
 *                       type: string
 *                       format: date-time
 *                 message:
 *                   type: string
 *                   example: User updated successfully
 *       400:
 *         description: Validation error or Email already in use
 *       401:
 *         description: Not authorized
 *       403:
 *         description: Insufficient permissions
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
 */
router.put('/:userId', 
    protect, 
    hasRole(['admin']), 
    hasPermission(['manage_users']), 
    userController.updateUser
);

/**
 * @swagger
 * /api/users/admin/dashboard-metrics:
 *   get:
 *     summary: Get user dashboard metrics for admin
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [7d, 30d, 90d, 365d]
 *           default: 7d
 *         description: Time period for metrics calculation
 *     responses:
 *       200:
 *         description: Dashboard metrics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     summary:
 *                       type: object
 *                       properties:
 *                         totalNewUsers:
 *                           type: integer
 *                           description: Total new users in the selected period
 *                           example: 124
 *                         averageNewUsersPerDay:
 *                           type: integer
 *                           description: Average new users per day
 *                           example: 17
 *                         growthRate:
 *                           type: integer
 *                           description: Growth rate compared to previous period
 *                           example: 25
 *                         activationRate:
 *                           type: string
 *                           description: Percentage of active users
 *                           example: "87%"
 *                     charts:
 *                       type: array
 *                       description: Daily data for chart visualization
 *                       items:
 *                         type: object
 *                         properties:
 *                           date:
 *                             type: string
 *                             example: "T2, 15/3"
 *                           newUsers:
 *                             type: integer
 *                             example: 12
 *                           totalUsers:
 *                             type: integer
 *                             example: 1250
 *                           activeUsers:
 *                             type: integer
 *                             example: 450
 *       401:
 *         description: Not authorized, token failed
 *       403:
 *         description: Not authorized as admin
 *       500:
 *         description: Server error
 */
router.get('/admin/dashboard-metrics', protect, hasRole(['admin']), userController.getUserDashboardMetrics.bind(userController));

module.exports = router; 