const mongoose = require('mongoose');

/**
 * @swagger
 * components:
 *   schemas:
 *     KnowledgeModel:
 *       type: object
 *       required:
 *         - title
 *         - textContent
 *         - qaContent
 *         - type
 *         - taskName
 *       properties:
 *         _id:
 *           type: string
 *           example: 60d0fe4f5311236168a109cb
 *         title:
 *           type: string
 *           description: Tiêu đề của knowledge
 *           example: "Skills Section Writing Guide"
 *         description:
 *           type: string
 *           description: Mô tả ngắn về knowledge này
 *           example: "Guide and Q&A for writing CV skills section"
 *         textContent:
 *           type: string
 *           description: Phần nội dung văn bản hướng dẫn
 *           example: "How to write an effective skills section..."
 *         qaContent:
 *           type: array
 *           description: Danh sách các cặp Q&A
 *           items:
 *             type: object
 *             properties:
 *               question:
 *                 type: string
 *                 description: Câu hỏi
 *               answer:
 *                 type: string
 *                 description: Câu trả lời
 *           example: [
 *             {
 *               question: "How many skills should I list?",
 *               answer: "Focus on 8-12 most relevant skills..."
 *             }
 *           ]
 *         type:
 *           type: string
 *           enum: [GENERAL, SPECIFIC]
 *           description: Phân loại knowledge là chung (GENERAL) hay riêng cho task cụ thể (SPECIFIC)
 *           example: "SPECIFIC"
 *         taskName:
 *           type: string
 *           description: Task name để identify knowledge này, nếu type là GENERAL thì taskName sẽ là GENERAL
 *           example: "CV_SKILLS"
 *         tags:
 *           type: array
 *           items:
 *             type: string
 *           description: Tags để phân loại và tìm kiếm knowledge
 *           example: ["CV", "skills", "guidelines"]
 *         priority:
 *           type: number
 *           default: 0
 *           description: Độ ưu tiên khi sử dụng knowledge
 *           example: 1
 *         isActive:
 *           type: boolean
 *           default: true
 *           description: Trạng thái kích hoạt của knowledge
 *         metadata:
 *           type: object
 *           description: Thông tin bổ sung tùy chọn
 *         createdBy:
 *           type: mongoose.Schema.Types.ObjectId
 *           ref: 'User'
 *           description: Người tạo knowledge
 *         updatedBy:
 *           type: mongoose.Schema.Types.ObjectId
 *           ref: 'User'
 *           description: Người cập nhật knowledge gần nhất
 */

const qaSchema = new mongoose.Schema({
  question: {
    type: String,
    required: [true, 'Câu hỏi là bắt buộc'],
    trim: true
  },
  answer: {
    type: String,
    required: [true, 'Câu trả lời là bắt buộc'],
    trim: true
  }
});

const knowledgeSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Tiêu đề knowledge là bắt buộc'],
    trim: true,
  },
  description: {
    type: String,
    trim: true
  },
  textContent: {
    type: String,
    required: [false, 'Nội dung văn bản hướng dẫn không cần là bắt buộc'],
    trim: true
  },
  qaContent: {
    type: [qaSchema],
    required: [false, 'Danh sách Q&A không cần là bắt buộc'],
    validate: {
      validator: function(v) {
        return Array.isArray(v) && v.length > 0;
      },
      message: 'Phải có ít nhất một cặp Q&A'
    }
  },
  type: {
    type: String,
    required: [true, 'Loại knowledge là bắt buộc'],
    enum: ['GENERAL', 'SPECIFIC'],
    default: 'SPECIFIC'
  },
  taskName: {
    type: String,
    required: [true, 'Task name là bắt buộc'],
    validate: {
      validator: function(v) {
        if (this.type === 'GENERAL' && v !== 'GENERAL') {
          throw new Error('General knowledge phải có taskName là GENERAL');
        }
        if (this.type === 'SPECIFIC' && v === 'GENERAL') {
          throw new Error('Specific knowledge không được có taskName là GENERAL');
        }
        return true;
      }
    }
  },
  tags: {
    type: [String],
    default: []
  },
  priority: {
    type: Number,
    default: 0,
    min: [0, 'Priority không được âm']
  },
  isActive: {
    type: Boolean,
    default: true
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Index để tối ưu tìm kiếm
knowledgeSchema.index({ title: 'text', description: 'text', textContent: 'text' });
knowledgeSchema.index({ taskName: 1 });
knowledgeSchema.index({ tags: 1 });
knowledgeSchema.index({ type: 1 });
knowledgeSchema.index({ isActive: 1 });

// Ensure taskName is unique
knowledgeSchema.index(
  { 'taskName': 1 }, 
  { unique: true }
);

// Virtual populate với GeminiApiConfig qua taskName
knowledgeSchema.virtual('relatedTask', {
  ref: 'GeminiApiConfig',
  localField: 'taskName',
  foreignField: 'taskName'
});

// Helper method để lấy general knowledge
knowledgeSchema.statics.findGeneralKnowledge = async function() {
  return this.find({
    type: 'GENERAL',
    isActive: true
  }).sort({ priority: -1 });
};

// Helper method để lấy knowledge theo task
knowledgeSchema.statics.findByTask = async function(taskName) {
  return this.find({
    taskName: taskName,
    isActive: true
  }).sort({ priority: -1 });
};

// Helper method to update knowledge by taskName
knowledgeSchema.statics.updateByTaskName = async function(taskName, updateData) {
  try {
    const knowledge = await this.findOne({ taskName: taskName });
    if (!knowledge) {
      throw new Error(`No knowledge found with taskName: ${taskName}`);
    }

    // Update allowed fields
    const allowedUpdates = [
      'title',
      'description',
      'textContent',
      'qaContent',
      'tags',
      'priority',
      'isActive',
      'metadata',
      'updatedBy'
    ];

    // Filter out non-allowed fields
    const filteredUpdate = Object.keys(updateData)
      .filter(key => allowedUpdates.includes(key))
      .reduce((obj, key) => {
        obj[key] = updateData[key];
        return obj;
      }, {});

    // Apply updates
    Object.assign(knowledge, filteredUpdate);
    
    // Save and return updated document
    return await knowledge.save();
  } catch (error) {
    throw error;
  }
};

// Transform qaContent before saving
knowledgeSchema.pre('save', function(next) {
  if (this.qaContent && Array.isArray(this.qaContent)) {
    // Remove _id field from qaContent items
    this.qaContent = this.qaContent.map(qa => {
      const { question, answer } = qa;
      return { question, answer };
    });
  }
  next();
});

// Helper method để lấy danh sách unique taskNames từ active knowledge
knowledgeSchema.statics.getUniqueActiveTaskNames = async function() {
    try {
        const taskNames = await this.distinct('taskName', { isActive: true });
        // Sort taskNames để có thứ tự ổn định
        return taskNames.sort();
    } catch (error) {
        console.error('Error getting unique taskNames:', error);
        throw error;
    }
};

// Helper method để lấy thông tin chi tiết của mỗi task
knowledgeSchema.statics.getTaskDescriptions = async function() {
    try {
        const tasks = await this.aggregate([
            { $match: { isActive: true } },
            { $group: {
                _id: '$taskName',
                description: { $first: '$description' },
                title: { $first: '$title' }
            }},
            { $project: {
                _id: 0,
                taskName: '$_id',
                description: 1,
                title: 1
            }}
        ]);
        return tasks.sort((a, b) => a.taskName.localeCompare(b.taskName));
    } catch (error) {
        console.error('Error getting task descriptions:', error);
        throw error;
    }
};

const KnowledgeModel = mongoose.model('Knowledge', knowledgeSchema);

module.exports = KnowledgeModel; 