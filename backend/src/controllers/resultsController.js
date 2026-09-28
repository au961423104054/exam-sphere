const mongoose = require('mongoose');
const Submission = require('../models/Submission');
const Exam = require('../models/Exam');
const User = require('../models/User');
const { generateCertificatePDF } = require('../services/certificateService');
const { broadcastLeaderboardUpdate } = require('../services/socketService');

/**
 * Compute and retrieve leaderboard rankings for an exam
 * GET /api/results/leaderboard/:examId
 */
const getLeaderboard = async (req, res) => {
  try {
    const { examId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(examId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid exam ID format'
      });
    }

    const exam = await Exam.findById(examId);
    if (!exam) {
      return res.status(404).json({
        success: false,
        message: 'Exam not found'
      });
    }

    // Aggregation pipeline ranking candidates by highest score and earliest submission time
    const rawLeaderboard = await Submission.aggregate([
      {
        $match: {
          examId: new mongoose.Types.ObjectId(examId)
        }
      },
      {
        $sort: {
          score: -1,
          submittedAt: 1,
          createdAt: 1
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: 'studentId',
          foreignField: '_id',
          as: 'student'
        }
      },
      {
        $unwind: '$student'
      },
      {
        $project: {
          _id: 1,
          submissionId: '$_id',
          studentId: '$student._id',
          studentName: '$student.name',
          score: '$score',
          status: '$status',
          violationCount: '$violationCount',
          submittedAt: '$submittedAt',
          createdAt: '$createdAt'
        }
      }
    ]);

    // Assign sequential ranks (1, 2, 3...)
    const rankedLeaderboard = rawLeaderboard.map((entry, index) => ({
      rank: index + 1,
      candidateId: entry.studentId,
      candidateName: entry.studentName,
      ...entry
    }));

    // Broadcast live leaderboard update over Socket.io
    try {
      broadcastLeaderboardUpdate(examId, rankedLeaderboard);
    } catch (socketErr) {
      // Non-blocking socket error
    }

    return res.status(200).json({
      success: true,
      examId,
      examTitle: exam.title,
      totalParticipants: rankedLeaderboard.length,
      data: rankedLeaderboard
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve leaderboard',
      error: error.message
    });
  }
};

/**
 * Generate and download PDF certificate for a passing submission
 * GET /api/results/:id/certificate
 */
const downloadCertificate = async (req, res) => {
  try {
    const { id: submissionId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(submissionId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid submission ID format'
      });
    }

    const submission = await Submission.findById(submissionId)
      .populate('studentId', 'name email')
      .populate('examId', 'title totalMarks passingMarks');

    if (!submission) {
      return res.status(404).json({
        success: false,
        message: 'Submission not found'
      });
    }

    const exam = submission.examId;
    const student = submission.studentId;

    if (!exam) {
      return res.status(404).json({
        success: false,
        message: 'Associated exam record not found'
      });
    }

    // Configurable passing threshold
    const passingThreshold = exam.passingMarks || (exam.totalMarks ? exam.totalMarks * 0.5 : 50);

    if (submission.score < passingThreshold) {
      return res.status(400).json({
        success: false,
        message: `Certificate not available: Score of ${submission.score} is below the passing cutoff (${passingThreshold} marks).`
      });
    }

    const pdfBuffer = await generateCertificatePDF({
      submission,
      exam,
      student
    });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="certificate_${submission._id}.pdf"`);
    res.setHeader('Content-Length', pdfBuffer.length);

    return res.send(pdfBuffer);
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to generate certificate',
      error: error.message
    });
  }
};

/**
 * Get aggregate statistics and submissions for an exam
 * GET /api/results/exam/:examId
 */
const getExamResults = async (req, res) => {
  try {
    const { examId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(examId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid exam ID format'
      });
    }

    const exam = await Exam.findById(examId);
    if (!exam) {
      return res.status(404).json({
        success: false,
        message: 'Exam not found'
      });
    }

    const submissions = await Submission.find({ examId })
      .populate('studentId', 'name email avatarUrl')
      .sort({ score: -1, submittedAt: 1 });

    const totalCandidates = submissions.length;
    const scores = submissions.map((s) => s.score || 0);
    const passingThreshold = exam.passingMarks || (exam.totalMarks ? exam.totalMarks * 0.5 : 50);

    const highestScore = scores.length > 0 ? Math.max(...scores) : 0;
    const lowestScore = scores.length > 0 ? Math.min(...scores) : 0;
    const averageScore =
      scores.length > 0
        ? Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) / 10
        : 0;
    const passCount = submissions.filter((s) => (s.score || 0) >= passingThreshold).length;
    const failCount = totalCandidates - passCount;

    return res.status(200).json({
      success: true,
      data: {
        exam: {
          id: exam._id,
          title: exam.title,
          totalMarks: exam.totalMarks,
          passingMarks: passingThreshold,
          duration: exam.duration
        },
        summary: {
          totalCandidates,
          averageScore,
          highestScore,
          lowestScore,
          passCount,
          failCount,
          passPercentage: totalCandidates > 0 ? Math.round((passCount / totalCandidates) * 100) : 0
        },
        submissions
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve exam results',
      error: error.message
    });
  }
};

/**
 * Get individual candidate scorecard and submission review
 * GET /api/results/submission/:submissionId
 */
const getSubmissionResult = async (req, res) => {
  try {
    const { submissionId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(submissionId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid submission ID format'
      });
    }

    const submission = await Submission.findById(submissionId)
      .populate('examId', 'title description totalMarks passingMarks duration')
      .populate('studentId', 'name email avatarUrl');

    if (!submission) {
      return res.status(404).json({
        success: false,
        message: 'Submission not found'
      });
    }

    // Role check: students can only view their own submission
    if (req.user && req.user.role === 'student') {
      const studentId = submission.studentId?._id || submission.studentId;
      if (studentId && studentId.toString() !== req.user._id.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Access denied: You can only view your own submission results.'
        });
      }
    }

    return res.status(200).json({
      success: true,
      data: submission
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve submission result',
      error: error.message
    });
  }
};

module.exports = {
  getLeaderboard,
  downloadCertificate,
  getExamResults,
  getSubmissionResult
};
