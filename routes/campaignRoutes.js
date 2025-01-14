// /**
//  * @swagger
//  * components:
//  *   securitySchemes:
//  *     bearerAuth:
//  *       type: http
//  *       scheme: bearer
//  *       bearerFormat: JWT
//  */

const express = require('express');
const router = express.Router();
const campaignController = require('../controllers/campaignController');
const authenticateUser = require('../middleware/authenticateUser');
router.use(authenticateUser);



router.post('/createcampaign', campaignController.createCampaign);

router.get('/campaigns/pipeline/:pipelineId', campaignController.getCampaignsByPipelineId);


router.get('/getcampaign', campaignController.getCampaign);


router.put('/updatecampaign/:campaignid', campaignController.updateCampaign);

router.delete('/deletecampaign/:campaignid', campaignController.deleteCampaign);
router.put('/assignpipeline/:campaignId', campaignController.updatePipelineInCampaign);


module.exports = router;


