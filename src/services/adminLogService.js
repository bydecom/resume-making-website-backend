const AdminLog = require('../models/adminLogModel');

/**
 * Ghi log hành động của admin
 * @param {Object} logData - Dữ liệu log
 * @param {string} logData.adminId - ID của admin
 * @param {string} logData.action - Hành động thực hiện
 * @param {Object} logData.details - Chi tiết hành động
 * @param {Object} req - Express request object
 * @returns {Promise<Object>} - Log đã được tạo
 */
const createAdminLog = async (logData, req) => {
  try {
    const ipAddress = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    const userAgent = req.headers['user-agent'];

    const log = await AdminLog.create({
      adminId: logData.adminId,
      action: logData.action,
      details: logData.details || {},
      ipAddress,
      userAgent
    });

    return log;
  } catch (error) {
    console.error('Error creating admin log:', error);
    // Không throw lỗi để không ảnh hưởng đến luồng chính
    return null;
  }
};

/**
 * Lấy danh sách log của admin
 * @param {Object} filter - Điều kiện lọc
 * @param {Object} options - Tùy chọn phân trang
 * @returns {Promise<Object>} - Danh sách log
 */
const getAdminLogs = async (filter = {}, options = {}) => {
  const page = parseInt(options.page, 10) || 1;
  const limit = parseInt(options.limit, 10) || 10;
  const skip = (page - 1) * limit;

  // Default sort if not provided
  const sortOption = options.sort || { timestamp: -1 };

  const logs = await AdminLog.find(filter)
    .sort(sortOption) // Use the sort from options
    .skip(skip)
    .limit(limit)
    .populate('adminId', 'name email');

  const total = await AdminLog.countDocuments(filter);

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
  createAdminLog,
  getAdminLogs
}; 