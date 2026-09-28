const express = require('express');
const router = express.Router();
const resultsController = require('../controllers/resultsController');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);
router.get('/leaderboard/:examId', resultsController.getLeaderboard);
router.get('/exam/:examId', resultsController.getExamResults);
router.get('/submission/:submissionId', resultsController.getSubmissionResult);
router.get('/:id/certificate', resultsController.downloadCertificate);

module.exports = router;
