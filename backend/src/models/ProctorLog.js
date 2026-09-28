const mongoose = require('mongoose');

const proctorLogSchema = new mongoose.Schema(
  {
    submissionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Submission',
      required: [true, 'Submission reference is required']
    },
    type: {
      type: String,
      enum: [
        'tab-switch',
        'fullscreen-exit',
        'devtools-opened',
        'screenshot-attempt',
        'copy-paste-attempt',
        'multiple-faces',
        'no-face',
        'camera-blocked',
        'camera-obstructed',
        'right-click-attempt',
        'print-screen-attempt',
        'audio-multiple-voices',
        'periodic-snapshot',
        'identity-verification'
      ],
      required: [true, 'Violation type is required']
    },
    timestamp: {
      type: Date,
      default: Date.now
    },
    snapshotUrl: {
      type: String,
      default: null
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    }
  },
  {
    timestamps: { createdAt: true, updatedAt: false }
  }
);

module.exports = mongoose.model('ProctorLog', proctorLogSchema);
