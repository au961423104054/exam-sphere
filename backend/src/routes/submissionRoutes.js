const express = require('express');
const router = express.Router();
const submissionController = require('../controllers/submissionController');
const { authenticate } = require('../middleware/auth');

// Run code against visible test cases
router.post('/:id/run-code', authenticate, submissionController.runCode);

// Submit code against all test cases and save answer
router.post('/:id/submit-code', authenticate, submissionController.submitCode);

module.exports = router;
