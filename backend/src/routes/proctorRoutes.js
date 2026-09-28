const express = require('express');
const router = express.Router();
const proctorController = require('../controllers/proctorController');
const { authenticate, authorize } = require('../middleware/auth');
const upload = require('../middleware/upload');

router.get('/violations', authenticate, authorize('teacher', 'admin'), proctorController.getViolations);
router.post('/log-violation', authenticate, proctorController.logViolation);
router.post('/log', authenticate, proctorController.logViolation);
router.post('/snapshot', authenticate, upload.single('snapshot'), proctorController.uploadSnapshot);
router.post('/verify-identity', authenticate, upload.single('snapshot'), proctorController.verifyIdentity);
router.post('/periodic-snapshot', authenticate, upload.single('snapshot'), proctorController.uploadPeriodicSnapshot);
router.get('/session/:submissionId', authenticate, proctorController.getSession);
router.get('/report/:submissionId', authenticate, proctorController.getProctorReport);

module.exports = router;
