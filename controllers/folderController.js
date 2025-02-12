const mongoose = require('mongoose');
const Folders = require("../models/folderHandler"); // Import the Folder model

// Create a new folder
exports.createFolder = async (req, res) => {
  try {
    const { folderName, parent, access, shared } = req.body;

    // Ensure user has a company ID
    if (!req.user || !req.user.company || !req.user.company._id) {
      return res.status(403).json({ error: "Unauthorized: Company ID is required" });
    }

    const companyId = req.user.company._id;

    // Validate and sanitize folder name
    if (!folderName || !folderName.trim()) {
      return res.status(400).json({ error: "Folder name is required and cannot be empty" });
    }
    const trimmedFolderName = folderName.trim();

    // Validate parent ID format if provided
    if (parent && !mongoose.Types.ObjectId.isValid(parent)) {
      return res.status(400).json({ error: "Invalid parent folder ID" });
    }

    // Check if a folder with the same name exists under the same parent for the same company
    const existingFolder = await Folders.findOne({ 
      folderName: trimmedFolderName, 
      parent, 
      company: companyId 
    });

    if (existingFolder) {
      return res.status(400).json({ error: "Folder with this name already exists in the same directory" });
    }

    // Determine if it's a root folder (no parent)
    const isRoot = !parent;

    // Create new folder
    const newFolder = new Folders({
      folderName: trimmedFolderName,
      parent: parent || null, // Null for root folders
      root: isRoot, // True if no parent is provided
      access: access || "private", // Default to private
      shared: shared || [], // Shared settings, default empty array
      company: companyId, // Associate folder with the user's company
    });

    // Save folder to database
    await newFolder.save();

    res.status(201).json({
      message: "Folder created successfully",
      folder: newFolder,
    });
  } catch (error) {
    console.error("Error creating folder:", error);
    res.status(500).json({ error: "Server error", details: error.message });
  }
};

exports.getAllFolders = async (req, res) => {
  try {
    // Ensure user has a company ID
    if (!req.user || !req.user.company || !req.user.company._id) {
      return res.status(403).json({ error: "Unauthorized: Company ID is required" });
    }

    const companyId = req.user.company._id;

    // Fetch folders belonging to the user's company
    const folders = await Folders.find({ company: companyId })
      .populate("parent", "folderName") // Populate parent folder with only folderName
      .populate("shared.sharedWith", "name email"); // Populate shared users with name & email

    res.status(200).json(folders);
  } catch (error) {
    console.error("Error fetching folders:", error);
    res.status(500).json({ error: "Server error", details: error.message });
  }
};

// Get folder by ID
exports.getFolderById = async (req, res) => {
  try {
    const folderId = req.params.id;

    // Validate folderId format
    if (!mongoose.Types.ObjectId.isValid(folderId)) {
      return res.status(400).json({ error: "Invalid folder ID" });
    }

    // Ensure user has a company ID
    if (!req.user || !req.user.company || !req.user.company._id) {
      return res.status(403).json({ error: "Unauthorized: Company ID is required" });
    }

    const companyId = req.user.company._id;

    // Find the folder, ensuring it belongs to the user's company
    const folder = await Folders.findOne({ _id: folderId, company: companyId })
      .populate("parent", "folderName") // Populate parent folder with only folderName
      .populate("shared.sharedWith", "name email"); // Populate shared users with name & email

    if (!folder) {
      return res.status(404).json({ error: "Folder not found or access denied" });
    }

    res.status(200).json(folder);
  } catch (error) {
    console.error("Error fetching folder:", error);
    res.status(500).json({ error: "Server error", details: error.message });
  }
};

// Update folder details
exports.updateFolder = async (req, res) => {
  try {
    const folderId = req.params.id;
    const updates = req.body;

    // Validate folderId format
    if (!mongoose.Types.ObjectId.isValid(folderId)) {
      return res.status(400).json({ error: "Invalid folder ID" });
    }

    // Ensure user has a company ID
    if (!req.user || !req.user.company || !req.user.company._id) {
      return res.status(403).json({ error: "Unauthorized: Company ID is required" });
    }

    const companyId = req.user.company._id;

    // Find and update the folder only if it belongs to the user's company
    const updatedFolder = await Folders.findOneAndUpdate(
      { _id: folderId, company: companyId }, // Ensure folder belongs to company
      updates,
      { new: true, runValidators: true } // Return updated folder & run schema validators
    );

    if (!updatedFolder) {
      return res.status(404).json({ error: "Folder not found or access denied" });
    }

    res.status(200).json({
      message: "Folder updated successfully",
      folder: updatedFolder,
    });
  } catch (error) {
    console.error("Error updating folder:", error);
    res.status(500).json({ error: "Server error", details: error.message });
  }
};

// Delete folder

exports.deleteFolder = async (req, res) => {
  try {
    const folderId = req.params.id;

    // Validate folderId format
    if (!mongoose.Types.ObjectId.isValid(folderId)) {
      return res.status(400).json({ error: "Invalid folder ID" });
    }

    // Ensure user has a company ID
    if (!req.user || !req.user.company || !req.user.company._id) {
      return res.status(403).json({ error: "Unauthorized: Company ID is required" });
    }

    const companyId = req.user.company._id;

    // Find and delete the folder only if it belongs to the user's company
    const deletedFolder = await Folders.findOneAndDelete({ _id: folderId, company: companyId });

    if (!deletedFolder) {
      return res.status(404).json({ error: "Folder not found or access denied" });
    }

    res.status(200).json({ message: "Folder deleted successfully" });
  } catch (error) {
    console.error("Error deleting folder:", error);
    res.status(500).json({ error: "Server error", details: error.message });
  }
};
