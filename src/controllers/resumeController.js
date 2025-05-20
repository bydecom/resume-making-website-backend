const Resume = require('../models/resumeModel');
const asyncHandler = require('express-async-handler');
const UserLog = require('../models/userLogModel');
const CV = require('../models/cvModel');
const JobDescription = require('../models/jobDescriptionModel');

// @desc    Create a new resume
// @route   POST /api/resumes
// @access  Private
const createResume = asyncHandler(async (req, res) => {
    const resume = await Resume.create({
        ...req.body,
        userId: req.user._id
    });

    // Log resume creation
    await UserLog.create({
        userId: req.user._id,
        action: 'create_resume',
        entityId: resume._id,
        entityType: 'Resume',
        details: {
            resumeName: resume.name,
            roleApply: resume.roleApply,
            cvId: resume.cvId,
            jobDescriptionId: resume.jobDescriptionId,
            timestamp: new Date()
        },
        ipAddress: req.headers['x-forwarded-for'] || req.connection.remoteAddress,
        userAgent: req.headers['user-agent']
    });

    res.status(201).json({
        success: true,
        data: resume
    });
});

// @desc    Create a draft resume with minimal fields
// @route   POST /api/resumes/draft
// @access  Private
const createDraftResume = asyncHandler(async (req, res) => {
    const { cvId, jobDescriptionId } = req.body;

    // Validate required fields
    if (!cvId || !jobDescriptionId) {
        res.status(400);
        throw new Error('CV ID and Job Description ID are required');
    }

    // Get CV and Job Description data
    const cv = await CV.findById(cvId);
    const jobDescription = await JobDescription.findById(jobDescriptionId);

    if (!cv) {
        res.status(404);
        throw new Error('CV not found');
    }

    if (!jobDescription) {
        res.status(404);
        throw new Error('Job Description not found');
    }

    // Create draft resume with minimal fields
    const { _id, userId, ...cvDataForOriginal } = cv.toObject();
    const draftResume = await Resume.create({
        userId: req.user._id,
        cvId,
        jobDescriptionId,
        name: `Draft Resume - ${new Date().toLocaleDateString()}`,
        status: 'draft',
        roleApply: jobDescription.position || 'Draft Position',
        personalInfo: {
            ...cv.personalInfo,
            professionalHeadline: jobDescription.position || 'Draft Professional Headline'
        },
        originalCV: cvDataForOriginal,
        summary: '',
        education: [],
        matchedExperience: [],
        matchedSkills: [],
        matchedProjects: [],
        matchedCertifications: [],
        matchedLanguages: [],
        additionalInfo: {},
        customFields: [],
        isDefault: false
    });

    // Log draft resume creation
    await UserLog.create({
        userId: req.user._id,
        action: 'create_resume',
        entityId: draftResume._id,
        entityType: 'Resume',
        details: {
            resumeName: draftResume.name,
            cvId: draftResume.cvId,
            jobDescriptionId: draftResume.jobDescriptionId,
            isDraft: true,
            timestamp: new Date()
        },
        ipAddress: req.headers['x-forwarded-for'] || req.connection.remoteAddress,
        userAgent: req.headers['user-agent']
    });

    res.status(201).json({
        success: true,
        data: draftResume
    });
});

// @desc    Get all resumes for a user
// @route   GET /api/resumes
// @access  Private
const getResumes = asyncHandler(async (req, res) => {
    const resumes = await Resume.find({ 
        userId: req.user._id,
        is_deleted: false 
    })
        .populate('jobDescriptionId', 'position company')
        .sort('-createdAt');

    res.status(200).json({
        success: true,
        count: resumes.length,
        data: resumes
    });
});

// @desc    Get single resume
// @route   GET /api/resumes/:id
// @access  Private
const getResume = asyncHandler(async (req, res) => {
    const resume = await Resume.findOne({
        _id: req.params.id,
        userId: req.user._id,
        is_deleted: false
    }).populate('jobDescriptionId');

    if (!resume) {
        res.status(404);
        throw new Error('Resume not found');
    }

    res.status(200).json({
        success: true,
        data: resume
    });
});

// @desc    Update resume
// @route   PUT /api/resumes/:id
// @access  Private
const updateResume = asyncHandler(async (req, res) => {
    // Lấy dữ liệu resume trước khi cập nhật
    let oldResume = await Resume.findOne({
        _id: req.params.id,
        userId: req.user._id,
        is_deleted: false
    });

    if (!oldResume) {
        res.status(404);
        throw new Error('Resume not found');
    }

    // Lưu bản sao của resume cũ để lưu vào log
    const resumeBeforeUpdate = oldResume.toObject();

    // Cập nhật resume
    const updatedResume = await Resume.findByIdAndUpdate(
        req.params.id,
        req.body,
        {
            new: true,
            runValidators: true
        }
    );

    // Không cần phân tích sự thay đổi vì chỉ lưu dữ liệu trước và sau
    
    // Log resume update với dữ liệu trước và sau khi cập nhật
    await UserLog.create({
        userId: req.user._id,
        action: 'update_resume',
        entityId: updatedResume._id,
        entityType: 'Resume',
        details: {
            resumeName: updatedResume.name,
            beforeUpdate: resumeBeforeUpdate,
            afterUpdate: updatedResume.toObject(),
            timestamp: new Date()
        },
        ipAddress: req.headers['x-forwarded-for'] || req.connection.remoteAddress,
        userAgent: req.headers['user-agent']
    });

    res.status(200).json({
        success: true,
        data: updatedResume
    });
});

// @desc    Delete resume
// @route   DELETE /api/resumes/:id
// @access  Private
const deleteResume = asyncHandler(async (req, res) => {
    const resume = await Resume.findOne({
        _id: req.params.id,
        userId: req.user._id
    });

    if (!resume) {
        res.status(404);
        throw new Error('Resume not found');
    }

    // Soft delete
    resume.is_deleted = true;
    resume.deleted_at = new Date();
    await resume.save();

    // Log resume deletion
    await UserLog.create({
        userId: req.user._id,
        action: 'delete_resume',
        entityId: resume._id,
        entityType: 'Resume',
        details: {
            resumeName: resume.name,
            timestamp: new Date()
        },
        ipAddress: req.headers['x-forwarded-for'] || req.connection.remoteAddress,
        userAgent: req.headers['user-agent']
    });

    res.status(200).json({
        success: true,
        data: {}
    });
});

module.exports = {
    createResume,
    createDraftResume,
    getResumes,
    getResume,
    updateResume,
    deleteResume
}; 