const Pipeline = require('../models/pipeline');

// Create a new pipeline
exports.createPipeline = async (req, res) => {
  try {
    const pipeline = new Pipeline({
      ...req.body,
      company: req.user.company._id,
      User: req.user._id,
    }); // Assuming validated data in req.body
    const savedPipeline = await pipeline.save();
    res.status(201).json(savedPipeline);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};
exports.getPipelines = async (req, res) => {
  try {
    const pipelines = await Pipeline.find({ company: req.user.company._id })
      .populate('User', 'name email'); // Populate user data
    res.status(200).json(pipelines);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
exports.getPipelineById = async (req, res) => {
  try {
    const { id } = req.params; // Extract pipeline ID from the request parameters

    // Find the pipeline by ID and populate the user field
    const pipeline = await Pipeline.findById(id)

    // Check if the pipeline exists
    if (!pipeline) {
      return res.status(404).json({ message: 'Pipeline not found' });
    }

    res.status(200).json(pipeline);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.updatePipeline = async (req, res) => {
  try {
    const { pipelineid } = req.params;
    const updatedPipeline = await Pipeline.findByIdAndUpdate(
      pipelineid,
      { $set: req.body },
      { new: true, runValidators: true }
    );
    if (!updatedPipeline) {
      return res.status(404).json({ message: 'Pipeline not found' });
    }
    res.status(200).json(updatedPipeline);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};
exports.deletePipeline = async (req, res) => {
  try {
    const { pipelineid } = req.params;
    const deletedPipeline = await Pipeline.findByIdAndDelete(pipelineid);
    if (!deletedPipeline) {
      return res.status(404).json({ message: 'Pipeline not found' });
    }
    res.status(200).json({ message: 'Pipeline deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};