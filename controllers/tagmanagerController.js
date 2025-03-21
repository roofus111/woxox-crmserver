const TagManager = require('../models/Tagmanager');
const company = require('../models/Company');

exports.createTag = async (req, res) => {
  try {
    const { name, description } = req.body;
    
    // Check if company exists in the user object
    if (!req.user.company || !req.user.company._id) {
      return res.status(400).json({ error: "Company ID is missing" });
    }
    
    const companyId = req.user.company._id; // Define companyId

    const existingTag = await TagManager.findOne({ name: name.toLowerCase(), company: companyId });
    if (existingTag) {
      return res.status(400).json({ error: "Tag already exists" });
    }

    const newTag = new TagManager({ 
      name: name.toLowerCase(), 
      description, 
      company: companyId, // Ensure company is set
      leadsCount: 0,      // Initialize leadsCount to 0
      filesCount: 0       // Initialize filesCount to 0
    });
    await newTag.save();

    res.status(201).json({ message: "Tag created successfully", tag: newTag });
  } catch (error) {
    res.status(500).json({ error: "Error creating tag", details: error.message });
  }
};

exports.getTags = async (req, res) => {
  try {
    const companyId = req.user.company._id; // Define companyId
    console.log("Fetching tags for company ID:", companyId);
    const tags = await TagManager.find({ 
      company: companyId
    }).sort({ usageCount: -1 });
    
    console.log("Tags found:", tags);
    res.json(tags);
  } catch (error) {
    console.error("Error fetching tags:", error);
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



exports.getAllTagsWithCounts = async (req, res) => {
  try {
    const tags = await TagManager.find().select("name leadsCount filesCount"); // Fetch relevant fields

    const formattedTags = tags.reduce((acc, tag) => {
      acc[tag.name] = {
        leads: tag.leadsCount,
        files: tag.filesCount
      };
      return acc;
    }, {});

    return res.status(200).json({ success: true, data: formattedTags });
  } catch (error) {
    console.error("Error fetching tags:", error);
    return res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

// Controller to get details of leads that are commonly present in all the given tags
exports.getCommonLeadsInTags = async (req, res) => {
    try {
        const { tagNames } = req.body; // Expecting an array of tag names in the request body
        if (!Array.isArray(tagNames) || tagNames.length === 0) {
            return res.status(400).json({ error: "Invalid or missing tag names" });
        }

        // Find leads that are associated with all the given tags
        const leads = await Lead.find({ tags: { $all: tagNames.map(name => name.toLowerCase()) } });

        // Return detailed information about each lead
        res.status(200).json({
            success: true,
            data: leads // This will return the entire lead objects
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server Error',
            error: error.message
        });
    }
};


