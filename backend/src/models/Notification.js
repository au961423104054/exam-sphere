const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Recipient user reference is required']
    },
    type: {
      type: String,
      default: 'proctor-alert'
    },
    message: {
      type: String,
      required: [true, 'Notification message is required']
    },
    read: {
      type: Boolean,
      default: false
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('Notification', notificationSchema);
