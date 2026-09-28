const Notification = require('../models/Notification');
const User = require('../models/User');
const { success, fail } = require('../utils/http');

const getNotifications = async (req, res) => {
  try {
    const userId = req.user.id;
    const page = parseInt(req.query.page || '1', 10);
    const limit = parseInt(req.query.limit || '50', 10);
    const skip = (page - 1) * limit;

    const [notifications, total, unreadCount] = await Promise.all([
      Notification.find({ userId }).sort({ createdAt: -1 }).skip(skip).limit(limit),
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
    return fail(res, 'Failed to retrieve notifications', 500, { error: error.message });
  }
};

const markAsRead = async (req, res) => {
  try {
    const notification = await Notification.findOne({ _id: req.params.id, userId: req.user.id });
    if (!notification) return fail(res, 'Notification not found', 404);
    notification.read = true;
    await notification.save();
    return success(res, notification, 'Notification marked as read');
  } catch (error) {
    return fail(res, 'Failed to update notification', 500, { error: error.message });
  }
};

const markAllAsRead = async (req, res) => {
  try {
    const result = await Notification.updateMany({ userId: req.user.id, read: false }, { $set: { read: true } });
    return success(res, { modifiedCount: result.modifiedCount }, `Marked ${result.modifiedCount} notifications as read`);
  } catch (error) {
    return fail(res, 'Failed to mark notifications as read', 500, { error: error.message });
  }
};

const registerFcmToken = async (req, res) => {
  try {
    const token = req.body.token || req.body.fcmToken;
    if (!token) return fail(res, 'token is required', 400);
    const user = await User.findById(req.user.id);
    if (!user) return fail(res, 'User not found', 404);
    user.fcmToken = token;
    await user.save();
    return success(res, { registered: true }, 'FCM token registered');
  } catch (error) {
    return fail(res, 'Failed to register FCM token', 500, { error: error.message });
  }
};

module.exports = {
  getNotifications,
  markAsRead,
  markAllAsRead,
  registerFcmToken
};
