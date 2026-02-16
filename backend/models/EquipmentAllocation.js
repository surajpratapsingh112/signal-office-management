const mongoose = require('mongoose');

const equipmentAllocationSchema = new mongoose.Schema({
  item: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'StoreItem',
    required: true
  },
  unit: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Unit',
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 0
  },
  allocatedDate: {
    type: Date,
    default: Date.now
  },
  remarks: {
    type: String,
    default: ''
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  }
});

// Compound index for item and unit (one allocation per item per unit)
equipmentAllocationSchema.index({ item: 1, unit: 1 }, { unique: true });

// Update lastUpdated on save
equipmentAllocationSchema.pre('save', function(next) {
  this.lastUpdated = Date.now();
  next();
});

module.exports = mongoose.model('EquipmentAllocation', equipmentAllocationSchema);