const express = require('express');
const router = express.Router();
const campaignController = require('../controllers/campaignController');
const authenticateUser = require('../middleware/authenticateUser');

router.use(authenticateUser);
router.post('/createcampaign', campaignController.createCampaign);
router.get('/getcampaign', campaignController.getCampaign);
router.put('/updatecampaign/:campaignid', campaignController.updateCampaign);
router.delete('/deletecampaign/:campaignid', campaignController.deleteCampaign);
module.exports = router;