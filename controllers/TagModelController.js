const TagModel = require('../models/TagModel');
// Create a new tag


exports.createTag = async (req, res,next) => {
  try {
    const { name, slug, description } = req.body;

    // Validate required fields
    if (!name || !slug) {
      return res.status(400).json({ message: 'Name and slug are required.' });
    }

    // Check for duplicate name or slug
    const existingTag = await Tag.findOne({ $or: [{ name }, { slug }] });
    if (existingTag) {
      return res.status(409).json({ message: 'Tag with the same name or slug already exists.' });
    }

    // Create a new tag instance
    const tag = new TagModel({
      name,
      slug,
      description
    });

    // Save the tag to the database
    const savedTag = await tag.save();
 
    // Respond with the newly created tag
    res.status(201).json({
      message: 'Tag created successfully.',
      Tag: savedTag,
    });
  } catch (error) {
    console.error('Error creating tag:', error);
    res.status(500).json({ message: 'An error occurred while creating the tag.', error });
  }
};
exports. getAllTag= async (req, res) => {
  try {
    const tag = await TagModel.find();

    res.status(200).json({
      message: 'Tag retrieved successfully',
      data: tag
    });
  } catch (error) {
    res.status(500).json({
      message: 'Failed to retrieve tag',
      error: error.message
    });
  }
};

// Controller to get a tag by its ID
exports.getTagById = async (req, res) => {
  try {
    // Get the tag ID from the request parameters
    const { id } = req.params;

    // Find the tag by ID
    const tag = await TagModel.findById(id);

    // If no tag is found, return a 404 error
    if (!tag) {
      return res.status(404).json({ message: 'Tag not found' });
    }

    // Return the found tag with a 200 status code
    res.status(200).json({
      message: 'Tag retrieved successfully',
      tag,
    });
  } catch (error) {
    console.error('Error fetching tag by ID:', error.message);

    // Handle any potential errors (e.g., invalid ObjectId format)
    res.status(500).json({
      message: 'An error occurred while fetching the tag.',
      error: error.message,
    });
  }
};



// Controller to update a tag by its ID
exports.updateTag = async (req, res) => {
  try {
    // Get the tag ID from the request parameters
    const { tagid } = req.params;

    // Get the updated data from the request body
    const { name, slug, description } = req.body;

    // Validate required fields (you can customize validation based on your needs)
    if (!name || !slug) {
      return res.status(400).json({ message: 'Name and slug are required.' });
    }

    // Find and update the tag by ID
    const updatedTag = await TagModel.findByIdAndUpdate(
        tagid,
      { name, slug, description},
      { new: true, runValidators: true } // `new: true` returns the updated document
    );

    // If no tag is found, return a 404 error
    if (!updatedTag) {
      return res.status(404).json({ message: 'Tag not found' });
    }

    // Return the updated tag with a success message
    res.status(200).json({
      message: 'Tag updated successfully',
      tag: updatedTag,
    });
  } catch (error) {
    console.error('Error updating tag:', error.message);

    // Handle any errors that occur during the update process
    res.status(500).json({
      message: 'An error occurred while updating the tag.',
      error: error.message,
    });
  }
};

// Controller to delete a tag by its ID
exports.deleteTag = async (req, res) => {
  try {
    // Get the tag ID from the request parameters
    const { tagid } = req.params;

    // Find and delete the tag by ID
    const deletedtag = await TagModel.findByIdAndDelete(tagid);

    // If no tag is found, return a 404 error
    if (!deletedtag) {
      return res.status(404).json({ message: 'tag not found' });
    }

    // Return a success message indicating the tag was deleted
    res.status(200).json({
      message: 'tag deleted successfully',
      tag: deletedtag,
    });
  } catch (error) {
    console.error('Error deleting tag:', error.message);

    // Handle any errors that occur during the delete process
    res.status(500).json({
      message: 'An error occurred while deleting the tag.',
      error: error.message,
    });
  }
};

