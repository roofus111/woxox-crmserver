const DocumentTemplate = require('../models/Template');

// Function to create a new template
exports.createTemplate = async (req, res) => {
    try {
        const { title, author, body, tags } = req.body;

        // Create a new document template instance
        const newTemplate = new DocumentTemplate({
            title,
            author,
            body,
            tags,
        });

        // Save the template to the database
        await newTemplate.save();

        // Respond with the created template
        res.status(201).json(newTemplate);
    } catch (error) {
        res.status(500).json({ message: 'Error creating template', error });
    }
};

// Function to get all templates
exports.getAllTemplates = async (req, res) => {
    try {
        const templates = await DocumentTemplate.find();
        res.status(200).json(templates);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching templates', error });
    }
};

// Function to get a template by ID
exports.getTemplateById = async (req, res) => {
    try {
        const { id } = req.params;
        const template = await DocumentTemplate.findById(id);

        if (!template) {
            return res.status(404).json({ message: 'Template not found' });
        }

        res.status(200).json(template);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching template', error });
    }
};

// Function to edit a template by ID
exports.editTemplate = async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;

        const updatedTemplate = await DocumentTemplate.findByIdAndUpdate(id, updates, { new: true });

        if (!updatedTemplate) {
            return res.status(404).json({ message: 'Template not found' });
        }

        res.status(200).json(updatedTemplate);
    } catch (error) {
        res.status(500).json({ message: 'Error updating template', error });
    }
};

// Function to delete a template by ID
exports.deleteTemplate = async (req, res) => {
    try {
        const { id } = req.params;

        const deletedTemplate = await DocumentTemplate.findByIdAndDelete(id);

        if (!deletedTemplate) {
            return res.status(404).json({ message: 'Template not found' });
        }

        res.status(204).send(); // No content to send back
    } catch (error) {
        res.status(500).json({ message: 'Error deleting template', error });
    }
};





