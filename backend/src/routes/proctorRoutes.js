const express = require('express');
const router = express.Router();
const proctorController = require('../controllers/proctorController');
const { authenticate } = require('../middleware/auth');

// Log proctoring violation incident
router.post('/log-violation', authenticate, proctorController.logViolation);

module.exports = router;
