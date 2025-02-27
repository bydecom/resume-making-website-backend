const mongoose = require('mongoose');

const cvSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
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
    skills: [{
        name: String,
        level: {
            type: String,
            enum: ['Beginner', 'Intermediate', 'Advanced', 'Expert']
        },
        category: String // Để dễ dàng lọc skills theo yêu cầu JD
    }],
    workExperience: [{
        title: String,
        company: String,
        location: String,
        startDate: Date,
        endDate: Date,
        current: {
            type: Boolean,
            default: false
        },
        description: String,
        achievements: [String],
        keywords: [String] // Để dễ dàng match với JD
    }],
    education: [{
        school: String,
        degree: String,
        field: String,
        location: String,
        startDate: Date,
        endDate: Date,
        current: {
            type: Boolean,
            default: false
        },
        description: String
    }],
    certifications: [{
        name: String,
        issuer: String,
        issueDate: Date,
        expiryDate: Date,
        credentialID: String,
        credentialURL: String
    }],
    additionalSections: [{
        title: String,
        content: String,
        keywords: [String] // Để dễ dàng match với JD
    }],
    status: {
        type: String,
        enum: ['draft', 'published'],
        default: 'draft'
    },
    isDefault: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('CV', cvSchema); 