const Campaign = require('../models/Campaign');

// Create a new pipeline
exports.createCampaign = async (req, res) => {
  try {
    const campaign = new Campaign({
      ...req.body,
      company: req.user.company._id,
      User: req.user._id,
    }); // Assuming validated data in req.body
    const savedCampaign = await campaign.save();
    res.status(201).json(savedCampaign);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};
exports.getCampaign = async (req, res) => {
    try {
      const campaigns = await Campaign.find({ company: req.user.company._id }).populate('User', 'name email'); // Populate user data
      res.status(200).json(campaigns);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  };
  exports.updateCampaign = async (req, res) => {
    try { 
      const { campaignid } = req.params;
      const updatedCampaign = await Campaign.findByIdAndUpdate(
        campaignid,
        { $set: req.body },
        { new: true, runValidators: true }
      );
      if (!updatedCampaign) {
        return res.status(404).json({ message: 'Campaign not found' });
      }
      res.status(200).json(updatedCampaign);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  };
  exports.deleteCampaign = async (req, res) => {
    try {
      const { campaignid } = req.params;
      const deleteCampaign = await Campaign.findByIdAndDelete(campaignid);
      if (!deleteCampaign) {
        return res.status(404).json({ message: 'Campaign not found' });
      }
      res.status(200).json({ message: 'Campaign deleted successfully' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  };
  
  exports.getCampaignsByPipelineId = async (req, res) => {
    try {
      const { pipelineid } = req.params; // Extract the pipeline ID from request parameters
  
      // Check if the pipeline ID is provided
      if (!pipelineid) {
        return res.status(400).json({ message: 'Pipeline ID is required.' });
      }
  
      // Find all campaigns that belong to the provided pipeline ID
      const campaigns = await Campaign.find({ pipelineId: pipelineid })
        .populate('pipelineId', 'name') // Optionally populate the pipeline details (like name) if needed
        .exec();
  
      // If no campaigns are found for the specified pipeline ID, return a 404 response
      if (!campaigns || campaigns.length === 0) {
        return res.status(404).json({ message: 'No campaigns found for this pipeline.' });
      }
  
      // Return the found campaigns
      res.status(200).json({
        message: 'Campaigns fetched successfully.',
        campaigns
      });
    } catch (error) {
      // Catch any error and respond with a generic message and the error details
      res.status(500).json({
        message: 'An error occurred while fetching campaigns.',
        error: error.message
      });
    }
  };
  

  