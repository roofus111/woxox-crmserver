const express = require('express');
const router = express.Router();
const templateController = require('../controllers/templateController');
const authenticateUser = require('../middleware/authenticateUser');

router.use(authenticateUser);

router.post('/createTemplate', templateController.createTemplate);
router.get('/getAllTemplates', templateController.getAllTemplates);
router.get('/getTemplateById/:id', templateController.getTemplateById);
router.put('/editTemplate/:id', templateController.editTemplate);
router.delete('/deleteTemplate/:id', templateController.deleteTemplate);    

module.exports = router;