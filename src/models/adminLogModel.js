const mongoose = require('mongoose');

/**
 * @swagger
 * components:
 *   schemas:
 *     AdminLog:
 *       type: object
 *       required:
 *         - adminId
 *         - action
 *       properties:
 *         _id:
 *           type: string
 *           example: 60d0fe4f5311236168a109ca
 *           description: ID tự động được tạo của log
 *         adminId:
 *           type: string
 *           example: 60d0fe4f5311236168a109cb
 *           description: ID của admin thực hiện hành động
 *         action:
 *           type: string
 *           enum: [login, create_user, update_user, delete_user, create_template, update_template, delete_template, sync_templates, system_config, other]
 *           description: Loại hành động được thực hiện
 *         details:
 *           type: object
 *           description: Chi tiết về hành động
 *           example: {"userId": "60d0fe4f5311236168a109cc", "email": "user@example.com"}
 *         ipAddress:
 *           type: string
 *           description: Địa chỉ IP của admin
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
const adminLogSchema = new mongoose.Schema({
  adminId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  action: {
    type: String,
    required: true,
    enum: ['login', 'create_user', 'update_user', 'delete_user', 'create_template', 'update_template', 'delete_template', 'sync_templates', 'system_config', 'other']
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

const AdminLog = mongoose.model('AdminLog', adminLogSchema);

module.exports = AdminLog; 