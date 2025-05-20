const adminLogService = require('../services/adminLogService');

/**
 * Lấy danh sách log của admin
 * @route GET /api/admin/logs
 * @access Private (Admin only)
 */
exports.getAdminLogs = async (req, res) => {
  try {
    const filter = {};
    
    // Lọc theo admin ID nếu có
    if (req.query.adminId) {
      filter.adminId = req.query.adminId;
    }
    
    // Lọc theo action nếu có
    if (req.query.action) {
      filter.action = req.query.action;
    }
    
    // Lọc theo khoảng thời gian nếu có
    if (req.query.startDate && req.query.endDate) {
      filter.timestamp = {
        $gte: new Date(req.query.startDate),
        $lte: new Date(req.query.endDate)
      };
    }

    // Lấy tham số sắp xếp từ query params
    const sortBy = req.query.sortBy || 'timestamp'; // Mặc định sort theo timestamp
    const sortOrder = req.query.sortOrder === 'asc' ? 1 : -1; // Mặc định desc (hoặc -1)

    const options = {
      page: req.query.page,
      limit: req.query.limit,
      sort: { [sortBy]: sortOrder } // Thêm tùy chọn sort vào options
    };

    // Gọi hàm getAdminLogs từ service sử dụng namespace
    const result = await adminLogService.getAdminLogs(filter, options);

    res.status(200).json({
      status: 'success',
      data: result.logs,
      pagination: result.pagination,
      message: 'Admin logs retrieved successfully'
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

/**
 * Lấy danh sách log của user theo userId
 * @route GET /api/admin/users/:userId/logs
 * @access Private (Admin only)
 */
exports.getUserLogsByUserId = async (req, res) => {
  try {
    const userId = req.params.userId;
    const UserLog = require('../models/userLogModel');
    
    const filter = { userId };
    
    // Lọc theo action nếu có
    if (req.query.action) {
      filter.action = req.query.action;
    }
    
    // Lọc theo entityType nếu có
    if (req.query.entityType) {
      filter.entityType = req.query.entityType;
    }
    
    // Lọc theo khoảng thời gian nếu có
    if (req.query.startDate && req.query.endDate) {
      filter.timestamp = {
        $gte: new Date(req.query.startDate),
        $lte: new Date(req.query.endDate)
      };
    }

    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit;

    const logs = await UserLog.find(filter)
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(limit)
      .populate('userId', 'name email')
      .populate({
        path: 'entityId',
        select: 'name status title position', // Fields from CV, Resume, JobDescription
        options: { lean: true }
      });

    const total = await UserLog.countDocuments(filter);
    
    // Trả về kết quả
    res.status(200).json({
      status: 'success',
      data: logs,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      },
      message: 'User logs retrieved successfully'
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

/**
 * Lấy thống kê hoạt động của user theo userId
 * @route GET /api/admin/users/:userId/stats
 * @access Private (Admin only)
 */
exports.getUserStatsByUserId = async (req, res) => {
  try {
    const userId = req.params.userId;
    const UserLog = require('../models/userLogModel');
    const mongoose = require('mongoose');
    
    const today = new Date();
    const startDate = req.query.startDate 
      ? new Date(req.query.startDate) 
      : new Date(today.setDate(today.getDate() - 30));
    const endDate = req.query.endDate 
      ? new Date(req.query.endDate) 
      : new Date();

    // Tổng số hoạt động trong khoảng thời gian
    const totalActivities = await UserLog.countDocuments({
      userId,
      timestamp: { $gte: startDate, $lte: endDate }
    });

    // Phân loại hoạt động theo loại
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

    // Hoạt động theo thời gian (ngày)
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
    
    // Phân loại theo entityType
    const activityByEntityType = await UserLog.aggregate([
      {
        $match: {
          userId: mongoose.Types.ObjectId(userId),
          timestamp: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: '$entityType',
          count: { $sum: 1 }
        }
      },
      {
        $sort: { count: -1 }
      }
    ]);
    
    // Phân tích thời gian hoạt động
    const activityTimeDistribution = await UserLog.aggregate([
      {
        $match: {
          userId: mongoose.Types.ObjectId(userId),
          timestamp: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: { $hour: '$timestamp' },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);

    // Trả về kết quả
    res.status(200).json({
      status: 'success',
      data: {
        totalActivities,
        activityByType,
        activityByDate,
        activityByEntityType,
        activityTimeDistribution,
        period: {
          startDate,
          endDate
        }
      },
      message: 'User statistics retrieved successfully'
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