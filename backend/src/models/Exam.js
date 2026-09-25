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
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      default: null
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
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('Exam', examSchema);
