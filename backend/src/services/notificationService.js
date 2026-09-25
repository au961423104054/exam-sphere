const Notification = require('../models/Notification');

/**
 * Dispatch and persist a notification to a specific user
 */
const sendNotification = async ({ userId, type = 'proctor-alert', message, metadata = {} }) => {
  try {
    const notification = await Notification.create({
      userId,
      type,
      message,
      read: false,
      metadata
    });
    return notification;
  } catch (error) {
    console.error('Failed to create notification:', error.message);
    return null;
  }
};

module.exports = {
  sendNotification
};
