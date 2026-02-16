const express = require('express');
const router = express.Router();
const LeaveApplication = require('../models/LeaveApplication');
const LeaveBalance = require('../models/LeaveBalance');
const Holiday = require('../models/Holiday');
const Employee = require('../models/Employee');
const { protect, authorize } = require('../middleware/auth');

// Helper function to check if date is Saturday or Sunday
const isWeekend = (date) => {
  const day = new Date(date).getDay();
  return day === 0 || day === 6;
};

// Helper function to check if date is gazetted holiday
const isGazettedHoliday = async (date) => {
  const dateStr = new Date(date).toISOString().split('T')[0];
  const holiday = await Holiday.findOne({
    date: { $gte: new Date(dateStr), $lt: new Date(new Date(dateStr).getTime() + 24*60*60*1000) },
    type: 'GAZETTED',
    isActive: true
  });
  return holiday;
};

// Helper function to check if date is restricted holiday
const isRestrictedHoliday = async (date) => {
  const dateStr = new Date(date).toISOString().split('T')[0];
  const holiday = await Holiday.findOne({
    date: { $gte: new Date(dateStr), $lt: new Date(new Date(dateStr).getTime() + 24*60*60*1000) },
    type: 'RESTRICTED',
    isActive: true
  });
  return holiday;
};

