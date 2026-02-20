const mongoose = require('mongoose');

const monthlyMessageSchema = new mongoose.Schema({
  year: {
    type: Number,
    required: true
  },
  month: {
    type: Number,
    required: true,
    min: 1,
    max: 12
  },
  zone: {
    type: String,
    enum: ['Agra', 'Bareilly', 'Kanpur', 'Prayagraj', 'Gorakhpur', 'Varanasi', 'Meerut', 'Lucknow', 'RHQ'],
    required: true
  },
  
  // CW Data
  cwInMessages: { type: Number, default: 0 },
  cwOutMessages: { type: Number, default: 0 },
  cwInGroups: { type: Number, default: 0 },
  cwOutGroups: { type: Number, default: 0 },
  
  // POLNET Data
  polnetInMessages: { type: Number, default: 0 },
  polnetOutMessages: { type: Number, default: 0 },
  polnetInGroups: { type: Number, default: 0 },
  polnetOutGroups: { type: Number, default: 0 },
  
  // PRM Data
  prmInMessages: { type: Number, default: 0 },
  prmOutMessages: { type: Number, default: 0 },
  prmInGroups: { type: Number, default: 0 },
  prmOutGroups: { type: Number, default: 0 },
  
  // VHF RG Data
  vhfRgInMessages: { type: Number, default: 0 },
  vhfRgOutMessages: { type: Number, default: 0 },
  vhfRgInGroups: { type: Number, default: 0 },
  vhfRgOutGroups: { type: Number, default: 0 },
  
  // VHF Events Data
  vhfEventsInMessages: { type: Number, default: 0 },
  vhfEventsOutMessages: { type: Number, default: 0 },
  vhfEventsInGroups: { type: Number, default: 0 },
  vhfEventsOutGroups: { type: Number, default: 0 },
  
  dataType: {
    type: String,
    default: 'MONTHLY_ZONE_WISE'
  },
  source: {
    type: String,
    enum: ['EXCEL_UPLOAD', 'MANUAL_ENTRY'],
    default: 'MANUAL_ENTRY'
  },
  remarks: {
    type: String,
    default: ''
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, { timestamps: true });

// Compound index for unique year-month-zone combination
monthlyMessageSchema.index({ year: 1, month: 1, zone: 1 }, { unique: true });

// Auto-set VHF fields to 0 for RHQ before saving
monthlyMessageSchema.pre('save', function(next) {
  if (this.zone === 'RHQ') {
    this.vhfRgInMessages = 0;
    this.vhfRgOutMessages = 0;
    this.vhfRgInGroups = 0;
    this.vhfRgOutGroups = 0;
    this.vhfEventsInMessages = 0;
    this.vhfEventsOutMessages = 0;
    this.vhfEventsInGroups = 0;
    this.vhfEventsOutGroups = 0;
  }
  next();
});

module.exports = mongoose.model('MonthlyMessage', monthlyMessageSchema);