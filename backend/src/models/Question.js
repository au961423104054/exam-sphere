const mongoose = require('mongoose');

const testCaseSchema = new mongoose.Schema(
  {
    input: {
      type: String,
      default: ''
    },
    expectedOutput: {
      type: String,
      required: true
    },
    isHidden: {
      type: Boolean,
      default: false
    }
  },
  { _id: true }
);

const questionSchema = new mongoose.Schema(
  {
    examId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Exam',
      required: [true, 'Exam reference is required']
    },
    type: {
      type: String,
      enum: ['mcq', 'tf', 'subjective', 'coding'],
      required: [true, 'Question type is required']
    },
    title: {
      type: String,
      trim: true,
      default: ''
    },
    description: {
      type: String,
      trim: true,
      default: ''
    },
    text: {
      type: String,
      required: [true, 'Question text/prompt is required'],
      trim: true
    },
    // Used for MCQ / TF
    options: {
      type: [String],
      default: []
    },
    correctAnswer: {
      type: mongoose.Schema.Types.Mixed,
      default: null
    },
    marks: {
      type: Number,
      required: [true, 'Marks allocated is required'],
      default: 1,
      min: 0
    },
    tags: {
      type: [String],
      default: []
    },

    // Coding specific fields
    language: {
      type: String,
      enum: ['javascript', 'python', 'java', 'cpp'],
      default: 'javascript'
    },
    starterCode: {
      type: String,
      default: ''
    },
    testCases: {
      type: [testCaseSchema],
      default: []
    },
    timeLimitMs: {
      type: Number,
      default: 2000,
      min: 100
    },
    memoryLimitMb: {
      type: Number,
      default: 128,
      min: 16
    }
  },
  {
    timestamps: true
  }
);

// Indexes
questionSchema.index({ examId: 1 });

module.exports = mongoose.model('Question', questionSchema);
