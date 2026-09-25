const mongoose = require('mongoose');

const testResultSchema = new mongoose.Schema(
  {
    testCaseIndex: { type: Number, required: true },
    passed: { type: Boolean, required: true },
    input: { type: String, default: '' },
    expectedOutput: { type: String, default: '' },
    actualOutput: { type: String, default: '' },
    error: { type: String, default: null },
    time: { type: Number, default: 0 },
    memory: { type: Number, default: 0 },
    isHidden: { type: Boolean, default: false }
  },
  { _id: false }
);

const answerSchema = new mongoose.Schema(
  {
    questionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Question',
      required: true
    },
    selectedOption: {
      type: mongoose.Schema.Types.Mixed,
      default: null
    },
    answerText: {
      type: String,
      default: ''
    },
    code: {
      type: String,
      default: ''
    },
    language: {
      type: String,
      default: ''
    },
    marksAwarded: {
      type: Number,
      default: 0
    },
    testResults: {
      type: [testResultSchema],
      default: []
    }
  },
  { _id: false }
);

const submissionSchema = new mongoose.Schema(
  {
    examId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Exam',
      required: [true, 'Exam reference is required']
    },
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Student reference is required']
    },
    answers: {
      type: [answerSchema],
      default: []
    },
    score: {
      type: Number,
      default: 0
    },
    status: {
      type: String,
      enum: ['in-progress', 'submitted', 'graded', 'flagged-for-review'],
      default: 'in-progress'
    },
    violationCount: {
      type: Number,
      default: 0,
      min: 0
    },
    proctorFlags: {
      type: [String],
      default: []
    },
    submittedAt: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('Submission', submissionSchema);
