const bcrypt = require('bcryptjs');
const Joi = require('joi');
const User = require('../models/User');
const { success, fail } = require('../utils/http');

const registerSchema = Joi.object({
  name: Joi.string().trim().min(2).max(100).required(),
  email: Joi.string().email().lowercase().trim().required(),
  password: Joi.string().min(6).max(128).required(),
  role: Joi.string().valid('student', 'teacher').default('student'),
  organizationName: Joi.string().optional().allow('')
});

const loginSchema = Joi.object({
  email: Joi.string().email().lowercase().trim().required(),
  password: Joi.string().required()
});

const toPublicUser = (user) => ({
  id: user._id,
  _id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  oauthProvider: user.oauthProvider
});

const login = async (req, res) => {
  try {
    const { error, value } = loginSchema.validate(req.body);
    if (error) {
      return fail(res, error.details[0].message, 400);
    }
    const { email, password } = value;

    const user = await User.findOne({ email });
    if (!user) {
      return fail(res, 'Invalid email or password', 401);
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return fail(res, 'Invalid email or password', 401);
    }

    const token = user.generateAuthToken();

    return success(
      res,
      { token, user: toPublicUser(user) },
      'Login successful'
    );
  } catch (error) {
    return fail(res, 'Server error during login', 500, { error: error.message });
  }
};

const register = async (req, res) => {
  try {
    const { error, value } = registerSchema.validate(req.body);
    if (error) {
      return fail(res, error.details[0].message, 400);
    }
    const { name, email, password, role } = value;

    const existing = await User.findOne({ email });
    if (existing) {
      return fail(res, 'An account with this email already exists', 409);
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({
      name,
      email,
      passwordHash,
      role: role || 'student',
      oauthProvider: 'local'
    });

    const token = user.generateAuthToken();
    return success(res, { token, user: toPublicUser(user) }, 'Registration successful', 201);
  } catch (error) {
    return fail(res, 'Server error during registration', 500, { error: error.message });
  }
};

const logout = async (req, res) => {
  return success(res, {}, 'Logged out. Discard the client token.');
};

const refresh = async (req, res) => {
  try {
    if (!req.user) {
      return fail(res, 'Authentication required', 401);
    }
    const user = await User.findById(req.user.id);
    if (!user) {
      return fail(res, 'User not found', 401);
    }
    const token = user.generateAuthToken();
    return success(res, { token, user: toPublicUser(user) }, 'Token refreshed');
  } catch (error) {
    return fail(res, 'Unable to refresh token', 500, { error: error.message });
  }
};

const crypto = require('crypto');

const forgotPasswordSchema = Joi.object({
  email: Joi.string().email().lowercase().trim().required()
});

const resetPasswordSchema = Joi.object({
  email: Joi.string().email().lowercase().trim().required(),
  token: Joi.string().optional().allow(''),
  newPassword: Joi.string().min(6).max(128).required()
});

const forgotPassword = async (req, res) => {
  try {
    const { error, value } = forgotPasswordSchema.validate(req.body);
    if (error) {
      return fail(res, error.details[0].message, 400);
    }
    const { email } = value;

    const user = await User.findOne({ email });
    if (!user) {
      return success(
        res,
        { email },
        'If an account exists with this email address, password reset instructions have been generated.'
      );
    }

    const resetToken = crypto.randomBytes(20).toString('hex');
    const resetCode = Math.floor(100000 + Math.random() * 900000).toString();

    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = new Date(Date.now() + 3600 * 1000); // 1 hour
    await user.save();

    console.log(`[Auth] Password reset requested for ${user.email}. Reset Code: ${resetCode}, Token: ${resetToken}`);

    return success(
      res,
      {
        email: user.email,
        resetToken,
        resetCode,
        expiresIn: '1 hour'
      },
      'Password reset verification code generated. Please proceed to set a new password.'
    );
  } catch (error) {
    return fail(res, 'Failed to process forgot password request', 500, { error: error.message });
  }
};

const resetPassword = async (req, res) => {
  try {
    const { error, value } = resetPasswordSchema.validate(req.body);
    if (error) {
      return fail(res, error.details[0].message, 400);
    }
    const { email, newPassword } = value;

    const user = await User.findOne({ email });
    if (!user) {
      return fail(res, 'Account with specified email not found.', 404);
    }

    if (user.resetPasswordExpires && user.resetPasswordExpires < new Date()) {
      return fail(res, 'Password reset token has expired. Please request a new one.', 400);
    }

    const salt = await bcrypt.genSalt(10);
    user.passwordHash = await bcrypt.hash(newPassword, salt);
    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;
    await user.save();

    return success(
      res,
      { email: user.email },
      'Password has been updated successfully. You can now sign in with your new password.'
    );
  } catch (error) {
    return fail(res, 'Failed to reset password', 500, { error: error.message });
  }
};

module.exports = {
  login,
  register,
  logout,
  refresh,
  forgotPassword,
  resetPassword,
  toPublicUser
};
