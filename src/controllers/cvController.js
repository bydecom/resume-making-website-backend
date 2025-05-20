const CV = require('../models/cvModel');
const CVEvaluation = require('../models/cvEvaluationModel');
const mongoose = require('mongoose');
const UserLog = require('../models/userLogModel');

/**
 * @desc    Create a new CV
 * @route   POST /api/cv
 * @access  Private
 */
const createCV = async (req, res) => {
  try {
    const userId = req.user._id; // Get user ID from authenticated user
    const cvData = req.body;
    
    // Check if user already has an active CV (not soft deleted)
    const existingCV = await CV.findOne({ userId: userId, is_deleted: false });
    if (existingCV) {
      return res.status(400).json({
        status: 'error',
        code: 'CV_LIMIT_EXCEEDED',
        message: 'User can only have one active CV. Please update your existing CV or delete it first.'
      });
    }
    
    // Create new CV
    const newCV = new CV({
      userId: userId,
      name: cvData.name || `CV - ${new Date().toLocaleDateString()}`,
      template: cvData.template,
      personalInfo: cvData.personalInfo,
      summary: cvData.summary,
      education: cvData.education,
      experience: cvData.experience,
      skills: cvData.skills,
      projects: cvData.projects,
      certifications: cvData.certifications,
      languages: cvData.languages,
      additionalInfo: cvData.additionalInfo,
      customFields: cvData.customFields,
      status: cvData.status || 'draft',
      isDefault: cvData.isDefault || false
    });
    
    await newCV.save();
    
    // Log CV creation
    await UserLog.create({
      userId: userId,
      action: 'create_cv',
      entityId: newCV._id,
      entityType: 'CV',
      details: {
        cvName: newCV.name,
        template: newCV.template,
        timestamp: new Date()
      },
      ipAddress: req.headers['x-forwarded-for'] || req.connection.remoteAddress,
      userAgent: req.headers['user-agent']
    });
    
    return res.status(201).json({
      status: 'success',
      data: newCV,
      message: 'CV created successfully'
    });
  } catch (error) {
    console.error('Error creating CV:', error);
    return res.status(500).json({
      status: 'error',
      code: 'SERVER_ERROR',
      message: 'Failed to create CV',
      error: error.message
    });
  }
};

/**
 * @desc    Create a temporary CV
 * @route   POST /api/cv/temp
 * @access  Private
 */
const createTempCV = async (req, res) => {
  try {
    const userId = req.user._id;
    const cvData = req.body;
    
    // Create new temporary CV
    const newTempCV = new CV({
      userId: userId,
      name: cvData.name || `Temp CV - ${new Date().toLocaleDateString()}`,
      template: cvData.template,
      personalInfo: cvData.personalInfo,
      summary: cvData.summary,
      education: cvData.education,
      experience: cvData.experience,
      skills: cvData.skills,
      projects: cvData.projects,
      certifications: cvData.certifications,
      languages: cvData.languages,
      additionalInfo: cvData.additionalInfo,
      customFields: cvData.customFields,
      status: 'draft',
      isDefault: false,
      is_deleted: true, // Mark as deleted (temporary)
      deleted_at: new Date()
    });
    
    await newTempCV.save();
    
    return res.status(201).json({
      status: 'success',
      data: newTempCV,
      message: 'Temporary CV created successfully'
    });
  } catch (error) {
    console.error('Error creating temporary CV:', error);
    return res.status(500).json({
      status: 'error',
      code: 'SERVER_ERROR',
      message: 'Failed to create temporary CV',
      error: error.message
    });
  }
};

/**
 * @desc    Update an existing CV
 * @route   PUT /api/cv/:id
 * @access  Private
 */
