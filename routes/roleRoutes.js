const express = require('express');
const router = express.Router();
const roleController = require('../controllers/roleController');
const authenticateUser = require('../middleware/authenticateUser');

router.use(authenticateUser);

router.post('/createrole', roleController.createRole);
router.get('/getallroles', roleController.getAllRoles);
router.get('/getrolebyid/:id', roleController.getRoleById);
router.put('/updaterole/:id', roleController.updateRole);
router.delete('/deleterole/:id', roleController.deleteRole);
module.exports = router;