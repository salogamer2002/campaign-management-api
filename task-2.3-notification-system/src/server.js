const express = require('express');
const http = require('http');
const { Server: SocketIO } = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
const config = require('./config');
const apiRoutes = require('./routes');
const errorHandler = require('./middleware/errorHandler');
const AlertEngine = require('./services/alertEngine');
const { notificationsDb } = require('./services/database');

// ─── Express App ────────────────────────────────────────────────
const app = express();
const server = http.createServer(app);

// ─── CORS Origins ───────────────────────────────────────────────
const allowedOrigins = config.CORS_ORIGIN === '*'
  ? '*'
  : config.CORS_ORIGIN.split(',').map(s => s.trim());
const corsOriginFn = (origin, cb) => {
  if (!origin) return cb(null, true);
  if (allowedOrigins === '*' || allowedOrigins.includes(origin)) return cb(null, true);
  cb(new Error('Not allowed by CORS'));
};

// ─── Socket.IO ──────────────────────────────────────────────────
const io = new SocketIO(server, {
  cors: { origin: allowedOrigins === '*' ? '*' : allowedOrigins, methods: ['GET', 'POST'] },
});

// ─── Middleware ──────────────────────────────────────────────────
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({ origin: corsOriginFn, credentials: true }));
app.use(express.json());
if (config.NODE_ENV !== 'test') app.use(morgan('dev'));

// ─── Serve client UI ────────────────────────────────────────────
app.use('/client', express.static(path.join(__dirname, '..', 'client')));

// ─── Health check ───────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({
    success: true,
    service: 'Real-Time Notification System',
    version: '1.0.0',
    status: 'healthy',
    connectedClients: io.engine.clientsCount,
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

// ─── Root ───────────────────────────────────────────────────────
app.get('/', (req, res) => {
  res.json({
    success: true,
    service: 'Real-Time Notification System',
    version: '1.0.0',
    endpoints: {
      health: 'GET /health',
      notifications: 'GET /api/notifications',
      unreadCount: 'GET /api/notifications/count',
      markRead: 'PATCH /api/notifications/:id/read',
      markAllRead: 'PATCH /api/notifications/read-all',
      rules: 'GET /api/rules',
      createRule: 'POST /api/rules',
      updateRule: 'PUT /api/rules/:id',
      deleteRule: 'DELETE /api/rules/:id',
      clientUI: 'GET /client/index.html',
    },
    websocket: `ws://localhost:${config.PORT}`,
  });
});

// ─── API Routes ─────────────────────────────────────────────────
app.use('/api', apiRoutes);

// ─── 404 ────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ success: false, error: `Route ${req.method} ${req.originalUrl} not found` });
});

// ─── Error handler ──────────────────────────────────────────────
app.use(errorHandler);

// ─── Socket.IO Connection Handling ──────────────────────────────
io.on('connection', (socket) => {
  console.log(`[WS] Client connected: ${socket.id}`);

  // Send current unread count on connect
  const unreadCount = notificationsDb.getUnreadCount();
  socket.emit('unread_count', { count: unreadCount });

  // Send recent notifications
  const recent = notificationsDb.getAll({ limit: 20 });
  socket.emit('recent_notifications', { notifications: recent });

  // Handle mark as read
  socket.on('mark_read', ({ id }) => {
    const notification = notificationsDb.markAsRead(id);
    if (notification) {
      io.emit('notification_updated', notification);
      io.emit('unread_count', { count: notificationsDb.getUnreadCount() });
    }
  });

  // Handle mark all as read
  socket.on('mark_all_read', () => {
    notificationsDb.markAllAsRead();
    io.emit('unread_count', { count: 0 });
  });

  socket.on('disconnect', () => {
    console.log(`[WS] Client disconnected: ${socket.id}`);
  });
});

// ─── Alert Engine ───────────────────────────────────────────────
const alertEngine = new AlertEngine((notification) => {
  // Broadcast notification to all connected clients
  io.emit('new_notification', notification);
  io.emit('unread_count', { count: notificationsDb.getUnreadCount() });
});

// ─── Start Server ───────────────────────────────────────────────
server.listen(config.PORT, () => {
  console.log(`\n🔔 Real-Time Notification System`);
  console.log(`   HTTP Port:    ${config.PORT}`);
  console.log(`   WebSocket:    ws://localhost:${config.PORT}`);
  console.log(`   Client UI:    http://localhost:${config.PORT}/client/index.html`);
  console.log(`   Campaign API: ${config.CAMPAIGN_API_URL}`);
  console.log(`   Environment:  ${config.NODE_ENV}`);
  console.log(`   Started:      ${new Date().toISOString()}\n`);

  // Start the alert engine
  alertEngine.start();
});

module.exports = { app, server, io };
