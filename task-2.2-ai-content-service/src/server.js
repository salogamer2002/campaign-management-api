const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const config = require('./config');
const requestId = require('./middleware/requestId');
const requestLogger = require('./middleware/requestLogger');
const errorHandler = require('./middleware/errorHandler');
const generateRoutes = require('./routes/generate.routes');

const app = express();

// ─── Security ───────────────────────────────────────────────────
app.use(helmet());

// CORS — allow Vercel frontends + local development
const allowedOrigins = config.CORS_ORIGIN === '*'
  ? '*'
  : config.CORS_ORIGIN.split(',').map(s => s.trim());
app.use(cors({
  origin: (origin, cb) => {
    if (!origin) return cb(null, true);
    if (allowedOrigins === '*' || allowedOrigins.includes(origin)) return cb(null, true);
    cb(new Error('Not allowed by CORS'));
  },
  credentials: true,
}));

// ─── Middleware ─────────────────────────────────────────────────
app.use(requestId);
app.use(requestLogger);
app.use(express.json({ limit: '10kb' }));

// ─── Health check ───────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({
    success: true,
    service: 'AI Content Generation Service',
    version: '1.0.0',
    status: 'healthy',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    requestId: req.requestId,
  });
});

// ─── Root ───────────────────────────────────────────────────────
app.get('/', (req, res) => {
  res.json({
    success: true,
    service: 'AI Content Generation Service',
    version: '1.0.0',
    endpoints: {
      health: 'GET /health',
      generateCopy: 'POST /generate/copy',
      generateCopyStream: 'POST /generate/copy/stream',
      generateSocial: 'POST /generate/social',
      generateHashtags: 'POST /generate/hashtags',
    },
    requestId: req.requestId,
  });
});

// ─── Routes ─────────────────────────────────────────────────────
app.use('/generate', generateRoutes);

// ─── 404 ────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: `Route ${req.method} ${req.originalUrl} not found`,
    requestId: req.requestId,
  });
});

// ─── Error handler ──────────────────────────────────────────────
app.use(errorHandler);

// ─── Start ──────────────────────────────────────────────────────
app.listen(config.PORT, () => {
  console.log(`\n🤖 AI Content Generation Service`);
  console.log(`   Port:        ${config.PORT}`);
  console.log(`   Environment: ${config.NODE_ENV}`);
  console.log(`   AI Backend:  mock (fallback mode)`);
  console.log(`   Started:     ${new Date().toISOString()}\n`);
});

module.exports = app;
