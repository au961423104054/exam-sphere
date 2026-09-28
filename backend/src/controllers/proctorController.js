const mongoose = require('mongoose');
const ProctorLog = require('../models/ProctorLog');
const Submission = require('../models/Submission');
const Exam = require('../models/Exam');
const User = require('../models/User');
const { sendNotification } = require('../services/notificationService');
const storageService = require('../services/storageService');
const { findExamByIdOrSlug } = require('../utils/examResolver');
const { success, fail } = require('../utils/http');

const VALID_VIOLATIONS = [
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
];

// Types that are informational monitoring events, not cheating violations
const NON_INCIDENTAL_TYPES = ['periodic-snapshot', 'identity-verification'];

const normalizeType = (type) => {
  if (!type) return 'tab-switch';
  if (type === 'screen-recording') return 'screenshot-attempt';
  if (type === 'printscreen' || type === 'print-screen') return 'print-screen-attempt';
  if (type === 'contextmenu' || type === 'right-click') return 'right-click-attempt';
  if (type === 'camera-dark' || type === 'camera-covered') return 'camera-blocked';
  return type;
};

const resolveSubmissionId = async (req) => {
  const subId = req.body.submissionId || req.params.submissionId;
  if (subId && mongoose.Types.ObjectId.isValid(subId)) return subId;

  const examId = req.body.examId;
  if (examId && req.user) {
    let resolvedExamId = examId;
    if (!mongoose.Types.ObjectId.isValid(examId)) {
      const resolvedExam = await findExamByIdOrSlug(examId);
      if (resolvedExam) resolvedExamId = resolvedExam._id;
    }
    if (mongoose.Types.ObjectId.isValid(resolvedExamId)) {
      const existing = await Submission.findOne({
        examId: resolvedExamId,
        studentId: req.user.id
      }).sort({ createdAt: -1 });
      return existing?._id;
    }
  }
  return null;
};

/**
 * Log a proctoring incident or violation event.
 * Auto-flags submission if threshold is crossed.
 */
