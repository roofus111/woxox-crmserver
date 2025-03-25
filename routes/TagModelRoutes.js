const express = require('express');
const router = express.Router();
const TagModelController = require('../controllers/TagModelController'); // Import the whole module

// Route to handle creating a new tag
router.post('/createtag', TagModelController.createTag);
router.get('/getalltag', TagModelController.getAllTag);
router.get('/gettagById/:id',TagModelController.getTagById );
router.put('/updatetagById/:tagid',TagModelController.updateTag );
router.delete('/deletetagById/:tagid',TagModelController.deleteTag );
module.exports = router;9
