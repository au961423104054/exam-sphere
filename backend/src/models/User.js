const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'User name is required'],
      trim: true
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true
    },
    passwordHash: {
      type: String,
      required: [true, 'Password hash is required']
    },
    role: {
      type: String,
      enum: ['student', 'teacher', 'admin'],
      default: 'student'
    },
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      default: null
    },
    oauthProvider: {
      type: String,
      enum: ['local', 'google', 'github'],
      default: 'local'
    }
  },
  {
    timestamps: true
  }
);

// Method to compare candidate password against hashed password
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.passwordHash);
};

// Method to generate JWT Access Token
userSchema.methods.generateAuthToken = function () {
  const secret = process.env.JWT_SECRET || 'default_jwt_secret';
  const expiresIn = process.env.JWT_EXPIRES_IN || '7d';
  return jwt.sign(
    {
      id: this._id,
      email: this.email,
      role: this.role,
      organizationId: this.organizationId
    },
    secret,
    { expiresIn }
  );
};

module.exports = mongoose.model('User', userSchema);
