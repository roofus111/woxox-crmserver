const Campaign = require('../models/Campaign');
const Pipelines = require('../models/pipeline');
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
  
  
  // Controller to update the pipeline inside a campaign
  exports.updatePipelineInCampaign = async (req, res) => {
    const {  Pipeline } = req.body;
    const { campaignId } = req.params;
  
    try {
      // Find the campaign by ID
      const campaign = await Campaign.findById(campaignId);
      if (!campaign) {
        return res.status(404).json({ message: "Campaign not found" });
      }
  
      // Find the pipeline by ID (Optional: If you want to verify that the pipeline exists)
      const pipeline = await Pipelines.findById(Pipeline);
      if (!pipeline) {
        return res.status(404).json({ message: "Pipeline not found" });
      }
  
      // Update the pipeline reference in the campaign
      campaign.Pipeline = Pipeline;
  
      // Save the updated campaign
      await campaign.save();
  
      return res.status(200).json({
        message: 'Pipeline updated successfully in campaign',
        campaign,
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: "Server error", error: error.message });
    }
  };
  exports.getCampaignsByPipelineId = async (req, res) => {
    try {
      const { pipelineId } = req.params; // Extract the pipeline ID from request parameters 
      // Check if the pipeline ID is provided
      console.log(pipelineId)
      if (!pipelineId) {
        return res.status(400).json({ message: 'Pipeline ID is required.' });
      }
  
      // Find all campaigns that belong to the provided pipeline ID
      const campaigns = await Campaign.find({ Pipeline: pipelineId }) // Use `find()` and match the correct field `Pipeline`
        .populate('Pipeline', 'name') // Optionally populate the pipeline details (e.g., name) if needed
        .exec();
  
      // If no campaigns are found for the specified pipeline ID, return a 404 response
      if (!campaigns || campaigns.length === 0) {
        return res.status(404).json({ message: 'No campaigns found for this pipeline.' });
      }
  
      // Return the found campaigns
      res.status(200).json({
        message: 'Campaigns fetched successfully.',
        campaigns,
      });
    } catch (error) {
      // Catch any error and respond with a generic message and the error details
      res.status(500).json({
        message: 'An error occurred while fetching campaigns.',
        error: error.message,
      });
    }
  };
  

  
  