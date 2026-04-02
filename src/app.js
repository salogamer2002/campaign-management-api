const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const swaggerUi = require('swagger-ui-express');
const YAML = require('yamljs');
const path = require('path');
const { errorHandler } = require('./middleware/errorHandler');

// Import routes
const authRoutes = require('./routes/auth.routes');
const campaignRoutes = require('./routes/campaign.routes');

const app = express();

// ─── Security ────────────────────────────────────────────────
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));

// CORS — allow Vercel frontends + local development
const allowedOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',').map(s => s.trim())
  : ['http://localhost:3003', 'http://localhost:3004', 'http://localhost:3000'];
app.use(cors({
  origin: (origin, cb) => {
    // Allow requests with no origin (curl, server-to-server)
    if (!origin) return cb(null, true);
    if (allowedOrigins.includes(origin) || allowedOrigins.includes('*')) return cb(null, true);
    cb(new Error('Not allowed by CORS'));
  },
  credentials: true,
}));

// ─── Rate Limiting: 100 requests/minute per IP ──────────────
const limiter = rateLimit({
  windowMs: 60 * 1000,         // 1 minute
  max: 100,                     // 100 requests per window
  standardHeaders: true,        // Return rate limit info in `RateLimit-*` headers
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Too many requests. Please try again later.',
  },
});
app.use(limiter);

// ─── Body parsing ───────────────────────────────────────────
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true }));

// ─── Logging ────────────────────────────────────────────────
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// ─── Root welcome route ─────────────────────────────────────
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Campaign Management API',
    version: '1.0.0',
    endpoints: {
      health: 'GET /api/health',
      login: 'POST /api/auth/login',
      campaigns: {
        list: 'GET /api/campaigns',
        create: 'POST /api/campaigns',
        get: 'GET /api/campaigns/:id',
        update: 'PUT /api/campaigns/:id',
        delete: 'DELETE /api/campaigns/:id',
      },
    },
    docs: 'See docs/openapi.yaml for full API documentation',
  });
});

// ─── Health check ───────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'Campaign Management API is running',
    timestamp: new Date().toISOString(),
  });
});

// ─── Swagger API Docs ───────────────────────────────────────
const swaggerDocument = YAML.load(path.join(__dirname, '..', 'docs', 'openapi.yaml'));
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'Campaign API Docs',
  swaggerOptions: {
    persistAuthorization: true,
  },
}));

// ─── Routes ─────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/campaigns', campaignRoutes);

// ─── 404 handler ────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: `Route ${req.method} ${req.originalUrl} not found`,
  });
});

// ─── Global error handler ───────────────────────────────────
app.use(errorHandler);

module.exports = app;
