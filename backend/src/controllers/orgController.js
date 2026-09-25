const Organization = require('../models/Organization');

/**
 * Retrieve current user's organization settings
 * GET /api/orgs/settings
 */
const getOrganizationSettings = async (req, res) => {
  try {
    const orgId = req.user.organizationId;
    if (!orgId) {
      return res.status(404).json({
        success: false,
        message: 'User is not associated with any organization'
      });
    }

    const org = await Organization.findById(orgId);
    if (!org) {
      return res.status(404).json({
        success: false,
        message: 'Organization not found'
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        organizationId: org._id,
        name: org.name,
        plan: org.plan,
        settings: org.settings
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve organization settings',
      error: error.message
    });
  }
};

/**
 * Update organization settings (branding, violation thresholds, enabled features)
 * PUT /api/orgs/settings
 */
const updateOrganizationSettings = async (req, res) => {
  try {
    const orgId = req.user.organizationId;
    if (!orgId && req.user.role !== 'admin') {
      return res.status(400).json({
        success: false,
        message: 'User does not belong to an organization'
      });
    }

    const targetOrgId = req.body.organizationId || orgId;
    const org = await Organization.findById(targetOrgId);
    if (!org) {
      return res.status(404).json({
        success: false,
        message: 'Organization not found'
      });
    }

    const { defaultViolationThreshold, branding, enabledFeatures } = req.body;

    if (defaultViolationThreshold !== undefined) {
      org.settings.defaultViolationThreshold = Math.max(1, parseInt(defaultViolationThreshold, 10));
    }

    if (branding) {
      if (branding.logoUrl !== undefined) org.settings.branding.logoUrl = branding.logoUrl;
      if (branding.primaryColor !== undefined) org.settings.branding.primaryColor = branding.primaryColor;
      if (branding.tagline !== undefined) org.settings.branding.tagline = branding.tagline;
    }

    if (enabledFeatures) {
      if (enabledFeatures.codingQuestions !== undefined) {
        org.settings.enabledFeatures.codingQuestions = !!enabledFeatures.codingQuestions;
      }
      if (enabledFeatures.webcamProctoring !== undefined) {
        org.settings.enabledFeatures.webcamProctoring = !!enabledFeatures.webcamProctoring;
      }
      if (enabledFeatures.liveLeaderboard !== undefined) {
        org.settings.enabledFeatures.liveLeaderboard = !!enabledFeatures.liveLeaderboard;
      }
      if (enabledFeatures.certificateGeneration !== undefined) {
        org.settings.enabledFeatures.certificateGeneration = !!enabledFeatures.certificateGeneration;
      }
    }

    await org.save();

    return res.status(200).json({
      success: true,
      message: 'Organization settings updated successfully',
      data: {
        organizationId: org._id,
        name: org.name,
        settings: org.settings
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to update organization settings',
      error: error.message
    });
  }
};

/**
 * Get organization by ID (scoped check)
 * GET /api/orgs/:id
 */
const getOrganizationById = async (req, res) => {
  try {
    const { id } = req.params;

    // Multi-tenant check: non-platform admin can only view their own organization
    if (req.user.role !== 'admin' && req.user.organizationId?.toString() !== id) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: You do not have access to data from another organization'
      });
    }

    const org = await Organization.findById(id);
    if (!org) {
      return res.status(404).json({
        success: false,
        message: 'Organization not found'
      });
    }

    return res.status(200).json({
      success: true,
      data: org
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch organization',
      error: error.message
    });
  }
};

module.exports = {
  getOrganizationSettings,
  updateOrganizationSettings,
  getOrganizationById
};
