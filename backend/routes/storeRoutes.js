const express = require('express');
const router = express.Router();
const StoreItem = require('../models/StoreItem');
const { protect, authorize } = require('../middleware/auth');

// @desc    Get all store items
// @route   GET /api/store
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const items = await StoreItem.find({ isActive: true }).sort({ name: 1 });
    res.status(200).json({
      success: true,
      count: items.length,
      data: items
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @desc    Create store item
// @route   POST /api/store
// @access  Private/Office Admin
router.post('/', protect, authorize('office_admin'), async (req, res) => {
  try {
    req.body.availableQuantity = req.body.totalQuantity;
    const item = await StoreItem.create(req.body);
    res.status(201).json({
      success: true,
      data: item
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @desc    Update store item
// @route   PUT /api/store/:id
// @access  Private/Office Admin
router.put('/:id', protect, authorize('office_admin'), async (req, res) => {
  try {
    const item = await StoreItem.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });
    
    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Store item not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: item
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @desc    Delete store item
// @route   DELETE /api/store/:id
// @access  Private/Office Admin
router.delete('/:id', protect, authorize('office_admin'), async (req, res) => {
  try {
    const item = await StoreItem.findById(req.params.id);
    
    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Store item not found'
      });
    }
    
    item.isActive = false;
    await item.save();
    
    res.status(200).json({
      success: true,
      message: 'Store item deleted successfully'
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