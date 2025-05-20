const mongoose = require('mongoose');

const templateSchema = new mongoose.Schema({
    templateId: {
        type: String,
        required: [true, 'Template ID is required'],
        unique: true,
        trim: true,
        index: true
    },
    name: {
        type: String,
        required: [true, 'Template name is required'],
        trim: true
    },
    description: {
        type: String,
        required: [true, 'Template description is required'],
        trim: true
    },
    previewImage: {
        type: String,
        required: [true, 'Preview image path is required']
    },
    category: [{
        type: String,
        enum: ['All', 'Professional', 'Minimalist', 'Modern', 'Creative', 'Academic'],
        required: [true, 'At least one category is required']
    }],
    isDefault: {
        type: Boolean,
        default: false
    },
    isActive: {
        type: Boolean,
        default: true
    },
    analytics: {
        cvDownloads: {
            type: Number,
            default: 0
        },
        resumeDownloads: {
            type: Number,
            default: 0
        },
        activeCVs: {
            type: Number,
            default: 0
        },
        activeResumes: {
            type: Number,
            default: 0
        }
    },
    version: {
        type: String,
        default: '1.0.0'
    },
    lastModifiedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
}, {
    timestamps: true
});

// Đảm bảo chỉ có một template mặc định
templateSchema.pre('save', async function(next) {
    if (this.isDefault) {
        await this.constructor.updateMany(
            { _id: { $ne: this._id } },
            { $set: { isDefault: false } }
        );
    }
    next();
});

// Indexes
templateSchema.index({ isActive: 1 });
templateSchema.index({ category: 1 });

module.exports = mongoose.model('Template', templateSchema); 