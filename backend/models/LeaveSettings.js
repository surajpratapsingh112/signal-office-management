const mongoose = require('mongoose');

const leaveSettingsSchema = new mongoose.Schema({
  year: {
    type: Number,
    required: true,
    unique: true
  },
  casualLeave: {
    type: Number,
    default: 30
  },
  permissions: {
    type: Number,
    default: 5
  },
  restrictedLeave: {
    type: Number,
    default: 2
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

module.exports = mongoose.model('LeaveSettings', leaveSettingsSchema);