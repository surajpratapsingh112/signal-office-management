const mongoose = require('mongoose');

const employeeSchema = new mongoose.Schema({
  pno: {
    type: String,
    required: [true, 'PNO is required'],
    unique: true,
    trim: true
  },
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true
  },
  rank: {
    type: String,
    required: [true, 'Rank/Designation is required'],
    trim: true
  },
  rankNumber: {
    type: String,
    trim: true
  },
  mobile: {
    type: String,
    required: [true, 'Mobile number is required'],
    trim: true
  },
  bloodGroup: {
    type: String,
    enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'],
    required: true
  },
  maritalStatus: {
    type: String,
    enum: ['MARRIED', 'UNMARRIED', 'WIDOW', 'WIDOWER'],
    default: 'UNMARRIED'
  },
  gender: {
    type: String,
    enum: ['MALE', 'FEMALE', 'OTHER'],
    required: true
  },
  pensionType: {
    type: String,
    enum: ['NPS', 'GPF', 'CPF', 'EPF', 'UPTRON'],
    required: true
  },
  pensionNumber: {
    type: String,
    required: true
  },
  currentUnit: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Unit',
    required: true
  },
  // NEW: Other Unit Details
otherUnitDetails: {
  type: String,
  trim: true,
  default: null
  // यहाँ specific unit name store होगी जैसे "Agra", "Meerut", "Delhi HQ"
},
  postingDate: {
    type: Date,
    default: Date.now
  },
  postingHistory: [{
    unit: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Unit'
    },
    startDate: Date,
    endDate: Date
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
    customFields: {
    type: Map,
    of: mongoose.Schema.Types.Mixed,
    default: {}
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

module.exports = mongoose.model('Employee', employeeSchema);