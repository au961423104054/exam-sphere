const User = require('../models/User');
const Organization = require('../models/Organization');
const Exam = require('../models/Exam');
const Submission = require('../models/Submission');
const ProctorLog = require('../models/ProctorLog');

const getOverview = async (req, res) => {
  try {
    const [totalUsers, totalExams, activeExams, totalSubmissions, totalViolations] = await Promise.all([
      User.countDocuments(),
      Exam.countDocuments(),
      Exam.countDocuments({
        $or: [
          { endTime: null },
          { endTime: { $gte: new Date() } }
        ]
      }),
      Submission.countDocuments(),
      Submission.countDocuments({ $or: [{ status: 'flagged-for-review' }, { violationCount: { $gt: 0 } }] })
    ]);
    return res.status(200).json({
      success: true,
      data: {
        totalUsers,
        totalExams,
        activeExams,
        totalSubmissions,
        totalViolations,
        integrityHealth: totalViolations === 0 ? '100%' : 'Nominal'
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to load admin overview',
      error: error.message
    });
  }
};

/**
 * List all organizations
 * GET /api/admin/organizations
 */
const getOrganizations = async (req, res) => {
  try {
    const organizations = await Organization.find().sort({ createdAt: -1 });
    return res.status(200).json({
      success: true,
      count: organizations.length,
      data: organizations
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve organizations',
      error: error.message
    });
  }
};

/**
 * List all users across the platform
 * GET /api/admin/users
 */
const getUsers = async (req, res) => {
  try {
    const { role, search } = req.query;
    const filter = {};

    if (role) {
      filter.role = role;
    }

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    const users = await User.find(filter)
      .select('-passwordHash')
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: users.length,
      data: users
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve users',
      error: error.message
    });
  }
};

/**
 * List all exams across the platform
 * GET /api/admin/exams
 */
const getExams = async (req, res) => {
  try {
    const exams = await Exam.find()
      .populate('createdBy', 'name email role')
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: exams.length,
      data: exams
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve exams',
      error: error.message
    });
  }
};

/**
 * List all flagged submissions with violation details
 * GET /api/admin/violations
 */
const getViolations = async (req, res) => {
  try {
    // Fetch submissions that have violations or are flagged for review
    const flaggedSubmissions = await Submission.find({
      $or: [{ status: 'flagged-for-review' }, { violationCount: { $gt: 0 } }]
    })
      .populate('studentId', 'name email')
      .populate('examId', 'title createdBy')
      .sort({ violationCount: -1, updatedAt: -1 });

    // Fetch corresponding proctor logs for these submissions
    const submissionIds = flaggedSubmissions.map((s) => s._id);
    const logs = await ProctorLog.find({ submissionId: { $in: submissionIds } }).sort({ timestamp: -1 });

    const logsBySubmission = logs.reduce((acc, log) => {
      const subId = log.submissionId.toString();
      if (!acc[subId]) acc[subId] = [];
      acc[subId].push(log);
      return acc;
    }, {});

    const enrichedViolations = flaggedSubmissions.map((submission) => ({
      submissionId: submission._id,
      student: submission.studentId,
      exam: submission.examId,
      status: submission.status,
      violationCount: submission.violationCount,
      proctorFlags: submission.proctorFlags,
      submittedAt: submission.submittedAt,
      logs: logsBySubmission[submission._id.toString()] || []
    }));

    return res.status(200).json({
      success: true,
      count: enrichedViolations.length,
      data: enrichedViolations
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve proctoring violations',
      error: error.message
    });
  }
};

/**
 * Change a user's role
 * PATCH /api/admin/users/:id/role
 */
const updateUserRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    const VALID_ROLES = ['student', 'teacher', 'admin'];
    if (!role || !VALID_ROLES.includes(role)) {
      return res.status(400).json({
        success: false,
        message: `Invalid role: "${role}". Expected one of: ${VALID_ROLES.join(', ')}`
      });
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    user.role = role;
    await user.save();

    return res.status(200).json({
      success: true,
      message: `User role successfully updated to "${role}"`,
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to update user role',
      error: error.message
    });
  }
};

/**
 * Update violation status (e.g., Dismissed, Confirmed Cheating)
 * PATCH /api/admin/violations/:id/status
 */
const updateViolationStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const submission = await Submission.findById(id);
    if (!submission) {
      return res.status(404).json({
        success: false,
        message: 'Submission not found'
      });
    }

    if (status) {
      submission.status = status;
      await submission.save();
    }

    return res.status(200).json({
      success: true,
      message: `Violation status updated to "${status}"`,
      data: submission
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to update violation status',
      error: error.message
    });
  }
};

/**
 * Delete a user account
 * DELETE /api/admin/users/:id
 */
const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    if (id === req.user.id) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete your own admin account'
      });
    }
    await User.findByIdAndDelete(id);
    return res.status(200).json({
      success: true,
      message: 'User account removed successfully'
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to delete user',
      error: error.message
    });
  }
};

module.exports = {
  getOverview,
  getOrganizations,
  getUsers,
  getExams,
  getViolations,
  updateUserRole,
  updateViolationStatus,
  deleteUser
};
