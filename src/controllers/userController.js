const User = require('../models/userModel');
const generateToken = require('../utils/generateToken');
const { registerValidator, loginValidator, changePasswordValidator, createAdminValidator } = require('../validators/userValidator');
const { createAdminLog } = require('../services/adminLogService');

class UserController {
    // @desc    Register a new user
    // @route   POST /api/users/register
    // @access  Public
    async register(req, res) {
        try {
            // Validate request body
            const { error } = registerValidator.validate(req.body);
            if (error) {
                return res.status(400).json({
                    status: 'error',
                    code: 'VALIDATION_ERROR',
                    message: error.details[0].message
                });
            }

            const { name, email, password } = req.body;

            // Check if user exists
            const userExists = await User.findOne({ email });
            if (userExists) {
                return res.status(400).json({
                    status: 'error',
                    code: 'USER_EXISTS',
                    message: 'User already exists'
                });
            }

            // Create user
            const user = await User.create({
                name,
                email,
                password,
                isActive: true,
                lastLogin: new Date(),
                createdAt: new Date()
            });

            // Ghi log nếu người tạo là admin
            if (req.user && req.user.role === 'admin') {
                await createAdminLog({
                    adminId: req.user._id,
                    action: 'create_user',
                    details: {
                        userId: user._id,
                        email: user.email,
                        role: user.role
                    }
                }, req);
            }

            if (user) {
                return res.status(201).json({
                    status: 'success',
                    data: {
                        _id: user._id,
                        name: user.name,
                        email: user.email,
                        role: user.role,
                        isActive: user.isActive,
                        createdAt: user.createdAt,
                        token: generateToken(user._id)
                    },
                    message: 'User registered successfully'
                });
            }

        } catch (error) {
            console.error('Register Error:', error);
            return res.status(500).json({
                status: 'error',
                code: 'SERVER_ERROR',
                message: 'Internal server error'
            });
        }
    }

    // @desc    Login user
    // @route   POST /api/users/login
    // @access  Public
    async login(req, res) {
        try {
            const { error } = loginValidator.validate(req.body);
            if (error) {
                return res.status(400).json({
                    status: 'error',
                    code: 'VALIDATION_ERROR',
                    message: error.details[0].message
                });
            }

            const { email, password } = req.body;

            // Debug log
            console.log('Login attempt:', { email });

            // Find user and include password field
            const user = await User.findOne({ email }).select('+password');
            
            if (!user) {
                console.log('User not found:', email);
                return res.status(401).json({
                    status: 'error',
                    code: 'INVALID_CREDENTIALS',
                    message: 'Invalid email or password'
                });
            }

            // Debug log
            console.log('User found:', { 
                userId: user._id,
                hasPassword: !!user.password
            });

            // Check password
            const isMatch = await user.matchPassword(password);
            
            if (!isMatch) {
                console.log('Password mismatch for user:', user._id);
                return res.status(401).json({
                    status: 'error',
                    code: 'INVALID_CREDENTIALS',
                    message: 'Invalid email or password'
                });
            }

            // Update last login
            user.lastLogin = new Date();
            await user.save();

            // Ghi log nếu người đăng nhập là admin
            if (req.user && req.user.role === 'admin') {
                await createAdminLog({
                    adminId: req.user._id,
                    action: 'login',
                    details: {
                        email: user.email
                    }
                }, req);
            }

            // Generate token
            const token = generateToken(user._id);

            return res.status(200).json({
                status: 'success',
                data: {
                    _id: user._id,
                    name: user.name,
                    email: user.email,
                    role: user.role,
                    isActive: user.isActive,
                    createdAt: user.createdAt,
                    lastLogin: user.lastLogin,
                    token
                },
                message: 'Login successful'
            });

        } catch (error) {
            console.error('Login Error:', error);
            return res.status(500).json({
                status: 'error',
                code: 'SERVER_ERROR',
                message: 'Internal server error'
            });
        }
    }

