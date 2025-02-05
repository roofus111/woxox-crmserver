const Folders = require("../models/folderHandler"); // Import the Folder model

// Create a new folder
exports.createFolder = async (req, res) => {
  try {
    const { folderName, parent, access, shared } = req.body;

    // Validate folder name
    if (!folderName) {
      return res.status(400).json({ error: "Folder name is required" });
    }

    // Check if it's a root folder (no parent)
    const isRoot = !parent;

    // Create new folder
    const newFolder = new Folders({
      folderName,
      parent: parent || null, // Null for root folders
      root: isRoot, // True if no parent is provided
      access: access || "private", // Default to private
      shared: shared || [], // Shared settings, default empty array
    });

    // Save folder to database
    await newFolder.save();

    res.status(201).json({
      message: "Folder created successfully",
      folder: newFolder,
    });
  } catch (error) {
    console.error("Error creating folder:", error);
    res.status(500).json({ error: "Server error" });
  }
};
exports.getAllFolders = async (req, res) => {
    try {
      const folders = await Folders.find()
        .populate("parent") // Populate parent folder data
        .populate("shared.sharedWith"); // Populate shared users (if any)
      
      res.status(200).json(folders);
    } catch (error) {
      console.error("Error fetching folders:", error);
      res.status(500).json({ error: "Server error" });
    }
  };
// Get folder by ID
exports.getFolderById = async (req, res) => {
  try {
    const folderId = req.params.id;
    const folder = await Folders.findById(folderId)
      .populate("parent")
      .populate("shared.sharedWith");

    if (!folder) {
      return res.status(404).json({ error: "Folder not found" });
    }

    res.status(200).json(folder);
  } catch (error) {
    console.error("Error fetching folder:", error);
    res.status(500).json({ error: "Server error" });
  }
};
// Update folder details
exports.updateFolder = async (req, res) => {
  try {
    const folderId = req.params.id;
    const updates = req.body;

    const updatedFolder = await Folders.findByIdAndUpdate(
      folderId,
      updates,
      { new: true } // Return the updated folder
    );

    if (!updatedFolder) {
      return res.status(404).json({ error: "Folder not found" });
    }

    res.status(200).json({
      message: "Folder updated successfully",
      folder: updatedFolder,
    });
  } catch (error) {
    console.error("Error updating folder:", error);
    res.status(500).json({ error: "Server error" });
  }
};
// Delete folder
exports.deleteFolder = async (req, res) => {
  try {
    const folderId = req.params.id;

    const deletedFolder = await Folders.findByIdAndDelete(folderId);

    if (!deletedFolder) {
      return res.status(404).json({ error: "Folder not found" });
    }

    res.status(200).json({
      message: "Folder deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting folder:", error);
    res.status(500).json({ error: "Server error" });
  }
};