const updateCV = async (req, res) => {
  try {
    const userId = req.user._id;
    const cvId = req.params.id;
    const cvData = req.body;
    
    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(cvId)) {
      return res.status(400).json({
        status: 'error',
        code: 'INVALID_ID',
        message: 'Invalid CV ID format'
      });
    }
    
    // Lấy dữ liệu CV trước khi cập nhật
    const oldCV = await CV.findOne({ _id: cvId, userId: userId });
    
    if (!oldCV) {
      return res.status(404).json({
        status: 'error',
        code: 'CV_NOT_FOUND',
        message: 'CV not found or not authorized to update'
      });
    }
    
    // Lưu bản sao của CV cũ
    const cvBeforeUpdate = oldCV.toObject();
    
    // Cập nhật CV, đảm bảo nó thuộc về người dùng
    const updatedCV = await CV.findOneAndUpdate(
      { _id: cvId, userId: userId }, 
      { ...cvData, updatedAt: new Date() },
      { new: true, runValidators: true }
    );
    
    // Không cần phân tích sự thay đổi vì chỉ lưu dữ liệu trước và sau
    
    // Log CV update với dữ liệu trước và sau khi cập nhật
    await UserLog.create({
      userId: userId,
      action: 'update_cv',
      entityId: updatedCV._id,
      entityType: 'CV',
      details: {
        cvName: updatedCV.name,
        beforeUpdate: cvBeforeUpdate,
        afterUpdate: updatedCV.toObject(),
        timestamp: new Date()
      },
      ipAddress: req.headers['x-forwarded-for'] || req.connection.remoteAddress,
      userAgent: req.headers['user-agent']
    });
    
    return res.status(200).json({
      status: 'success',
      data: updatedCV,
      message: 'CV updated successfully'
    });
  } catch (error) {
    console.error('Error updating CV:', error);
    return res.status(500).json({
      status: 'error',
      code: 'SERVER_ERROR',
      message: 'Failed to update CV',
      error: error.message
    });
  }
};

/**
 * @desc    Update CV name
 * @route   PATCH /api/cv/:id/name
 * @access  Private
 */
const updateCVName = async (req, res) => {
  try {
    const userId = req.user._id;
    const cvId = req.params.id;
    const { name } = req.body;
    
    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(cvId)) {
      return res.status(400).json({
        status: 'error',
        code: 'INVALID_ID',
        message: 'Invalid CV ID format'
      });
    }
    
    // Validate name
    if (!name || name.trim() === '') {
      return res.status(400).json({
        status: 'error',
        code: 'VALIDATION_ERROR',
        message: 'CV name is required'
      });
    }
    
    // Lấy CV trước khi cập nhật để lưu trữ trạng thái trước đó
    const oldCV = await CV.findOne({ _id: cvId, userId: userId });
    
    if (!oldCV) {
      return res.status(404).json({
        status: 'error',
        code: 'CV_NOT_FOUND',
        message: 'CV not found or not authorized to update'
      });
    }
    
    // Lưu trữ tên cũ
    const oldCVData = {
      _id: oldCV._id,
      name: oldCV.name
    };
    
    // Cập nhật tên CV
    const updatedCV = await CV.findOneAndUpdate(
      { _id: cvId, userId: userId }, 
      { name: name.trim(), updatedAt: new Date() },
      { new: true }
    );
    
    // Log việc cập nhật tên CV với thông tin trước và sau khi thay đổi
    await UserLog.create({
      userId: userId,
      action: 'update_cv_name',
      entityId: updatedCV._id,
      entityType: 'CV',
      details: {
        beforeUpdate: oldCVData,
        afterUpdate: {
          _id: updatedCV._id,
          name: updatedCV.name
        },
        timestamp: new Date()
      },
      ipAddress: req.headers['x-forwarded-for'] || req.connection.remoteAddress,
      userAgent: req.headers['user-agent']
    });
    
    return res.status(200).json({
      status: 'success',
      data: {
        _id: updatedCV._id,
        name: updatedCV.name
      },
      message: 'CV name updated successfully'
    });
  } catch (error) {
    console.error('Error updating CV name:', error);
    return res.status(500).json({
      status: 'error',
      code: 'SERVER_ERROR',
      message: 'Failed to update CV name',
      error: error.message
    });
  }
};

/**
 * @desc    Get all CVs for a user
 * @route   GET /api/cv
 * @access  Private
 */
const getUserCVs = async (req, res) => {
  try {
    const userId = req.user._id;
    
    // Find all CVs for the user that haven't been soft deleted
    const cvs = await CV.find({ userId: userId, is_deleted: false }).lean();
    
    return res.status(200).json({
      status: 'success',
      data: cvs,
      message: 'CVs retrieved successfully'
    });
  } catch (error) {
    console.error('Error fetching CVs:', error);
    return res.status(500).json({
      status: 'error',
      code: 'SERVER_ERROR',
      message: 'Failed to fetch CVs',
      error: error.message
    });
  }
};

/**
 * @desc    Get a CV by ID
 * @route   GET /api/cv/:id
 * @access  Private
 */
