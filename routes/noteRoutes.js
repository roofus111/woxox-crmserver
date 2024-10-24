// routes/noteRoutes.js
const express = require('express');
const router = express.Router();
const notesController = require('../controllers/noteController');
const authenticateUser = require('../middleware/authenticateUser');

router.use(authenticateUser); 
router.post('/', notesController.addNote);
router.get('/', notesController.getAllNotes);
router.put('/:id', notesController.updateNote);
router.delete('/:id', notesController.deleteNote);

module.exports = router;
