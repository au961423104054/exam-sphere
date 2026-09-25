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
 * List all users across the platform (multi-tenant organizationId filter supported)
 * GET /api/admin/users
 */
const getUsers = async (req, res) => {
  try {
    const { role, search, organizationId } = req.query;
    const filter = {};

    if (organizationId) {
      filter.organizationId = organizationId;
    }

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
      .populate('organizationId', 'name plan settings')
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
 * List all exams across organizations (scoped by organizationId if provided)
 * GET /api/admin/exams
 */
const getExams = async (req, res) => {
  try {
    const { organizationId } = req.query;
    const filter = {};
    if (organizationId) {
      filter.organizationId = organizationId;
    }

    const exams = await Exam.find(filter)
      .populate('createdBy', 'name email role')
      .populate('organizationId', 'name plan settings')
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
    const { organizationId } = req.query;

    // Filter exams by organizationId if requested
    let examFilter = {};
    if (organizationId) {
      const exams = await Exam.find({ organizationId }).select('_id');
      examFilter = { examId: { $in: exams.map((e) => e._id) } };
    }

    const flaggedSubmissions = await Submission.find({
      $and: [
        examFilter,
        { $or: [{ status: 'flagged-for-review' }, { violationCount: { $gt: 0 } }] }
      ]
    })
      .populate('studentId', 'name email organizationId')
      .populate('examId', 'title createdBy organizationId')
      .sort({ violationCount: -1, updatedAt: -1 });

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

/**
 * Admin Reporting Summary (Platform-wide or per Organization) with CSV Export
 * GET /api/admin/reports/summary
 */
const getReportsSummary = async (req, res) => {
  try {
    const { organizationId, format } = req.query;

    const userFilter = organizationId ? { organizationId } : {};
    const examFilter = organizationId ? { organizationId } : {};

    let submissionFilter = {};
    if (organizationId) {
      const orgExams = await Exam.find({ organizationId }).select('_id');
      submissionFilter = { examId: { $in: orgExams.map((e) => e._id) } };
    }

    const [
      totalOrgs,
      totalExams,
      totalSubmissions,
      flaggedSubmissions,
      studentsCount,
      teachersCount,
      adminsCount,
      allSubmissions,
      organizations
    ] = await Promise.all([
      Organization.countDocuments(),
      Exam.countDocuments(examFilter),
      Submission.countDocuments(submissionFilter),
      Submission.countDocuments({ ...submissionFilter, status: 'flagged-for-review' }),
      User.countDocuments({ ...userFilter, role: 'student' }),
      User.countDocuments({ ...userFilter, role: 'teacher' }),
      User.countDocuments({ ...userFilter, role: 'admin' }),
      Submission.find(submissionFilter).select('score violationCount'),
      Organization.find().select('name plan')
    ]);

    const totalActiveUsers = studentsCount + teachersCount + adminsCount;
    const totalScore = allSubmissions.reduce((acc, s) => acc + (s.score || 0), 0);
    const averageScore = allSubmissions.length > 0 ? Number((totalScore / allSubmissions.length).toFixed(2)) : 0;
    const totalViolations = allSubmissions.reduce((acc, s) => acc + (s.violationCount || 0), 0);

    const summaryData = {
      scope: organizationId ? 'organization' : 'platform-wide',
      organizationId: organizationId || null,
      totalOrganizations: totalOrgs,
      totalExams,
      totalSubmissions,
      flaggedSubmissions,
      totalActiveUsers,
      userBreakdown: {
        students: studentsCount,
        teachers: teachersCount,
        admins: adminsCount
      },
      averageScore,
      totalViolations
    };

    // CSV Export option
    if (format === 'csv') {
      const csvRows = [
        'Metric,Value',
        `Scope,${summaryData.scope}`,
        `OrganizationId,${summaryData.organizationId || 'All'}`,
        `Total Organizations,${summaryData.totalOrganizations}`,
        `Total Exams,${summaryData.totalExams}`,
        `Total Submissions,${summaryData.totalSubmissions}`,
        `Flagged Submissions,${summaryData.flaggedSubmissions}`,
        `Total Active Users,${summaryData.totalActiveUsers}`,
        `Student Users,${summaryData.userBreakdown.students}`,
        `Teacher Users,${summaryData.userBreakdown.teachers}`,
        `Admin Users,${summaryData.userBreakdown.admins}`,
        `Average Score,${summaryData.averageScore}`,
        `Total Proctoring Violations,${summaryData.totalViolations}`
      ];

      const csvContent = csvRows.join('\n');
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="examsphere_admin_summary_report.csv"');
      return res.status(200).send(csvContent);
    }

    return res.status(200).json({
      success: true,
      data: summaryData
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to generate admin reports summary',
      error: error.message
    });
  }
};

module.exports = {
  getOrganizations,
  getUsers,
  getExams,
  getViolations,
  updateUserRole,
  getReportsSummary
};
