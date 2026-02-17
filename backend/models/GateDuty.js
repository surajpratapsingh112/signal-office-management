const mongoose = require('mongoose');

// Sub-schema for individual slot assignment
const slotAssignmentSchema = new mongoose.Schema({
  permanentEmployee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
    default: null
  }
}, { _id: false });

const gateDutySchema = new mongoose.Schema({
  // Date (1-31) - Permanent for whole year
  date: {
    type: Number,
    required: true,
    min: 1,
    max: 31
  },
  
  // Year for which this setup is valid
  year: {
    type: Number,
    required: true,
    default: () => new Date().getFullYear()
  },
  
  // Four possible slots for each date
  slots: {
    MAIN_MORNING: {
      type: slotAssignmentSchema,
      default: () => ({ permanentEmployee: null })
    },
    MAIN_EVENING: {
      type: slotAssignmentSchema,
      default: () => ({ permanentEmployee: null })
    },
    SCHOOL_MORNING: {
      type: slotAssignmentSchema,
      default: () => ({ permanentEmployee: null })
    },
    SCHOOL_EVENING: {
      type: slotAssignmentSchema,
      default: () => ({ permanentEmployee: null })
    }
  },
  
  // Metadata
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  isActive: {
    type: Boolean,
    default: true
  }
  
}, { timestamps: true });

// Compound index: unique combination of date and year
gateDutySchema.index({ date: 1, year: 1 }, { unique: true });

// Helper method to get slot details
gateDutySchema.statics.getSlotDetails = function(slotKey) {
  const slotMap = {
    'MAIN_MORNING': { 
      gate: 'Main Gate', 
      time: '0600-1400', 
      timeDisplay: '06:00 - 14:00',
      label: 'Main (06-14)'
    },
    'MAIN_EVENING': { 
      gate: 'Main Gate', 
      time: '1400-2200', 
      timeDisplay: '14:00 - 22:00',
      label: 'Main (14-22)'
    },
    'SCHOOL_MORNING': { 
      gate: 'Training School Gate', 
      time: '0600-1400', 
      timeDisplay: '06:00 - 14:00',
      label: 'School (06-14)'
    },
    'SCHOOL_EVENING': { 
      gate: 'Training School Gate', 
      time: '1400-2200', 
      timeDisplay: '14:00 - 22:00',
      label: 'School (14-22)'
    }
  };
  return slotMap[slotKey];
};

// Method to get all assigned slots for a date
gateDutySchema.methods.getAssignedSlots = function() {
  const assigned = [];
  const slotKeys = ['MAIN_MORNING', 'MAIN_EVENING', 'SCHOOL_MORNING', 'SCHOOL_EVENING'];
  
  slotKeys.forEach(key => {
    if (this.slots[key] && this.slots[key].permanentEmployee) {
      assigned.push({
        slot: key,
        employee: this.slots[key].permanentEmployee,
        details: this.constructor.getSlotDetails(key)
      });
    }
  });
  
  return assigned;
};

module.exports = mongoose.model('GateDuty', gateDutySchema);