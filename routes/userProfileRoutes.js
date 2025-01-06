const express = require('express');
const router = express.Router();
const userProfileController = require('../controllers/userProfileController');
const authenticateUser = require('../middleware/authenticateUser');

router.use(authenticateUser); 
/**
 * @swagger
 * components:
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 */
/**
 * @swagger
 * /api/user-profiles/:
 *   get:
 *     summary: Get user profiles
 *     description: Retrieve user profiles from the MongoDB database.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Successfully fetched user profiles from MongoDB.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                     description: The unique identifier of the user.
 *                   name:
 *                     type: string
 *                     description: The name of the user.
 *                   email:
 *                     type: string
 *                     description: The email address of the user.
 */

router.get('/', userProfileController.getAllProfiles);
/**
 * @swagger
 * /api/user-profiles/:
 *   post:
 *     summary: create user profile
 *     description: This API is used to add a new user to MongoDB.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/User'
 *     responses:
 *       200:
 *         description: user added successfully.
 */
router.post('/', userProfileController.createProfile);
router.get("/:userid", userProfileController. getProfileById);
router.put("/put/:userid", userProfileController.updateProfileById);
// router.put('/toggle-activation/:userId', userProfileController.toggleUserActivation);
module.exports = router;
