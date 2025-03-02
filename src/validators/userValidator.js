const Joi = require('joi');

const registerValidator = Joi.object({
    name: Joi.string()
        .min(2)
        .max(50)
        .required()
        .trim()
        .messages({
            'string.empty': 'Name is required',
            'string.min': 'Name must be at least 2 characters',
            'string.max': 'Name cannot be more than 50 characters',
            'any.required': 'Name is required'
        }),
    email: Joi.string()
        .email()
        .required()
        .trim()
        .lowercase()
        .messages({
            'string.empty': 'Email is required',
            'string.email': 'Please enter a valid email',
            'any.required': 'Email is required'
        }),
    password: Joi.string()
        .min(6)
        .max(30)
        .required()
        .pattern(new RegExp('^[a-zA-Z0-9]{6,30}$'))
        .messages({
            'string.empty': 'Password is required',
            'string.min': 'Password must be at least 6 characters',
            'string.max': 'Password cannot be more than 30 characters',
            'string.pattern.base': 'Password must contain only letters and numbers',
            'any.required': 'Password is required'
        })
});

const loginValidator = Joi.object({
    email: Joi.string()
        .email()
        .required()
        .trim()
        .lowercase()
        .messages({
            'string.empty': 'Email is required',
            'string.email': 'Please enter a valid email',
            'any.required': 'Email is required'
        }),
    password: Joi.string()
        .required()
        .messages({
            'string.empty': 'Password is required',
            'any.required': 'Password is required'
        })
});

const changePasswordValidator = Joi.object({
    currentPassword: Joi.string()
        .required()
        .messages({
            'string.empty': 'Current password is required',
            'any.required': 'Current password is required'
        }),
    newPassword: Joi.string()
        .min(6)
        .max(30)
        .required()
        .pattern(new RegExp('^[a-zA-Z0-9]{6,30}$'))
        .messages({
            'string.empty': 'New password is required',
            'string.min': 'New password must be at least 6 characters',
            'string.max': 'New password cannot be more than 30 characters',
            'string.pattern.base': 'New password must contain only letters and numbers',
            'any.required': 'New password is required'
        })
});

const createAdminValidator = Joi.object({
    name: Joi.string()
        .min(2)
        .max(50)
        .required()
        .trim()
        .messages({
            'string.empty': 'Name is required',
            'string.min': 'Name must be at least 2 characters',
            'string.max': 'Name cannot be more than 50 characters',
            'any.required': 'Name is required'
        }),
    email: Joi.string()
        .email()
        .required()
        .trim()
        .lowercase()
        .messages({
            'string.empty': 'Email is required',
            'string.email': 'Please enter a valid email',
            'any.required': 'Email is required'
        }),
    password: Joi.string()
        .min(6)
        .max(30)
        .required()
        .pattern(new RegExp('^[a-zA-Z0-9]{6,30}$'))
        .messages({
            'string.empty': 'Password is required',
            'string.min': 'Password must be at least 6 characters',
            'string.max': 'Password cannot be more than 30 characters',
            'string.pattern.base': 'Password must contain only letters and numbers',
            'any.required': 'Password is required'
        }),
    adminSecret: Joi.string()
        .required()
        .messages({
            'string.empty': 'Admin secret is required',
            'any.required': 'Admin secret is required'
        })
});

const updateUserValidator = Joi.object({
    name: Joi.string()
        .min(2)
        .max(50)
        .trim()
        .messages({
            'string.min': 'Name must be at least 2 characters',
            'string.max': 'Name cannot be more than 50 characters'
        }),
    email: Joi.string()
        .email()
        .trim()
        .lowercase()
        .messages({
            'string.email': 'Please enter a valid email'
        }),
    isActive: Joi.boolean()
}).min(1).messages({
    'object.min': 'At least one field must be updated'
});

const updateUserWithPasswordValidator = Joi.object({
    name: Joi.string()
        .min(2)
        .max(50)
        .trim()
        .messages({
            'string.min': 'Name must be at least 2 characters',
            'string.max': 'Name cannot be more than 50 characters'
        }),
    email: Joi.string()
        .email()
        .trim()
        .lowercase()
        .messages({
            'string.email': 'Please enter a valid email'
        }),
    currentPassword: Joi.string()
        .required()
        .messages({
            'string.empty': 'Current password is required',
            'any.required': 'Current password is required'
        })
}).min(1).messages({
    'object.min': 'At least one field must be updated'
});

module.exports = {
    registerValidator,
    loginValidator,
    changePasswordValidator,
    createAdminValidator,
    updateUserValidator,
    updateUserWithPasswordValidator
}; 