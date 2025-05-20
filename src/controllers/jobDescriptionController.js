const JobDescription = require('../models/jobDescriptionModel');
const mongoose = require('mongoose');
const UserLog = require('../models/userLogModel');

/**
 * @desc    Create a new job description
 * @route   POST /api/job-descriptions
 * @access  Private
 */
const createJobDescription = async (req, res) => {
  try {
    const userId = req.user._id;
    const jdData = req.body;
    
    // Create new job description
    const newJD = new JobDescription({
      userId,
      position: jdData.position,
      department: jdData.department,
      companyName: jdData.companyName,
      location: jdData.location,
      remoteStatus: jdData.remoteStatus,
      jobLevel: jdData.jobLevel,
      experienceRequired: jdData.experienceRequired,
      employmentType: jdData.employmentType,
      summary: jdData.summary,
      responsibilities: jdData.responsibilities,
      requirements: jdData.requirements,
      preferredQualifications: jdData.preferredQualifications,
      skillsRequired: jdData.skillsRequired,
      benefits: jdData.benefits,
      postingDate: jdData.postingDate,
      closingDate: jdData.closingDate,
      tags: jdData.tags,
      language: jdData.language,
      status: jdData.status || 'draft',
      salary: {
        min: jdData.salary?.min,
        max: jdData.salary?.max,
        currency: jdData.salary?.currency,
        period: jdData.salary?.period
      },
      applicationDeadline: jdData.applicationDeadline,
      contactInfo: {
        name: jdData.contactInfo?.name,
        email: jdData.contactInfo?.email,
        phone: jdData.contactInfo?.phone
      }
    });
    
    await newJD.save();
    
    // Log job description creation
    await UserLog.create({
      userId: userId,
      action: 'create_job_description',
      entityId: newJD._id,
      entityType: 'JobDescription',
      details: {
        position: newJD.position,
        companyName: newJD.companyName,
        timestamp: new Date()
      },
      ipAddress: req.headers['x-forwarded-for'] || req.connection.remoteAddress,
      userAgent: req.headers['user-agent']
    });
    
    return res.status(201).json({
      status: 'success',
      data: newJD,
      message: 'Job description created successfully'
    });
  } catch (error) {
    console.error('Error creating job description:', error);
    return res.status(500).json({
      status: 'error',
      code: 'SERVER_ERROR',
      message: 'Failed to create job description',
      error: error.message
    });
  }
};

/**
 * @desc    Get all job descriptions for the logged-in user
 * @route   GET /api/job-descriptions
 * @access  Private
 */
const getUserJobDescriptions = async (req, res) => {
  try {
    const userId = req.user._id;
    
    // Find all job descriptions for the user that haven't been soft deleted
    const jobDescriptions = await JobDescription.find({ 
      userId: userId,
      is_deleted: false 
    }).lean();
    
    return res.status(200).json({
      status: 'success',
      data: jobDescriptions,
      message: 'Job descriptions retrieved successfully'
    });
  } catch (error) {
    console.error('Error fetching job descriptions:', error);
    return res.status(500).json({
      status: 'error',
      code: 'SERVER_ERROR',
      message: 'Failed to fetch job descriptions',
      error: error.message
    });
  }
};

/**
 * @desc    Get a job description by ID
 * @route   GET /api/job-descriptions/:id
 * @access  Private
 */
const getJobDescriptionById = async (req, res) => {
  try {
    const userId = req.user._id;
    const jdId = req.params.id;
    
    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(jdId)) {
      return res.status(400).json({
        status: 'error',
        code: 'INVALID_ID',
        message: 'Invalid job description ID format'
      });
    }
    
    const jobDescription = await JobDescription.findOne({ 
      _id: jdId, 
      userId: userId,
      is_deleted: false 
    }).lean();
    
    if (!jobDescription) {
      return res.status(404).json({
        status: 'error',
        code: 'JD_NOT_FOUND',
        message: 'Job description not found or not authorized to access'
      });
    }
    
    return res.status(200).json({
      status: 'success',
      data: jobDescription,
      message: 'Job description retrieved successfully'
    });
  } catch (error) {
    console.error('Error fetching job description:', error);
    return res.status(500).json({
      status: 'error',
      code: 'SERVER_ERROR',
      message: 'Failed to fetch job description',
      error: error.message
    });
  }
};

/**
 * @desc    Update a job description
 * @route   PUT /api/job-descriptions/:id
 * @access  Private
 */
const updateJobDescription = async (req, res) => {
  try {
    const userId = req.user._id;
    const jdId = req.params.id;
    const jdData = req.body;
    
    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(jdId)) {
      return res.status(400).json({
        status: 'error',
        code: 'INVALID_ID',
        message: 'Invalid job description ID format'
      });
    }
    
    // Find and update job description, ensuring it belongs to the user
    const jobDescription = await JobDescription.findOneAndUpdate(
      { _id: jdId, userId: userId },
      { ...jdData, updatedAt: new Date() },
      { new: true, runValidators: true }
    );
    
    if (!jobDescription) {
      return res.status(404).json({
        status: 'error',
        code: 'JD_NOT_FOUND',
        message: 'Job description not found or not authorized to update'
      });
    }
    
    // Log job description update
    await UserLog.create({
      userId: userId,
      action: 'update_job_description',
      entityId: jobDescription._id,
      entityType: 'JobDescription',
      details: {
        position: jobDescription.position,
        companyName: jobDescription.companyName,
        updatedFields: Object.keys(jdData),
        timestamp: new Date()
      },
      ipAddress: req.headers['x-forwarded-for'] || req.connection.remoteAddress,
      userAgent: req.headers['user-agent']
    });
    
    return res.status(200).json({
      status: 'success',
      data: jobDescription,
      message: 'Job description updated successfully'
    });
  } catch (error) {
    console.error('Error updating job description:', error);
    return res.status(500).json({
      status: 'error',
      code: 'SERVER_ERROR',
      message: 'Failed to update job description',
      error: error.message
    });
  }
};

/**
 * @desc    Delete a job description
 * @route   DELETE /api/job-descriptions/:id
 * @access  Private
 */
const deleteJobDescription = async (req, res) => {
  try {
    const userId = req.user._id;
    const jdId = req.params.id;
    
    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(jdId)) {
      return res.status(400).json({
        status: 'error',
        code: 'INVALID_ID',
        message: 'Invalid job description ID format'
      });
    }
    
    const jobDescription = await JobDescription.findOne({ _id: jdId, userId: userId });
    
    if (!jobDescription) {
      return res.status(404).json({
        status: 'error',
        code: 'JD_NOT_FOUND',
        message: 'Job description not found or not authorized to delete'
      });
    }

    // Soft delete
    jobDescription.is_deleted = true;
    jobDescription.deleted_at = new Date();
    await jobDescription.save();
    
    // Log job description deletion
    await UserLog.create({
      userId: userId,
      action: 'delete_job_description',
      entityId: jobDescription._id,
      entityType: 'JobDescription',
      details: {
        position: jobDescription.position,
        companyName: jobDescription.companyName,
        timestamp: new Date()
      },
      ipAddress: req.headers['x-forwarded-for'] || req.connection.remoteAddress,
      userAgent: req.headers['user-agent']
    });
    
    return res.status(200).json({
      status: 'success',
      message: 'Job description deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting job description:', error);
    return res.status(500).json({
      status: 'error',
      code: 'SERVER_ERROR',
      message: 'Failed to delete job description',
      error: error.message
    });
  }
};

module.exports = {
  createJobDescription,
  getUserJobDescriptions,
  getJobDescriptionById,
  updateJobDescription,
  deleteJobDescription
}; 