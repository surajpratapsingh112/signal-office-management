const express = require('express');
const router = express.Router();
const Holiday = require('../models/Holiday');
const { protect, authorize } = require('../middleware/auth');

// Get all holidays (with optional year filter)
router.get('/', protect, async (req, res) => {
  try {
    const { year } = req.query;
    const filter = year ? { year: parseInt(year) } : {};
    
    const holidays = await Holiday.find(filter).sort('date');
    
    res.status(200).json({
      success: true,
      count: holidays.length,
      data: holidays
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Get single holiday
router.get('/:id', protect, async (req, res) => {
  try {
    const holiday = await Holiday.findById(req.params.id);
    
    if (!holiday) {
      return res.status(404).json({
        success: false,
        message: 'Holiday not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: holiday
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Create holiday (admin only)
router.post('/', protect, authorize('office_admin'), async (req, res) => {
  try {
    const { date, name, nameEnglish, type, year } = req.body;

    const holiday = await Holiday.create({
      date,
      name,
      nameEnglish,
      type,
      year: year || new Date(date).getFullYear()
    });

    res.status(201).json({
      success: true,
      data: holiday
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Bulk create holidays (admin only)
router.post('/bulk', protect, authorize('office_admin'), async (req, res) => {
  try {
    const { holidays } = req.body;

    if (!Array.isArray(holidays) || holidays.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide an array of holidays'
      });
    }

    const createdHolidays = await Holiday.insertMany(holidays);

    res.status(201).json({
      success: true,
      count: createdHolidays.length,
      data: createdHolidays
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Update holiday (admin only)
router.put('/:id', protect, authorize('office_admin'), async (req, res) => {
  try {
    const { date, name, nameEnglish, type, isActive } = req.body;

    let holiday = await Holiday.findById(req.params.id);
    
    if (!holiday) {
      return res.status(404).json({
        success: false,
        message: 'Holiday not found'
      });
    }

    holiday.date = date || holiday.date;
    holiday.name = name || holiday.name;
    holiday.nameEnglish = nameEnglish || holiday.nameEnglish;
    holiday.type = type || holiday.type;
    holiday.isActive = isActive !== undefined ? isActive : holiday.isActive;
    holiday.year = new Date(holiday.date).getFullYear();

    await holiday.save();

    res.status(200).json({
      success: true,
      data: holiday
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Delete holiday (admin only)
router.delete('/:id', protect, authorize('office_admin'), async (req, res) => {
  try {
    const holiday = await Holiday.findById(req.params.id);
    
    if (!holiday) {
      return res.status(404).json({
        success: false,
        message: 'Holiday not found'
      });
    }

    await holiday.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Holiday deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Get holidays for date range
router.post('/range', protect, async (req, res) => {
  try {
    const { startDate, endDate } = req.body;

    const holidays = await Holiday.find({
      date: {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      },
      isActive: true
    }).sort('date');

    res.status(200).json({
      success: true,
      count: holidays.length,
      data: holidays
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

module.exports = router;