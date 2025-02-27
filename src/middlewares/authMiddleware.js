const jwt = require('jsonwebtoken');
const User = require('../models/userModel');

const protect = async (req, res, next) => {
    try {
        let token;

        if (
            req.headers.authorization &&
            req.headers.authorization.startsWith('Bearer')
        ) {
            // Get token from header
            token = req.headers.authorization.split(' ')[1];

            // Verify token
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            // Get user from the token
            req.user = await User.findById(decoded.id).select('-password');

            if (!req.user) {
                return res.status(401).json({
                    status: 'error',
                    code: 'USER_NOT_FOUND',
                    message: 'User not found'
                });
            }

            next();
        } else {
            return res.status(401).json({
                status: 'error',
                code: 'NO_TOKEN',
                message: 'Not authorized, no token'
            });
        }
    } catch (error) {
        console.error('Auth Error:', error);
        return res.status(401).json({
            status: 'error',
            code: 'INVALID_TOKEN',
            message: 'Not authorized, token failed'
        });
    }
};

const hasRole = (roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                status: 'error',
                code: 'NOT_AUTHORIZED',
                message: 'Not authorized'
            });
        }

        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                status: 'error',
                code: 'INSUFFICIENT_ROLE',
                message: `Requires role: ${roles.join(', ')}`
            });
        }

        next();
    };
};

const hasPermission = (permissions) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                status: 'error',
                code: 'NOT_AUTHORIZED',
                message: 'Not authorized'
            });
        }

        const hasRequiredPermission = permissions.every(permission =>
            req.user.permissions.includes(permission)
        );

        if (!hasRequiredPermission) {
            return res.status(403).json({
                status: 'error',
                code: 'INSUFFICIENT_PERMISSION',
                message: `Missing required permissions: ${permissions.join(', ')}`
            });
        }

        next();
    };
};

module.exports = { protect, hasRole, hasPermission }; 