const mongoose = require('mongoose');

const employeeFieldSettingsSchema = new mongoose.Schema({
  fieldName: {
    type: String,
    required: true,
    trim: true
  },
  fieldLabel: {
    type: String,
    required: true,
    trim: true
  },
  fieldType: {
    type: String,
    required: true,
    enum: ['text', 'number', 'date', 'email', 'phone', 'dropdown', 'textarea'],
    default: 'text'
  },
  required: {
    type: Boolean,
    default: false
  },
  enabled: {
    type: Boolean,
    default: true
  },
  showInTable: {
    type: Boolean,
    default: false
  },
  options: [{
    type: String,
    trim: true
  }],
  order: {
    type: Number,
    default: 0
  },
  placeholder: {
    type: String,
    trim: true
  },
  validationPattern: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

// Index for faster queries
employeeFieldSettingsSchema.index({ order: 1 });

module.exports = mongoose.model('EmployeeFieldSettings', employeeFieldSettingsSchema);