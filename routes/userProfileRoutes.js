const express = require('express');
const router = express.Router();
const userProfileController = require('../controllers/userProfileController');
const authenticateUser = require('../middleware/authenticateUser');

router.use(authenticateUser); 

router.post('/', userProfileController.createProfile);
router.get('/', userProfileController.getAllProfiles);
router.get("/users/active", userProfileController.getPublicUsers);
router.get("/:userid", userProfileController. getProfileById);
router.put("/put/:userid", userProfileController.updateProfileById);
router.put("/:userId/toggle-status", userProfileController.toggleUserStatus);

module.exports = router;
 