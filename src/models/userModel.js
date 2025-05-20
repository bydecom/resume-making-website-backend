/**
 * @swagger
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       required:
 *         - name
 *         - email
 *         - password
 *       properties:
 *         name:
 *           type: string
 *           description: User's full name
 *         email:
 *           type: string
 *           format: email
 *           description: User's email address
 *         password:
 *           type: string
 *           description: User's hashed password
 *         role:
 *           type: string
 *           enum: [user, admin]
 *           default: user
 *         isActive:
 *           type: boolean
 *           default: true
 *         lastLogin:
 *           type: string
 *           format: date-time
 */
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please provide a name'],
        trim: true,
        maxLength: [50, 'Name cannot be more than 50 characters']
    },
    email: {
        type: String,
        required: [true, 'Please provide an email'],
        unique: true,
        lowercase: true,
        match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email']
    },
    password: {
        type: String,
        required: [true, 'Please provide a password'],
        minlength: 6,
        select: false
    },
    role: {
        type: String,
        enum: ['user', 'admin', 'moderator'],
        default: 'user'
    },
    avatar: {
        type: String,
        default: 'default-avatar.png'
    },
    isActive: {
        type: Boolean,
        default: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    lastLogin: {
        type: Date,
        default: null
    },
    notifications: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Notification'
    }],
    permissions: {
        type: [String],
        default: []
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

// Encrypt password using bcrypt
userSchema.pre('save', async function(next) {
    try {
        // Chỉ hash password khi nó được thay đổi
        if (!this.isModified('password')) {
            return next();
        }

        // Generate salt với độ dài 10
        const salt = await bcrypt.genSalt(10);
        
        // Hash password
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error) {
        next(error);
    }
});

// Method để so sánh password
userSchema.methods.matchPassword = async function(enteredPassword) {
    try {
        return await bcrypt.compare(enteredPassword, this.password);
    } catch (error) {
        throw new Error('Password comparison failed');
    }
};

// Add method to check permissions
userSchema.methods.hasPermission = function(permission) {
    return this.permissions.includes(permission);
};

// Add method to check roles
userSchema.methods.hasRole = function(role) {
    return this.role === role;
};

// Add static method to get default permissions for a role
userSchema.statics.getDefaultPermissions = function(role) {
    const permissionMap = {
        user: ['create_cv', 'edit_cv', 'delete_cv'],
        admin: [
            'create_cv',
            'edit_cv',
            'delete_cv',
            'view_users',
            'manage_users',
            'manage_templates',
            'manage_system'
        ],
        moderator: [
            'create_cv',
            'edit_cv',
            'delete_cv',
            'view_users',
            'manage_templates'
        ]
    };
    return permissionMap[role] || [];
};

module.exports = mongoose.model('User', userSchema); 