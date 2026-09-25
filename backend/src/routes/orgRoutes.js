const express = require('express');
const router = express.Router();
const orgController = require('../controllers/orgController');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

// Settings for current user's organization
router.get('/settings', orgController.getOrganizationSettings);
router.put('/settings', orgController.updateOrganizationSettings);

// Scoped organization retrieval
router.get('/:id', orgController.getOrganizationById);

module.exports = router;
