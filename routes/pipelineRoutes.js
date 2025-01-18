const express = require('express');
const router = express.Router();
const pipelineController = require('../controllers/pipelineController');
const authenticateUser = require('../middleware/authenticateUser');

router.use(authenticateUser);
router.post('/createpipeline', pipelineController.createPipeline);
router.get('/getpipeline', pipelineController.getPipelines);
router.get('/getpipeline/:id', pipelineController.getPipelineById);
router.put('/updatepipeline/:pipelineid', pipelineController.updatePipeline);
router.delete('/deletepipeline/:pipelineid', pipelineController.deletePipeline);
module.exports = router;