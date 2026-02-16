const mongoose = require('mongoose');

const leaveBalanceSchema = new mongoose.Schema({
  employee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
    required: true
  },
  year: {
    type: Number,
    required: true
  },
  casualLeave: {
    total: { type: Number, default: 30 },
    used: { type: Number, default: 0 },
    remaining: { type: Number, default: 30 }
  },
  permissions: {
    total: { type: Number, default: 5 },
    used: { type: Number, default: 0 },
    remaining: { type: Number, default: 5 }
  },
  restrictedLeave: {
    total: { type: Number, default: 2 },
    used: { type: Number, default: 0 },
    remaining: { type: Number, default: 2 }
  },
  earnedLeave: {
    carriedForward: { type: Number, default: 0 },
    earned: { type: Number, default: 0 },
    used: { type: Number, default: 0 },
    remaining: { type: Number, default: 0 }
  },
  // Female only
  childCareLeave: {
    total: { type: Number, default: 730 }, // lifetime 2 years
    used: { type: Number, default: 0 },
    remaining: { type: Number, default: 730 }
  },
  maternityLeave: {
    total: { type: Number, default: 180 }, // per pregnancy
    used: { type: Number, default: 0 },
    remaining: { type: Number, default: 180 }
  },
  medicalLeave: {
    used: { type: Number, default: 0 }
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Compound index for employee and year
leaveBalanceSchema.index({ employee: 1, year: 1 }, { unique: true });

module.exports = mongoose.model('LeaveBalance', leaveBalanceSchema);