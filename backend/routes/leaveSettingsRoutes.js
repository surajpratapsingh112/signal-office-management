const express = require('express');
const router = express.Router();
const LeaveSettings = require('../models/LeaveSettings');
const { protect, authorize } = require('../middleware/auth');

// Get leave settings for current year or specified year
router.get('/', protect, async (req, res) => {
  try {
    const year = req.query.year || new Date().getFullYear();
    
    let settings = await LeaveSettings.findOne({ year: parseInt(year) });
    
    if (!settings) {
      // Create default settings if not exists
      settings = await LeaveSettings.create({
        year: parseInt(year),
        casualLeave: 30,
        permissions: 5,
        restrictedLeave: 2
      });
    }
    
    res.status(200).json({
      success: true,
      data: settings
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Get leave settings for specific year
router.get('/:year', protect, async (req, res) => {
  try {
    const year = parseInt(req.params.year);
    
    let settings = await LeaveSettings.findOne({ year });
    
    if (!settings) {
      // Create default settings if not exists
      settings = await LeaveSettings.create({
        year,
        casualLeave: 30,
        permissions: 5,
        restrictedLeave: 2
      });
    }
    
    res.status(200).json({
      success: true,
      data: settings
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Update leave settings (admin only)
router.put('/:year', protect, authorize('office_admin'), async (req, res) => {
  try {
    const { casualLeave, permissions, restrictedLeave } = req.body;
    const year = parseInt(req.params.year);
    
    let settings = await LeaveSettings.findOne({ year });
    
    if (!settings) {
      settings = await LeaveSettings.create({
        year,
        casualLeave,
        permissions,
        restrictedLeave
      });
    } else {
      settings.casualLeave = casualLeave !== undefined ? casualLeave : settings.casualLeave;
      settings.permissions = permissions !== undefined ? permissions : settings.permissions;
      settings.restrictedLeave = restrictedLeave !== undefined ? restrictedLeave : settings.restrictedLeave;
      
      await settings.save();
    }
    
    res.status(200).json({
      success: true,
      data: settings
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

module.exports = router;