const mongoose = require('mongoose');

const gateDutyReplacementSchema = new mongoose.Schema({
  // Reference to the main gate duty
  gateDuty: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'GateDuty',
    required: true
  },
  
  // Date (1-31)
  date: {
    type: Number,
    required: true,
    min: 1,
    max: 31
  },
  
  // Month and Year
  month: {
    type: Number,
    required: true,
    min: 1,
    max: 12
  },
  
  year: {
    type: Number,
    required: true
  },
  
  // Which slot is being replaced
  slot: {
    type: String,
    enum: ['MAIN_MORNING', 'MAIN_EVENING', 'SCHOOL_MORNING', 'SCHOOL_EVENING'],
    required: true
  },
  
  // Original permanent employee
  permanentEmployee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
    required: true
  },
  
  // Replacement employee for this month
  replacementEmployee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
    required: true
  },
  
  // Reason for replacement
  reason: {
    type: String,
    default: ''
  },
  
  // Who made this replacement
  replacedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // When was replacement made
  replacedAt: {
    type: Date,
    default: Date.now
  }
  
}, { timestamps: true });

// Compound index: unique replacement per date-month-year-slot
gateDutyReplacementSchema.index(
  { date: 1, month: 1, year: 1, slot: 1 }, 
  { unique: true }
);

// Index for quick monthly queries
gateDutyReplacementSchema.index({ year: 1, month: 1 });

// Static method to get effective employee for a specific date/month/slot
gateDutyReplacementSchema.statics.getEffectiveEmployee = async function(date, month, year, slot, permanentEmployee) {
  const replacement = await this.findOne({
    date,
    month,
    year,
    slot
  }).populate('replacementEmployee', 'name pno rank currentUnit');
  
  if (replacement) {
    return {
      employee: replacement.replacementEmployee,
      isReplacement: true,
      replacementDetails: replacement
    };
  }
  
  return {
    employee: permanentEmployee,
    isReplacement: false,
    replacementDetails: null
  };
};

// Static method to check if employee has any duty on a specific date/month
gateDutyReplacementSchema.statics.getEmployeeDutiesForDate = async function(employeeId, date, month, year) {
  const GateDuty = mongoose.model('GateDuty');
  
  // Get permanent duties
  const gateDuty = await GateDuty.findOne({ date, year })
    .populate('slots.MAIN_MORNING.permanentEmployee slots.MAIN_EVENING.permanentEmployee slots.SCHOOL_MORNING.permanentEmployee slots.SCHOOL_EVENING.permanentEmployee');
  
  if (!gateDuty) return [];
  
  const duties = [];
  const slotKeys = ['MAIN_MORNING', 'MAIN_EVENING', 'SCHOOL_MORNING', 'SCHOOL_EVENING'];
  
  for (const slotKey of slotKeys) {
    const slot = gateDuty.slots[slotKey];
    if (!slot || !slot.permanentEmployee) continue;
    
    // Check if this employee is permanent
    if (slot.permanentEmployee._id.toString() === employeeId.toString()) {
      // Check if replaced this month
      const replacement = await this.findOne({ date, month, year, slot: slotKey });
      
      if (!replacement) {
        duties.push({
          slot: slotKey,
          type: 'permanent',
          details: GateDuty.getSlotDetails(slotKey)
        });
      }
    }
  }
  
  // Check if employee is replacement for any slot
  const replacements = await this.find({
    date,
    month,
    year,
    replacementEmployee: employeeId
  });
  
  replacements.forEach(rep => {
    duties.push({
      slot: rep.slot,
      type: 'replacement',
      replacingEmployee: rep.permanentEmployee,
      details: GateDuty.getSlotDetails(rep.slot)
    });
  });
  
  return duties;
};

module.exports = mongoose.model('GateDutyReplacement', gateDutyReplacementSchema);