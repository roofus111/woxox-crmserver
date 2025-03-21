const mongoose = require('mongoose');

const tagSchema = new mongoose.Schema({
  company: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Company",
    required: true,
},
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  usageCount: {
    type: Number,
    default: 0,
    min: 0 // Ensures usageCount doesn't go negative
  }
}, { timestamps: true });

/**
 * Increment or decrement the usageCount of a tag.
 * If the tag does not exist and is being added, it will be created.
 * If the usageCount reaches 0, the tag will be deleted.
 *
 * @param {String} tagName - The name of the tag to update.
 * @param {Boolean} isAdding - True to increment, False to decrement.
 */
tagSchema.statics.updateUsage = async function (tagName, isAdding) {
  try {
    if (isAdding) {
      await this.findOneAndUpdate(
        { name: tagName },
        { $inc: { usageCount: 1 } },
        { new: true, upsert: true } // Create tag if it doesn't exist
      );
    } else {
      const tag = await this.findOneAndUpdate(
        { name: tagName, usageCount: { $gt: 0 } },
        { $inc: { usageCount: -1 } },
        { new: true }
      );

      if (tag && tag.usageCount === 0) {
        await this.deleteOne({ name: tagName });
        console.log(`Tag "${tagName}" deleted as its usage count reached 0.`);
      }
    }
  } catch (error) {
    console.error("Error updating tag usage:", error);
  }
};

const TagManager = mongoose.model('TagManager', tagSchema);

module.exports = TagManager;
