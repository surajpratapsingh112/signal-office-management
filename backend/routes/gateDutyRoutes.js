const express = require('express');
const router = express.Router();

// Import models with error handling
let GateDuty, GateDutyReplacement, Employee, LeaveApplication;

try {
  GateDuty = require('../models/GateDuty');
  console.log('✅ GateDuty model loaded');
} catch (error) {
  console.error('❌ Error loading GateDuty model:', error.message);
}

try {
  GateDutyReplacement = require('../models/GateDutyReplacement');
  console.log('✅ GateDutyReplacement model loaded');
} catch (error) {
  console.error('❌ Error loading GateDutyReplacement model:', error.message);
}

try {
  Employee = require('../models/Employee');
  console.log('✅ Employee model loaded');
} catch (error) {
  console.error('❌ Error loading Employee model:', error.message);
}

try {
  LeaveApplication = require('../models/LeaveApplication');
  console.log('✅ LeaveApplication model loaded');
} catch (error) {
  console.error('❌ Error loading LeaveApplication model:', error.message);
}

const { protect, authorize } = require('../middleware/auth');

// @desc    Create or update yearly gate duty setup (for all 31 dates)
// @route   POST /api/gate-duty/setup
// @access  Private/Admin
router.post('/setup', protect, authorize('office_admin'), async (req, res) => {
  try {
    console.log('\n📥 ========== GATE DUTY SETUP REQUEST ==========');
    console.log('User:', req.user.name);
    console.log('Request received at:', new Date().toISOString());
    console.log('Request body keys:', Object.keys(req.body));
    
    const { year, duties } = req.body;
    
    console.log('Year:', year);
    console.log('Number of duties:', duties?.length);
    
    if (!duties || duties.length === 0) {
      console.log('❌ No duties provided');
      return res.status(400).json({
        success: false,
        message: 'Duties array is required'
      });
    }
    
    const savedDuties = [];
    const errors = [];
    
    for (let i = 0; i < duties.length; i++) {
      const dutyData = duties[i];
      const { date, slots } = dutyData;
      
      console.log(`\n--- Processing Date ${date} ---`);
      console.log('Slots:', JSON.stringify(slots, null, 2));
      
      if (!date || !slots) {
        console.log(`⚠️ Skipping - missing data`);
        continue;
      }
      
      try {
        // Check if duty already exists
        let existingDuty = await GateDuty.findOne({ date, year });
        
        if (existingDuty) {
          console.log(`✏️ Updating existing duty`);
          existingDuty.slots = slots;
          existingDuty.updatedBy = req.user._id;
          await existingDuty.save();
          savedDuties.push(existingDuty);
        } else {
          console.log(`➕ Creating new duty`);
          const newDuty = await GateDuty.create({
            date,
            year,
            slots,
            createdBy: req.user._id
          });
          savedDuties.push(newDuty);
        }
        
        console.log(`✅ Success`);
        
      } catch (dutyError) {
        console.error(`❌ Error for date ${date}:`, dutyError.message);
        console.error('Stack:', dutyError.stack);
        errors.push({
          date,
          error: dutyError.message
        });
      }
    }
    
    console.log(`\n========== SUMMARY ==========`);
    console.log(`✅ Saved: ${savedDuties.length}`);
    console.log(`❌ Errors: ${errors.length}`);
    
    if (errors.length > 0) {
      console.log('Error details:', errors);
    }
    
    res.status(200).json({
      success: true,
      message: 'Gate duty setup saved successfully',
      count: savedDuties.length,
      data: savedDuties,
      errors: errors.length > 0 ? errors : undefined
    });
    
  } catch (error) {
    console.error('\n❌ ========== FATAL ERROR ==========');
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    console.error('======================================\n');
    
    res.status(500).json({
      success: false,
      message: 'Server error: ' + error.message,
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// @desc    Update single date slot
// @route   PUT /api/gate-duty/setup/:id/slot
// @access  Private/Admin
router.put('/setup/:id/slot', protect, authorize('office_admin'), async (req, res) => {
  try {
    const { slot, employeeId } = req.body;
    
    const duty = await GateDuty.findById(req.params.id);
    
    if (!duty) {
      return res.status(404).json({
        success: false,
        message: 'Gate duty not found'
      });
    }
    
    // Validate slot
    if (!['MAIN_MORNING', 'MAIN_EVENING', 'SCHOOL_MORNING', 'SCHOOL_EVENING'].includes(slot)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid slot'
      });
    }
    
    // Update slot
    if (!duty.slots) {
      duty.slots = {};
    }
    
    duty.slots[slot] = {
      permanentEmployee: employeeId || null
    };
    
    duty.updatedBy = req.user._id;
    duty.markModified('slots');
    await duty.save();
    
    await duty.populate('slots.MAIN_MORNING.permanentEmployee slots.MAIN_EVENING.permanentEmployee slots.SCHOOL_MORNING.permanentEmployee slots.SCHOOL_EVENING.permanentEmployee');
    
    res.status(200).json({
      success: true,
      message: 'Slot updated successfully',
      data: duty
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @desc    Get yearly gate duty setup
// @route   GET /api/gate-duty/setup/:year
// @access  Private
router.get('/setup/:year', protect, async (req, res) => {
  try {
    const { year } = req.params;
    
    console.log(`📋 Fetching gate duty setup for year ${year}`);
    
    const duties = await GateDuty.find({ year, isActive: true })
      .populate('slots.MAIN_MORNING.permanentEmployee', 'name pno rank currentUnit')
      .populate('slots.MAIN_EVENING.permanentEmployee', 'name pno rank currentUnit')
      .populate('slots.SCHOOL_MORNING.permanentEmployee', 'name pno rank currentUnit')
      .populate('slots.SCHOOL_EVENING.permanentEmployee', 'name pno rank currentUnit')
      .populate('createdBy', 'name')
      .populate('updatedBy', 'name')
      .sort({ date: 1 });
    
    console.log(`✅ Found ${duties.length} gate duty entries`);
    
    res.status(200).json({
      success: true,
      count: duties.length,
      data: duties
    });
    
  } catch (error) {
    console.error('❌ Error fetching setup:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @desc    Add monthly replacement for a specific date and slot
// @route   POST /api/gate-duty/replacement
// @access  Private/Admin
router.post('/replacement', protect, authorize('office_admin'), async (req, res) => {
  try {
    const { date, year, month, slot, replacementEmployee, reason } = req.body;
    
    console.log(`📝 Adding replacement for date ${date}, slot ${slot}`);
    
    // Find the gate duty for this date
    const duty = await GateDuty.findOne({ date, year, isActive: true })
      .populate(`slots.${slot}.permanentEmployee`, 'name pno rank');
    
    if (!duty) {
      return res.status(404).json({
        success: false,
        message: 'Gate duty not found for this date'
      });
    }
    
    // Check if slot has a permanent employee
    if (!duty.slots[slot] || !duty.slots[slot].permanentEmployee) {
      return res.status(400).json({
        success: false,
        message: 'No permanent employee assigned to this slot'
      });
    }
    
    const permanentEmployee = duty.slots[slot].permanentEmployee;
    
    // Check if replacement employee exists
    const employee = await Employee.findById(replacementEmployee);
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Replacement employee not found'
      });
    }
    
    // Check if replacement employee is available on this date
    const checkDate = new Date(year, month - 1, date);
    const startOfDay = new Date(checkDate.setHours(0, 0, 0, 0));
    const endOfDay = new Date(checkDate.setHours(23, 59, 59, 999));
    
    const onLeave = await LeaveApplication.findOne({
      employee: replacementEmployee,
      status: 'ON_LEAVE',
      startDate: { $lte: endOfDay },
      endDate: { $gte: startOfDay }
    });
    
    if (onLeave) {
      return res.status(400).json({
        success: false,
        message: `${employee.name} is on leave on this date`,
        warning: true
      });
    }
    
    // Check if replacement already exists
    let replacement = await GateDutyReplacement.findOne({
      date,
      month,
      year,
      slot
    });
    
    if (replacement) {
      // Update existing replacement
      replacement.replacementEmployee = replacementEmployee;
      replacement.reason = reason || '';
      replacement.replacedBy = req.user._id;
      replacement.replacedAt = new Date();
      await replacement.save();
    } else {
      // Create new replacement
      replacement = await GateDutyReplacement.create({
        gateDuty: duty._id,
        date,
        month,
        year,
        slot,
        permanentEmployee: permanentEmployee._id,
        replacementEmployee,
        reason: reason || '',
        replacedBy: req.user._id
      });
    }
    
    // Populate with nested currentUnit
    await replacement.populate([
      {
        path: 'permanentEmployee',
        select: 'name pno rank currentUnit',
        populate: {
          path: 'currentUnit',
          select: 'name'
        }
      },
      {
        path: 'replacementEmployee',
        select: 'name pno rank currentUnit',
        populate: {
          path: 'currentUnit',
          select: 'name'
        }
      }
    ]);
    
    console.log('✅ Replacement added successfully');
    
    res.status(200).json({
      success: true,
      message: 'Replacement added successfully',
      data: replacement
    });
    
  } catch (error) {
    console.error('❌ Error adding replacement:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @desc    Remove monthly replacement
// @route   DELETE /api/gate-duty/replacement/:date/:month/:year/:slot
// @access  Private/Admin
router.delete('/replacement/:date/:month/:year/:slot', protect, authorize('office_admin'), async (req, res) => {
  try {
    const { date, month, year, slot } = req.params;
    
    const replacement = await GateDutyReplacement.findOneAndDelete({
      date: parseInt(date),
      month: parseInt(month),
      year: parseInt(year),
      slot
    });
    
    if (!replacement) {
      return res.status(404).json({
        success: false,
        message: 'Replacement not found'
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'Replacement removed successfully'
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @desc    Get monthly gate duty roster with replacements
// @route   GET /api/gate-duty/roster/:year/:month
// @access  Private
router.get('/roster/:year/:month', protect, async (req, res) => {
  try {
    const { year, month } = req.params;
    
    console.log(`📋 Fetching roster for ${month}/${year}`);
    
    // Get all gate duties for this year
    const duties = await GateDuty.find({ year, isActive: true })
      .populate('slots.MAIN_MORNING.permanentEmployee', 'name pno rank currentUnit')
      .populate('slots.MAIN_EVENING.permanentEmployee', 'name pno rank currentUnit')
      .populate('slots.SCHOOL_MORNING.permanentEmployee', 'name pno rank currentUnit')
      .populate('slots.SCHOOL_EVENING.permanentEmployee', 'name pno rank currentUnit')
      .sort({ date: 1 });
    
    // Get all replacements for this month with nested populate
    const replacements = await GateDutyReplacement.find({
      year: parseInt(year),
      month: parseInt(month)
    })
    .populate({
      path: 'permanentEmployee',
      select: 'name pno rank currentUnit',
      populate: {
        path: 'currentUnit',
        select: 'name'
      }
    })
    .populate({
      path: 'replacementEmployee',
      select: 'name pno rank currentUnit',
      populate: {
        path: 'currentUnit',
        select: 'name'
      }
    });
    
    // Build roster with effective employees
    const roster = [];
    
    for (const duty of duties) {
      const dateRoster = {
        _id: duty._id,
        date: duty.date,
        slots: {}
      };
      
      const slotKeys = ['MAIN_MORNING', 'MAIN_EVENING', 'SCHOOL_MORNING', 'SCHOOL_EVENING'];
      
      for (const slotKey of slotKeys) {
        const slot = duty.slots[slotKey];
        const permanentEmployee = slot?.permanentEmployee;
        
        if (permanentEmployee) {
          // Check if there's a replacement for this slot
          const replacement = replacements.find(r => 
            r.date === duty.date && r.slot === slotKey
          );
          
          dateRoster.slots[slotKey] = {
            permanentEmployee,
            effectiveEmployee: replacement ? replacement.replacementEmployee : permanentEmployee,
            hasReplacement: !!replacement,
            replacementDetails: replacement || null,
            slotInfo: GateDuty.getSlotDetails(slotKey)
          };
        } else {
          dateRoster.slots[slotKey] = null;
        }
      }
      
      roster.push(dateRoster);
    }
    
    console.log(`✅ Roster generated with ${roster.length} dates`);
    
    res.status(200).json({
      success: true,
      count: roster.length,
      data: roster
    });
    
  } catch (error) {
    console.error('❌ Error fetching roster:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @desc    Get gate duty report for a date range
// @route   GET /api/gate-duty/report
// @access  Private
router.get('/report', protect, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'Start date and end date are required'
      });
    }
    
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    const reportData = [];
    
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const date = d.getDate();
      const month = d.getMonth() + 1;
      const year = d.getFullYear();
      
      // Get gate duty for this date
      const duty = await GateDuty.findOne({ date, year })
        .populate('slots.MAIN_MORNING.permanentEmployee slots.MAIN_EVENING.permanentEmployee slots.SCHOOL_MORNING.permanentEmployee slots.SCHOOL_EVENING.permanentEmployee');
      
      if (!duty) continue;
      
      // Get replacements for this date
      const replacements = await GateDutyReplacement.find({ date, month, year })
        .populate('replacementEmployee', 'name pno rank currentUnit');
      
      const dateEntry = {
        fullDate: new Date(d),
        date,
        month,
        year,
        slots: {}
      };
      
      const slotKeys = ['MAIN_MORNING', 'MAIN_EVENING', 'SCHOOL_MORNING', 'SCHOOL_EVENING'];
      
      slotKeys.forEach(slotKey => {
        const slot = duty.slots[slotKey];
        if (slot?.permanentEmployee) {
          const replacement = replacements.find(r => r.slot === slotKey);
          
          dateEntry.slots[slotKey] = {
            permanentEmployee: slot.permanentEmployee,
            effectiveEmployee: replacement ? replacement.replacementEmployee : slot.permanentEmployee,
            hasReplacement: !!replacement,
            slotInfo: GateDuty.getSlotDetails(slotKey)
          };
        }
      });
      
      reportData.push(dateEntry);
    }
    
    res.status(200).json({
      success: true,
      count: reportData.length,
      data: reportData
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @desc    Check employee availability for gate duty on a specific date
// @route   GET /api/gate-duty/check-availability/:employeeId/:date
// @access  Private
router.get('/check-availability/:employeeId/:date', protect, async (req, res) => {
  try {
    const { employeeId, date } = req.params;
    
    const checkDate = new Date(date);
    const startOfDay = new Date(checkDate.setHours(0, 0, 0, 0));
    const endOfDay = new Date(checkDate.setHours(23, 59, 59, 999));
    
    // Check if employee is on leave
    const onLeave = await LeaveApplication.findOne({
      employee: employeeId,
      status: 'ON_LEAVE',
      startDate: { $lte: endOfDay },
      endDate: { $gte: startOfDay }
    });
    
    const availability = {
      available: !onLeave,
      reason: onLeave ? `On ${onLeave.leaveType} leave` : null,
      details: onLeave || null
    };
    
    res.status(200).json({
      success: true,
      data: availability
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