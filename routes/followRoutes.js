const express = require('express');
const router = express.Router();
const leadFollowUpController = require('../controllers/followUpController');

// Create a new follow-up


const authenticateUser = require('../middleware/authenticateUser');

router.use(authenticateUser); // Apply authentication to all routes

router.post('/', leadFollowUpController.createFollowUp);
 
router.get('/:leadId', leadFollowUpController.getFollowUpsByLead);
// Get all follow-ups for a lead
router.get('/', leadFollowUpController.getAllfollowUps);
router.get('/myfollow/get', leadFollowUpController.getMyfollowUps);
// Get a specific follow-up by ID
router.get('/byId/:followUpId', leadFollowUpController.getFollowUpById);

// Update a follow-up
router.put('/update/:followUpId', leadFollowUpController.updateFollowUp);

// Delete a follow-up
router.delete('/delete/:followUpId', leadFollowUpController.deleteFollowUp);
router.delete('/delete-with-no-lead', leadFollowUpController.deleteLeadFollowUpsWithNoLeadId);



// Route to update all follow-up details (including nextFollowUpDate)
router.put('/follow-up/:followUpId', leadFollowUpController.updateFollowUp);


module.exports = router;
