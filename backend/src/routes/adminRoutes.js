const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { authenticate, requireAdmin } = require('../middleware/auth');

// Protect all admin endpoints with authentication and admin role requirement
router.use(authenticate, requireAdmin);

// Organization management
router.get('/organizations', adminController.getOrganizations);

// User management
router.get('/users', adminController.getUsers);
router.patch('/users/:id/role', adminController.updateUserRole);

// Exam management
router.get('/exams', adminController.getExams);

// Violation logs & flagged sessions
router.get('/violations', adminController.getViolations);

module.exports = router;
