const express = require('express');
const router = express.Router();
const questionController = require('../controllers/questionController');
const { authenticate, authorize } = require('../middleware/auth');
const { uploadBank } = require('../middleware/upload');

router.use(authenticate);
router.post('/upload', authorize('teacher', 'admin'), uploadBank.single('file'), questionController.uploadQuestionBank);
router.post('/', authorize('teacher', 'admin'), questionController.createQuestion);
router.get('/exam/:examId', questionController.listByExam);
router.get('/:id', questionController.getQuestion);
router.patch('/:id', authorize('teacher', 'admin'), questionController.updateQuestion);
router.put('/:id', authorize('teacher', 'admin'), questionController.updateQuestion);
router.delete('/:id', authorize('teacher', 'admin'), questionController.deleteQuestion);

module.exports = router;
