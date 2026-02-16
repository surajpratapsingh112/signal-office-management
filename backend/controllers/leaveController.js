const LeaveApplication = require('../models/LeaveApplication');
const LeaveBalance = require('../models/LeaveBalance');
const Employee = require('../models/Employee');

// @desc    Get all leave applications
// @route   GET /api/leaves
// @access  Private
exports.getLeaves = async (req, res) => {
  try {
    const { status, employeeId } = req.query;
    let query = {};

    if (status) query.status = status;
    if (employeeId) query.employee = employeeId;

    const leaves = await LeaveApplication.find(query)
      .populate('employee', 'name pno rank')
      .populate('approvedBy', 'name')
      .sort({ appliedDate: -1 });

    res.status(200).json({
      success: true,
      count: leaves.length,
      data: leaves
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Create leave application
// @route   POST /api/leaves
// @access  Private/Office Admin
exports.createLeave = async (req, res) => {
  try {
    const leave = await LeaveApplication.create(req.body);

    res.status(201).json({
      success: true,
      data: leave
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Approve/Reject leave
// @route   PUT /api/leaves/:id/approve
// @access  Private/Office Admin
exports.approveLeave = async (req, res) => {
  try {
    const { status, rejectionReason } = req.body;
    
    const leave = await LeaveApplication.findById(req.params.id);
    
    if (!leave) {
      return res.status(404).json({
        success: false,
        message: 'Leave application not found'
      });
    }

    leave.status = status;
    leave.approvedBy = req.user._id;
    leave.approvedDate = new Date();
    
    if (status === 'REJECTED') {
      leave.rejectionReason = rejectionReason;
    }

    // If approved, update leave balance
    if (status === 'APPROVED') {
      const currentYear = new Date().getFullYear();
      const balance = await LeaveBalance.findOne({
        employee: leave.employee,
        year: currentYear
      });

      if (balance) {
        switch (leave.leaveType) {
          case 'CL':
            balance.casualLeave.used += leave.totalDays;
            balance.casualLeave.remaining -= leave.totalDays;
            break;
          case 'RL':
            balance.restrictedLeave.used += 1;
            balance.restrictedLeave.remaining -= 1;
            break;
          case 'EL':
            balance.earnedLeave.used += leave.totalDays;
            balance.earnedLeave.remaining -= leave.totalDays;
            break;
        }

        if (leave.isPermission && leave.permissionDates.length > 0) {
          balance.permissions.used += leave.permissionDates.length;
          balance.permissions.remaining -= leave.permissionDates.length;
        }

        await balance.save();
      }
    }

    await leave.save();

    res.status(200).json({
      success: true,
      data: leave
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Get leave balance
// @route   GET /api/leaves/balance/:employeeId
// @access  Private
exports.getLeaveBalance = async (req, res) => {
  try {
    const currentYear = new Date().getFullYear();
    let balance = await LeaveBalance.findOne({
      employee: req.params.employeeId,
      year: currentYear
    });

    // Create if doesn't exist
    if (!balance) {
      balance = await LeaveBalance.create({
        employee: req.params.employeeId,
        year: currentYear
      });
    }

    res.status(200).json({
      success: true,
      data: balance
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};