const UserLog = require('../models/userLogModel');

/**
 * Ghi log hành động của user
 * @param {Object} logData - Dữ liệu log
 * @param {string} logData.userId - ID của user
 * @param {string} logData.action - Hành động thực hiện
 * @param {string} logData.entityId - ID của đối tượng liên quan (optional)
 * @param {string} logData.entityType - Loại đối tượng liên quan (optional)
 * @param {Object} logData.details - Chi tiết hành động (optional)
 * @param {Object} req - Express request object
 * @returns {Promise<Object>} - Log đã được tạo
 */
const createUserLog = async (logData, req) => {
  try {
    const ipAddress = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    const userAgent = req.headers['user-agent'];

    const log = await UserLog.create({
      userId: logData.userId,
      action: logData.action,
      entityId: logData.entityId || null,
      entityType: logData.entityType || 'other',
      details: logData.details || {},
      ipAddress,
      userAgent
    });

    return log;
  } catch (error) {
    console.error('Error creating user log:', error);
    // Không throw lỗi để không ảnh hưởng đến luồng chính
    return null;
  }
};

/**
 * Lấy danh sách log của người dùng
 * @param {Object} filter - Điều kiện lọc
 * @param {Object} options - Tùy chọn phân trang
 * @returns {Promise<Object>} - Danh sách log
 */
const getUserLogs = async (filter = {}, options = {}) => {
  const page = parseInt(options.page, 10) || 1;
  const limit = parseInt(options.limit, 10) || 10;
  const skip = (page - 1) * limit;

  // Sử dụng options.sort nếu có, ngược lại dùng mặc định
  const sortOption = options.sort || { timestamp: -1 };

  const logs = await UserLog.find(filter)
    .sort(sortOption)  // Sử dụng sortOption thay vì hardcode
    .skip(skip)
    .limit(limit)
    .populate('userId', 'name email')
    .populate({
      path: 'entityId',
      select: 'name status title position', // Fields từ CV, Resume, JobDescription
      options: { lean: true }
    });

  const total = await UserLog.countDocuments(filter);

  return {
    logs,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    }
  };
};

/**
 * Get user activity stats
 * @param {string} userId - ID of user
 * @param {Object} options - Time options
 * @returns {Promise<Object>} - Activity stats
 */
const getUserActivityStats = async (userId, options = {}) => {
  const today = new Date();
  const startDate = options.startDate ? new Date(options.startDate) : new Date(today.setDate(today.getDate() - 30));
  const endDate = options.endDate ? new Date(options.endDate) : new Date();

  // Total activities in time range
  const totalActivities = await UserLog.countDocuments({
    userId,
    timestamp: { $gte: startDate, $lte: endDate }
  });

  // Classify activities by type
  const activityByType = await UserLog.aggregate([
    {
      $match: {
        userId: mongoose.Types.ObjectId(userId),
        timestamp: { $gte: startDate, $lte: endDate }
      }
    },
    {
      $group: {
        _id: '$action',
        count: { $sum: 1 }
      }
    },
    {
      $sort: { count: -1 }
    }
  ]);

  // Activities by time (day)
  const activityByDate = await UserLog.aggregate([
    {
      $match: {
        userId: mongoose.Types.ObjectId(userId),
        timestamp: { $gte: startDate, $lte: endDate }
      }
    },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$timestamp' } },
        count: { $sum: 1 }
      }
    },
    {
      $sort: { _id: 1 }
    }
  ]);

  return {
    totalActivities,
    activityByType,
    activityByDate
  };
};

/**
 * Get all user logs
 * @param {Object} filter - Filter conditions
 * @param {Object} options - Pagination options
 * @returns {Promise<Object>} - List of logs
 */
const getAllUserLogs = async (filter = {}, options = {}) => {
  const page = parseInt(options.page, 10) || 1;
  const limit = parseInt(options.limit, 10) || 10;
  const skip = (page - 1) * limit;
  
  // Use options.sort if provided, otherwise use default
  const sortOption = options.sort || { timestamp: -1 };

  // Only filter logs of users (excluding admin logs)
  const userFilter = { ...filter };
  
    //Filter by role !== 'admin'

  const logs = await UserLog.find(userFilter)
    .sort(sortOption)  // Sử dụng sortOption thay vì hardcode
    .skip(skip)
    .limit(limit)
    .populate('userId', 'name email role') // Thêm thông tin người dùng
    .populate({
      path: 'entityId',
      select: 'name status title position', // Fields từ CV, Resume, JobDescription
      options: { lean: true }
    });

  const total = await UserLog.countDocuments(userFilter);

  return {
    logs,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    }
  };
};

module.exports = {
  createUserLog,
  getUserLogs,
  getUserActivityStats,
  getAllUserLogs,
};
