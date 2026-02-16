const express = require('express');
const router = express.Router();
const Unit = require('../models/Unit');
const { protect, authorize } = require('../middleware/auth');

// Get all units
router.get('/', protect, async (req, res) => {
  try {
    const units = await Unit.find().populate('inchargeId', 'username name').sort('name');
    
    res.status(200).json({
      success: true,
      count: units.length,
      data: units
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Get single unit
router.get('/:id', protect, async (req, res) => {
  try {
    const unit = await Unit.findById(req.params.id).populate('inchargeId', 'username name');
    
    if (!unit) {
      return res.status(404).json({
        success: false,
        message: 'Unit not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: unit
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Create unit (admin only)
router.post('/', protect, authorize('office_admin'), async (req, res) => {
  try {
    const { name, code, description, isActive } = req.body;

    // Check if unit with same code exists
    const existingUnit = await Unit.findOne({ code: code.toUpperCase() });
    if (existingUnit) {
      return res.status(400).json({
        success: false,
        message: 'Unit with this code already exists'
      });
    }

    const unit = await Unit.create({
      name,
      code: code.toUpperCase(),
      description,
      isActive
    });

    res.status(201).json({
      success: true,
      data: unit
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Update unit (admin only)
router.put('/:id', protect, authorize('office_admin'), async (req, res) => {
  try {
    const { name, description, isActive } = req.body;

    let unit = await Unit.findById(req.params.id);
    
    if (!unit) {
      return res.status(404).json({
        success: false,
        message: 'Unit not found'
      });
    }

    unit.name = name || unit.name;
    unit.description = description !== undefined ? description : unit.description;
    unit.isActive = isActive !== undefined ? isActive : unit.isActive;

    await unit.save();

    res.status(200).json({
      success: true,
      data: unit
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Delete unit (admin only)
router.delete('/:id', protect, authorize('office_admin'), async (req, res) => {
  try {
    const unit = await Unit.findById(req.params.id);
    
    if (!unit) {
      return res.status(404).json({
        success: false,
        message: 'Unit not found'
      });
    }

    // Check if any employees are assigned to this unit
    const Employee = require('../models/Employee');
    const employeeCount = await Employee.countDocuments({ currentUnit: unit._id });
    
    if (employeeCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete unit. ${employeeCount} employees are currently assigned to this unit.`
      });
    }

    await unit.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Unit deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

module.exports = router;