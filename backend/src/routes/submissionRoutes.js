const express = require('express');
const router = express.Router();
const submissionController = require('../controllers/submissionController');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

// Student past submissions list (must be before /:id)
router.get('/mine', submissionController.getMySubmissions);

// Start an exam attempt
router.post('/start', submissionController.startSubmission);

// Save single answer or batch answers
router.post('/:id/answer', submissionController.saveSingleAnswer);
router.post('/:id/answers', submissionController.saveAnswers);

// Coding question execution & submission
router.post('/:id/run-code', submissionController.runCode);
router.post('/:id/submit-code', submissionController.submitCode);

// Finalize and grade submission
router.post('/:id/finalize', submissionController.finalizeSubmission);
router.post('/:id/submit', submissionController.submitExam);

// Get submission details
router.get('/:id', submissionController.getSubmission);

module.exports = router;
