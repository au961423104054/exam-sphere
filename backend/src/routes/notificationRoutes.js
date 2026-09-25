const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const { authenticate } = require('../middleware/auth');

// Protect all notification routes
router.use(authenticate);

// List notifications
router.get('/', notificationController.getNotifications);

// Mark single notification as read
router.patch('/:id/read', notificationController.markAsRead);

// Mark all notifications as read
router.patch('/read-all', notificationController.markAllAsRead);

module.exports = router;
