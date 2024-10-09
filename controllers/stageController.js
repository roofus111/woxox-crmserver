const Stage = require('../models/Stages'); // Adjust the path as needed

// Create a new stage
exports.createStage = async (req, res) => {
    try {
        const newStage = new Stage(req.body);
        const savedStage = await newStage.save();
        res.status(201).json(savedStage);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// Get all stages
exports.getAllStages = async (req, res) => {
    try {
        const stages = await Stage.find().populate('taskIds');
        res.status(200).json(stages);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get a single stage by ID
exports.getStageById = async (req, res) => {
    try {
        const stage = await Stage.findById(req.params.id).populate('taskIds');
        if (!stage) {
            return res.status(404).json({ message: 'Stage not found' });
        }
        res.status(200).json(stage);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Update a stage
exports.updateStage = async (req, res) => {
    try {
        const updatedStage = await Stage.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!updatedStage) {
            return res.status(404).json({ message: 'Stage not found' });
        }
        res.status(200).json(updatedStage);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// Delete a stage
exports.deleteStage = async (req, res) => {
    try {
        const deletedStage = await Stage.findByIdAndDelete(req.params.id);
        if (!deletedStage) {
            return res.status(404).json({ message: 'Stage not found' });
        }
        res.status(200).json({ message: 'Stage deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
