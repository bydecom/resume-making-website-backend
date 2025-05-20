const User = require('../models/userModel');
const generateToken = require('../utils/generateToken');
const { registerValidator, loginValidator, changePasswordValidator, createAdminValidator, updateUserValidator, updateUserWithPasswordValidator } = require('../validators/userValidator');
const { createAdminLog } = require('../services/adminLogService');
const moment = require('moment'); // Thêm thư viện moment để xử lý ngày tháng dễ dàng hơn
const UserLog = require('../models/userLogModel'); // Add this line

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

            // Log user registration
            await UserLog.create({
                userId: user._id,
                action: 'register',
                entityId: user._id,
                entityType: 'User',
                details: {
                    name: user.name,
                    email: user.email,
                    timestamp: new Date()
                },
                ipAddress: req.headers['x-forwarded-for'] || req.connection.remoteAddress,
                userAgent: req.headers['user-agent']
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

            // Log user login
            await UserLog.create({
                userId: user._id,
                action: 'login',
                entityId: user._id,
                entityType: 'User',
                details: {
                    email: user.email,
                    timestamp: new Date()
                },
                ipAddress: req.headers['x-forwarded-for'] || req.connection.remoteAddress,
                userAgent: req.headers['user-agent']
            });

            // Ghi log vào AdminLog nếu người đăng nhập là admin
            if (user.role === 'admin') {
                await createAdminLog({
                    adminId: user._id, // Sử dụng ID của admin đang đăng nhập
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

            // Log password change
            await UserLog.create({
                userId: user._id,
                action: 'change_password',
                entityId: user._id,
                entityType: 'User',
                details: {
                    timestamp: new Date()
                },
                ipAddress: req.headers['x-forwarded-for'] || req.connection.remoteAddress,
                userAgent: req.headers['user-agent']
            });

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

    // @desc    Get user profile
    // @route   GET /api/users/me
    // @access  Private
    async getUserProfile(req, res) {
        try {
            const user = await User.findOne({ _id: req.user._id, is_deleted: false });

            if (!user) {
                return res.status(404).json({
                    status: 'error',
                    code: 'USER_NOT_FOUND',
                    message: 'User not found'
                });
            }

            return res.status(200).json({
                status: 'success',
                data: {
                    _id: user._id,
                    name: user.name,
                    email: user.email,
                    role: user.role,
                    isActive: user.isActive,
                    createdAt: user.createdAt,
                    lastLogin: user.lastLogin
                }
            });
        } catch (error) {
            console.error('Get Profile Error:', error);
            return res.status(500).json({
                status: 'error',
                code: 'SERVER_ERROR',
                message: 'Failed to get user profile'
            });
        }
    }

    // @desc    Get user by ID
    // @route   GET /api/users/:id
    // @access  Private/Admin
    async getUserById(req, res) {
        try {
            const user = await User.findOne({ _id: req.params.id, is_deleted: false });
            
            if (!user) {
                return res.status(404).json({
                    status: 'error',
                    code: 'USER_NOT_FOUND',
                    message: 'User not found'
                });
            }

            return res.status(200).json({
                status: 'success',
                data: {
                    _id: user._id,
                    name: user.name,
                    email: user.email,
                    role: user.role,
                    isActive: user.isActive,
                    createdAt: user.createdAt,
                    lastLogin: user.lastLogin
                }
            });
        } catch (error) {
            console.error('Get User Error:', error);
            return res.status(500).json({
                status: 'error',
                code: 'SERVER_ERROR',
                message: 'Failed to get user'
            });
        }
    }

    // @desc    Delete user
    // @route   DELETE /api/users/:id
    // @access  Private/Admin
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

            // Soft delete
            user.is_deleted = true;
            user.deleted_at = new Date();
            await user.save();

            // Log user deletion
            await UserLog.create({
                userId: req.user._id, // Admin user performing the delete
                action: 'delete_user',
                entityId: req.params.userId, // ID of user being deleted
                entityType: 'User',
                details: {
                    userEmail: user.email,
                    timestamp: new Date()
                },
                ipAddress: req.headers['x-forwarded-for'] || req.connection.remoteAddress,
                userAgent: req.headers['user-agent']
            });

            // Ghi log nếu người xóa là admin
            if (req.user && req.user.role === 'admin') {
                await createAdminLog({
                    adminId: req.user._id,
                    action: 'delete_user',
                    details: {
                        userId: user._id,
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
                message: 'Failed to delete user'
            });
        }
    }

    // @desc    Update user profile (for regular users)
    // @route   PUT /api/users/me
    // @access  Private
    async updateProfile(req, res) {
        try {
            // Validate request body
            const { error } = updateUserWithPasswordValidator.validate(req.body);
            if (error) {
                return res.status(400).json({
                    status: 'error',
                    code: 'VALIDATION_ERROR',
                    message: error.details[0].message
                });
            }

            const user = await User.findById(req.user._id).select('+password');
            if (!user) {
                return res.status(404).json({
                    status: 'error',
                    code: 'USER_NOT_FOUND',
                    message: 'User not found'
                });
            }

            // Verify current password
            const isMatch = await user.matchPassword(req.body.currentPassword);
            if (!isMatch) {
                return res.status(401).json({
                    status: 'error',
                    code: 'INVALID_PASSWORD',
                    message: 'Current password is incorrect'
                });
            }

            // Update fields
            if (req.body.name) user.name = req.body.name;
            
            // Kiểm tra email mới có trùng với email người dùng khác không
            if (req.body.email && req.body.email !== user.email) {
                const existingUser = await User.findOne({ email: req.body.email });
                if (existingUser) {
                    return res.status(400).json({
                        status: 'error',
                        code: 'EMAIL_EXISTS',
                        message: 'Email already in use'
                    });
                }
                user.email = req.body.email;
            }

            const updatedUser = await user.save();

            // Log user profile update
            await UserLog.create({
                userId: updatedUser._id,
                action: 'update_profile',
                entityId: updatedUser._id,
                entityType: 'User',
                details: {
                    changes: req.body, // Log what fields were changed
                    timestamp: new Date()
                },
                ipAddress: req.headers['x-forwarded-for'] || req.connection.remoteAddress,
                userAgent: req.headers['user-agent']
            });

            return res.status(200).json({
                status: 'success',
                data: {
                    _id: updatedUser._id,
                    name: updatedUser.name,
                    email: updatedUser.email,
                    role: updatedUser.role,
                    isActive: updatedUser.isActive,
                    createdAt: updatedUser.createdAt,
                    lastLogin: updatedUser.lastLogin
                },
                message: 'Profile updated successfully'
            });

        } catch (error) {
            console.error('Update Profile Error:', error);
            return res.status(500).json({
                status: 'error',
                code: 'SERVER_ERROR',
                message: 'Internal server error'
            });
        }
    }

    // @desc    Update user (admin only)
    // @route   PUT /api/users/:userId
    // @access  Private (Admin only)
    async updateUser(req, res) {
        try {
            // Validate request body
            const { error } = updateUserValidator.validate(req.body);
            if (error) {
                return res.status(400).json({
                    status: 'error',
                    code: 'VALIDATION_ERROR',
                    message: error.details[0].message
                });
            }

            // Tìm người dùng trước khi cập nhật để lưu giá trị cũ
            const userBeforeUpdate = await User.findById(req.params.userId);
            if (!userBeforeUpdate) {
                return res.status(404).json({
                    status: 'error',
                    code: 'USER_NOT_FOUND',
                    message: 'User not found'
                });
            }

            // Lưu trữ các giá trị cũ để so sánh sau khi cập nhật
            const oldValues = {
                name: userBeforeUpdate.name,
                email: userBeforeUpdate.email,
                isActive: userBeforeUpdate.isActive
            };

            // Cập nhật các trường
            let hasChanges = false;
            const changedFields = [];

            // Cập nhật tên
            if (req.body.name && req.body.name !== userBeforeUpdate.name) {
                userBeforeUpdate.name = req.body.name;
                changedFields.push({
                    field: 'name',
                    oldValue: oldValues.name,
                    newValue: req.body.name
                });
                hasChanges = true;
            }
            
            // Cập nhật email
            if (req.body.email && req.body.email !== userBeforeUpdate.email) {
            // Kiểm tra email mới có trùng với email người dùng khác không
                const existingUser = await User.findOne({ 
                    email: req.body.email,
                    _id: { $ne: req.params.userId } // Loại trừ user hiện tại
                });
                
                if (existingUser) {
                    return res.status(400).json({
                        status: 'error',
                        code: 'EMAIL_EXISTS',
                        message: 'Email already in use'
                    });
                }
                
                userBeforeUpdate.email = req.body.email;
                changedFields.push({
                    field: 'email',
                    oldValue: oldValues.email,
                    newValue: req.body.email
                });
                hasChanges = true;
            }

            // Cập nhật trạng thái active (chỉ admin mới có thể cập nhật)
            if (req.body.isActive !== undefined && req.body.isActive !== userBeforeUpdate.isActive) {
                userBeforeUpdate.isActive = req.body.isActive;
                changedFields.push({
                    field: 'isActive',
                    oldValue: oldValues.isActive,
                    newValue: req.body.isActive
                });
                hasChanges = true;
            }

            // Lưu người dùng nếu có thay đổi
            if (!hasChanges) {
                return res.status(400).json({
                    status: 'error',
                    code: 'NO_CHANGES',
                    message: 'No changes provided'
                });
            }

            const updatedUser = await userBeforeUpdate.save();

            // Ghi log chi tiết về những thay đổi
            await createAdminLog({
                adminId: req.user._id,
                action: 'update_user',
                details: {
                    userId: updatedUser._id,
                    userEmail: updatedUser.email,
                    changes: changedFields,
                    timestamp: new Date()
                }
            }, req);

            return res.status(200).json({
                status: 'success',
                data: {
                    _id: updatedUser._id,
                    name: updatedUser.name,
                    email: updatedUser.email,
                    role: updatedUser.role,
                    isActive: updatedUser.isActive,
                    createdAt: updatedUser.createdAt,
                    lastLogin: updatedUser.lastLogin
                },
                message: 'User updated successfully'
            });

        } catch (error) {
            console.error('Update User Error:', error);
            return res.status(500).json({
                status: 'error',
                code: 'SERVER_ERROR',
                message: 'Internal server error'
            });
        }
    }

    // @desc    Get user dashboard metrics
    // @route   GET /api/users/admin/dashboard-metrics
    // @access  Private (Admin only)
    async getUserDashboardMetrics(req, res) {
        try {
            const { period = '7d' } = req.query; // Lấy khoảng thời gian, mặc định 7 ngày

            // --- Tính toán các số liệu ---
            const dailyNewUsers = await this.calculateDailyNewUsers(period);
            const { dailyTotalUsers, initialTotalUsers } = await this.calculateDailyTotalUsers(period, dailyNewUsers);
            const dailyActiveUsers = await this.calculateDailyActiveUsers(period);
            const summaryStats = await this.calculateSummaryStats(dailyNewUsers, period, initialTotalUsers);

            // Chuẩn bị dữ liệu biểu đồ cho frontend
            const chartDataForFrontend = [];
            const endDate = moment();
            let daysToIterate = 7; // Mặc định cho 7 ngày

            if (period.endsWith('d')) {
                daysToIterate = parseInt(period.slice(0, -1)) || 7;
            }

            for (let i = daysToIterate - 1; i >= 0; i--) {
                const momentDate = moment(endDate).subtract(i, 'days');
                const formattedDate = momentDate.format('ddd, DD/MM');

                const newUsersData = dailyNewUsers.find(d => moment(d.date).isSame(momentDate, 'day'));
                const totalUsersData = dailyTotalUsers.find(d => moment(d.date).isSame(momentDate, 'day'));
                const activeUsersData = dailyActiveUsers.find(d => moment(d.date).isSame(momentDate, 'day'));

                chartDataForFrontend.push({
                    date: formattedDate,
                    newUsers: newUsersData ? newUsersData.count : 0,
                    totalUsers: totalUsersData ? totalUsersData.count : 0,
                    activeUsers: activeUsersData ? activeUsersData.count : 0,
                });
            }

            return res.status(200).json({
                success: true,
                data: {
                    summary: summaryStats,
                    charts: chartDataForFrontend
                }
            });

        } catch (error) {
            console.error("Error fetching user dashboard metrics:", error);
            return res.status(500).json({ success: false, message: "Server error", error: error.message });
        }
    }

    // Helper methods
    async calculateDailyNewUsers(periodString) {
        console.log(`Calculating daily new users for period: ${periodString}`);
        const days = parseInt(periodString.slice(0, -1)) || 7;
        const results = [];
        for (let i = 0; i < days; i++) {
            const date = moment().subtract(i, 'days').toDate();
            const count = await User.countDocuments({
                createdAt: {
                    $gte: moment(date).startOf('day').toDate(),
                    $lte: moment(date).endOf('day').toDate()
                },
                is_deleted: false
            });
            results.push({ date: moment(date).startOf('day').toDate(), count });
        }
        return results.reverse();
    }

    async calculateDailyTotalUsers(periodString, dailyNewUsersData) {
        console.log(`Calculating daily total users for period: ${periodString}`);
        const days = parseInt(periodString.slice(0, -1)) || 7;
        const endDate = moment().endOf('day');
        const startDateOfPeriod = moment(endDate).subtract(days -1, 'days').startOf('day');

        const initialTotalUsers = await User.countDocuments({
            createdAt: { $lt: startDateOfPeriod.toDate() },
            is_deleted: false
        });

        const dailyTotals = [];
        let accumulatedTotal = initialTotalUsers;

        for (let i = 0; i < days; i++) {
            const currentDate = moment(startDateOfPeriod).add(i, 'days');
            const totalUpToCurrentDate = await User.countDocuments({
                 createdAt: { $lte: currentDate.endOf('day').toDate() },
                 is_deleted: false
            });

            dailyTotals.push({ date: currentDate.toDate(), count: totalUpToCurrentDate });
        }
        return { dailyTotalUsers: dailyTotals, initialTotalUsers };
    }

    async calculateDailyActiveUsers(periodString) {
        console.log(`Calculating daily active users for period: ${periodString}`);
        const days = parseInt(periodString.slice(0, -1)) || 7;
        const results = [];
        for (let i = 0; i < days; i++) {
            const date = moment().subtract(i, 'days').toDate();
            const count = await User.countDocuments({
                lastLogin: {
                    $gte: moment(date).startOf('day').toDate(),
                    $lte: moment(date).endOf('day').toDate()
                },
                is_deleted: false,
                isActive: true
            });
            results.push({ date: moment(date).startOf('day').toDate(), count });
        }
        return results.reverse();
    }

    async calculateSummaryStats(dailyNewUserData, periodString, initialTotalUsersBeforePeriod) {
        console.log(`Calculating summary stats for period: ${periodString}`);
        const totalNewUsersInPeriod = dailyNewUserData.reduce((sum, item) => sum + item.count, 0);
        const numberOfDaysInPeriod = dailyNewUserData.length || (parseInt(periodString.slice(0, -1)) || 7);
        const averageNewUsersPerDay = numberOfDaysInPeriod > 0 ? Math.round(totalNewUsersInPeriod / numberOfDaysInPeriod) : 0;

        const previousPeriodData = await this.calculateDailyNewUsers(`${numberOfDaysInPeriod*2}d`);
        const newUsersInPreviousPeriod = previousPeriodData
            .slice(0, numberOfDaysInPeriod)
            .reduce((sum, item) => sum + item.count, 0);

        let growthRate = 0;
        if (newUsersInPreviousPeriod > 0) {
            growthRate = Math.round(((totalNewUsersInPeriod - newUsersInPreviousPeriod) / newUsersInPreviousPeriod) * 100);
        } else if (totalNewUsersInPeriod > 0) {
            growthRate = 100;
        }

        // Lấy tổng số user (không bị xóa)
        const totalSystemUsers = await User.countDocuments({is_deleted: false});

        return {
            totalNewUsers: totalNewUsersInPeriod,
            averageNewUsersPerDay: averageNewUsersPerDay,
            growthRate: growthRate,
            totalUsers: totalSystemUsers // Thay activationRate bằng totalUsers
        };
    }
}

module.exports = new UserController(); 