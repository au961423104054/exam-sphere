const User = require('../models/User');
const Organization = require('../models/Organization');
const Exam = require('../models/Exam');
const Submission = require('../models/Submission');
const ProctorLog = require('../models/ProctorLog');

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
      .populate('organizationId', 'name plan')
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
 * List all exams across organizations
 * GET /api/admin/exams
 */
const getExams = async (req, res) => {
  try {
    const exams = await Exam.find()
      .populate('createdBy', 'name email role')
      .populate('organizationId', 'name plan')
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
        role: user.role,
        organizationId: user.organizationId
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

module.exports = {
  getOrganizations,
  getUsers,
  getExams,
  getViolations,
  updateUserRole
};
