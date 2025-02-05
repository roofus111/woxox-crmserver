const express = require("express");
const router = express.Router();
const folderController = require("../controllers/folderController"); // Adjust path as necessary
const authenticateUser = require('../middleware/authenticateUser');

router.use(authenticateUser)

router.post('/postfolder', folderController.createFolder);
// Route for getting all folders
router.get("/getfolders", folderController.getAllFolders);
router.get("/:id", folderController.getFolderById);
router.put("/:id", folderController.updateFolder);
// Route for deleting a folder by ID
router.delete("/:id", folderController.deleteFolder);

module.exports = router;