const Unit = require('../models/Unit');

// @desc    Get all units
// @route   GET /api/units
// @access  Private
exports.getUnits = async (req, res) => {
  try {
    const units = await Unit.find({ isActive: true })
      .populate('inchargeId', 'name username')
      .sort({ name: 1 });

    res.status(200).json({
      success: true,
      count: units.length,
      data: units
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Get single unit
// @route   GET /api/units/:id
// @access  Private
exports.getUnit = async (req, res) => {
  try {
    const unit = await Unit.findById(req.params.id)
      .populate('inchargeId', 'name username');

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
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Create unit
// @route   POST /api/units
// @access  Private/Office Admin
exports.createUnit = async (req, res) => {
  try {
    const unit = await Unit.create(req.body);

    res.status(201).json({
      success: true,
      data: unit
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Update unit
// @route   PUT /api/units/:id
// @access  Private/Office Admin
exports.updateUnit = async (req, res) => {
  try {
    const unit = await Unit.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

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
      message: 'Server error',
      error: error.message
    });
  }
};