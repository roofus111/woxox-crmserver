const mongoose = require('mongoose');
const CampaignSchema = new mongoose.Schema({
    company: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
    },
    User: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // Assuming you have a User model for sales representatives
      required: true,
    },
    Pipeline: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Pipeline", // Assuming you have a User model for sales representatives
    },
    name: {
      type: String,
      required: true
    },
    description: {
      type: String
    },
    createdAt: {
        type: Date,
        default: Date.now
      },
    updatedAt: {
        type: Date,
        default: Date.now
      }
    });
    CampaignSchema.pre('save', function (next) {
        this.updatedAt = Date.now();
        next();
      });
      
      const Camapaign = mongoose.model('campaign', CampaignSchema);
      
      module.exports = Camapaign;