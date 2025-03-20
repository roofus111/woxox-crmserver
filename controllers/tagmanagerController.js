const Tag = require("../models/Tagmanager");

// Add a tag to an item in a collection
exports.addTag = async (req, res) => {
  try {
    const { tagName, itemId, collectionName } = req.body;

    if (!tagName || !itemId || !collectionName) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const tag = await Tag.findOneAndUpdate(
      { name: tagName },
      { $addToSet: { taggedItems: { itemId, collectionName } } },
      { upsert: true, new: true }
    );

    res.status(200).json({ message: "Tag added successfully", tag });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// Get multiple tags along with their tagged items and counts
exports.getMultipleTags = async (req, res) => {
    try {
      const { tagNames } = req.body; // Expecting an array of tag names
  
      if (!Array.isArray(tagNames) || tagNames.length === 0) {
        return res.status(400).json({ message: "tagNames must be a non-empty array" });
      }
  
      const tags = await Tag.find({ name: { $in: tagNames } });
  
      if (!tags.length) {
        return res.status(404).json({ message: "No tags found" });
      }
  
      const response = tags.map(tag => ({
        tagName: tag.name,
        count: tag.taggedItems.length,
        taggedItems: tag.taggedItems,
      }));
  
      res.status(200).json(response);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Internal Server Error" });
    }
  };
  
// Update tag name
const mongoose = require("mongoose");

// Update a tag name by ID
exports.updateTagById = async (req, res) => {
  try {
    const { tagId, newTagName } = req.body;

    if (!mongoose.Types.ObjectId.isValid(tagId) || !newTagName) {
      return res.status(400).json({ message: "Valid tagId and newTagName are required" });
    }

    const updatedTag = await Tag.findByIdAndUpdate(
      tagId,
      { $set: { name: newTagName } },
      { new: true }
    );

    if (!updatedTag) {
      return res.status(404).json({ message: "Tag not found" });
    }

    res.status(200).json({ message: "Tag updated successfully", updatedTag });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// Update tagged items by tag ID (Add or Remove)
exports.updateTaggedItemsById = async (req, res) => {
  try {
    const { tagId, itemId, collectionName, action } = req.body;

    if (!mongoose.Types.ObjectId.isValid(tagId) || !itemId || !collectionName || !action) {
      return res.status(400).json({ message: "Valid tagId, itemId, collectionName, and action are required" });
    }

    let updateOperation;
    if (action === "add") {
      updateOperation = { $addToSet: { taggedItems: { itemId, collectionName } } };
    } else if (action === "remove") {
      updateOperation = { $pull: { taggedItems: { itemId, collectionName } } };
    } else {
      return res.status(400).json({ message: "Invalid action. Use 'add' or 'remove'." });
    }

    const updatedTag = await Tag.findByIdAndUpdate(tagId, updateOperation, { new: true });

    if (!updatedTag) {
      return res.status(404).json({ message: "Tag not found" });
    }

    res.status(200).json({ message: `Tag ${action}ed successfully`, updatedTag });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};


// Delete a tag by ID
exports.deleteTagById = async (req, res) => {
  try {
    const { tagId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(tagId)) {
      return res.status(400).json({ message: "Invalid tag ID" });
    }

    const deletedTag = await Tag.findByIdAndDelete(tagId);

    if (!deletedTag) {
      return res.status(404).json({ message: "Tag not found" });
    }

    res.status(200).json({ message: "Tag deleted successfully", deletedTag });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};


