const CV = require('../models/cvModel');
const mongoose = require('mongoose');

/**
 * @desc    Create a new CV
 * @route   POST /api/cv
 * @access  Private
 */
const createCV = async (req, res) => {
  try {
    const userId = req.user._id; // Get user ID from authenticated user
    const cvData = req.body;
    
    // Create new CV
    const newCV = new CV({
      userId: userId, // Will be saved as 'userId' in the database based on the model
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
    
    // Find and update CV, ensuring it belongs to the user
    const cv = await CV.findOneAndUpdate(
      { _id: cvId, userId: userId }, 
      { ...cvData, updatedAt: new Date() },
      { new: true, runValidators: true }
    );
    
    if (!cv) {
      return res.status(404).json({
        status: 'error',
        code: 'CV_NOT_FOUND',
        message: 'CV not found or not authorized to update'
      });
    }
    
    return res.status(200).json({
      status: 'success',
      data: cv,
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
    
    // Find and update CV name only, ensuring it belongs to the user
    const cv = await CV.findOneAndUpdate(
      { _id: cvId, userId: userId }, 
      { name: name.trim(), updatedAt: new Date() },
      { new: true }
    );
    
    if (!cv) {
      return res.status(404).json({
        status: 'error',
        code: 'CV_NOT_FOUND',
        message: 'CV not found or not authorized to update'
      });
    }
    
    return res.status(200).json({
      status: 'success',
      data: {
        _id: cv._id,
        name: cv.name
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
 * @desc    Get all CVs for the logged-in user
 * @route   GET /api/cv
 * @access  Private
 */
const getUserCVs = async (req, res) => {
  try {
    const userId = req.user._id;
    
    // Add pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    // Get total count for pagination
    const total = await CV.countDocuments({ userId: userId });
    
    // Get CVs with basic info only
    const cvs = await CV.find({ userId: userId })
      .select('_id name createdAt updatedAt status isDefault template')
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(limit);
    
    return res.status(200).json({
      status: 'success',
      data: cvs,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      },
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
    
    const cv = await CV.findOne({ _id: cvId, userId: userId });
    
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
    
    const result = await CV.findOneAndDelete({ _id: cvId, userId: userId });
    
    if (!result) {
      return res.status(404).json({
        status: 'error',
        code: 'CV_NOT_FOUND',
        message: 'CV not found or not authorized to delete'
      });
    }
    
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

module.exports = {
  createCV,
  updateCV,
  updateCVName,
  getUserCVs,
  getCVById,
  deleteCV
}; 