const mongoose = require('mongoose');

const cvSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true // For faster queries
    },
    name: {
        type: String,
        default: `CV - ${new Date().toLocaleDateString()}`,
        trim: true
    },
    template: {
        id: {
            type: String,
            default: 'professionalBlue' // Template mặc định
        },
        name: {
            type: String,
            default: 'Professional Blue'
        }
    },
    personalInfo: {
        firstName: String,
        lastName: String,
        professionalHeadline: String,
        email: String,
        phone: String,
        location: String,
        country: String,
        website: String,
        linkedin: String
    },
    summary: {
        type: String,
        maxLength: [2000, 'Summary cannot be more than 2000 characters']
    },
    education: [{
        degree: String,
        institution: String,
        startDate: String,
        endDate: String,
        description: String,
        isPresent: Boolean
    }],
    experience: [{
        position: String,
        company: String,
        startDate: String,
        endDate: String,
        description: String,
        isPresent: Boolean
    }],
    skills: [String],
    projects: [{
        title: String,
        role: String,
        startDate: String,
        endDate: String,
        description: String,
        url: String,
        isPresent: Boolean
    }],
    certifications: [{
        name: String,
        issuer: String,
        date: String,
        url: String
    }],
    languages: [{
        language: String,
        proficiency: String
    }],
    additionalInfo: {
        interests: String,
        achievements: String,
        publications: String,
        references: String
    },
    customFields: [{
        label: String,
        value: String
    }],
    status: {
        type: String,
        enum: ['draft', 'published'],
        default: 'draft'
    },
    isDefault: {
        type: Boolean,
        default: false
    },
    is_deleted: {
        type: Boolean,
        default: false
    },
    deleted_at: {
        type: Date,
        default: null
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('CV', cvSchema); 