const getCVById = async (req, res) => {
  try {
    const userId = req.user._id;
    const cvId = req.params.id;
    
    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(cvId)) {
      return res.status(400).json({
        status: 'error',
        code: 'INVALID_ID',
        message: 'Invalid CV ID format'
      });
    }
    
    const cv = await CV.findOne({ _id: cvId, userId: userId, is_deleted: false }).lean();
    
    if (!cv) {
      return res.status(404).json({
        status: 'error',
        code: 'CV_NOT_FOUND',
        message: 'CV not found or not authorized to access'
      });
    }
    
    return res.status(200).json({
      status: 'success',
      data: cv,
      message: 'CV retrieved successfully'
    });
  } catch (error) {
    console.error('Error fetching CV:', error);
    return res.status(500).json({
      status: 'error',
      code: 'SERVER_ERROR',
      message: 'Failed to fetch CV',
      error: error.message
    });
  }
};

/**
 * @desc    Delete a CV
 * @route   DELETE /api/cv/:id
 * @access  Private
 */
const deleteCV = async (req, res) => {
  try {
    const userId = req.user._id;
    const cvId = req.params.id;
    
    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(cvId)) {
      return res.status(400).json({
        status: 'error',
        code: 'INVALID_ID',
        message: 'Invalid CV ID format'
      });
    }
    
    const cv = await CV.findOne({ _id: cvId, userId: userId });
    
    if (!cv) {
      return res.status(404).json({
        status: 'error',
        code: 'CV_NOT_FOUND',
        message: 'CV not found or not authorized to delete'
      });
    }

    // Soft delete
    cv.is_deleted = true;
    cv.deleted_at = new Date();
    await cv.save();
    
    // Log CV deletion
    await UserLog.create({
      userId: userId,
      action: 'delete_cv',
      entityId: cv._id,
      entityType: 'CV',
      details: {
        cvName: cv.name,
        timestamp: new Date()
      },
      ipAddress: req.headers['x-forwarded-for'] || req.connection.remoteAddress,
      userAgent: req.headers['user-agent']
    });
    
    return res.status(200).json({
      status: 'success',
      message: 'CV deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting CV:', error);
    return res.status(500).json({
      status: 'error',
      code: 'SERVER_ERROR',
      message: 'Failed to delete CV',
      error: error.message
    });
  }
};

/**
 * @desc    Get all CVs for the logged-in user with evaluation data
 * @route   GET /api/cv/with-evaluations
 * @access  Private
 */
const getUserCVsWithEvaluations = async (req, res) => {
  try {
    const userId = req.user._id;
    
    // Find the user's CV
    const cv = await CV.findOne({ userId: userId }).lean();
    
    // If no CV exists, return empty array
    if (!cv) {
      return res.status(200).json({
        status: 'success',
        data: [],
        message: 'No CV found'
      });
    }
    
    // Get evaluation for the CV
    const evaluation = await CVEvaluation.findOne({ cv: cv._id }).lean();
    
    // Combine CV and evaluation
    const cvWithEvaluation = {
      ...cv,
      evaluation: evaluation || null
    };
    
    return res.status(200).json({
      status: 'success',
      data: [cvWithEvaluation],
      message: 'CV with evaluation retrieved successfully'
    });
  } catch (error) {
    console.error('Error fetching CV with evaluation:', error);
    return res.status(500).json({
      status: 'error',
      code: 'SERVER_ERROR',
      message: 'Failed to fetch CV with evaluation',
      error: error.message
    });
  }
};

/**
 * @desc    Lấy chi tiết một CV kèm theo đánh giá
 * @route   GET /api/cv/:id/with-evaluation
 * @access  Private
 */
const getCVWithEvaluation = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    // Kiểm tra xem CV có tồn tại và thuộc về người dùng hiện tại không
    const cv = await CV.findOne({ _id: id, userId }).lean();
    if (!cv) {
      return res.status(404).json({
        status: 'error',
        code: 'CV_NOT_FOUND',
        message: 'CV not found or not authorized'
      });
    }

    // Tìm đánh giá cho CV này
    const evaluation = await CVEvaluation.findOne({ cv: id }).lean();

    // Kết hợp CV và đánh giá
    const cvWithEvaluation = {
      ...cv,
      evaluation: evaluation || null
    };

    return res.status(200).json({
      status: 'success',
      data: cvWithEvaluation,
      message: 'CV with evaluation retrieved successfully'
    });
  } catch (error) {
    console.error('Error getting CV with evaluation:', error);
    return res.status(500).json({
      status: 'error',
      code: 'SERVER_ERROR',
      message: 'Failed to get CV with evaluation',
      error: error.message
    });
  }
};

module.exports = {
  createCV,
  createTempCV,
  updateCV,
  updateCVName,
  getUserCVs,
  getCVById,
  deleteCV,
  getUserCVsWithEvaluations,
  getCVWithEvaluation
}; 