const mongoose = require('mongoose');

const tagSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  taggedItems: [
    {
      itemId: { type: mongoose.Schema.Types.ObjectId, required: true },
      collectionName: { type: String, required: true }
    }
  ]
});

// Get the count of tagged items for each tag
tagSchema.statics.getTagCounts = async function () {
  return this.aggregate([
    {
      $project: {
        name: 1,
        count: { $size: "$taggedItems" }
      }
    }
  ]);
};

const Tag = mongoose.model('Tag', tagSchema);

module.exports = Tag;
