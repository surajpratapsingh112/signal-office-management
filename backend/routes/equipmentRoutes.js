const express = require('express');
const router = express.Router();
const EquipmentAllocation = require('../models/EquipmentAllocation');
const StoreItem = require('../models/StoreItem');
const { protect, authorize } = require('../middleware/auth');

// @desc    Get all equipment allocations
// @route   GET /api/equipment
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const { unitId } = req.query;
    let query = {};
    
    // If unit_incharge, only show their unit's equipment
    if (req.user.role === 'unit_incharge') {
      query.unit = req.user.unitId;
    } else if (unitId) {
      query.unit = unitId;
    }
    
    const allocations = await EquipmentAllocation.find(query)
      .populate('item', 'name category unit')
      .populate('unit', 'name code')
      .populate('updatedBy', 'name')
      .sort({ lastUpdated: -1 });
    
    res.status(200).json({
      success: true,
      count: allocations.length,
      data: allocations
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @desc    Create or update equipment allocation
// @route   POST /api/equipment
// @access  Private
router.post('/', protect, async (req, res) => {
  try {
    const { item, unit, quantity, remarks } = req.body;
    
    // Check if user has permission
    if (req.user.role === 'unit_incharge' && req.user.unitId.toString() !== unit) {
      return res.status(403).json({
        success: false,
        message: 'You can only update your own unit equipment'
      });
    }
    
    // Check if allocation already exists
    let allocation = await EquipmentAllocation.findOne({ item, unit });
    
    if (allocation) {
      // Update existing
      const oldQuantity = allocation.quantity;
      allocation.quantity = quantity;
      allocation.remarks = remarks;
      allocation.updatedBy = req.user._id;
      await allocation.save();
      
      // Update store item available quantity
      const storeItem = await StoreItem.findById(item);
      if (storeItem) {
        storeItem.availableQuantity += (oldQuantity - quantity);
        await storeItem.save();
      }
    } else {
      // Create new
      allocation = await EquipmentAllocation.create({
        item,
        unit,
        quantity,
        remarks,
        updatedBy: req.user._id
      });
      
      // Update store item available quantity
      const storeItem = await StoreItem.findById(item);
      if (storeItem) {
        storeItem.availableQuantity -= quantity;
        await storeItem.save();
      }
    }
    
    await allocation.populate('item unit updatedBy');
    
    res.status(201).json({
      success: true,
      data: allocation
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @desc    Update equipment allocation
// @route   PUT /api/equipment/:id
// @access  Private
router.put('/:id', protect, async (req, res) => {
  try {
    let allocation = await EquipmentAllocation.findById(req.params.id);
    
    if (!allocation) {
      return res.status(404).json({
        success: false,
        message: 'Equipment allocation not found'
      });
    }
    
    // Check permission
    if (req.user.role === 'unit_incharge' && 
        req.user.unitId.toString() !== allocation.unit.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You can only update your own unit equipment'
      });
    }
    
    const oldQuantity = allocation.quantity;
    allocation.quantity = req.body.quantity;
    allocation.remarks = req.body.remarks;
    allocation.updatedBy = req.user._id;
    await allocation.save();
    
    // Update store item
    const storeItem = await StoreItem.findById(allocation.item);
    if (storeItem) {
      storeItem.availableQuantity += (oldQuantity - req.body.quantity);
      await storeItem.save();
    }
    
    await allocation.populate('item unit updatedBy');
    
    res.status(200).json({
      success: true,
      data: allocation
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

module.exports = router;