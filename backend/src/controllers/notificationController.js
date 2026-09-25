const Notification = require('../models/Notification');

/**
 * List all notifications for authenticated user
 * GET /api/notifications
 */
const getNotifications = async (req, res) => {
  try {
    const userId = req.user.id;
    const page = parseInt(req.query.page || '1', 10);
    const limit = parseInt(req.query.limit || '50', 10);
    const skip = (page - 1) * limit;

    const [notifications, total, unreadCount] = await Promise.all([
      Notification.find({ userId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Notification.countDocuments({ userId }),
      Notification.countDocuments({ userId, read: false })
    ]);

    return res.status(200).json({
      success: true,
      total,
      unreadCount,
      page,
      data: notifications
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve notifications',
      error: error.message
    });
  }
};

/**
 * Mark a single notification as read
 * PATCH /api/notifications/:id/read
 */
const markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const notification = await Notification.findOne({ _id: id, userId });
    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    notification.read = true;
    await notification.save();

    return res.status(200).json({
      success: true,
      message: 'Notification marked as read',
      data: notification
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to update notification',
      error: error.message
    });
  }
};

/**
 * Mark all unread notifications as read for authenticated user
 * PATCH /api/notifications/read-all
 */
const markAllAsRead = async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await Notification.updateMany(
      { userId, read: false },
      { $set: { read: true } }
    );

    return res.status(200).json({
      success: true,
      message: `Marked ${result.modifiedCount} notifications as read`,
      modifiedCount: result.modifiedCount
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to mark notifications as read',
      error: error.message
    });
  }
};

module.exports = {
  getNotifications,
  markAsRead,
  markAllAsRead
};
