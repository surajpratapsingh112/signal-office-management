const mongoose = require('mongoose');

const storeItemSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Item name is required'],
    trim: true
  },
  category: {
    type: String,
    required: true,
    enum: ['ELECTRONICS', 'COMMUNICATION', 'FURNITURE', 'STATIONERY', 'OTHER']
  },
  totalQuantity: {
    type: Number,
    required: true,
    default: 0
  },
  availableQuantity: {
    type: Number,
    required: true,
    default: 0
  },
  unit: {
    type: String,
    required: true,
    default: 'Nos'
  },
  description: {
    type: String,
    default: ''
  },
  addedDate: {
    type: Date,
    default: Date.now
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  },
  isActive: {
    type: Boolean,
    default: true
  }
});

// Update lastUpdated on save
storeItemSchema.pre('save', function(next) {
  this.lastUpdated = Date.now();
  next();
});

module.exports = mongoose.model('StoreItem', storeItemSchema);