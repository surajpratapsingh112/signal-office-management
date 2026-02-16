const Employee = require('../models/Employee');
const LeaveBalance = require('../models/LeaveBalance');

// @desc    Get all employees
// @route   GET /api/employees
// @access  Private
exports.getEmployees = async (req, res) => {
  try {
    const { unitId, search } = req.query;
    let query = { isActive: true };

    // Filter by unit if user is unit_incharge
    if (req.user.role === 'unit_incharge') {
      query.currentUnit = req.user.unitId;
    } else if (unitId) {
      query.currentUnit = unitId;
    }

    // Search functionality
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { pno: { $regex: search, $options: 'i' } },
        { rank: { $regex: search, $options: 'i' } }
      ];
    }

    const employees = await Employee.find(query)
      .populate('currentUnit', 'name code')
      .sort({ name: 1 });

    res.status(200).json({
      success: true,
      count: employees.length,
      data: employees
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Get single employee
// @route   GET /api/employees/:id
// @access  Private
exports.getEmployee = async (req, res) => {
  try {
    const employee = await Employee.findById(req.params.id)
      .populate('currentUnit')
      .populate('postingHistory.unit');

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
    }

    res.status(200).json({
      success: true,
      data: employee
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Create employee
// @route   POST /api/employees
// @access  Private/Office Admin
exports.createEmployee = async (req, res) => {
  try {
    const employee = await Employee.create(req.body);

    // Create leave balance for current year
    const currentYear = new Date().getFullYear();
    const leaveBalance = await LeaveBalance.create({
      employee: employee._id,
      year: currentYear
    });

    res.status(201).json({
      success: true,
      data: employee
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Update employee
// @route   PUT /api/employees/:id
// @access  Private/Office Admin
exports.updateEmployee = async (req, res) => {
  try {
    let employee = await Employee.findById(req.params.id);

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
    }

    // If unit is changing, update posting history
    if (req.body.currentUnit && req.body.currentUnit !== employee.currentUnit.toString()) {
      employee.postingHistory.push({
        unit: employee.currentUnit,
        startDate: employee.postingDate,
        endDate: new Date()
      });
      employee.postingDate = new Date();
    }

    employee = await Employee.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    }).populate('currentUnit');

    res.status(200).json({
      success: true,
      data: employee
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Delete employee
// @route   DELETE /api/employees/:id
// @access  Private/Office Admin
exports.deleteEmployee = async (req, res) => {
  try {
    const employee = await Employee.findById(req.params.id);

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
    }

    // Soft delete
    employee.isActive = false;
    await employee.save();

    res.status(200).json({
      success: true,
      message: 'Employee deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};