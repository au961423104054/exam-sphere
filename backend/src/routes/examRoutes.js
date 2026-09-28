const express = require('express');
const router = express.Router();
const examController = require('../controllers/examController');
const { authenticate, authorize } = require('../middleware/auth');

router.use(authenticate);
router.get('/', examController.listExams);
router.post('/', authorize('teacher', 'admin'), examController.createExam);
router.get('/:id', examController.getExam);
router.patch('/:id', authorize('teacher', 'admin'), examController.updateExam);
router.put('/:id', authorize('teacher', 'admin'), examController.updateExam);
router.delete('/:id', authorize('teacher', 'admin'), examController.deleteExam);

module.exports = router;
