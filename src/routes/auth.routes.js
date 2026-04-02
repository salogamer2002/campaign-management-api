const express = require('express');
const router = express.Router();
const { login } = require('../controllers/auth.controller');
const { loginSchema, validate } = require('../validators/campaign.validator');

// POST /api/auth/login
router.post('/login', validate(loginSchema), login);

module.exports = router;
