const mongoose = require('mongoose');

const templateSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please add a template name'],
        trim: true,
        unique: true
    },
    description: {
        type: String,
        required: [true, 'Please add a description']
    },
    thumbnail: {
        type: String,
        required: [true, 'Please add a thumbnail']
    },
    category: [{
        type: String,
        enum: ['Professional', 'Creative', 'Simple', 'Modern', 'Academic', 'Technical']
    }],
    tags: [String],
    targetIndustries: [String],
    components: {
        layout: {
            type: String,
            required: true
        },
        styles: {
            fonts: [{
                name: String,
                category: String
            }],
            colors: [{
                name: String,
                value: String
            }],
            spacing: {
                type: Map,
                of: String
            }
        }
    },
    defaultContent: {
        placeholders: {
            type: Map,
            of: String
        },
        sampleData: {
            type: Map,
            of: String
        }
    },
    status: {
        type: String,
        enum: ['active', 'inactive', 'draft'],
        default: 'draft'
    },
    analytics: {
        views: {
            type: Number,
            default: 0
        },
        downloads: {
            type: Number,
            default: 0
        },
        rating: {
            type: Number,
            default: 0
        },
        usageCount: {
            type: Number,
            default: 0
        }
    },
    version: {
        type: String,
        required: true
    },
    creator: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Template', templateSchema); 