    // @desc    Change user password
    // @route   PUT /api/users/change-password
    // @access  Private (requires token)
    async changePassword(req, res) {
        try {
            // Validate request body
            const { error } = changePasswordValidator.validate(req.body);
            if (error) {
                return res.status(400).json({
                    status: 'error',
                    code: 'VALIDATION_ERROR',
                    message: error.details[0].message
                });
            }

            const { currentPassword, newPassword } = req.body;

            // Get user from auth middleware (includes password)
            const user = await User.findById(req.user._id).select('+password');
            if (!user) {
                return res.status(404).json({
                    status: 'error',
                    code: 'USER_NOT_FOUND',
                    message: 'User not found'
                });
            }

            // Verify current password
            const isMatch = await user.matchPassword(currentPassword);
            if (!isMatch) {
                return res.status(401).json({
                    status: 'error',
                    code: 'INVALID_PASSWORD',
                    message: 'Current password is incorrect'
                });
            }

            // Check if new password is same as current
            const isSamePassword = await user.matchPassword(newPassword);
            if (isSamePassword) {
                return res.status(400).json({
                    status: 'error',
                    code: 'SAME_PASSWORD',
                    message: 'New password must be different from current password'
                });
            }

            // Update password
            user.password = newPassword;
            await user.save();

            // Ghi log nếu người cập nhật là admin
            if (req.user && req.user.role === 'admin') {
                await createAdminLog({
                    adminId: req.user._id,
                    action: 'update_user',
                    details: {
                        userId: user._id,
                        email: user.email,
                        updatedFields: ['password']
                    }
                }, req);
            }

            // Generate new token
            const token = generateToken(user._id);

            return res.status(200).json({
                status: 'success',
                data: {
                    token: token
                },
                message: 'Password changed successfully'
            });

        } catch (error) {
            console.error('Change Password Error:', error);
            return res.status(500).json({
                status: 'error',
                code: 'SERVER_ERROR',
                message: 'Internal server error'
            });
        }
    }

    // @desc    Create admin account
    // @route   POST /api/users/create-admin
    // @access  Public (with admin secret)
    async createAdmin(req, res) {
        try {
            // Validate request body
            const { error } = createAdminValidator.validate(req.body);
            if (error) {
                return res.status(400).json({
                    status: 'error',
                    code: 'VALIDATION_ERROR',
                    message: error.details[0].message
                });
            }

            const { name, email, password, adminSecret } = req.body;

            // Verify admin secret
            if (adminSecret !== process.env.ADMIN_SECRET) {
                return res.status(401).json({
                    status: 'error',
                    code: 'INVALID_ADMIN_SECRET',
                    message: 'Invalid admin secret'
                });
            }

            // Check if admin exists
            const adminExists = await User.findOne({ email });
            if (adminExists) {
                return res.status(400).json({
                    status: 'error',
                    code: 'ADMIN_EXISTS',
                    message: 'Admin already exists'
                });
            }

            // Create admin with roles and permissions
            const admin = await User.create({
                name,
                email,
                password,
                role: 'admin',
                permissions: User.getDefaultPermissions('admin'),
                isActive: true,
                lastLogin: new Date(),
                createdAt: new Date()
            });

            // Ghi log nếu người tạo là admin
            if (req.user && req.user.role === 'admin') {
                await createAdminLog({
                    adminId: req.user._id,
                    action: 'create_user',
                    details: {
                        userId: admin._id,
                        email: admin.email,
                        role: admin.role
                    }
                }, req);
            }

            return res.status(201).json({
                status: 'success',
                data: {
                    _id: admin._id,
                    name: admin.name,
                    email: admin.email,
                    role: admin.role,
                    isActive: admin.isActive,
                    createdAt: admin.createdAt,
                    token: generateToken(admin._id)
                },
                message: 'Admin created successfully'
            });

        } catch (error) {
            console.error('Create Admin Error:', error);
            return res.status(500).json({
                status: 'error',
                code: 'SERVER_ERROR',
                message: 'Internal server error'
            });
        }
    }

    // @desc    Get all users (admin only)
    // @route   GET /api/users
    // @access  Private (Admin only)
    async getAllUsers(req, res) {
        try {
            const users = await User.find().select('-password');
            return res.status(200).json({
                status: 'success',
                data: users,
                message: 'Users retrieved successfully'
            });
        } catch (error) {
            console.error('Get Users Error:', error);
            return res.status(500).json({
                status: 'error',
                code: 'SERVER_ERROR',
                message: 'Internal server error'
            });
        }
    }

    // @desc    Delete user
    // @route   DELETE /api/users/:userId
    // @access  Private (Admin only)
    async deleteUser(req, res) {
        try {
            const user = await User.findById(req.params.userId);

            if (!user) {
                return res.status(404).json({
                    status: 'error',
                    code: 'USER_NOT_FOUND',
                    message: 'User not found'
                });
            }

            // Prevent admin from deleting themselves
            if (user._id.toString() === req.user._id.toString()) {
                return res.status(400).json({
                    status: 'error',
                    code: 'INVALID_OPERATION',
                    message: 'Admin cannot delete themselves'
                });
            }

            await user.deleteOne();

            // Ghi log nếu người xóa là admin
            if (req.user && req.user.role === 'admin') {
                await createAdminLog({
                    adminId: req.user._id,
                    action: 'delete_user',
                    details: {
                        userId: req.params.userId,
                        email: user.email
                    }
                }, req);
            }

            return res.status(200).json({
                status: 'success',
                message: 'User deleted successfully'
            });

        } catch (error) {
            console.error('Delete User Error:', error);
            return res.status(500).json({
                status: 'error',
                code: 'SERVER_ERROR',
                message: 'Internal server error'
            });
        }
    }
}

module.exports = new UserController(); 