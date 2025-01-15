const express = require('express');
const router = express.Router();
const userProfileController = require('../controllers/userProfileController');
const authenticateUser = require('../middleware/authenticateUser');

router.use(authenticateUser); 
// /**
//  * @swagger
//  * components:
//  *   securitySchemes:
//  *     bearerAuth:
//  *       type: http
//  *       scheme: bearer
//  *       bearerFormat: JWT
//  */


router.get('/', userProfileController.getAllProfiles);

router.post('/', userProfileController.createProfile);
router.get("/:userid", userProfileController. getProfileById);
router.put("/put/:userid", userProfileController.updateProfileById);
router.put("/:userId/toggle-status", userProfileController.toggleUserStatus);
router.get("/users/active", userProfileController.getPublicUsers);
module.exports = router;
