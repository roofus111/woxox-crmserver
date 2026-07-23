const Pipeline = require('../models/pipeline');

function getCompanyId(user) {
  if (!user) return null;
  if (user.company) {
    return typeof user.company === 'object' && user.company._id
      ? user.company._id
      : user.company;
  }
  return null;
}

// Create a new pipeline
exports.createPipeline = async (req, res) => {
  try {
    const companyId = getCompanyId(req.user);
    if (!companyId) {
      return res.status(400).json({
        error: 'Your account is not linked to a company yet. Complete company registration first.',
      });
    }

    const pipeline = new Pipeline({
      ...req.body,
      company: companyId,
      User: req.user._id,
    });
    const savedPipeline = await pipeline.save();
    res.status(201).json(savedPipeline);
  } catch (error) {
    console.error('createPipeline error:', error);
    res.status(400).json({ error: error.message });
  }
};

exports.getPipelines = async (req, res) => {
  try {
    const companyId = getCompanyId(req.user);
    if (!companyId) {
      return res.status(200).json([]);
    }

    let pipelines = await Pipeline.find({ company: companyId }).populate(
      'User',
      'name email'
    );

    // Campaigns depend on legacy Mongo pipelines. If none exist yet, seed a
    // default so the Campaign "Choose Pipeline" dropdown is never empty.
    if (!pipelines.length) {
      await Pipeline.create({
        name: 'Sales Pipeline',
        description: 'Auto-created for campaigns',
        company: companyId,
        User: req.user._id,
        stages: [
          { name: 'New', property: 'Pending', order: 0 },
          { name: 'Contacted', property: 'Processing', order: 1 },
          { name: 'Qualified', property: 'Processing', order: 2 },
          { name: 'Won', property: 'Won', order: 3 },
          { name: 'Lost', property: 'Lost', order: 4 },
        ],
      });
      pipelines = await Pipeline.find({ company: companyId }).populate(
        'User',
        'name email'
      );
    }

    res.status(200).json(pipelines);
  } catch (error) {
    console.error('getPipelines error:', error);
    res.status(500).json({ error: error.message });
  }
};

exports.getPipelineById = async (req, res) => {
  try {
    const { id } = req.params;
    const pipeline = await Pipeline.findById(id);

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
