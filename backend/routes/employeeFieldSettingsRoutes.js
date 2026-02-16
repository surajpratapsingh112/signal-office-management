const express = require('express');
const router = express.Router();
const EmployeeFieldSettings = require('../models/EmployeeFieldSettings');
const { protect, authorize } = require('../middleware/auth');

// Get all field settings
router.get('/', protect, async (req, res) => {
  try {
    const fields = await EmployeeFieldSettings.find().sort({ order: 1 });
    
    res.status(200).json({
      success: true,
      data: fields
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Get enabled fields only
router.get('/enabled', protect, async (req, res) => {
  try {
    const fields = await EmployeeFieldSettings.find({ enabled: true }).sort({ order: 1 });
    
    res.status(200).json({
      success: true,
      data: fields
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Get single field setting
router.get('/:id', protect, async (req, res) => {
  try {
    const field = await EmployeeFieldSettings.findById(req.params.id);
    
    if (!field) {
      return res.status(404).json({
        success: false,
        message: 'Field setting not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: field
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Create new field setting (Admin only)
router.post('/', protect, authorize('office_admin'), async (req, res) => {
  try {
    const { fieldName, fieldLabel, fieldType, required, enabled, showInTable, options, placeholder, validationPattern } = req.body;

    // Check if field name already exists
    const existingField = await EmployeeFieldSettings.findOne({ fieldName });
    if (existingField) {
      return res.status(400).json({
        success: false,
        message: 'Field with this name already exists'
      });
    }

    // Get the highest order number and add 1
    const maxOrder = await EmployeeFieldSettings.findOne().sort({ order: -1 }).select('order');
    const order = maxOrder ? maxOrder.order + 1 : 1;

    const field = await EmployeeFieldSettings.create({
      fieldName,
      fieldLabel,
      fieldType,
      required: required || false,
      enabled: enabled !== undefined ? enabled : true,
      showInTable: showInTable || false,
      options: options || [],
      order,
      placeholder: placeholder || '',
      validationPattern: validationPattern || ''
    });

    res.status(201).json({
      success: true,
      data: field
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Update field setting (Admin only)
router.put('/:id', protect, authorize('office_admin'), async (req, res) => {
  try {
    const { fieldLabel, fieldType, required, enabled, showInTable, options, order, placeholder, validationPattern } = req.body;

    let field = await EmployeeFieldSettings.findById(req.params.id);

    if (!field) {
      return res.status(404).json({
        success: false,
        message: 'Field setting not found'
      });
    }

    // Update fields
    if (fieldLabel !== undefined) field.fieldLabel = fieldLabel;
    if (fieldType !== undefined) field.fieldType = fieldType;
    if (required !== undefined) field.required = required;
    if (enabled !== undefined) field.enabled = enabled;
    if (showInTable !== undefined) field.showInTable = showInTable;
    if (options !== undefined) field.options = options;
    if (order !== undefined) field.order = order;
    if (placeholder !== undefined) field.placeholder = placeholder;
    if (validationPattern !== undefined) field.validationPattern = validationPattern;

    await field.save();

    res.status(200).json({
      success: true,
      data: field
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Delete field setting (Admin only)
router.delete('/:id', protect, authorize('office_admin'), async (req, res) => {
  try {
    const field = await EmployeeFieldSettings.findById(req.params.id);

    if (!field) {
      return res.status(404).json({
        success: false,
        message: 'Field setting not found'
      });
    }

    await field.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Field setting deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Reorder fields (Admin only)
router.put('/reorder/all', protect, authorize('office_admin'), async (req, res) => {
  try {
    const { fields } = req.body; // Array of { id, order }

    // Update all orders
    const updatePromises = fields.map(field => 
      EmployeeFieldSettings.findByIdAndUpdate(field.id, { order: field.order })
    );

    await Promise.all(updatePromises);

    const updatedFields = await EmployeeFieldSettings.find().sort({ order: 1 });

    res.status(200).json({
      success: true,
      data: updatedFields
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

module.exports = router;