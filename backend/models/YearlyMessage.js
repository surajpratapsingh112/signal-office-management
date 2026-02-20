const mongoose = require('mongoose');

const yearlyMessageSchema = new mongoose.Schema({
  year: {
    type: Number,
    required: true
  },
  station: {
    type: String,
    enum: ['HF', 'PRM', 'POLNET', 'DCR'],
    required: true
  },
  messagesIn: {
    type: Number,
    required: true,
    default: 0
  },
  messagesOut: {
    type: Number,
    required: true,
    default: 0
  },
  messagesTotal: {
    type: Number,
    required: true,
    default: 0
  },
  groupsIn: {
    type: Number,
    required: true,
    default: 0
  },
  groupsOut: {
    type: Number,
    required: true,
    default: 0
  },
  groupsTotal: {
    type: Number,
    required: true,
    default: 0
  },
  dataType: {
    type: String,
    default: 'YEARLY_HISTORICAL'
  },
  source: {
    type: String,
    enum: ['EXCEL_IMPORT', 'MANUAL_ENTRY'],
    default: 'EXCEL_IMPORT'
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, { timestamps: true });

// Compound index for unique year-station combination
yearlyMessageSchema.index({ year: 1, station: 1 }, { unique: true });

module.exports = mongoose.model('YearlyMessage', yearlyMessageSchema);