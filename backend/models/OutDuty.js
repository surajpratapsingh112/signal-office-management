const mongoose = require('mongoose');

const outDutySchema = new mongoose.Schema({
  employee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
    required: true
  },
  
  // Type of duty
  dutyType: {
    type: String,
    enum: [
      'OUT_DUTY',
      'TRAINING_OUTSIDE_DISTRICT',
      'TRAINING_WITHIN_DISTRICT',
      'TRAINING_HQ',
      'DEPUTATION',
      'OFFICIAL_TOUR'
    ],
    required: true
  },
  
  // Location/Place
  location: {
    type: String,
    required: true,
    trim: true
  },
  
  // Purpose/Details
  purpose: {
    type: String,
    trim: true
  },
  
  // Start date (fixed)
  startDate: {
    type: Date,
    required: true
  },
  
  // Return date (initially null - TBD)
  returnDate: {
    type: Date,
    default: null
  },
  
  // Actual return date (when employee actually returns)
  actualReturnDate: {
    type: Date,
    default: null
  },
  
  // Status
  status: {
    type: String,
    enum: ['ONGOING', 'RETURNED', 'CANCELLED'],
    default: 'ONGOING'
  },
  
  // Order/Authority details
  orderNumber: {
    type: String,
    trim: true
  },
  
  orderDate: {
    type: Date
  },
  
  // Remarks
  remarks: {
    type: String,
    trim: true
  },
  
  // Who created this entry
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Who marked return
  returnMarkedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  returnMarkedAt: {
    type: Date
  },
  
  isActive: {
    type: Boolean,
    default: true
  }
  
}, { timestamps: true });

// Index for quick queries
outDutySchema.index({ employee: 1, status: 1 });
outDutySchema.index({ startDate: 1, returnDate: 1 });
outDutySchema.index({ dutyType: 1 });

// Method to check if employee is on out duty on a specific date
outDutySchema.statics.isEmployeeOnOutDuty = async function(employeeId, checkDate) {
  const date = new Date(checkDate);
  const startOfDay = new Date(date.setHours(0, 0, 0, 0));
  const endOfDay = new Date(date.setHours(23, 59, 59, 999));
  
  const onOutDuty = await this.findOne({
    employee: employeeId,
    status: 'ONGOING',
    startDate: { $lte: endOfDay },
    $or: [
      { returnDate: null }, // TBD
      { returnDate: { $gte: startOfDay } }
    ]
  });
  
  return !!onOutDuty;
};

// Method to get employee's current out duty
outDutySchema.statics.getCurrentOutDuty = async function(employeeId) {
  return await this.findOne({
    employee: employeeId,
    status: 'ONGOING'
  })
  .populate('employee', 'name pno rank currentUnit')
  .populate('createdBy', 'name')
  .sort({ startDate: -1 });
};

// Helper method to get duty type label in Hindi
outDutySchema.methods.getDutyTypeLabel = function() {
  const labels = {
    'OUT_DUTY': 'आउट ड्यूटी',
    'TRAINING_OUTSIDE_DISTRICT': 'ट्रेनिंग (जनपद से बाहर)',
    'TRAINING_WITHIN_DISTRICT': 'ट्रेनिंग (जनपद में)',
    'TRAINING_HQ': 'विभागीय ट्रेनिंग (मुख्यालय)',
    'DEPUTATION': 'प्रतिनियुक्ति',
    'OFFICIAL_TOUR': 'सरकारी दौरा'
  };
  return labels[this.dutyType] || this.dutyType;
};

module.exports = mongoose.model('OutDuty', outDutySchema);