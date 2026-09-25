const express = require('express');
const router = express.Router();
const resultsController = require('../controllers/resultsController');
const { authenticate } = require('../middleware/auth');

// Leaderboard route (authenticated)
router.get('/leaderboard/:examId', authenticate, resultsController.getLeaderboard);

// Certificate download route (authenticated)
router.get('/:id/certificate', authenticate, resultsController.downloadCertificate);

module.exports = router;
