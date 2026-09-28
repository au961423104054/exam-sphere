const Organization = require('../models/Organization');
const { success, fail } = require('../utils/http');

const createOrg = async (req, res) => {
  try {
    if (!['admin', 'teacher'].includes(req.user.role)) {
      return fail(res, 'Forbidden', 403);
    }
    const { name, plan = 'standard' } = req.body;
    if (!name) return fail(res, 'Organization name is required', 400);
    const org = await Organization.create({ name: name.trim(), plan });
    return success(res, org, 'Organization created', 201);
  } catch (error) {
    return fail(res, 'Failed to create organization', 500, { error: error.message });
  }
};

const getOrg = async (req, res) => {
  try {
    const org = await Organization.findById(req.params.id);
    if (!org) return fail(res, 'Organization not found', 404);
    return success(res, org);
  } catch (error) {
    return fail(res, 'Failed to retrieve organization', 500, { error: error.message });
  }
};

const updateOrg = async (req, res) => {
  try {
    const org = await Organization.findById(req.params.id);
    if (!org) return fail(res, 'Organization not found', 404);
    if (req.body.name) org.name = req.body.name.trim();
    if (req.body.plan) org.plan = req.body.plan;
    await org.save();
    return success(res, org, 'Organization updated');
  } catch (error) {
    return fail(res, 'Failed to update organization', 500, { error: error.message });
  }
};

const listOrgs = async (req, res) => {
  try {
    const orgs = await Organization.find().sort({ createdAt: -1 });
    return success(res, orgs);
  } catch (error) {
    return fail(res, 'Failed to list organizations', 500, { error: error.message });
  }
};

module.exports = { createOrg, getOrg, updateOrg, listOrgs };
