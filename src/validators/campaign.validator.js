const Joi = require('joi');

/**
 * Validation schema for creating a campaign
 */
const createCampaignSchema = Joi.object({
  name: Joi.string().trim().min(2).max(255).required()
    .messages({
      'string.empty': 'Campaign name is required',
      'string.min': 'Campaign name must be at least 2 characters',
      'string.max': 'Campaign name must not exceed 255 characters',
    }),
  description: Joi.string().trim().max(2000).allow('', null)
    .messages({
      'string.max': 'Description must not exceed 2000 characters',
    }),
  status: Joi.string().valid('active', 'paused', 'completed').default('active')
    .messages({
      'any.only': 'Status must be one of: active, paused, completed',
    }),
  budget: Joi.number().positive().precision(2).required()
    .messages({
      'number.base': 'Budget must be a number',
      'number.positive': 'Budget must be a positive number',
    }),
  spend: Joi.number().min(0).precision(2).default(0)
    .messages({
      'number.min': 'Spend cannot be negative',
    }),
  start_date: Joi.date().iso().required()
    .messages({
      'date.base': 'Start date must be a valid date',
      'date.format': 'Start date must be in ISO format (YYYY-MM-DD)',
    }),
  end_date: Joi.date().iso().greater(Joi.ref('start_date')).required()
    .messages({
      'date.base': 'End date must be a valid date',
      'date.greater': 'End date must be after start date',
    }),
  impressions: Joi.number().integer().min(0).default(0),
  clicks: Joi.number().integer().min(0).default(0),
  conversions: Joi.number().integer().min(0).default(0),
});

/**
 * Validation schema for updating a campaign (all fields optional)
 */
const updateCampaignSchema = Joi.object({
  name: Joi.string().trim().min(2).max(255)
    .messages({
      'string.min': 'Campaign name must be at least 2 characters',
      'string.max': 'Campaign name must not exceed 255 characters',
    }),
  description: Joi.string().trim().max(2000).allow('', null),
  status: Joi.string().valid('active', 'paused', 'completed')
    .messages({
      'any.only': 'Status must be one of: active, paused, completed',
    }),
  budget: Joi.number().positive().precision(2)
    .messages({
      'number.positive': 'Budget must be a positive number',
    }),
  spend: Joi.number().min(0).precision(2)
    .messages({
      'number.min': 'Spend cannot be negative',
    }),
  start_date: Joi.date().iso(),
  end_date: Joi.date().iso(),
  impressions: Joi.number().integer().min(0),
  clicks: Joi.number().integer().min(0),
  conversions: Joi.number().integer().min(0),
}).min(1).messages({
  'object.min': 'At least one field must be provided for update',
});

/**
 * Validation schema for login
 */
const loginSchema = Joi.object({
  email: Joi.string().email().required()
    .messages({
      'string.email': 'Please provide a valid email address',
      'string.empty': 'Email is required',
    }),
  password: Joi.string().min(6).required()
    .messages({
      'string.min': 'Password must be at least 6 characters',
      'string.empty': 'Password is required',
    }),
});

/**
 * Middleware factory — validates req.body against a Joi schema
 */
function validate(schema) {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      return res.status(400).json({
        success: false,
        error: 'Validation Error',
        details: error.details.map((d) => ({
          field: d.path.join('.'),
          message: d.message,
        })),
      });
    }

    req.body = value;
    next();
  };
}

module.exports = {
  createCampaignSchema,
  updateCampaignSchema,
  loginSchema,
  validate,
};
