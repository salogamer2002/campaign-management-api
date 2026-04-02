const express = require('express');
const router = express.Router();
const {
  generateCopy,
  generateCopyStream,
  generateSocial,
  generateHashtags,
} = require('../controllers/generateController');

// POST /generate/copy — Generate advertising copy
router.post('/copy', generateCopy);

// POST /generate/copy/stream — SSE streaming copy generation
router.post('/copy/stream', generateCopyStream);

// POST /generate/social — Generate social media captions
router.post('/social', generateSocial);

// POST /generate/hashtags — Generate relevant hashtags
router.post('/hashtags', generateHashtags);

module.exports = router;
