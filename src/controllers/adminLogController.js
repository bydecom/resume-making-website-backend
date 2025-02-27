const { getAdminLogs } = require('../services/adminLogService');

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

    const options = {
      page: req.query.page,
      limit: req.query.limit
    };

    const result = await getAdminLogs(filter, options);

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