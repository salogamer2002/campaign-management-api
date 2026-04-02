const aiService = require('../services/aiService');

/**
 * POST /generate/copy
 * Generates advertising copy (headline, body, CTA).
 */
async function generateCopy(req, res, next) {
  try {
    const { product, tone, platform, word_limit } = req.body;

    if (!product) {
      return res.status(400).json({
        success: false,
        error: 'Missing required field: product',
        requestId: req.requestId,
      });
    }

    const result = await aiService.generateCopy({ product, tone, platform, word_limit });

    res.json({
      success: true,
      data: result,
      requestId: req.requestId,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /generate/copy/stream
 * SSE streaming version of copy generation.
 */
async function generateCopyStream(req, res, next) {
  try {
    const { product, tone, platform, word_limit } = req.body;

    if (!product) {
      return res.status(400).json({
        success: false,
        error: 'Missing required field: product',
        requestId: req.requestId,
      });
    }

    // Set SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Request-Id', req.requestId);
    res.flushHeaders();

    const stream = aiService.generateCopyStream({ product, tone, platform, word_limit });

    for await (const chunk of stream) {
      res.write(`event: ${chunk.type}\n`);
      res.write(`data: ${chunk.data}\n\n`);
    }

    res.end();
  } catch (err) {
    next(err);
  }
}

/**
 * POST /generate/social
 * Generates social media captions for a specific platform.
 */
async function generateSocial(req, res, next) {
  try {
    const { platform, campaign_goal, brand_voice } = req.body;

    if (!campaign_goal) {
      return res.status(400).json({
        success: false,
        error: 'Missing required field: campaign_goal',
        requestId: req.requestId,
      });
    }

    const result = await aiService.generateSocial({ platform, campaign_goal, brand_voice });

    res.json({
      success: true,
      data: result,
      requestId: req.requestId,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /generate/hashtags
 * Generates relevant hashtags based on content and industry.
 */
async function generateHashtags(req, res, next) {
  try {
    const { content, industry } = req.body;

    if (!content) {
      return res.status(400).json({
        success: false,
        error: 'Missing required field: content',
        requestId: req.requestId,
      });
    }

    const result = await aiService.generateHashtags({ content, industry });

    res.json({
      success: true,
      data: result,
      requestId: req.requestId,
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  generateCopy,
  generateCopyStream,
  generateSocial,
  generateHashtags,
};
