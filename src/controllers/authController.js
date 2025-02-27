const { createAdminLog } = require('../services/adminLogService');

// Trong hàm login
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate email & password
    if (!email || !password) {
      return res.status(400).json({
        status: 'error',
        code: 'MISSING_FIELDS',
        message: 'Please provide email and password'
      });
    }

    // Check for user
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      return res.status(401).json({
        status: 'error',
        code: 'INVALID_CREDENTIALS',
        message: 'Invalid credentials'
      });
    }

    // Check if password matches
    const isMatch = await user.matchPassword(password);

    if (!isMatch) {
      return res.status(401).json({
        status: 'error',
        code: 'INVALID_CREDENTIALS',
        message: 'Invalid credentials'
      });
    }

    // Cập nhật thời gian đăng nhập cuối
    user.lastLogin = new Date();
    await user.save();

    // Nếu là admin, ghi log đăng nhập
    if (user.role === 'admin') {
      await createAdminLog({
        adminId: user._id,
        action: 'login',
        details: {
          email: user.email
        }
      }, req);
    }

    // Create token
    const token = user.getSignedJwtToken();

    res.status(200).json({
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
    console.error(error);
    res.status(500).json({
      status: 'error',
      code: 'SERVER_ERROR',
      message: 'Server error'
    });
  }
}; 