// Get all leave applications
router.get('/', protect, async (req, res) => {
  try {
    const { status, employee, year } = req.query;
    
    let filter = {};
    
    if (status) filter.status = status;
    if (employee) filter.employee = employee;
    if (year) {
      const startOfYear = new Date(`${year}-01-01`);
      const endOfYear = new Date(`${year}-12-31`);
      filter.startDate = { $gte: startOfYear, $lte: endOfYear };
    }

    // Unit incharge can only see their unit's employees
    if (req.user.role === 'unit_incharge') {
      const employees = await Employee.find({ currentUnit: req.user.unit }).select('_id');
      const employeeIds = employees.map(emp => emp._id);
      filter.employee = { $in: employeeIds };
    }
    
    const leaves = await LeaveApplication.find(filter)
      .populate('employee', 'name pno rank rankNumber mobile')
      .populate('createdBy', 'name')
      .sort('-createdAt');
    
    res.status(200).json({
      success: true,
      count: leaves.length,
      data: leaves
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Get single leave application
router.get('/:id', protect, async (req, res) => {
  try {
    const leave = await LeaveApplication.findById(req.params.id)
      .populate('employee', 'name pno rank rankNumber mobile')
      .populate('createdBy', 'name')
      .populate('extensions.extendedBy', 'name')
      .populate('medicalRestHistory.addedBy', 'name')
      .populate('approvedBy', 'name');
    
    if (!leave) {
      return res.status(404).json({
        success: false,
        message: 'Leave application not found'
      });
    }

    // Unit incharge can only view their unit's employees
    if (req.user.role === 'unit_incharge') {
      const employee = await Employee.findById(leave.employee._id);
      if (!employee || employee.currentUnit.toString() !== req.user.unit.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }
    }
    
    res.status(200).json({
      success: true,
      data: leave
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Validate permission dates
router.post('/validate-permissions', protect, async (req, res) => {
  try {
    const { permissionDates } = req.body;
    
    const validationResults = [];
    
    for (const dateStr of permissionDates) {
      const date = new Date(dateStr);
      const isWeekendDay = isWeekend(date);
      const gazettedHoliday = await isGazettedHoliday(date);
      
      const isValid = isWeekendDay || gazettedHoliday;
      
      validationResults.push({
        date: dateStr,
        isValid,
        reason: isWeekendDay 
          ? 'Weekend' 
          : gazettedHoliday 
            ? `Gazetted Holiday: ${gazettedHoliday.name}` 
            : 'Not a valid permission day'
      });
    }
    
    res.status(200).json({
      success: true,
      data: validationResults
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Create leave application (admin only)
router.post('/', protect, authorize('office_admin'), async (req, res) => {
  try {
    const { 
      employee, 
      leaveType, 
      startDate, 
      endDate, 
      permissionDates,
      remarks 
    } = req.body;

    const start = new Date(startDate);
    const end = new Date(endDate);
    const totalDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;

    // Validate permission dates if CL
    if (leaveType === 'CL' && permissionDates && permissionDates.length > 0) {
      for (const dateStr of permissionDates) {
        const date = new Date(dateStr);
        
        if (date < start || date > end) {
          return res.status(400).json({
            success: false,
            message: `Permission date ${dateStr} is outside leave period`
          });
        }
        
        const isWeekendDay = isWeekend(date);
        const gazettedHoliday = await isGazettedHoliday(date);
        
        if (!isWeekendDay && !gazettedHoliday) {
          return res.status(400).json({
            success: false,
            message: `Permission cannot be taken on ${dateStr}. Permission केवल Saturday/Sunday/Gazetted Holiday पर ली जा सकती है।`
          });
        }
      }
    }

    // Validate RL dates
    if (leaveType === 'RL') {
      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        const restrictedHoliday = await isRestrictedHoliday(d);
        if (!restrictedHoliday) {
          return res.status(400).json({
            success: false,
            message: `${d.toISOString().split('T')[0]} is not a Restricted Holiday.`
          });
        }
      }
    }

    let arrivalDate = new Date(end);
    arrivalDate.setDate(arrivalDate.getDate() + 1);

    const permissionsUsed = permissionDates ? permissionDates.length : 0;
    const clDays = leaveType === 'CL' ? totalDays - permissionsUsed : 0;

    const currentYear = new Date().getFullYear();
    let leaveBalance = await LeaveBalance.findOne({ 
      employee, 
      year: currentYear 
    });

    if (!leaveBalance) {
      leaveBalance = await LeaveBalance.create({
        employee,
        year: currentYear
      });
    }

    // Check balance
    if (leaveType === 'CL') {
      if (leaveBalance.casualLeave.remaining < clDays) {
        return res.status(400).json({
          success: false,
          message: `Insufficient CL balance. Required: ${clDays}, Available: ${leaveBalance.casualLeave.remaining}`
        });
      }
      
      if (permissionsUsed > 0 && leaveBalance.permissions.remaining < permissionsUsed) {
        return res.status(400).json({
          success: false,
          message: `Insufficient permissions. Required: ${permissionsUsed}, Available: ${leaveBalance.permissions.remaining}`
        });
      }
    } else if (leaveType === 'RL') {
      if (leaveBalance.restrictedLeave.remaining < totalDays) {
        return res.status(400).json({
          success: false,
          message: `Insufficient RL balance. Required: ${totalDays}, Available: ${leaveBalance.restrictedLeave.remaining}`
        });
      }
    }

    const leave = await LeaveApplication.create({
      employee,
      leaveType,
      startDate,
      endDate,
      totalDays,
      originalStartDate: startDate,
      originalEndDate: endDate,
      originalTotalDays: totalDays,
      workingDays: leaveType === 'CL' ? clDays : totalDays,
      weekendDays: 0,
      holidayDays: 0,
      permissionsUsed,
      permissionDates: permissionDates || [],
      arrivalDate,
      remarks,
      createdBy: req.user._id
    });

    // Update balance
    if (leaveType === 'CL') {
      leaveBalance.casualLeave.used += clDays;
      leaveBalance.casualLeave.remaining -= clDays;
      
      if (permissionsUsed > 0) {
        leaveBalance.permissions.used += permissionsUsed;
        leaveBalance.permissions.remaining -= permissionsUsed;
      }
    } else if (leaveType === 'RL') {
      leaveBalance.restrictedLeave.used += totalDays;
      leaveBalance.restrictedLeave.remaining -= totalDays;
    } else if (leaveType === 'EL') {
      leaveBalance.earnedLeave.used += totalDays;
    } else if (leaveType === 'MEDICAL') {
      leaveBalance.medicalLeave.used += totalDays;
    }

    await leaveBalance.save();

    const populatedLeave = await LeaveApplication.findById(leave._id)
      .populate('employee', 'name pno rank rankNumber mobile')
      .populate('createdBy', 'name');

    res.status(201).json({
      success: true,
      data: populatedLeave
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Update leave application (admin only)
router.put('/:id', protect, authorize('office_admin'), async (req, res) => {
  try {
    const { 
      employee, 
      leaveType, 
      startDate, 
      endDate, 
      permissionDates,
      remarks 
    } = req.body;

    const leave = await LeaveApplication.findById(req.params.id);
    
    if (!leave) {
      return res.status(404).json({
        success: false,
        message: 'Leave application not found'
      });
    }

    if (leave.status !== 'ON_LEAVE') {
      return res.status(400).json({
        success: false,
        message: 'Can only edit active leaves'
      });
    }

    if (leave.medicalRestStartDate) {
      return res.status(400).json({
        success: false,
        message: 'Cannot edit leave after medical rest has been added'
      });
    }

    // Calculate new values
    const start = new Date(startDate);
    const end = new Date(endDate);
    const totalDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
    const permissionsUsed = permissionDates ? permissionDates.length : 0;
    const clDays = leaveType === 'CL' ? totalDays - permissionsUsed : 0;

    let arrivalDate = new Date(end);
    arrivalDate.setDate(arrivalDate.getDate() + 1);

    // Get balance
    const currentYear = new Date().getFullYear();
    const leaveBalance = await LeaveBalance.findOne({ 
      employee: leave.employee, 
      year: currentYear 
    });

    if (!leaveBalance) {
      return res.status(400).json({
        success: false,
        message: 'Leave balance not found'
      });
    }

    // Restore old balance
    if (leave.leaveType === 'CL') {
      leaveBalance.casualLeave.used -= leave.workingDays;
      leaveBalance.casualLeave.remaining += leave.workingDays;
      
      if (leave.permissionsUsed > 0) {
        leaveBalance.permissions.used -= leave.permissionsUsed;
        leaveBalance.permissions.remaining += leave.permissionsUsed;
      }
    }

    // Check new balance
    if (leaveType === 'CL') {
      if (leaveBalance.casualLeave.remaining < clDays) {
        return res.status(400).json({
          success: false,
          message: `Insufficient CL balance. Required: ${clDays}, Available: ${leaveBalance.casualLeave.remaining}`
        });
      }
      
      if (permissionsUsed > 0 && leaveBalance.permissions.remaining < permissionsUsed) {
        return res.status(400).json({
          success: false,
          message: `Insufficient permissions. Required: ${permissionsUsed}, Available: ${leaveBalance.permissions.remaining}`
        });
      }
    }

    // Update leave
    leave.employee = employee || leave.employee;
    leave.leaveType = leaveType || leave.leaveType;
    leave.startDate = startDate || leave.startDate;
    leave.endDate = endDate || leave.endDate;
    leave.totalDays = totalDays;
    leave.workingDays = clDays;
    leave.permissionsUsed = permissionsUsed;
    leave.permissionDates = permissionDates || [];
    leave.arrivalDate = arrivalDate;
    leave.remarks = remarks !== undefined ? remarks : leave.remarks;

    await leave.save();

    // Apply new balance
    if (leaveType === 'CL') {
      leaveBalance.casualLeave.used += clDays;
      leaveBalance.casualLeave.remaining -= clDays;
      
      if (permissionsUsed > 0) {
        leaveBalance.permissions.used += permissionsUsed;
        leaveBalance.permissions.remaining -= permissionsUsed;
      }
    }

    await leaveBalance.save();

    const populatedLeave = await LeaveApplication.findById(leave._id)
      .populate('employee', 'name pno rank rankNumber mobile')
      .populate('createdBy', 'name');

    res.status(200).json({
      success: true,
      data: populatedLeave
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Extend CL (admin only)
router.put('/:id/extend', protect, authorize('office_admin'), async (req, res) => {
  try {
    const { extendedDays, reason } = req.body;
    
    const leave = await LeaveApplication.findById(req.params.id);
    
    if (!leave) {
      return res.status(404).json({
        success: false,
        message: 'Leave application not found'
      });
    }

    if (leave.leaveType !== 'CL') {
      return res.status(400).json({
        success: false,
        message: 'Only CL can be extended'
      });
    }

    if (leave.medicalRestStartDate) {
      return res.status(400).json({
        success: false,
        message: 'Cannot extend CL after medical rest has started'
      });
    }

    if (leave.status !== 'ON_LEAVE') {
      return res.status(400).json({
        success: false,
        message: 'Can only extend active leaves'
      });
    }

    // Check CL balance
    const currentYear = new Date().getFullYear();
    const leaveBalance = await LeaveBalance.findOne({ 
      employee: leave.employee, 
      year: currentYear 
    });

    if (!leaveBalance || leaveBalance.casualLeave.remaining < extendedDays) {
      return res.status(400).json({
        success: false,
        message: `Insufficient CL balance. Required: ${extendedDays}, Available: ${leaveBalance?.casualLeave.remaining || 0}`
      });
    }

    // Calculate new end date
    const newEndDate = new Date(leave.endDate);
    newEndDate.setDate(newEndDate.getDate() + extendedDays);

    // Calculate new arrival date
    const newArrivalDate = new Date(newEndDate);
    newArrivalDate.setDate(newArrivalDate.getDate() + 1);

    // Add extension record
    leave.extensions.push({
      extendedDays,
      newEndDate,
      reason,
      extendedBy: req.user._id
    });

    // Update leave
    leave.endDate = newEndDate;
    leave.totalDays += extendedDays;
    leave.workingDays += extendedDays;
    leave.arrivalDate = newArrivalDate;

    await leave.save();

    // Update balance
    leaveBalance.casualLeave.used += extendedDays;
    leaveBalance.casualLeave.remaining -= extendedDays;
    await leaveBalance.save();

    const populatedLeave = await LeaveApplication.findById(leave._id)
      .populate('employee', 'name pno rank rankNumber mobile')
      .populate('extensions.extendedBy', 'name');

    res.status(200).json({
      success: true,
      data: populatedLeave
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Add Medical Rest (admin only)
router.put('/:id/add-medical', protect, authorize('office_admin'), async (req, res) => {
  try {
    const { medicalDays, reason } = req.body;
    
    const leave = await LeaveApplication.findById(req.params.id);
    
    if (!leave) {
      return res.status(404).json({
        success: false,
        message: 'Leave application not found'
      });
    }

    if (leave.leaveType !== 'CL') {
      return res.status(400).json({
        success: false,
        message: 'Medical rest can only be added to CL'
      });
    }

    if (leave.medicalRestStartDate) {
      return res.status(400).json({
        success: false,
        message: 'Medical rest already added. Use extend medical instead.'
      });
    }

    if (leave.status !== 'ON_LEAVE') {
      return res.status(400).json({
        success: false,
        message: 'Can only add medical rest to active leaves'
      });
    }

    // Calculate CL days availed
    const today = new Date();
    const startDate = new Date(leave.startDate);
    const clDaysAvailed = Math.ceil((today - startDate) / (1000 * 60 * 60 * 24)) + 1;
    const clDaysCancelled = leave.totalDays - clDaysAvailed;

    // Medical rest starts from tomorrow
    const medicalStartDate = new Date(today);
    medicalStartDate.setDate(medicalStartDate.getDate() + 1);

    const medicalEndDate = new Date(medicalStartDate);
    medicalEndDate.setDate(medicalEndDate.getDate() + medicalDays - 1);

    // New arrival date
    const newArrivalDate = new Date(medicalEndDate);
    newArrivalDate.setDate(newArrivalDate.getDate() + 1);

    // Update leave
    leave.medicalRestStartDate = medicalStartDate;
    leave.medicalRestEndDate = medicalEndDate;
    leave.medicalRestDays = medicalDays;
    leave.medicalRestReason = reason;
    leave.clDaysAvailed = clDaysAvailed;
    leave.clDaysCancelled = clDaysCancelled;
    leave.medicalApprovalStatus = 'PENDING';
    leave.arrivalDate = newArrivalDate;
    
    // Add to history
    leave.medicalRestHistory.push({
      days: medicalDays,
      reason,
      addedBy: req.user._id
    });

    await leave.save();

    const populatedLeave = await LeaveApplication.findById(leave._id)
      .populate('employee', 'name pno rank rankNumber mobile')
      .populate('medicalRestHistory.addedBy', 'name');

    res.status(200).json({
      success: true,
      data: populatedLeave
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Extend Medical Rest (admin only)
router.put('/:id/extend-medical', protect, authorize('office_admin'), async (req, res) => {
  try {
    const { additionalDays, reason } = req.body;
    
    const leave = await LeaveApplication.findById(req.params.id);
    
    if (!leave) {
      return res.status(404).json({
        success: false,
        message: 'Leave application not found'
      });
    }

    if (!leave.medicalRestStartDate) {
      return res.status(400).json({
        success: false,
        message: 'No medical rest to extend'
      });
    }

    if (leave.status !== 'ON_LEAVE') {
      return res.status(400).json({
        success: false,
        message: 'Can only extend medical rest for active leaves'
      });
    }

    // Extend medical end date
    const newMedicalEndDate = new Date(leave.medicalRestEndDate);
    newMedicalEndDate.setDate(newMedicalEndDate.getDate() + additionalDays);

    // New arrival date
    const newArrivalDate = new Date(newMedicalEndDate);
    newArrivalDate.setDate(newArrivalDate.getDate() + 1);

    // Update leave
    leave.medicalRestEndDate = newMedicalEndDate;
    leave.medicalRestDays += additionalDays;
    leave.arrivalDate = newArrivalDate;
    
    // Add to history
    leave.medicalRestHistory.push({
      days: additionalDays,
      reason: `Extension: ${reason}`,
      addedBy: req.user._id
    });

    await leave.save();

    const populatedLeave = await LeaveApplication.findById(leave._id)
      .populate('employee', 'name pno rank rankNumber mobile')
      .populate('medicalRestHistory.addedBy', 'name');

    res.status(200).json({
      success: true,
      data: populatedLeave
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Approve Medical (CRK - admin only)
router.put('/:id/approve-medical', protect, authorize('office_admin'), async (req, res) => {
  try {
    const { convertTo, remarks } = req.body;
    
    const leave = await LeaveApplication.findById(req.params.id);
    
    if (!leave) {
      return res.status(404).json({
        success: false,
        message: 'Leave application not found'
      });
    }

    if (leave.medicalApprovalStatus !== 'PENDING') {
      return res.status(400).json({
        success: false,
        message: 'Medical rest approval is not pending'
      });
    }

    if (leave.status !== 'RETURNED') {
      return res.status(400).json({
        success: false,
        message: 'Employee must be returned before medical approval'
      });
    }

    // Get balance
    const currentYear = new Date().getFullYear();
    const leaveBalance = await LeaveBalance.findOne({ 
      employee: leave.employee, 
      year: currentYear 
    });

    if (!leaveBalance) {
      return res.status(400).json({
        success: false,
        message: 'Leave balance not found'
      });
    }

    // Cancel remaining CL days
    if (leave.clDaysCancelled > 0) {
      leaveBalance.casualLeave.used -= leave.clDaysCancelled;
      leaveBalance.casualLeave.remaining += leave.clDaysCancelled;
      
      // Update working days
      leave.workingDays -= leave.clDaysCancelled;
    }

    // Add medical days to appropriate leave type
    if (convertTo === 'EL') {
      leaveBalance.earnedLeave.used += leave.medicalRestDays;
      leave.medicalApprovalStatus = 'APPROVED_AS_EL';
    } else if (convertTo === 'MEDICAL') {
      leaveBalance.medicalLeave.used += leave.medicalRestDays;
      leave.medicalApprovalStatus = 'APPROVED_AS_MEDICAL';
    }

    leave.convertedLeaveType = convertTo;
    leave.approvedBy = req.user._id;
    leave.approvedAt = new Date();
    leave.approvalRemarks = remarks;

    await leaveBalance.save();
    await leave.save();

    const populatedLeave = await LeaveApplication.findById(leave._id)
      .populate('employee', 'name pno rank rankNumber mobile')
      .populate('approvedBy', 'name');

    res.status(200).json({
      success: true,
      data: populatedLeave
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Mark employee as returned (admin only)
router.put('/:id/return', protect, authorize('office_admin'), async (req, res) => {
  try {
    const leave = await LeaveApplication.findById(req.params.id);
    
    if (!leave) {
      return res.status(404).json({
        success: false,
        message: 'Leave application not found'
      });
    }

    if (leave.status === 'RETURNED') {
      return res.status(400).json({
        success: false,
        message: 'Employee already marked as returned'
      });
    }

    leave.status = 'RETURNED';
    await leave.save();

    res.status(200).json({
      success: true,
      data: leave
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Get leave balance for employee
router.get('/balance/:employeeId', protect, async (req, res) => {
  try {
    const { year } = req.query;
    const currentYear = year || new Date().getFullYear();
    
    let leaveBalance = await LeaveBalance.findOne({
      employee: req.params.employeeId,
      year: currentYear
    });

    if (!leaveBalance) {
      leaveBalance = await LeaveBalance.create({
        employee: req.params.employeeId,
        year: currentYear
      });
    }

    res.status(200).json({
      success: true,
      data: leaveBalance
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Get arrivals (today, tomorrow, upcoming)
router.get('/arrivals/upcoming', protect, async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const nextWeek = new Date(today);
    nextWeek.setDate(nextWeek.getDate() + 7);

    let filter = { status: 'ON_LEAVE' };

    // Unit incharge can only see their unit's employees
    if (req.user.role === 'unit_incharge') {
      const employees = await Employee.find({ currentUnit: req.user.unit }).select('_id');
      const employeeIds = employees.map(emp => emp._id);
      filter.employee = { $in: employeeIds };
    }

    const todayArrivals = await LeaveApplication.find({
      ...filter,
      arrivalDate: {
        $gte: today,
        $lt: tomorrow
      }
    }).populate('employee', 'name pno rank rankNumber mobile');

    const tomorrowArrivals = await LeaveApplication.find({
      ...filter,
      arrivalDate: {
        $gte: tomorrow,
        $lt: new Date(tomorrow.getTime() + 24 * 60 * 60 * 1000)
      }
    }).populate('employee', 'name pno rank rankNumber mobile');

    const upcomingArrivals = await LeaveApplication.find({
      ...filter,
      arrivalDate: {
        $gte: new Date(tomorrow.getTime() + 24 * 60 * 60 * 1000),
        $lte: nextWeek
      }
    }).populate('employee', 'name pno rank rankNumber mobile').sort('arrivalDate');

    res.status(200).json({
      success: true,
      data: {
        today: todayArrivals,
        tomorrow: tomorrowArrivals,
        upcoming: upcomingArrivals
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Get currently on leave employees
router.get('/status/on-leave', protect, async (req, res) => {
  try {
    const today = new Date();
    
    let filter = {
      status: 'ON_LEAVE',
      startDate: { $lte: today },
      endDate: { $gte: today }
    };

    // Unit incharge can only see their unit's employees
    if (req.user.role === 'unit_incharge') {
      const employees = await Employee.find({ currentUnit: req.user.unit }).select('_id');
      const employeeIds = employees.map(emp => emp._id);
      filter.employee = { $in: employeeIds };
    }
    
    const onLeave = await LeaveApplication.find(filter)
      .populate('employee', 'name pno rank rankNumber mobile currentUnit')
      .populate({
        path: 'employee',
        populate: {
          path: 'currentUnit',
          select: 'name code'
        }
      })
      .sort('arrivalDate');

    res.status(200).json({
      success: true,
      count: onLeave.length,
      data: onLeave
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Get leaves pending CRK approval (admin only)
router.get('/approval/pending', protect, authorize('office_admin'), async (req, res) => {
  try {
    const pendingApprovals = await LeaveApplication.find({
      medicalApprovalStatus: 'PENDING',
      status: 'RETURNED'
    }).populate('employee', 'name pno rank rankNumber mobile currentUnit')
      .populate({
        path: 'employee',
        populate: {
          path: 'currentUnit',
          select: 'name code'
        }
      })
      .sort('createdAt');

    res.status(200).json({
      success: true,
      count: pendingApprovals.length,
      data: pendingApprovals
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Delete leave application (admin only)
// Get currently on leave
router.get('/status/on-leave', protect, async (req, res) => {
  try {
    let query = { status: 'ON_LEAVE' };

    // Unit incharge filter - FIXED
    if (req.user.role === 'unit_incharge' && req.user.assignedUnit) {
      const employees = await Employee.find({ currentUnit: req.user.assignedUnit });
      const employeeIds = employees.map(emp => emp._id);
      query.employee = { $in: employeeIds };
    }

    const leaves = await LeaveApplication.find(query)
      .populate({
        path: 'employee',
        select: 'name pno rank currentUnit',
        populate: {
          path: 'currentUnit',
          select: 'name'
        }
      })
      .sort({ arrivalDate: 1 });

    res.status(200).json({
      success: true,
      count: leaves.length,
      data: leaves
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

module.exports = router;