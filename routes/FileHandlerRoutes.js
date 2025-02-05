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
router.get('/getfiles', fileController.getFiles);
module.exports = router;


