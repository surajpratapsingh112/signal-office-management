const express = require('express');
const router = express.Router();
const OutDuty = require('../models/OutDuty');
const Employee = require('../models/Employee');
const { protect, authorize } = require('../middleware/auth');

// @desc    Add new out duty/training
// @route   POST /api/out-duty
// @access  Private/Admin
router.post('/', protect, authorize('office_admin'), async (req, res) => {
  try {
    const {
      employee,
      dutyType,
      location,
      purpose,
      startDate,
      returnDate,
      orderNumber,
      orderDate,
      remarks
    } = req.body;

    console.log('📝 Creating new out duty entry');

    // Check if employee exists
    const emp = await Employee.findById(employee);
    if (!emp) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
    }

    // Check if employee already has ongoing out duty
    const existingOutDuty = await OutDuty.findOne({
      employee,
      status: 'ONGOING'
    });

    if (existingOutDuty) {
      return res.status(400).json({
        success: false,
        message: `${emp.name} already has ongoing out duty/training`
      });
    }

    // Create out duty entry
    const outDuty = await OutDuty.create({
      employee,
      dutyType,
      location,
      purpose,
      startDate,
      returnDate: returnDate || null,
      orderNumber,
      orderDate,
      remarks,
      createdBy: req.user._id
    });

    await outDuty.populate([
      { path: 'employee', select: 'name pno rank currentUnit' },
      { path: 'createdBy', select: 'name' }
    ]);

    console.log('✅ Out duty created successfully');

    res.status(201).json({
      success: true,
      message: 'Out duty entry created successfully',
      data: outDuty
    });

  } catch (error) {
    console.error('❌ Error creating out duty:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @desc    Get all out duties
// @route   GET /api/out-duty
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const { status, employee, startDate, endDate } = req.query;

    let query = { isActive: true };

    // Filter by status
    if (status) {
      query.status = status;
    }

    // Filter by employee
    if (employee) {
      query.employee = employee;
    }

    // Filter by date range
    if (startDate && endDate) {
      query.startDate = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const outDuties = await OutDuty.find(query)
      .populate('employee', 'name pno rank currentUnit')
      .populate('createdBy', 'name')
      .populate('returnMarkedBy', 'name')
      .sort({ startDate: -1 });

    res.status(200).json({
      success: true,
      count: outDuties.length,
      data: outDuties
    });

  } catch (error) {
    console.error('❌ Error fetching out duties:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @desc    Get single out duty
// @route   GET /api/out-duty/:id
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const outDuty = await OutDuty.findById(req.params.id)
      .populate('employee', 'name pno rank currentUnit')
      .populate('createdBy', 'name')
      .populate('returnMarkedBy', 'name');

    if (!outDuty) {
      return res.status(404).json({
        success: false,
        message: 'Out duty not found'
      });
    }

    res.status(200).json({
      success: true,
      data: outDuty
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @desc    Update out duty
// @route   PUT /api/out-duty/:id
// @access  Private/Admin
router.put('/:id', protect, authorize('office_admin'), async (req, res) => {
  try {
    let outDuty = await OutDuty.findById(req.params.id);

    if (!outDuty) {
      return res.status(404).json({
        success: false,
        message: 'Out duty not found'
      });
    }

    const {
      dutyType,
      location,
      purpose,
      startDate,
      returnDate,
      orderNumber,
      orderDate,
      remarks
    } = req.body;

    // Update fields
    if (dutyType) outDuty.dutyType = dutyType;
    if (location) outDuty.location = location;
    if (purpose !== undefined) outDuty.purpose = purpose;
    if (startDate) outDuty.startDate = startDate;
    if (returnDate !== undefined) outDuty.returnDate = returnDate || null;
    if (orderNumber !== undefined) outDuty.orderNumber = orderNumber;
    if (orderDate !== undefined) outDuty.orderDate = orderDate;
    if (remarks !== undefined) outDuty.remarks = remarks;

    await outDuty.save();

    await outDuty.populate([
      { path: 'employee', select: 'name pno rank currentUnit' },
      { path: 'createdBy', select: 'name' }
    ]);

    res.status(200).json({
      success: true,
      message: 'Out duty updated successfully',
      data: outDuty
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @desc    Mark employee return
// @route   PUT /api/out-duty/:id/return
// @access  Private/Admin
router.put('/:id/return', protect, authorize('office_admin'), async (req, res) => {
  try {
    const { actualReturnDate } = req.body;

    const outDuty = await OutDuty.findById(req.params.id);

    if (!outDuty) {
      return res.status(404).json({
        success: false,
        message: 'Out duty not found'
      });
    }

    if (outDuty.status === 'RETURNED') {
      return res.status(400).json({
        success: false,
        message: 'Employee has already been marked as returned'
      });
    }

    outDuty.status = 'RETURNED';
    outDuty.actualReturnDate = actualReturnDate || new Date();
    outDuty.returnMarkedBy = req.user._id;
    outDuty.returnMarkedAt = new Date();

    await outDuty.save();

    await outDuty.populate([
      { path: 'employee', select: 'name pno rank currentUnit' },
      { path: 'returnMarkedBy', select: 'name' }
    ]);

    res.status(200).json({
      success: true,
      message: 'Employee return marked successfully',
      data: outDuty
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @desc    Cancel out duty
// @route   PUT /api/out-duty/:id/cancel
// @access  Private/Admin
router.put('/:id/cancel', protect, authorize('office_admin'), async (req, res) => {
  try {
    const outDuty = await OutDuty.findById(req.params.id);

    if (!outDuty) {
      return res.status(404).json({
        success: false,
        message: 'Out duty not found'
      });
    }

    outDuty.status = 'CANCELLED';
    await outDuty.save();

    res.status(200).json({
      success: true,
      message: 'Out duty cancelled successfully',
      data: outDuty
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @desc    Delete out duty
// @route   DELETE /api/out-duty/:id
// @access  Private/Admin
router.delete('/:id', protect, authorize('office_admin'), async (req, res) => {
  try {
    const outDuty = await OutDuty.findById(req.params.id);

    if (!outDuty) {
      return res.status(404).json({
        success: false,
        message: 'Out duty not found'
      });
    }

    outDuty.isActive = false;
    await outDuty.save();

    res.status(200).json({
      success: true,
      message: 'Out duty deleted successfully'
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @desc    Check if employee is available on a date
// @route   GET /api/out-duty/check-availability/:employeeId/:date
// @access  Private
router.get('/check-availability/:employeeId/:date', protect, async (req, res) => {
  try {
    const { employeeId, date } = req.params;

    const isOnOutDuty = await OutDuty.isEmployeeOnOutDuty(employeeId, date);

    if (isOnOutDuty) {
      const outDuty = await OutDuty.getCurrentOutDuty(employeeId);
      
      return res.status(200).json({
        success: true,
        available: false,
        reason: `On ${outDuty.dutyType.replace('_', ' ')} at ${outDuty.location}`,
        outDuty
      });
    }

    res.status(200).json({
      success: true,
      available: true
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