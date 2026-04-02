const express = require('express');
const router = express.Router();
const { getNotifications, getUnreadCount, markAsRead, markAllAsRead } = require('../controllers/notificationController');
const { getRules, getRule, createRule, updateRule, deleteRule } = require('../controllers/ruleController');

// ─── Notification endpoints ──────────────────────────────────
router.get('/notifications', getNotifications);
router.get('/notifications/count', getUnreadCount);
router.patch('/notifications/read-all', markAllAsRead);
router.patch('/notifications/:id/read', markAsRead);

// ─── Alert rule endpoints ────────────────────────────────────
router.get('/rules', getRules);
router.get('/rules/:id', getRule);
router.post('/rules', createRule);
router.put('/rules/:id', updateRule);
router.delete('/rules/:id', deleteRule);

module.exports = router;
