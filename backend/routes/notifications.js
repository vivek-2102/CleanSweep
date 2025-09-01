const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const {
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  deleteNotification
} = require('../controllers/notificationController');

const router = express.Router();

router.use(authenticateToken);

router.get('/', getNotifications);
router.put('/:notificationId/read', markNotificationRead);
router.put('/mark-all-read', markAllNotificationsRead);
router.delete('/:notificationId', deleteNotification);

module.exports = router; 