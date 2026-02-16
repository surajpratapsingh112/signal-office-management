const mongoose = require('mongoose');

const holidaySchema = new mongoose.Schema({
  date: {
    type: Date,
    required: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  nameEnglish: {
    type: String,
    trim: true
  },
  type: {
    type: String,
    enum: ['GAZETTED', 'RESTRICTED'],
    required: true
  },
  year: {
    type: Number,
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

// Index for faster queries
holidaySchema.index({ year: 1, date: 1 });

module.exports = mongoose.model('Holiday', holidaySchema);