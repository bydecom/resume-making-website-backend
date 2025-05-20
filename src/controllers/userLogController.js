const { createUserLog, getUserLogs, getUserActivityStats, getUserDashboardMetrics, getAllUserLogs } = require('../services/userLogService');

/**
 * @desc    Lấy danh sách log hoạt động của người dùng hiện tại
 * @route   GET /api/users/activity-logs
 * @access  Private
 */
exports.getCurrentUserLogs = async (req, res) => {
  try {
    const userId = req.user._id;
    
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

    const options = {
      page: req.query.page,
      limit: req.query.limit
    };

    const result = await getUserLogs(filter, options);

    res.status(200).json({
      status: 'success',
      data: result.logs,
      pagination: result.pagination,
      message: 'User logs retrieved successfully'
    });
  } catch (error) {
    console.error('Error retrieving user logs:', error);
    res.status(500).json({
      status: 'error',
      code: 'SERVER_ERROR',
      message: 'Server error'
    });
  }
};

/**
 * @desc    Lấy thống kê hoạt động của người dùng hiện tại
 * @route   GET /api/users/activity-stats
 * @access  Private
 */
exports.getCurrentUserActivityStats = async (req, res) => {
  try {
    const userId = req.user._id;
    
    const options = {
      startDate: req.query.startDate,
      endDate: req.query.endDate
    };

    const stats = await getUserActivityStats(userId, options);

    res.status(200).json({
      status: 'success',
      data: stats,
      message: 'User activity statistics retrieved successfully'
    });
  } catch (error) {
    console.error('Error retrieving user activity stats:', error);
    res.status(500).json({
      status: 'error',
      code: 'SERVER_ERROR',
      message: 'Server error'
    });
  }
};

/**
 * @desc    Lấy danh sách log hoạt động của một người dùng cụ thể (dành cho admin)
 * @route   GET /api/admin/users/:userId/activity-logs
 * @access  Private (Admin only)
 */
exports.getUserLogsByAdmin = async (req, res) => {
  try {
    const userId = req.params.userId;
    
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

    const options = {
      page: req.query.page,
      limit: req.query.limit
    };

    const result = await getUserLogs(filter, options);

    res.status(200).json({
      status: 'success',
      data: result.logs,
      pagination: result.pagination,
      message: 'User logs retrieved successfully'
    });
  } catch (error) {
    console.error('Error retrieving user logs by admin:', error);
    res.status(500).json({
      status: 'error',
      code: 'SERVER_ERROR',
      message: 'Server error'
    });
  }
};

/**
 * @desc    Lấy thống kê hoạt động của tất cả người dùng (dành cho admin)
 * @route   GET /api/admin/users/activity-stats
 * @access  Private (Admin only)
 */
