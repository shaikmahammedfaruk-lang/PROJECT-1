const Joi = require('joi');

/**
 * Validate registration data
 */
const registerSchema = Joi.object({
  name: Joi.string().min(2).max(255).required()
    .messages({
      'string.min': 'Name must be at least 2 characters',
      'string.max': 'Name must be less than 255 characters',
      'any.required': 'Name is required'
    }),
  email: Joi.string().email().required()
    .messages({
      'string.email': 'Please enter a valid email address',
      'any.required': 'Email is required'
    }),
  password: Joi.string().min(6).required()
    .messages({
      'string.min': 'Password must be at least 6 characters',
      'any.required': 'Password is required'
    }),
  confirmPassword: Joi.string().valid(Joi.ref('password')).required()
    .messages({
      'any.only': 'Passwords do not match',
      'any.required': 'Please confirm your password'
    }),
  college: Joi.string().max(255).required()
    .messages({
      'string.max': 'College name is too long',
      'any.required': 'College is required'
    }),
  regulation: Joi.string().valid('R20', 'R23').required()
    .messages({
      'any.only': 'Please select a valid regulation (R20 or R23)',
      'any.required': 'Regulation is required'
    })
});

/**
 * Validate login data
 */
const loginSchema = Joi.object({
  email: Joi.string().email().required()
    .messages({
      'string.email': 'Please enter a valid email address',
      'any.required': 'Email is required'
    }),
  password: Joi.string().required()
    .messages({
      'any.required': 'Password is required'
    })
});

/**
 * Validate profile update data
 */
const updateProfileSchema = Joi.object({
  name: Joi.string().min(2).max(255).optional(),
  college: Joi.string().max(255).optional()
});

/**
 * Validate password change
 */
const changePasswordSchema = Joi.object({
  currentPassword: Joi.string().required(),
  newPassword: Joi.string().min(6).required()
});

/**
 * General validation middleware factory
 */
function validate(schema) {
  return (req, res, next) => {
    const { error } = schema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message
      });
    }
    next();
  };
}

module.exports = {
  validate,
  registerSchema,
  loginSchema,
  updateProfileSchema,
  changePasswordSchema
};