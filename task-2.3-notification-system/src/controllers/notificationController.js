const { notificationsDb } = require('../services/database');

/**
 * GET /api/notifications
 */
function getNotifications(req, res) {
  const { limit = 50, offset = 0, unread_only } = req.query;
  const notifications = notificationsDb.getAll({
    limit: parseInt(limit),
    offset: parseInt(offset),
    unread_only: unread_only === 'true',
  });
  const unreadCount = notificationsDb.getUnreadCount();

  res.json({
    success: true,
    data: { notifications, unread_count: unreadCount },
  });
}

/**
 * GET /api/notifications/count
 */
function getUnreadCount(req, res) {
  const count = notificationsDb.getUnreadCount();
  res.json({ success: true, data: { unread_count: count } });
}

/**
 * PATCH /api/notifications/:id/read
 */
function markAsRead(req, res) {
  const notification = notificationsDb.getById(req.params.id);
  if (!notification) {
    return res.status(404).json({ success: false, error: 'Notification not found' });
  }

  const updated = notificationsDb.markAsRead(req.params.id);
  res.json({ success: true, data: updated });
}

/**
 * PATCH /api/notifications/read-all
 */
function markAllAsRead(req, res) {
  const result = notificationsDb.markAllAsRead();
  res.json({ success: true, data: { updated: result.changes } });
}

module.exports = { getNotifications, getUnreadCount, markAsRead, markAllAsRead };
