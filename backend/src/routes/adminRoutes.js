const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { authenticate, requireAdmin } = require('../middleware/auth');

// Protect all admin endpoints with authentication and admin role requirement
router.use(authenticate, requireAdmin);

router.get('/overview', adminController.getOverview);

// Organization management
router.get('/organizations', adminController.getOrganizations);

// User management
router.get('/users', adminController.getUsers);
router.patch('/users/:id/role', adminController.updateUserRole);
router.delete('/users/:id', adminController.deleteUser);

// Exam management
router.get('/exams', adminController.getExams);

// Violation logs & flagged sessions
router.get('/violations', adminController.getViolations);
router.patch('/violations/:id/status', adminController.updateViolationStatus);

module.exports = router;
