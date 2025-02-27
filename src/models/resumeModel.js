const mongoose = require('mongoose');

const resumeSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    baseCV: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'CV',
        required: true
    },
    jobDescription: {
        title: String,
        company: String,
        description: String,
        requirements: [String],
        keywords: [String]
    },
    template: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Template',
        required: true
    },
    title: {
        type: String,
        required: [true, 'Please add a title'],
        trim: true
    },
    basicInfo: {
        fullName: String,
        email: String,
        phone: String,
        location: String,
        website: String,
        linkedin: String
    },
    professionalSummary: {
        type: String,
        maxLength: [2000, 'Professional summary cannot be more than 2000 characters']
    },
    selectedSkills: [{
        skill: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'CV.skills'
        },
        relevance: Number // Độ phù hợp với JD (0-100)
    }],
    selectedExperiences: [{
        experience: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'CV.workExperience'
        },
        relevance: Number,
        customDescription: String // Mô tả được điều chỉnh để phù hợp với JD
    }],
    selectedEducation: [{
        education: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'CV.education'
        }
    }],
    selectedCertifications: [{
        certification: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'CV.certifications'
        }
    }],
    customSections: [{
        title: String,
        content: String,
        relevance: Number
    }],
    status: {
        type: String,
        enum: ['draft', 'published'],
        default: 'draft'
    },
    matchScore: {
        type: Number,
        default: 0 // Điểm số phù hợp với JD (0-100)
    },
    customization: {
        colors: {
            primary: String,
            secondary: String,
            text: String
        },
        fonts: {
            heading: String,
            body: String
        },
        spacing: {
            type: String,
            enum: ['compact', 'normal', 'spacious'],
            default: 'normal'
        }
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Resume', resumeSchema); 