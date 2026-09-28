const User = require('../models/User');
const { success, fail } = require('../utils/http');
const { toPublicUser } = require('./authController');

const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-passwordHash');
    if (!user) return fail(res, 'User not found', 404);
    return success(res, toPublicUser(user));
  } catch (error) {
    return fail(res, 'Failed to load profile', 500, { error: error.message });
  }
};

const updateMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return fail(res, 'User not found', 404);
    if (req.body.name) user.name = req.body.name.trim();
    await user.save();
    return success(res, toPublicUser(user), 'Profile updated');
  } catch (error) {
    return fail(res, 'Failed to update profile', 500, { error: error.message });
  }
};

const listUsers = async (req, res) => {
  try {
    if (!['admin', 'teacher'].includes(req.user.role)) {
      return fail(res, 'Forbidden', 403);
    }
    const filter = {};
    if (req.query.role) filter.role = req.query.role;
    const users = await User.find(filter).select('-passwordHash');
    return success(res, users.map(toPublicUser));
  } catch (error) {
    return fail(res, 'Failed to list users', 500, { error: error.message });
  }
};

const getUser = async (req, res) => {
  try {
    if (!['admin', 'teacher'].includes(req.user.role)) {
      return fail(res, 'Forbidden', 403);
    }
    const user = await User.findById(req.params.id).select('-passwordHash');
    if (!user) return fail(res, 'User not found', 404);
    return success(res, toPublicUser(user));
  } catch (error) {
    return fail(res, 'Failed to retrieve user', 500, { error: error.message });
  }
};

const updateUserRole = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return fail(res, 'Only admins can change roles', 403);
    }
    const { role } = req.body;
    const VALID_ROLES = ['student', 'teacher', 'admin'];
    if (!VALID_ROLES.includes(role)) {
      return fail(res, `Invalid role: "${role}"`, 400);
    }
    const user = await User.findById(req.params.id);
    if (!user) return fail(res, 'User not found', 404);
    user.role = role;
    await user.save();
    return success(res, toPublicUser(user), `User role updated to "${role}"`);
  } catch (error) {
    return fail(res, 'Failed to update role', 500, { error: error.message });
  }
};

module.exports = {
  getMe,
  updateMe,
  listUsers,
  getUser,
  updateUserRole
};
