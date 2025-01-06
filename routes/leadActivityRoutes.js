const express = require('express');
const router = express.Router();
const leadActivityController = require('../controllers/leadActivityController');

const authenticateUser = require('../middleware/authenticateUser');

router.use(authenticateUser); // Apply authentication to all routes

router.post('/', leadActivityController.createLeadActivity);

// Route to get all activities for a lead
router.get('/:leadId', leadActivityController.getLeadActivities);

// Route to get filtered activities for a lead
router.get('/filter/:leadId', leadActivityController.getFilteredLeadActivities);

// Route to delete all activities for a lead (if needed)
router.delete('/:leadId', leadActivityController.deleteLeadActivities);
router.get('/get/insight',leadActivityController.getLeadActivitiesByCompany);
module.exports = router;
