const express = require("express");
const router = express.Router();
const fileController = require("../controllers/FileHandlerController"); // Adjust path as necessary
const multer = require("multer");
const storage = multer.memoryStorage();
const upload = multer({ storage });
const authenticateUser = require('../middleware/authenticateUser');

router.use(authenticateUser)


// Route to upload and share file
router.post('/upload', upload.array('files'), fileController.createFile);
router.get("/getfiles/:parentId", fileController.getFilesAndFoldersByParentId);
router.put("/file/:fileId", fileController.updateFileName);
router.post("/copy", fileController.copyFile);
router.post("/move",fileController. moveFile);
router.delete("/file/:fileId", fileController.deleteFile);
router.get("/files/:leadId", fileController.getFilesByLeadId);
router.get("/leads", fileController.listAllLeadsFromFilesAndFolders);
module.exports = router;


