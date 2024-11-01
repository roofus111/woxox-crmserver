const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
    text: { type: String, required: true },
    isCompleted: { type: Boolean, default: false },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
      }
}, {
    timestamps: true
});

module.exports = mongoose.model('Task', taskSchema);
