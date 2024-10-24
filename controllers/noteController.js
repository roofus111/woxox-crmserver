const Note = require("../models/notes");

exports.addNote = async (req, res) => {
    const { content} = req.body;
    const newNote = new Note({ content, userId:req.user._id });
    try {
      await newNote.save();
      res.status(201).send(newNote);
    } catch (error) {
      res.status(400).send(error);
    }
  };

  exports.getAllNotes = async (req, res) => {
    try {
      const notes = await Note.find({userId:req.user._id});
      res.status(200).send(notes);
    } catch (error) {
      res.status(500).send(error);
    }
  };
  

  exports.updateNote = async (req, res) => {
    try {
      const updatedNote = await Note.findByIdAndUpdate(req.params.id, req.body, { new: true });
      if (!updatedNote) {
        return res.status(404).send();
      }
      res.send(updatedNote);
    } catch (error) {
      res.status(400).send(error);
    }
  }

  exports.deleteNote = async (req, res) => {
    try {
      const note = await Note.findByIdAndDelete(req.params.id);
      if (!note) {
        return res.status(404).send();
      }
      res.send(note);
    } catch (error) {
      res.status(500).send(error);
    }
  };