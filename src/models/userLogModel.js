const mongoose = require('mongoose');

/**
 * @swagger
 * components:
 *   schemas:
 *     UserLog:
 *       type: object
 *       required:
 *         - userId
 *         - action
 *       properties:
 *         _id:
 *           type: string
 *           example: 60d0fe4f5311236168a109ca
 *           description: ID tự động được tạo của log
 *         userId:
 *           type: string
 *           example: 60d0fe4f5311236168a109cb
 *           description: ID của user thực hiện hành động
 *         action:
 *           type: string
 *           enum: [register, login, logout, create_cv, update_cv, update_cv_name, delete_cv, create_resume, update_resume, delete_resume, create_job_description, update_job_description, delete_job_description, update_profile, change_password, download_cv, download_resume, extract_cv_from_text, extract_job_description_from_text, extract_resume_from_cv_jd, extract_resume_tips, delete_user]
 *           description: Loại hành động được thực hiện
 *         entityId:
 *           type: string
 *           example: 60d0fe4f5311236168a109cc
 *           description: ID của đối tượng liên quan (CV, Resume, JobDescription...)
 *         entityType:
 *           type: string
 *           enum: [cv, resume, job_description, user, other]
 *           description: Loại đối tượng liên quan
 *         details:
 *           type: object
 *           description: Chi tiết về hành động
 *           example: {"name": "Professional CV", "status": "draft", "fields": ["personalInfo", "skills"]}
 *         ipAddress:
 *           type: string
 *           description: Địa chỉ IP của user
 *           example: 192.168.1.1
 *         userAgent:
 *           type: string
 *           description: User agent của trình duyệt
 *           example: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36
 *         timestamp:
 *           type: string
 *           format: date-time
 *           description: Thời gian thực hiện hành động
 *           example: 2023-07-10T15:30:00.000Z
 */
const userLogSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  action: {
    type: String,
    required: true,
    enum: [
      'register',
      'login',
      'logout',
      'create_cv',
      'update_cv',
      'update_cv_name',
      'delete_cv',
      'create_resume',
      'update_resume',
      'delete_resume',
      'create_job_description',
      'update_job_description',
      'delete_job_description',
      'update_profile',
      'change_password',
      'download_cv',
      'download_resume',
      'extract_cv_from_text',
      'extract_job_description_from_text',
      'extract_resume_from_cv_jd',
      'extract_resume_tips',
      'delete_user'
    ]
  },
  entityId: {
    type: mongoose.Schema.Types.ObjectId,
    refPath: 'entityType',
    default: null
  },
  entityType: {
    type: String,
    enum: ['CV', 'Resume', 'JobDescription', 'User', 'other'],
    default: 'other'
  },
  details: {
    type: Object,
    default: {}
  },
  ipAddress: {
    type: String,
    default: ''
  },
  userAgent: {
    type: String,
    default: ''
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

// Index for fields commonly used for querying
userLogSchema.index({ userId: 1 });
userLogSchema.index({ action: 1 });
userLogSchema.index({ timestamp: -1 });
userLogSchema.index({ entityId: 1, entityType: 1 });

const UserLog = mongoose.model('UserLog', userLogSchema);

module.exports = UserLog;