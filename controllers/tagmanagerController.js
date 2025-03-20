const TagManager = require('../models/Tagmanager');

exports.createTag = async (req, res) => {
  try {
    const { name, description } = req.body;

    const existingTag = await TagManager.findOne({ name: name.toLowerCase(), company: req.user.company._id });
    if (existingTag) {
      return res.status(400).json({ error: "Tag already exists" });
    }

    const newTag = new TagManager({ 
      name: name.toLowerCase(), 
      description, 
      company: req.user.company._id
    });
    await newTag.save();

    res.status(201).json({ message: "Tag created successfully", tag: newTag });
  } catch (error) {
    res.status(500).json({ error: "Error creating tag", details: error.message });
  }
};

exports.getTags = async (req, res) => {
  try {
    const tags = await TagManager.find({ 
      company: req.user.company._id
    }).sort({ usageCount: -1 });
    res.json(tags);
  } catch (error) {
    res.status(500).json({ error: "Error fetching tags", details: error.message });
  }
};

exports.getTagByName = async (req, res) => {
  try {
    const tag = await TagManager.findOne({ 
      name: req.params.name.toLowerCase(), 
      company: req.user.company._id
    });

    if (!tag) return res.status(404).json({ error: "Tag not found" });

    res.json(tag);
  } catch (error) {
    res.status(500).json({ error: "Error fetching tag", details: error.message });
  }
};

const Lead = require('../models/Lead');
const File = require('../models/Filehandler');

exports.updateTag = async (req, res) => {
  try {
    const { newName, description } = req.body;
    const oldName = req.params.name.toLowerCase().trim(); // Ensure lowercase & trimmed

    // Validate input
    if (!newName || typeof newName !== "string") {
      return res.status(400).json({ error: "Invalid or missing new tag name" });
    }
    if (!description || typeof description !== "string") {
      return res.status(400).json({ error: "Invalid or missing description" });
    }

    // Find and update the tag
    const tag = await TagManager.findOneAndUpdate(
      { name: oldName, company: req.user.company._id },
      { name: newName.toLowerCase().trim(), description },
      { new: true, runValidators: true }
    );

    if (!tag) return res.status(404).json({ error: `Tag '${oldName}' not found` });

    // Update references in Leads and Files
    await Lead.updateMany({ tags: oldName }, { $set: { "tags.$": newName } });
    await File.updateMany({ tags: oldName }, { $set: { "tags.$": newName } });

    res.json({ message: "Tag updated successfully", tag });
  } catch (error) {
    res.status(500).json({ error: "Error updating tag", details: error.message });
  }
};



exports.deleteTag = async (req, res) => {
  try {
    const tagName = req.params.name.toLowerCase().trim(); // Ensure lowercase & trimmed

    // Find and delete the tag
    const tag = await TagManager.findOneAndDelete({ 
      name: tagName, 
      company: req.user.company._id
    });

    if (!tag) return res.status(404).json({ error: `Tag '${tagName}' not found` });

    // Remove tag from Leads and Files
    await Lead.updateMany({}, { $pull: { tags: tagName } });
    await File.updateMany({}, { $pull: { tags: tagName } });

    res.json({ message: `Tag '${tagName}' deleted and removed from all leads and files.` });
  } catch (error) {
    res.status(500).json({ error: "Error deleting tag", details: error.message });
  }
};
