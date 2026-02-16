const express = require('express');
const router = express.Router();
const Requisition = require('../models/Requisition');
const { protect, authorize } = require('../middleware/auth');

// @desc    Get all requisitions
// @route   GET /api/requisitions
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    let query = {};
    
    // If unit_incharge, only show their requisitions
    if (req.user.role === 'unit_incharge') {
      query.unit = req.user.unitId;
    }
    
    const requisitions = await Requisition.find(query)
      .populate('unit', 'name code')
      .populate('requestedBy', 'name')
      .populate('approvedBy', 'name')
      .sort({ requestDate: -1 });
    
    res.status(200).json({
      success: true,
      count: requisitions.length,
      data: requisitions
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @desc    Create requisition
// @route   POST /api/requisitions
// @access  Private/Unit Incharge
router.post('/', protect, authorize('unit_incharge'), async (req, res) => {
  try {
    const requisition = await Requisition.create({
      ...req.body,
      unit: req.user.unitId,
      requestedBy: req.user._id
    });
    
    await requisition.populate('unit requestedBy');
    
    res.status(201).json({
      success: true,
      data: requisition
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @desc    Update requisition status
// @route   PUT /api/requisitions/:id
// @access  Private/Office Admin
router.put('/:id', protect, authorize('office_admin'), async (req, res) => {
  try {
    const { status, rejectionReason } = req.body;
    
    const requisition = await Requisition.findById(req.params.id);
    
    if (!requisition) {
      return res.status(404).json({
        success: false,
        message: 'Requisition not found'
      });
    }
    
    requisition.status = status;
    
    if (status === 'APPROVED') {
      requisition.approvedBy = req.user._id;
      requisition.approvedDate = new Date();
    } else if (status === 'REJECTED') {
      requisition.rejectionReason = rejectionReason;
    } else if (status === 'FULFILLED') {
      requisition.fulfilledDate = new Date();
    }
    
    await requisition.save();
    await requisition.populate('unit requestedBy approvedBy');
    
    res.status(200).json({
      success: true,
      data: requisition
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