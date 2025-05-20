const mongoose = require('mongoose');

const jobDescriptionSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    position: {
        type: String,
        required: true,
        trim: true
    },
    department: String, 
    companyName: String,
    location: [String],
    remoteStatus: {
        type: String,
        enum: ['On-site', 'Remote', 'Hybrid'],
        default: 'On-site'
    },
    experienceRequired: {
        min: {
            type: Number,
            min: 0,
            default: 0
        },
        max: {
            type: Number,
            min: 0
        },
        description: {
            type: String,
            trim: true
        }
    },
    jobLevel: {
        type: String,
        enum: ['Intern', 'Junior', 'Mid', 'Senior', 'Lead', 'Manager', 'Director', 'Executive'],
        default: 'Mid'
    },
    employmentType: {
        type: String,
        enum: ['Full-time', 'Part-time', 'Internship', 'Freelance', 'Contract'],
        default: 'Full-time'
    },
    summary: [String],
    responsibilities: [String],
    requirements: [String],
    preferredQualifications: [String],
    skillsRequired: [String],
    benefits: [String],
    postingDate: {
        type: Date,
        default: Date.now
    },
    closingDate: Date,
    tags: [String],
    language: {
        type: String,
        enum: ['en', 'vi'],
        default: 'en'
    },
    status: {
        type: String,
        enum: ['draft', 'published'],
        default: 'draft'
    },
    salary: {
        min: { type: Number },
        max: { type: Number },
        currency: { type: String },
        period: { type: String }
    },
    applicationDeadline: String,
    contactInfo: {
        name: { type: String },
        email: { type: String },
        phone: { type: String }
    },
    applicationStatus: {
        type: String,
        enum: [
            'Not Applied', // Chưa ứng tuyển (Trạng thái mặc định)
            'Applied',     // Đã ứng tuyển
            'Interview',   // Được gọi phỏng vấn (Approved)
            'Rejected'     // Bị từ chối
         ],
        default: 'Not Applied'
    },
    interviewDate: {
        type: Date,
        default: null // Chỉ có giá trị khi status là 'Interview'
    },
    interviewTime: { // Có thể lưu giờ riêng cho dễ hiển thị
        type: String, // Ví dụ: "09:30", "14:00"
        default: null
    },
    interviewLocation: { // Địa điểm hoặc link online meeting
        type: String,
        default: null
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

module.exports = mongoose.model('JobDescription', jobDescriptionSchema); 