const logViolation = async (req, res) => {
  try {
    const type = normalizeType(req.body.type || req.body.violationType);
    const { timestamp, snapshotUrl, metadata, details } = req.body;
    const submissionId = await resolveSubmissionId(req);

    if (!submissionId || !type) {
      // If student hasn't initiated active submission, accept gracefully without crash
      return success(res, { type, recordedLocally: true }, 'Incident recorded locally');
    }

    if (!VALID_VIOLATIONS.includes(type)) {
      return fail(res, `Invalid violation type: "${type}". Expected one of: ${VALID_VIOLATIONS.join(', ')}`, 400);
    }

    if (!mongoose.Types.ObjectId.isValid(submissionId)) {
      return success(res, { type, recordedLocally: true }, 'Incident recorded');
    }

    const submission = await Submission.findById(submissionId);
    if (!submission) return fail(res, 'Submission not found', 404);

    const proctorLog = await ProctorLog.create({
      submissionId,
      type,
      timestamp: timestamp ? new Date(timestamp) : new Date(),
      snapshotUrl: snapshotUrl || null,
      metadata: metadata || (details ? { details } : {})
    });

    // Only penalize/count actual violations (not periodic or verification events)
    let justFlagged = false;
    if (!NON_INCIDENTAL_TYPES.includes(type)) {
      submission.violationCount = (submission.violationCount || 0) + 1;
      if (!submission.proctorFlags.includes(type)) {
        submission.proctorFlags.push(type);
      }

      const threshold = parseInt(process.env.VIOLATION_FLAG_THRESHOLD || '5', 10);
      if (submission.violationCount >= threshold) {
        if (submission.status !== 'flagged-for-review') {
          submission.status = 'flagged-for-review';
          justFlagged = true;
        }
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
    }

    return success(
      res,
      {
        logId: proctorLog._id,
        id: proctorLog._id,
        submissionId: submission._id,
        violationType: type,
        type,
        violationCount: submission.violationCount,
        status: submission.status,
        isFlagged: submission.status === 'flagged-for-review',
        justFlagged
      },
      'Violation recorded successfully',
      201
    );
  } catch (error) {
    return fail(res, 'Failed to record proctoring violation', 500, { error: error.message });
  }
};

/**
 * Upload an incident snapshot or manual snapshot
 */
const uploadSnapshot = async (req, res) => {
  try {
    const { logId, type } = req.body;
    const submissionId = await resolveSubmissionId(req);
    let fileInput = null;

    if (req.file && req.file.buffer) fileInput = req.file.buffer;
    else if (req.body.snapshot) fileInput = req.body.snapshot;
    else if (req.body.image) fileInput = req.body.image;
    else if (req.body.imageBase64) fileInput = req.body.imageBase64;

    if (!fileInput) {
      return fail(
        res,
        'No snapshot image provided. Submit via multipart "snapshot" field or base64 "imageBase64"/"snapshot" body string.',
        400
      );
    }

    if (!submissionId && !logId) {
      return fail(res, 'Either submissionId, examId, or logId must be provided to associate the webcam snapshot', 400);
    }

    const uploadResult = await storageService.uploadSnapshot(fileInput, {
      folder: 'snapshots',
      req
    });

    let targetLog = null;

    if (logId) {
      targetLog = await ProctorLog.findById(logId);
      if (targetLog) {
        targetLog.snapshotUrl = uploadResult.url;
        await targetLog.save();
      }
    } else if (submissionId) {
      const incidentType = type && VALID_VIOLATIONS.includes(normalizeType(type)) ? normalizeType(type) : 'screenshot-attempt';
      targetLog = await ProctorLog.create({
        submissionId,
        type: incidentType,
        timestamp: req.body.timestamp ? new Date(req.body.timestamp) : new Date(),
        snapshotUrl: uploadResult.url
      });
    }

    return success(
      res,
      {
        snapshotUrl: uploadResult.url,
        url: uploadResult.url,
        publicId: uploadResult.publicId,
        logId: targetLog ? targetLog._id : null,
        submissionId: submissionId || targetLog?.submissionId
      },
      'Snapshot uploaded and linked successfully'
    );
  } catch (error) {
    return fail(res, 'Failed to upload webcam snapshot', 500, { error: error.message });
  }
};

/**
 * Pre-exam Identity Verification
 * Captures live candidate webcam photo, logs verification event,
 * and attaches reference snapshot to candidate attempt.
 */
const verifyIdentity = async (req, res) => {
  try {
    let fileInput = null;
    if (req.file && req.file.buffer) fileInput = req.file.buffer;
    else if (req.body.snapshot) fileInput = req.body.snapshot;
    else if (req.body.image) fileInput = req.body.image;
    else if (req.body.imageBase64) fileInput = req.body.imageBase64;

    if (!fileInput) {
      return fail(res, 'Candidate webcam identity photo is required.', 400);
    }

    const { submissionId, examId, faceDetected, confidenceScore, metadata } = req.body;

    if (faceDetected === false) {
      return fail(
        res,
        'Identity verification rejected: No human face detected. Please open your camera shutter and face the camera directly.',
        400
      );
    }

    if (
      metadata &&
      (metadata.cameraBlocked ||
        metadata.isShutterClosed ||
        (metadata.avgLuminance !== undefined && Number(metadata.avgLuminance) < 25))
    ) {
      return fail(
        res,
        'Identity verification rejected: Camera shutter is closed or lens is covered. Open the physical shutter slider on your webcam.',
        400
      );
    }

    const uploadResult = await storageService.uploadSnapshot(fileInput, {
      folder: 'verification',
      req
    });

    // Handle optional College ID card photo upload
    let collegeIdPhotoUrl = req.body.collegeIdPhotoUrl || null;
    const rawCollegeIdPhoto = req.body.collegeIdPhoto || req.body.collegeIdImageBase64;
    if (rawCollegeIdPhoto && !collegeIdPhotoUrl) {
      try {
        const idUpload = await storageService.uploadSnapshot(rawCollegeIdPhoto, { folder: 'college_ids', req });
        collegeIdPhotoUrl = idUpload.url;
      } catch (err) {
        console.warn('Failed to upload college ID photo in verifyIdentity:', err.message);
      }
    }

    const candidateDetails = {
      name: req.body.name || req.body.candidateName || req.user?.name || '',
      email: req.body.email || req.body.candidateEmail || req.user?.email || '',
      collegeId: req.body.collegeId || req.body.registerNo || '',
      collegeName: req.body.collegeName || '',
      collegeIdPhotoUrl: collegeIdPhotoUrl || null,
      facePhotoUrl: uploadResult.url
    };

    let submission = null;
    if (submissionId && mongoose.Types.ObjectId.isValid(submissionId)) {
      submission = await Submission.findById(submissionId);
    } else if (examId && req.user) {
      let targetExamId = examId;
      if (!mongoose.Types.ObjectId.isValid(examId)) {
        const resolvedExam = await findExamByIdOrSlug(examId);
        if (resolvedExam) targetExamId = resolvedExam._id;
      }
      if (mongoose.Types.ObjectId.isValid(targetExamId)) {
        submission = await Submission.findOne({ examId: targetExamId, studentId: req.user.id, status: 'in-progress' });
      }
    }

    if (submission) {
      submission.verificationSnapshotUrl = uploadResult.url;
      submission.verifiedAt = new Date();
      submission.identityStatus = 'verified';
      submission.candidateDetails = {
        ...(submission.candidateDetails?.toObject ? submission.candidateDetails.toObject() : submission.candidateDetails),
        ...candidateDetails
      };
      await submission.save();

      await ProctorLog.create({
        submissionId: submission._id,
        type: 'identity-verification',
        timestamp: new Date(),
        snapshotUrl: uploadResult.url,
        metadata: {
          faceDetected: faceDetected !== false,
          confidenceScore: confidenceScore || 0.95,
          collegeId: candidateDetails.collegeId,
          collegeName: candidateDetails.collegeName,
          collegeIdPhotoUrl: candidateDetails.collegeIdPhotoUrl,
          ...(metadata || {})
        }
      });
    }

    // Also update student user profile reference if not yet set
    if (req.user && req.user.id) {
      const userUpdate = { avatarUrl: uploadResult.url };
      if (candidateDetails.collegeIdPhotoUrl) userUpdate.idPhotoUrl = candidateDetails.collegeIdPhotoUrl;
      if (candidateDetails.collegeId) userUpdate.collegeId = candidateDetails.collegeId;
      if (candidateDetails.collegeName) userUpdate.collegeName = candidateDetails.collegeName;
      await User.findByIdAndUpdate(req.user.id, { $set: userUpdate }).catch(() => {});
    }

    return success(
      res,
      {
        verified: true,
        verificationSnapshotUrl: uploadResult.url,
        snapshotUrl: uploadResult.url,
        url: uploadResult.url,
        collegeIdPhotoUrl: candidateDetails.collegeIdPhotoUrl,
        candidateDetails,
        verifiedAt: new Date().toISOString(),
        confidence: confidenceScore || 0.95,
        submissionId: submission?._id || null
      },
      'Candidate identity and college ID photo verified successfully'
    );
  } catch (error) {
    return fail(res, 'Failed to verify candidate identity', 500, { error: error.message });
  }
};

/**
 * Continuous Session Monitoring Snapshot
 * Periodic webcam captures (every 30-60s) providing an ongoing chronological trail.
 */
const uploadPeriodicSnapshot = async (req, res) => {
  try {
    const submissionId = await resolveSubmissionId(req);
    if (!submissionId) {
      return fail(res, 'submissionId is required for periodic monitoring', 400);
    }

    let fileInput = null;
    if (req.file && req.file.buffer) fileInput = req.file.buffer;
    else if (req.body.snapshot) fileInput = req.body.snapshot;
    else if (req.body.image) fileInput = req.body.image;
    else if (req.body.imageBase64) fileInput = req.body.imageBase64;

    if (!fileInput) {
      return fail(res, 'Snapshot image data is required', 400);
    }

    const uploadResult = await storageService.uploadSnapshot(fileInput, {
      folder: 'filmstrip',
      req
    });

    const log = await ProctorLog.create({
      submissionId,
      type: 'periodic-snapshot',
      timestamp: req.body.timestamp ? new Date(req.body.timestamp) : new Date(),
      snapshotUrl: uploadResult.url,
      metadata: req.body.metadata || {}
    });

    return success(
      res,
      {
        logId: log._id,
        snapshotUrl: uploadResult.url,
        timestamp: log.timestamp
      },
      'Periodic session snapshot logged'
    );
  } catch (error) {
    return fail(res, 'Failed to save periodic snapshot', 500, { error: error.message });
  }
};

/**
 * Comprehensive Proctoring Report for Teachers and Admins
 * Returns candidate identity snapshot, continuous filmstrip, and violation timeline.
 */
const getProctorReport = async (req, res) => {
  try {
    const { submissionId } = req.params;
    const submission = await Submission.findById(submissionId)
      .populate('studentId', 'name email role')
      .populate('examId', 'title duration totalMarks passingMarks');

    if (!submission) return fail(res, 'Submission not found', 404);

    const logs = await ProctorLog.find({ submissionId }).sort({ timestamp: 1 });

    const verificationLog = logs.find((l) => l.type === 'identity-verification');
    const filmstrip = logs.filter((l) => l.type === 'periodic-snapshot');
    const violations = logs.filter((l) => !NON_INCIDENTAL_TYPES.includes(l.type));

    // Map severity
    const formattedViolations = violations.map((v) => {
      let severity = 'low';
      if (['multiple-faces', 'devtools-opened', 'camera-blocked'].includes(v.type)) {
        severity = 'high';
      } else if (['tab-switch', 'fullscreen-exit', 'no-face', 'audio-multiple-voices'].includes(v.type)) {
        severity = 'medium';
      }
      return {
        id: v._id,
        type: v.type,
        timestamp: v.timestamp,
        snapshotUrl: v.snapshotUrl,
        severity,
        metadata: v.metadata
      };
    });

    return success(res, {
      submission: {
        id: submission._id,
        submissionId: submission._id,
        candidateName: submission.candidateDetails?.name || submission.studentId?.name || 'Student Candidate',
        candidateEmail: submission.candidateDetails?.email || submission.studentId?.email || 'N/A',
        collegeId: submission.candidateDetails?.collegeId || 'N/A',
        collegeName: submission.candidateDetails?.collegeName || 'N/A',
        collegeIdPhotoUrl: submission.candidateDetails?.collegeIdPhotoUrl || null,
        facePhotoUrl: submission.candidateDetails?.facePhotoUrl || submission.verificationSnapshotUrl || null,
        candidateDetails: submission.candidateDetails || null,
        examTitle: submission.examId?.title || 'Assessment',
        status: submission.status,
        score: submission.score,
        totalMarks: submission.examId?.totalMarks || 100,
        passingMarks: submission.examId?.passingMarks || 50,
        violationCount: submission.violationCount,
        isFlagged: submission.status === 'flagged-for-review',
        verifiedAt: submission.verifiedAt,
        verificationSnapshotUrl: submission.verificationSnapshotUrl || verificationLog?.snapshotUrl || null,
        identityStatus: submission.identityStatus || (submission.verifiedAt ? 'verified' : 'pending'),
        submittedAt: submission.submittedAt,
        createdAt: submission.createdAt
      },
      filmstrip: filmstrip.map((f) => ({
        id: f._id,
        timestamp: f.timestamp,
        snapshotUrl: f.snapshotUrl
      })),
      violations: formattedViolations,
      stats: {
        totalViolations: violations.length,
        totalSnapshots: filmstrip.length,
        flagThreshold: parseInt(process.env.VIOLATION_FLAG_THRESHOLD || '5', 10),
        status: submission.status
      }
    });
  } catch (error) {
    return fail(res, 'Failed to generate proctoring report', 500, { error: error.message });
  }
};

const getSession = async (req, res) => {
  try {
    const logs = await ProctorLog.find({ submissionId: req.params.submissionId }).sort({ timestamp: -1 });
    return success(res, logs);
  } catch (error) {
    return fail(res, 'Failed to load proctor session', 500, { error: error.message });
  }
};

const getViolations = async (req, res) => {
  try {
    const flaggedSubmissions = await Submission.find({
      $or: [
        { violationCount: { $gt: 0 } },
        { proctorFlags: { $exists: true, $not: { $size: 0 } } },
        { status: 'flagged-for-review' },
        { status: 'terminated' }
      ]
    })
      .populate('studentId', 'name email collegeId')
      .populate('examId', 'title code durationMinutes totalMarks passingMarks')
      .sort({ updatedAt: -1 });

    const submissionIds = flaggedSubmissions.map((s) => s._id);
    const logs = await ProctorLog.find({
      submissionId: { $in: submissionIds },
      type: { $nin: ['periodic-snapshot', 'identity-verification'] }
    }).sort({ timestamp: -1 });

    const logsBySubmission = logs.reduce((acc, log) => {
      const subId = log.submissionId.toString();
      if (!acc[subId]) acc[subId] = [];
      acc[subId].push(log);
      return acc;
    }, {});

    const enriched = flaggedSubmissions.map((sub) => {
      const subLogs = logsBySubmission[sub._id.toString()] || [];
      return {
        id: sub._id,
        submissionId: sub._id,
        studentName: sub.candidateDetails?.name || sub.studentId?.name || 'Unknown Candidate',
        studentEmail: sub.candidateDetails?.email || sub.studentId?.email || 'N/A',
        registerNo: sub.candidateDetails?.collegeId || sub.studentId?.collegeId || 'N/A',
        examTitle: sub.examId?.title || 'Assessment',
        examId: sub.examId?._id,
        violationCount: sub.violationCount || subLogs.length || 0,
        flags: sub.proctorFlags || [],
        status: sub.status,
        submittedAt: sub.submittedAt || sub.updatedAt,
        timestamp: sub.updatedAt || sub.createdAt,
        collegeIdPhotoUrl: sub.candidateDetails?.collegeIdPhotoUrl || null,
        facePhotoUrl: sub.candidateDetails?.facePhotoUrl || sub.verificationSnapshotUrl || null,
        logs: subLogs.map((l) => ({
          type: l.type,
          timestamp: l.timestamp,
          snapshotUrl: l.snapshotUrl,
          details: l.metadata?.details || l.metadata?.reason || ''
        }))
      };
    });

    return success(res, enriched, 'Violations retrieved successfully');
  } catch (error) {
    return fail(res, error.message || 'Failed to retrieve violations', 500);
  }
};

module.exports = {
  logViolation,
  uploadSnapshot,
  verifyIdentity,
  uploadPeriodicSnapshot,
  getProctorReport,
  getSession,
  getViolations,
  VALID_VIOLATIONS,
  NON_INCIDENTAL_TYPES
};
