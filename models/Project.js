const mongoose = require('mongoose')
const { Schema } = mongoose

const milestoneSchema = new Schema(
  {
    title: { type: String, required: true },
    description: { type: String },
    dueDate: { type: Date },
    status: {
      type: String,
      enum: ['planned', 'in_progress', 'done', 'cancelled'],
      default: 'planned'
    },
    completedAt: { type: Date }
  },
  { timestamps: true }
)

const memberSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    role: {
      type: String,
      enum: ['owner', 'manager', 'member', 'viewer'],
      default: 'member'
    },
    joinedAt: { type: Date, default: Date.now }
  },
  { _id: false }
)

const projectSchema = new Schema(
  {
    company: { type: Schema.Types.ObjectId, ref: 'Company', required: true, index: true },
    name: { type: String, required: true, trim: true },
    code: { type: String, trim: true },
    description: { type: String },
    status: {
      type: String,
      enum: ['planning', 'active', 'on_hold', 'completed', 'cancelled'],
      default: 'planning',
      index: true
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
      default: 'medium'
    },
    startDate: { type: Date },
    endDate: { type: Date },
    owner: { type: Schema.Types.ObjectId, ref: 'User' },
    members: [memberSchema],
    milestones: [milestoneSchema],
    pipelineIds: [{ type: Schema.Types.ObjectId, ref: 'Pipeline' }],
    tagIds: [{ type: Schema.Types.ObjectId, ref: 'TagManager' }],
    // Lite vs Max feature surface preference for this project
    edition: {
      type: String,
      enum: ['lite', 'max'],
      default: 'lite'
    },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
    archivedAt: { type: Date }
  },
  { timestamps: true }
)

projectSchema.index({ company: 1, name: 1 })
projectSchema.index({ company: 1, status: 1 })

module.exports = mongoose.model('Project', projectSchema)
