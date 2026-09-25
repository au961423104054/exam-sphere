const express = require('express');
const router = express.Router();
const proctorController = require('../controllers/proctorController');
const { authenticate } = require('../middleware/auth');

const upload = require('../middleware/upload');

// Log proctoring violation incident
router.post('/log-violation', authenticate, proctorController.logViolation);

// Upload webcam snapshot to Cloudinary and link to ProctorLog
router.post('/snapshot', authenticate, upload.single('snapshot'), proctorController.uploadSnapshot);

module.exports = router;

