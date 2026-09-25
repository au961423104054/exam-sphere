const ProctorLog = require('../models/ProctorLog');
const Submission = require('../models/Submission');
const Exam = require('../models/Exam');
const { sendNotification } = require('../services/notificationService');

const VALID_VIOLATIONS = [
  'tab-switch',
  'fullscreen-exit',
  'devtools-opened',
  'screenshot-attempt',
  'copy-paste-attempt',
  'multiple-faces',
  'no-face'
];

/**
 * Log an anti-cheat proctoring violation and update submission status
 * POST /api/proctor/log-violation
 */
const logViolation = async (req, res) => {
  try {
    const { type, timestamp, submissionId, snapshotUrl, metadata } = req.body;

    if (!submissionId || !type) {
      return res.status(400).json({
        success: false,
        message: 'submissionId and violation type are required'
      });
    }

    if (!VALID_VIOLATIONS.includes(type)) {
      return res.status(400).json({
        success: false,
        message: `Invalid violation type: "${type}". Expected one of: ${VALID_VIOLATIONS.join(', ')}`
      });
    }

    const submission = await Submission.findById(submissionId);
    if (!submission) {
      return res.status(404).json({
        success: false,
        message: 'Submission not found'
      });
    }

    // Create persistent ProctorLog entry
    const proctorLog = await ProctorLog.create({
      submissionId,
      type,
      timestamp: timestamp ? new Date(timestamp) : new Date(),
      snapshotUrl: snapshotUrl || null,
      metadata: metadata || {}
    });

    // Increment violation count on Submission
    submission.violationCount = (submission.violationCount || 0) + 1;

    // Track unique violation types in proctorFlags
    if (!submission.proctorFlags.includes(type)) {
      submission.proctorFlags.push(type);
    }

    // Auto-flagging logic: check against configurable threshold (default: 5)
    const threshold = parseInt(process.env.VIOLATION_FLAG_THRESHOLD || '5', 10);
    let justFlagged = false;

    if (submission.violationCount >= threshold) {
      if (submission.status !== 'flagged-for-review') {
        submission.status = 'flagged-for-review';
        justFlagged = true;
      }

      // Notify the exam's creator (teacher/admin)
      try {
        const exam = await Exam.findById(submission.examId);
        if (exam && exam.createdBy) {
          await sendNotification({
            userId: exam.createdBy,
            type: 'proctor-alert',
            message: `Submission ${submission._id} for assessment "${exam.title}" reached ${submission.violationCount} violations and has been flagged for review.`,
            metadata: {
              submissionId: submission._id,
              examId: exam._id,
              studentId: submission.studentId,
              violationCount: submission.violationCount,
              latestViolation: type
            }
          });
        }
      } catch (notifErr) {
        console.error('Error notifying exam creator:', notifErr.message);
      }
    }

    await submission.save();

    return res.status(201).json({
      success: true,
      message: 'Violation recorded successfully',
      data: {
        logId: proctorLog._id,
        submissionId: submission._id,
        violationType: type,
        violationCount: submission.violationCount,
        status: submission.status,
        isFlagged: submission.status === 'flagged-for-review',
        justFlagged
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to record proctoring violation',
      error: error.message
    });
  }
};

module.exports = {
  logViolation,
  VALID_VIOLATIONS
};