exports.getAllUsersActivityStats = async (req, res) => {
  try {
    // Tổng số log trong hệ thống
    const totalLogs = await UserLog.countDocuments();
    
    // Số hoạt động trong 7 ngày qua
    const lastWeekDate = new Date();
    lastWeekDate.setDate(lastWeekDate.getDate() - 7);
    
    const lastWeekLogs = await UserLog.countDocuments({
      timestamp: { $gte: lastWeekDate }
    });
    
    // Phân loại theo loại hoạt động
    const activityByType = await UserLog.aggregate([
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
    
    // Phân loại theo entityType
    const activityByEntityType = await UserLog.aggregate([
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
    
    // Người dùng hoạt động nhiều nhất
    const mostActiveUsers = await UserLog.aggregate([
      {
        $group: {
          _id: '$userId',
          count: { $sum: 1 }
        }
      },
      {
        $sort: { count: -1 }
      },
      {
        $limit: 10
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'user'
        }
      },
      {
        $unwind: '$user'
      },
      {
        $project: {
          _id: 1,
          count: 1,
          'user.name': 1,
          'user.email': 1
        }
      }
    ]);

    res.status(200).json({
      status: 'success',
      data: {
        totalLogs,
        lastWeekLogs,
        activityByType,
        activityByEntityType,
        mostActiveUsers
      },
      message: 'System activity statistics retrieved successfully'
    });
  } catch (error) {
    console.error('Error retrieving system activity stats:', error);
    res.status(500).json({
      status: 'error',
      code: 'SERVER_ERROR',
      message: 'Server error'
    });
  }
};

/**
 * @desc    Lấy logs activities của tất cả user (dành cho admin)
 * @route   GET /api/admin/users/all-logs
 * @access  Private (Admin only)
 */
exports.getAllUserLogs = async (req, res) => {
  try {
    const filter = {};
    
    // Lọc theo userId nếu có
    if (req.query.userId) {
      filter.userId = req.query.userId;
    }
    
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

    const options = {
      page: req.query.page,
      limit: req.query.limit
    };

    const result = await getAllUserLogs(filter, options);

    res.status(200).json({
      status: 'success',
      data: result.logs,
      pagination: result.pagination,
      message: 'All user logs retrieved successfully'
    });
  } catch (error) {
    console.error('Error retrieving all user logs:', error);
    res.status(500).json({
      status: 'error',
      code: 'SERVER_ERROR',
      message: 'Server error'
    });
  }
};

/**
 * @desc    Lấy số liệu thống kê về CV và Resume
 * @route   GET /api/user-logs/statistics
 * @access  Private (Admin only)
 */
exports.getDocumentStatistics = async (req, res) => {
  try {
    const UserLog = require('../models/userLogModel');
    const CV = require('../models/cvModel');
    const Resume = require('../models/resumeModel');
    
    // Xử lý lọc theo period hoặc khoảng thời gian cụ thể
    let startDate = req.query.startDate ? new Date(req.query.startDate) : null;
    let endDate = req.query.endDate ? new Date(req.query.endDate) : null;
    
    // Hỗ trợ lọc nhanh theo period (7d, 30d, 90d, 365d)
    const { period } = req.query;
    if (period && !startDate) {
      endDate = new Date(); // Ngày hiện tại
      
      if (period === '7d') {
        startDate = new Date(endDate);
        startDate.setDate(startDate.getDate() - 7);
      } else if (period === '30d') {
        startDate = new Date(endDate);
        startDate.setDate(startDate.getDate() - 30);
      } else if (period === '90d') {
        startDate = new Date(endDate);
        startDate.setDate(startDate.getDate() - 90);
      } else if (period === '365d' || period === '1y') {
        startDate = new Date(endDate);
        startDate.setDate(startDate.getDate() - 365);
      } else if (period === 'all') {
        // Không cần filter theo thời gian
        startDate = null;
        endDate = null;
      }
    }
    
    // Điều kiện thời gian cho truy vấn
    const timeFilter = {};
    if (startDate && endDate) {
      timeFilter.timestamp = { $gte: startDate, $lte: endDate };
    }
    
    // --- Thống kê CV ---
    // Tổng số CV được tạo (không phân biệt is_deleted)
    const totalCVsCreated = await UserLog.countDocuments({
      action: 'create_cv',
      ...timeFilter
    });
    
    // Tổng số CV active hiện tại
    const activeCVs = await CV.countDocuments({ is_deleted: false });
    
    // Tổng số CV đã được tải xuống
    const totalCVDownloads = await UserLog.countDocuments({
      action: 'download_cv',
      ...timeFilter
    });
    
    // --- Thống kê Resume ---
    // Tổng số Resume được tạo (không phân biệt is_deleted)
    const totalResumesCreated = await UserLog.countDocuments({
      action: 'create_resume',
      ...timeFilter
    });
    
    // Tổng số Resume active hiện tại
    const activeResumes = await Resume.countDocuments({ is_deleted: false });
    
    // Tổng số Resume đã được tải xuống
    const totalResumeDownloads = await UserLog.countDocuments({
      action: 'download_resume',
      ...timeFilter
    });
    
    // --- Thống kê theo thời gian ---
    // CV và Resume tạo mới theo tháng
    const monthlyCreationStats = await getMonthlyCreationStats(timeFilter);
    
    // CV và Resume download theo tháng
    const monthlyDownloadStats = await getMonthlyDownloadStats(timeFilter);
    
    return res.status(200).json({
      status: 'success',
      data: {
        cv: {
          totalCreated: totalCVsCreated,
          activeCount: activeCVs,
          totalDownloads: totalCVDownloads
        },
        resume: {
          totalCreated: totalResumesCreated,
          activeCount: activeResumes, 
          totalDownloads: totalResumeDownloads
        },
        timeBasedStats: {
          creationByMonth: monthlyCreationStats,
          downloadsByMonth: monthlyDownloadStats
        }
      },
      message: 'Thống kê CV và Resume lấy thành công'
    });
  } catch (error) {
    console.error('Error retrieving document statistics:', error);
    return res.status(500).json({
      status: 'error',
      code: 'SERVER_ERROR',
      message: 'Lỗi server khi lấy thống kê'
    });
  }
};

/**
 * Hàm hỗ trợ lấy số liệu tạo mới theo tháng
 */
const getMonthlyCreationStats = async (timeFilter) => {
  const UserLog = require('../models/userLogModel');
  
  // Số lượng CV và Resume được tạo theo tháng
  const monthlyStats = await UserLog.aggregate([
    {
      $match: {
        action: { $in: ['create_cv', 'create_resume'] },
        ...timeFilter
      }
    },
    {
      $group: {
        _id: {
          year: { $year: "$timestamp" },
          month: { $month: "$timestamp" },
          action: "$action"
        },
        count: { $sum: 1 }
      }
    },
    {
      $sort: { "_id.year": 1, "_id.month": 1 }
    }
  ]);
  
  // Định dạng lại dữ liệu để dễ sử dụng
  const formattedStats = {};
  
  monthlyStats.forEach(stat => {
    const year = stat._id.year;
    const month = stat._id.month;
    const dateKey = `${year}-${month.toString().padStart(2, '0')}`;
    
    if (!formattedStats[dateKey]) {
      formattedStats[dateKey] = {
        cvCount: 0,
        resumeCount: 0
      };
    }
    
    if (stat._id.action === 'create_cv') {
      formattedStats[dateKey].cvCount = stat.count;
    } else if (stat._id.action === 'create_resume') {
      formattedStats[dateKey].resumeCount = stat.count;
    }
  });
  
  return Object.keys(formattedStats).map(key => ({
    month: key,
    cvCount: formattedStats[key].cvCount,
    resumeCount: formattedStats[key].resumeCount
  }));
};

/**
 * Hàm hỗ trợ lấy số liệu download theo tháng
 */
const getMonthlyDownloadStats = async (timeFilter) => {
  const UserLog = require('../models/userLogModel');
  
  // Số lượng CV và Resume được download theo tháng
  const monthlyStats = await UserLog.aggregate([
    {
      $match: {
        action: { $in: ['download_cv', 'download_resume'] },
        ...timeFilter
      }
    },
    {
      $group: {
        _id: {
          year: { $year: "$timestamp" },
          month: { $month: "$timestamp" },
          action: "$action"
        },
        count: { $sum: 1 }
      }
    },
    {
      $sort: { "_id.year": 1, "_id.month": 1 }
    }
  ]);
  
  // Định dạng lại dữ liệu để dễ sử dụng
  const formattedStats = {};
  
  monthlyStats.forEach(stat => {
    const year = stat._id.year;
    const month = stat._id.month;
    const dateKey = `${year}-${month.toString().padStart(2, '0')}`;
    
    if (!formattedStats[dateKey]) {
      formattedStats[dateKey] = {
        cvDownloads: 0,
        resumeDownloads: 0
      };
    }
    
    if (stat._id.action === 'download_cv') {
      formattedStats[dateKey].cvDownloads = stat.count;
    } else if (stat._id.action === 'download_resume') {
      formattedStats[dateKey].resumeDownloads = stat.count;
    }
  });
  
  return Object.keys(formattedStats).map(key => ({
    month: key,
    cvDownloads: formattedStats[key].cvDownloads,
    resumeDownloads: formattedStats[key].resumeDownloads
  }));
};

/**
 * @desc    Thống kê số lượt download CV và Resume theo từng template
 * @route   GET /api/user-logs/template-download-stats
 * @access  Private (Admin only)
 */
exports.getTemplateDownloadStats = async (req, res) => {
  try {
    const UserLog = require('../models/userLogModel');
    const mongoose = require('mongoose');

    // Hỗ trợ lọc theo khoảng thời gian nếu có
    let startDate = req.query.startDate ? new Date(req.query.startDate) : null;
    let endDate = req.query.endDate ? new Date(req.query.endDate) : null;
    const { period } = req.query;
    if (period && !startDate) {
      endDate = new Date();
      if (period === '7d') {
        startDate = new Date(endDate);
        startDate.setDate(startDate.getDate() - 7);
      } else if (period === '30d') {
        startDate = new Date(endDate);
        startDate.setDate(startDate.getDate() - 30);
      } else if (period === '90d') {
        startDate = new Date(endDate);
        startDate.setDate(startDate.getDate() - 90);
      } else if (period === '365d' || period === '1y') {
        startDate = new Date(endDate);
        startDate.setDate(startDate.getDate() - 365);
      } else if (period === 'all') {
        startDate = null;
        endDate = null;
      }
    }
    const timeFilter = {};
    if (startDate && endDate) {
      timeFilter.timestamp = { $gte: startDate, $lte: endDate };
    }

    // Thực hiện aggregation để thống kê theo template
    const stats = await UserLog.aggregate([
      {
        $match: {
          action: { $in: ['download_cv', 'download_resume'] },
          ...timeFilter
        }
      },
      {
        $group: {
          _id: {
            templateId: '$details.templateId',
            templateName: '$details.templateName',
            action: '$action'
          },
          count: { $sum: 1 }
        }
      },
      {
        $group: {
          _id: { templateId: '$_id.templateId', templateName: '$_id.templateName' },
          downloads: {
            $push: {
              action: '$_id.action',
              count: '$count'
            }
          },
          totalDownloads: { $sum: '$count' }
        }
      },
      {
        $sort: { totalDownloads: -1 }
      }
    ]);

    // Định dạng lại dữ liệu cho dễ dùng ở frontend
    const formatted = stats.map(item => {
      const cvDownloads = item.downloads.find(d => d.action === 'download_cv')?.count || 0;
      const resumeDownloads = item.downloads.find(d => d.action === 'download_resume')?.count || 0;
      return {
        templateId: item._id.templateId,
        templateName: item._id.templateName,
        cvDownloads,
        resumeDownloads,
        totalDownloads: item.totalDownloads
      };
    });

    return res.status(200).json({
      status: 'success',
      data: formatted,
      message: 'Thống kê lượt download theo template thành công'
    });
  } catch (error) {
    console.error('Error retrieving template download stats:', error);
    return res.status(500).json({
      status: 'error',
      code: 'SERVER_ERROR',
      message: 'Lỗi server khi lấy thống kê template download'
    });
  }
};

// Middleware để tự động ghi log hoạt động
exports.logUserActivity = (action, entityType = 'other') => {
  return async (req, res, next) => {
    // Lưu data trước khi cập nhật nếu là hành động cập nhật
    let beforeData = null;
    if (action.includes('update') && req.params.id) {
      try {
        // Lấy model tương ứng với entityType
        let Model;
        switch (entityType) {
          case 'User':
            Model = require('../models/userModel');
            break;
          case 'CV':
            Model = require('../models/cvModel');
            break;
          case 'Resume':
            Model = require('../models/resumeModel');
            break;
          case 'JobDescription':
            Model = require('../models/jobDescriptionModel');
            break;
          // Thêm các model khác nếu cần
        }
        
        // Lấy dữ liệu trước khi cập nhật
        if (Model) {
          beforeData = await Model.findById(req.params.id);
        }
      } catch (err) {
        console.error('Error fetching data before update:', err);
      }
    }

    // Lưu response gốc để sử dụng sau
    const originalSend = res.send;
    
    // Override phương thức res.send()
    res.send = function(data) {
      // Phục hồi phương thức res.send gốc
      res.send = originalSend;
      
      // Chỉ ghi log nếu request thành công
      if (res.statusCode >= 200 && res.statusCode < 300) {
        try {
          // Parse response data nếu là JSON string
          let responseData = data;
          if (typeof data === 'string') {
            try {
              responseData = JSON.parse(data);
            } catch (e) {
              // Nếu không parse được, giữ nguyên
              responseData = data;
            }
          }
          
          // Xác định entityId nếu có
          let entityId = null;
          if (responseData && responseData.data && responseData.data._id) {
            entityId = responseData.data._id;
          } else if (req.params.id) {
            entityId = req.params.id;
          }
          
          // Chuẩn bị chi tiết log
          const logDetails = {
            method: req.method,
            path: req.path,
            params: req.params,
            timestamp: new Date()
          };
          
          // Thêm dữ liệu trước và sau khi cập nhật nếu có
          if (req.method === 'PUT' || req.method === 'PATCH') {
            logDetails.body = req.body; // Dữ liệu gửi lên để cập nhật
            
            if (beforeData) {
              // Chỉ lưu các trường quan trọng từ beforeData để giảm kích thước log
              const beforeDataSimplified = {};
              Object.keys(req.body).forEach(key => {
                if (beforeData[key] !== undefined) {
                  beforeDataSimplified[key] = beforeData[key];
                }
              });
              logDetails.beforeUpdate = beforeDataSimplified;
            }
            
            if (responseData && responseData.data) {
              logDetails.afterUpdate = responseData.data;
            }
          } else if (req.method === 'POST') {
            logDetails.createdData = responseData && responseData.data ? responseData.data : null;
          } else if (req.method !== 'GET') {
            logDetails.body = req.body;
          }
          
          // Ghi log
          createUserLog({
            userId: req.user._id,
            action,
            entityId,
            entityType,
            details: logDetails
          }, req);
          
          // Nếu người dùng là admin, ghi thêm vào adminLog
          if (req.user && req.user.role === 'admin') {
            const { createAdminLog } = require('../services/adminLogService');
            createAdminLog({
              adminId: req.user._id,
              action,
              details: {
                ...logDetails,
                entityType,
                entityId
              }
            }, req);
          }
        } catch (error) {
          console.error('Error logging user activity:', error);
        }
      }
      
      // Gọi phương thức send gốc
      return res.send(data);
    };
    
    next();
  };
};
