const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const authenticateUser = require('../middleware/authenticateUser');
router.use(authenticateUser);

router.post('/adminadded', adminController.createAdmin);
router.get('/getadmin', adminController.getAllAdmins);
router.get('/getadminbyid/:adminId', adminController.getAdminById);
router.put('/putadmin/:adminId', adminController.updateAdmin);       
router.delete('/deleteadmin/:adminId', adminController.deleteAdmin);

module.exports = router;