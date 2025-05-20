const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/authMiddleware');
const UserLog = require('../models/userLogModel');
const CV = require('../models/cvModel');
const Resume = require('../models/resumeModel');
const mongoose = require('mongoose');

/**
 * @swagger
 * /api/downloads/cv/{id}:
 *   get:
 *     summary: Download a CV
 *     tags: [Downloads]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: CV ID
 *       - in: query
 *         name: format
 *         schema:
 *           type: string
 *           enum: [pdf, docx]
 *           default: pdf
 *         description: Download format
 *       - in: query
 *         name: templateId
 *         schema:
 *           type: string
 *         description: Template ID used for generating the CV
 *       - in: query
 *         name: templateName
 *         schema:
 *           type: string
 *         description: Template name used for generating the CV
 *     responses:
 *       200:
 *         description: CV file
 *       404:
 *         description: CV not found
 */
router.get('/cv/:id', protect, async (req, res) => {
  try {
    const cvId = req.params.id;
    const format = req.query.format || 'pdf';
    // Lấy thông tin template từ frontend
    const templateId = req.query.templateId || 'default';
    const templateName = req.query.templateName || 'Default Template';
    
    // Kiểm tra CV tồn tại và thuộc về người dùng hiện tại
    const cv = await CV.findOne({ 
      _id: cvId, 
      userId: req.user._id,
      is_deleted: false
    });
    
    if (!cv) {
      return res.status(404).json({
        status: 'error',
        code: 'CV_NOT_FOUND',
        message: 'CV not found or not authorized to access'
      });
    }

    // Ghi log hoạt động với chi tiết template
    await UserLog.create({
      userId: req.user._id,
      action: 'download_cv',
      entityId: cvId,
      entityType: 'CV',
      details: {
        cvId: cvId,
        cvName: cv.name,
        // Ưu tiên template từ CV nếu có, nếu không sử dụng thông tin từ frontend
        templateId: cv.template?.id || templateId,
        templateName: cv.template?.name || templateName,
        format: format,
        timestamp: new Date()
      },
      ipAddress: req.headers['x-forwarded-for'] || req.connection.remoteAddress,
      userAgent: req.headers['user-agent']
    });

    // Ở đây bạn sẽ thêm logic để tạo file CV và trả về cho người dùng
    // Tạm thời, hãy trả về thông báo thành công
    return res.status(200).json({
      status: 'success',
      message: `CV download tracked successfully. Format: ${format}`,
      data: {
        cvId: cvId,
        cvName: cv.name,
        templateId: cv.template?.id || templateId,
        templateName: cv.template?.name || templateName,
        format: format
      }
    });
    
  } catch (error) {
    console.error('Error downloading CV:', error);
    return res.status(500).json({
      status: 'error',
      code: 'SERVER_ERROR',
      message: 'Failed to download CV',
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/downloads/resume/{id}:
 *   get:
 *     summary: Download a Resume
 *     tags: [Downloads]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Resume ID
 *       - in: query
 *         name: format
 *         schema:
 *           type: string
 *           enum: [pdf, docx]
 *           default: pdf
 *         description: Download format
 *       - in: query
 *         name: templateId
 *         schema:
 *           type: string
 *         description: Template ID used for generating the Resume
 *       - in: query
 *         name: templateName
 *         schema:
 *           type: string
 *         description: Template name used for generating the Resume
 *     responses:
 *       200:
 *         description: Resume file
 *       404:
 *         description: Resume not found
 */
router.get('/resume/:id', protect, async (req, res) => {
  try {
    const resumeId = req.params.id;
    const format = req.query.format || 'pdf';
    // Lấy thông tin template từ frontend
    const templateId = req.query.template?.id || 'default';
    const templateName = req.query.template?.name || 'Default Template';
    
    // Kiểm tra Resume tồn tại và thuộc về người dùng hiện tại
    const resume = await Resume.findOne({ 
      _id: resumeId, 
      userId: req.user._id,
      is_deleted: false
    });
    
    if (!resume) {
      return res.status(404).json({
        status: 'error',
        code: 'RESUME_NOT_FOUND',
        message: 'Resume not found or not authorized to access'
      });
    }

    // Ghi log hoạt động với chi tiết template
    await UserLog.create({
      userId: req.user._id,
      action: 'download_resume',
      entityId: resumeId,
      entityType: 'Resume',
      details: {
        resumeId: resumeId,
        resumeName: resume.name,
        roleApply: resume.roleApply,
        // Ưu tiên template từ Resume nếu có, nếu không sử dụng thông tin từ frontend
        templateId: resume.template?.id || templateId,
        templateName: resume.template?.name || templateName,
        jobDescriptionId: resume.jobDescriptionId,
        cvId: resume.cvId,
        format: format,
        timestamp: new Date()
      },
      ipAddress: req.headers['x-forwarded-for'] || req.connection.remoteAddress,
      userAgent: req.headers['user-agent']
    });

    // Ở đây bạn sẽ thêm logic để tạo file Resume và trả về cho người dùng
    // Tạm thời, hãy trả về thông báo thành công
    return res.status(200).json({
      status: 'success',
      message: `Resume download tracked successfully. Format: ${format}`,
      data: {
        resumeId: resumeId,
        resumeName: resume.name,
        templateId: resume.template?.id || templateId,
        templateName: resume.template?.name || templateName,
        format: format
      }
    });
    
  } catch (error) {
    console.error('Error downloading Resume:', error);
    return res.status(500).json({
      status: 'error',
      code: 'SERVER_ERROR',
      message: 'Failed to download Resume',
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/downloads/stats:
 *   get:
 *     summary: Get download statistics for current user
 *     tags: [Downloads]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Download statistics
 */
router.get('/stats', protect, async (req, res) => {
  try {
    const userId = req.user._id;

    // Tổng số lượt tải xuống CV
    const totalCVDownloads = await UserLog.countDocuments({
      userId,
      action: 'download_cv'
    });

    // Tổng số lượt tải xuống Resume
    const totalResumeDownloads = await UserLog.countDocuments({
      userId,
      action: 'download_resume'
    });

    // Lấy các CV đã tải xuống
    const downloadedCVs = await UserLog.aggregate([
      {
        $match: {
          userId: mongoose.Types.ObjectId(userId),
          action: 'download_cv'
        }
      },
      {
        $group: {
          _id: '$details.cvId',
          cvName: { $first: '$details.cvName' },
          templateName: { $first: '$details.templateName' },
          count: { $sum: 1 },
          lastDownload: { $max: '$timestamp' }
        }
      },
      {
        $sort: { count: -1 }
      }
    ]);

    // Lấy các Resume đã tải xuống
    const downloadedResumes = await UserLog.aggregate([
      {
        $match: {
          userId: mongoose.Types.ObjectId(userId),
          action: 'download_resume'
        }
      },
      {
        $group: {
          _id: '$details.resumeId',
          resumeName: { $first: '$details.resumeName' },
          templateName: { $first: '$details.templateName' },
          roleApply: { $first: '$details.roleApply' },
          count: { $sum: 1 },
          lastDownload: { $max: '$timestamp' }
        }
      },
      {
        $sort: { count: -1 }
      }
    ]);

    // Template được dùng nhiều nhất
    const mostUsedTemplates = await UserLog.aggregate([
      {
        $match: {
          userId: mongoose.Types.ObjectId(userId),
          $or: [
            { action: 'download_cv' },
            { action: 'download_resume' }
          ]
        }
      },
      {
        $group: {
          _id: '$details.templateId',
          templateName: { $first: '$details.templateName' },
          count: { $sum: 1 },
          lastUsed: { $max: '$timestamp' }
        }
      },
      {
        $sort: { count: -1 }
      },
      {
        $limit: 5
      }
    ]);

    return res.status(200).json({
      status: 'success',
      data: {
        totalDownloads: totalCVDownloads + totalResumeDownloads,
        cvDownloads: totalCVDownloads,
        resumeDownloads: totalResumeDownloads,
        downloadedCVs,
        downloadedResumes,
        mostUsedTemplates
      },
      message: 'Download statistics retrieved successfully'
    });
    
  } catch (error) {
    console.error('Error retrieving download statistics:', error);
    return res.status(500).json({
      status: 'error',
      code: 'SERVER_ERROR',
      message: 'Failed to retrieve download statistics',
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/admin/downloads/stats:
 *   get:
 *     summary: Get download statistics for all users (Admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Download statistics
 */
router.get('/admin/stats', protect, async (req, res) => {
  try {
    // Import middleware
    const { hasRole } = require('../middlewares/authMiddleware');
    
    // Kiểm tra quyền admin
    if (!req.user || req.user.role !== 'admin') {
      return res.status(403).json({
        status: 'error',
        code: 'FORBIDDEN',
        message: 'Access denied. Admin permission required.'
      });
    }
    
    // Tổng số lượt tải xuống CV
    const totalCVDownloads = await UserLog.countDocuments({
      action: 'download_cv'
    });

    // Tổng số lượt tải xuống Resume
    const totalResumeDownloads = await UserLog.countDocuments({
      action: 'download_resume'
    });

    // Template được tải xuống nhiều nhất
    const mostDownloadedTemplates = await UserLog.aggregate([
      {
        $match: {
          $or: [
            { action: 'download_cv' },
            { action: 'download_resume' }
          ]
        }
      },
      {
        $group: {
          _id: '$details.templateId',
          templateName: { $first: '$details.templateName' },
          count: { $sum: 1 },
          lastDownloaded: { $max: '$timestamp' }
        }
      },
      {
        $sort: { count: -1 }
      },
      {
        $limit: 10
      }
    ]);

    // Người dùng có nhiều lượt tải xuống nhất
    const mostActiveDownloaders = await UserLog.aggregate([
      {
        $match: {
          $or: [
            { action: 'download_cv' },
            { action: 'download_resume' }
          ]
        }
      },
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

    // Lượt tải xuống theo thời gian (ngày)
    const downloadsByDay = await UserLog.aggregate([
      {
        $match: {
          $or: [
            { action: 'download_cv' },
            { action: 'download_resume' }
          ],
          timestamp: {
            $gte: new Date(new Date().setDate(new Date().getDate() - 30)) // 30 ngày gần đây
          }
        }
      },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: '%Y-%m-%d', date: '$timestamp' } },
            action: '$action'
          },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { '_id.date': 1 }
      }
    ]);

    // Định dạng lại dữ liệu cho biểu đồ
    const formattedDownloadsByDay = {};
    downloadsByDay.forEach(item => {
      const date = item._id.date;
      if (!formattedDownloadsByDay[date]) {
        formattedDownloadsByDay[date] = {
          date,
          download_cv: 0,
          download_resume: 0
        };
      }
      formattedDownloadsByDay[date][item._id.action] = item.count;
    });

    return res.status(200).json({
      status: 'success',
      data: {
        totalDownloads: totalCVDownloads + totalResumeDownloads,
        cvDownloads: totalCVDownloads,
        resumeDownloads: totalResumeDownloads,
        mostDownloadedTemplates,
        mostActiveDownloaders,
        downloadsByDay: Object.values(formattedDownloadsByDay)
      },
      message: 'Download statistics retrieved successfully'
    });
    
  } catch (error) {
    console.error('Error retrieving admin download statistics:', error);
    return res.status(500).json({
      status: 'error',
      code: 'SERVER_ERROR',
      message: 'Failed to retrieve download statistics',
      error: error.message
    });
  }
});

module.exports = router;
