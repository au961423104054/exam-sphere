const mongoose = require('mongoose');

const sectionSchema = new mongoose.Schema(
  {
    sectionId: { type: String, required: true },
    name: { type: String, required: true },
    instructions: { type: String, default: '' }
  },
  { _id: false }
);

const examSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Exam title is required'],
      trim: true
    },
    slug: {
      type: String,
      trim: true,
      index: true
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    duration: {
      type: Number,
      required: [true, 'Duration in minutes is required'],
      min: 1
    },
    sections: {
      type: [sectionSchema],
      default: []
    },
    startTime: {
      type: Date,
      default: Date.now
    },
    endTime: {
      type: Date,
      default: null
    },
    negativeMarking: {
      type: Boolean,
      default: false
    },
    randomizeOrder: {
      type: Boolean,
      default: false
    },
    reminderSent: {
      type: Boolean,
      default: false
    },
    totalMarks: {
      type: Number,
      default: 100
    },
    passingMarks: {
      type: Number,
      default: 50
    },
    allowedIpRange: {
      type: String,
      default: ''
    },
    requireIdentityVerification: {
      type: Boolean,
      default: true
    },
    snapshotIntervalSeconds: {
      type: Number,
      default: 45,
      min: 10,
      max: 300
    },
    enableMicrophoneMonitoring: {
      type: Boolean,
      default: false
    },
    questionDistribution: {
      enabled: {
        type: Boolean,
        default: false
      },
      totalCount: {
        type: Number,
        default: 0
      },
      byType: {
        coding: { type: Number, default: 0 },
        mcq: { type: Number, default: 0 },
        tf: { type: Number, default: 0 },
        subjective: { type: Number, default: 0 }
      }
    }
  },
  {
    timestamps: true
  }
);

// Indexes for query performance
examSchema.index({ createdBy: 1 });
examSchema.index({ startTime: 1, endTime: 1 });

module.exports = mongoose.model('Exam', examSchema);
