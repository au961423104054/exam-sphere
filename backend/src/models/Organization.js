const mongoose = require('mongoose');

const brandingSchema = new mongoose.Schema(
  {
    logoUrl: { type: String, default: null },
    primaryColor: { type: String, default: '#4F46E5' },
    tagline: { type: String, default: '' }
  },
  { _id: false }
);

const featureFlagsSchema = new mongoose.Schema(
  {
    codingQuestions: { type: Boolean, default: true },
    webcamProctoring: { type: Boolean, default: true },
    liveLeaderboard: { type: Boolean, default: true },
    certificateGeneration: { type: Boolean, default: true }
  },
  { _id: false }
);

const settingsSchema = new mongoose.Schema(
  {
    defaultViolationThreshold: { type: Number, default: 5, min: 1 },
    branding: { type: brandingSchema, default: () => ({}) },
    enabledFeatures: { type: featureFlagsSchema, default: () => ({}) }
  },
  { _id: false }
);

const organizationSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Organization name is required'],
      trim: true
    },
    plan: {
      type: String,
      enum: ['standard', 'institutional', 'enterprise'],
      default: 'standard'
    },
    settings: {
      type: settingsSchema,
      default: () => ({})
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('Organization', organizationSchema);
