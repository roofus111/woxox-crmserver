const TagManager = require('../models/Tagmanager');

exports.createTag = async (req, res) => {
  try {
    const { name, description } = req.body;

    const existingTag = await TagManager.findOne({ name: name.toLowerCase() });
    if (existingTag) {
      return res.status(400).json({ error: "Tag already exists" });
    }

    const newTag = new TagManager({ name: name.toLowerCase(), description });
    await newTag.save();

    res.status(201).json({ message: "Tag created successfully", tag: newTag });
  } catch (error) {
    res.status(500).json({ error: "Error creating tag", details: error.message });
  }
};