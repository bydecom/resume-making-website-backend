const mongoose = require('mongoose');
const cvSnapshotSchema = require('./cvSnapshotSchema');
const jobDescriptionSchema = require('./jobDescriptionModel');

const resumeSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    cvId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'CV',
        required: true,
        index: true
    },
    originalCV: {
        type: cvSnapshotSchema,
        default: null
    },
    jobDescriptionId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'JobDescription',
        required: true,
        index: true
    },
    name: {
        type: String,
        default: `Resume - ${new Date().toLocaleDateString()}`,
        trim: true
    },
    template: {
        id: {
            type: String,
            default: 'professionalBlue'
        },
        name: {
            type: String,
            default: 'Professional Blue'
        }
    },
    personalInfo: {
        firstName: String,
        lastName: String,
        professionalHeadline: {
            type: String,
            required: true,
            trim: true
        },
        email: String,
        phone: String,
        location: String,
        country: String,
        website: String,
        linkedin: String
    },
    roleApply: {
        type: String,
        required: true,
        trim: true
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
        isPresent: Boolean,
        relevance: {
            type: Number,
            min: 0,
            max: 100
        },
        comment: {
            type: String,
            description: 'AI analysis of how this education matches the job requirements'
        }
    }],
    matchedExperience: [{
        position: String,
        company: String,
        startDate: String,
        endDate: String,
        description: String,
        isPresent: Boolean,
        relevance: {
            type: Number,
            min: 0,
            max: 100
        },
        comment: {
            type: String,
            description: 'AI analysis of how this experience matches the job requirements'
        }
    }],
    matchedSkills: [{
        skill: String,
        relevance: {
            type: Number,
            min: 0,
            max: 100
        },
        comment: {
            type: String,
            description: 'AI analysis of how this skill matches the job requirements'
        }
    }],
    matchedProjects: [{
        title: String,
        role: String,
        startDate: String,
        endDate: String,
        description: String,
        url: String,
        isPresent: Boolean,
        relevance: {
            type: Number,
            min: 0,
            max: 100
        },
        comment: {
            type: String,
            description: 'AI analysis of how this project matches the job requirements'
        }
    }],
    matchedCertifications: [{
        name: String,
        issuer: String,
        date: String,
        url: String,
        relevance: {
            type: Number,
            min: 0,
            max: 100
        },
        comment: {
            type: String,
            description: 'AI analysis of how this certification matches the job requirements'
        }
    }],
    matchedLanguages: [{
        language: String,
        proficiency: String,
        relevance: {
            type: Number,
            min: 0,
            max: 100
        },
        comment: {
            type: String,
            description: 'AI analysis of how this language skill matches the job requirements'
        }
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

module.exports = mongoose.model('Resume', resumeSchema); 