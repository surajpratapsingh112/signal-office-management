const mongoose = require('mongoose');

const leaveApplicationSchema = new mongoose.Schema({
  employee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
    required: true
  },
  leaveType: {
    type: String,
    enum: ['CL', 'PERMISSION', 'RL', 'EL', 'MEDICAL', 'MATERNITY', 'CCL'],
    required: true
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  totalDays: {
    type: Number,
    required: true
  },
  
  // Original leave tracking
  originalStartDate: {
    type: Date
  },
  originalEndDate: {
    type: Date
  },
  originalTotalDays: {
    type: Number
  },
  
  // Working days calculation
  workingDays: {
    type: Number,
    required: true
  },
  weekendDays: {
    type: Number,
    default: 0
  },
  holidayDays: {
    type: Number,
    default: 0
  },
  
  // Permissions
  permissionsUsed: {
    type: Number,
    default: 0
  },
  permissionDates: [{
    type: Date
  }],
  
  // CL Extensions
  extensions: [{
    extendedDays: Number,
    newEndDate: Date,
    reason: String,
    extendedAt: {
      type: Date,
      default: Date.now
    },
    extendedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  }],
  
  // Medical Rest
  medicalRestStartDate: {
    type: Date
  },
  medicalRestEndDate: {
    type: Date
  },
  medicalRestDays: {
    type: Number,
    default: 0
  },
  medicalRestReason: {
    type: String
  },
  
  // Medical Rest History (for extensions)
  medicalRestHistory: [{
    days: Number,
    reason: String,
    addedAt: {
      type: Date,
      default: Date.now
    },
    addedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  }],
  
  // CL Split when medical rest starts
  clDaysAvailed: {
    type: Number,
    default: 0
  },
  clDaysCancelled: {
    type: Number,
    default: 0
  },
  
  // Medical Approval (CRQ Branch)
  medicalApprovalStatus: {
    type: String,
    enum: ['NONE', 'PENDING', 'APPROVED_AS_EL', 'APPROVED_AS_MEDICAL', 'REJECTED'],
    default: 'NONE'
  },
  convertedLeaveType: {
    type: String,
    enum: ['EL', 'MEDICAL', null],
    default: null
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  approvedAt: {
    type: Date
  },
  approvalRemarks: {
    type: String
  },
  
  // Status
  status: {
    type: String,
    enum: ['ON_LEAVE', 'RETURNED', 'CANCELLED'],
    default: 'ON_LEAVE'
  },
  arrivalDate: {
    type: Date,
    required: true
  },
  remarks: {
    type: String,
    trim: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, { timestamps: true });

// Index for faster queries
leaveApplicationSchema.index({ employee: 1, startDate: -1 });
leaveApplicationSchema.index({ status: 1, arrivalDate: 1 });
leaveApplicationSchema.index({ medicalApprovalStatus: 1 });

module.exports = mongoose.model('LeaveApplication', leaveApplicationSchema);