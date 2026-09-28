const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);
router.get('/me', userController.getMe);
router.put('/me', userController.updateMe);
router.get('/', userController.listUsers);
router.get('/:id', userController.getUser);
router.put('/:id/role', userController.updateUserRole);
router.patch('/:id/role', userController.updateUserRole);

module.exports = router;
