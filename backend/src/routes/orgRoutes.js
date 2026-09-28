const express = require('express');
const router = express.Router();
const orgController = require('../controllers/orgController');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);
router.get('/', orgController.listOrgs);
router.post('/', orgController.createOrg);
router.get('/:id', orgController.getOrg);
router.put('/:id', orgController.updateOrg);

module.exports = router;
