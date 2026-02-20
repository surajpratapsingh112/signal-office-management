const express = require('express');
const router = express.Router();
const YearlyMessage = require('../models/YearlyMessage');
const MonthlyMessage = require('../models/MonthlyMessage');
const { protect, checkTFCAccess, tfcInchargeOnly } = require('../middleware/auth');
const multer = require('multer');
const XLSX = require('xlsx');

// Multer configuration for Excel upload
const upload = multer({ 
  storage: multer.memoryStorage(),
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
        file.mimetype === 'application/vnd.ms-excel') {
      cb(null, true);
    } else {
      cb(new Error('Only Excel files are allowed'), false);
    }
  }
});

// ============================================
// YEARLY MESSAGES (2021-2024 Historical)
// ============================================

// Import historical yearly data from Excel
router.post('/yearly/import', protect, tfcInchargeOnly, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    const workbook = XLSX.read(req.file.buffer);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });

    const records = [];
    let currentYear = null;
    
    // Parse Excel data (skip headers, process data rows)
    for (let i = 2; i < data.length; i++) {
      const row = data[i];
      
      if (!row || row.length === 0 || !row[0]) continue;
      if (row[0] === 'TOTAL' || row[0] === 'GRAND TOTAL') continue;
      
      if (row[0] && !isNaN(row[0]) && row[1]) {
        const yearString = row[1].toString();
        const yearMatch = yearString.match(/(\d{4})/);
        if (yearMatch) {
          currentYear = parseInt(yearMatch[1]);
          console.log('Found year:', currentYear);
        }
      }
      
      const station = row[2];
      if (currentYear && station && ['HF', 'PRM', 'POLNET', 'DCR'].includes(station)) {
        console.log('Adding record:', currentYear, station);
        records.push({
          year: currentYear,
          station: station,
          messagesIn: parseInt(row[3]) || 0,
          messagesOut: parseInt(row[4]) || 0,
          messagesTotal: parseInt(row[5]) || 0,
          groupsIn: parseInt(row[6]) || 0,
          groupsOut: parseInt(row[7]) || 0,
          groupsTotal: parseInt(row[8]) || 0,
          source: 'EXCEL_IMPORT',
          createdBy: req.user._id
        });
      }
    }

    console.log('Total records parsed:', records.length);

    if (records.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No valid data found in Excel file'
      });
    }

    // Delete existing records
    await YearlyMessage.deleteMany({});

    // Delete existing records
    await YearlyMessage.deleteMany({});

    // Insert new records
    const result = await YearlyMessage.insertMany(records);

    res.status(200).json({
      success: true,
      message: `Successfully imported ${result.length} records`,
      data: result
    });

  } catch (error) {
    console.error('Import error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Get all yearly messages
router.get('/yearly', protect, checkTFCAccess, async (req, res) => {
  try {
    const messages = await YearlyMessage.find().sort({ year: 1, station: 1 });
    
    res.status(200).json({
      success: true,
      count: messages.length,
      data: messages
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// ============================================
// MONTHLY MESSAGES (2025+ Zone-wise)
// ============================================

// Create monthly message entry
router.post('/monthly', protect, tfcInchargeOnly, async (req, res) => {
  try {
    const messageData = {
      ...req.body,
      createdBy: req.user._id
    };

    const message = await MonthlyMessage.create(messageData);

    res.status(201).json({
      success: true,
      data: message
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Entry already exists for this year, month, and zone'
      });
    }
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Get all monthly messages with filters
router.get('/monthly', protect, checkTFCAccess, async (req, res) => {
  try {
    const { year, month, zone } = req.query;
    
    const filter = {};
    if (year) filter.year = parseInt(year);
    if (month) filter.month = parseInt(month);
    if (zone) filter.zone = zone;

    const messages = await MonthlyMessage.find(filter)
      .populate('createdBy', 'name')
      .sort({ year: -1, month: -1, zone: 1 });

    res.status(200).json({
      success: true,
      count: messages.length,
      data: messages
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Get single monthly message
router.get('/monthly/:id', protect, checkTFCAccess, async (req, res) => {
  try {
    const message = await MonthlyMessage.findById(req.params.id)
      .populate('createdBy', 'name');

    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Record not found'
      });
    }

    res.status(200).json({
      success: true,
      data: message
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Update monthly message
router.put('/monthly/:id', protect, tfcInchargeOnly, async (req, res) => {
  try {
    const message = await MonthlyMessage.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Record not found'
      });
    }

    res.status(200).json({
      success: true,
      data: message
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Delete monthly message
router.delete('/monthly/:id', protect, tfcInchargeOnly, async (req, res) => {
  try {
    const message = await MonthlyMessage.findByIdAndDelete(req.params.id);

    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Record not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Record deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// ============================================
// REPORTS
// ============================================

// Yearly summary report (2021-2025)
router.get('/reports/yearly-summary', protect, checkTFCAccess, async (req, res) => {
  try {
    // Get historical data (2021-2024)
    const historicalData = await YearlyMessage.aggregate([
      {
        $group: {
          _id: '$year',
          totalMessagesIn: { $sum: '$messagesIn' },
          totalMessagesOut: { $sum: '$messagesOut' },
          totalMessages: { $sum: '$messagesTotal' },
          totalGroupsIn: { $sum: '$groupsIn' },
          totalGroupsOut: { $sum: '$groupsOut' },
          totalGroups: { $sum: '$groupsTotal' }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Get 2025+ data from monthly records
    const currentData = await MonthlyMessage.aggregate([
      {
        $group: {
          _id: '$year',
          totalMessagesIn: { 
            $sum: { 
              $add: ['$cwInMessages', '$polnetInMessages', '$prmInMessages', '$vhfRgInMessages', '$vhfEventsInMessages'] 
            }
          },
          totalMessagesOut: { 
            $sum: { 
              $add: ['$cwOutMessages', '$polnetOutMessages', '$prmOutMessages', '$vhfRgOutMessages', '$vhfEventsOutMessages'] 
            }
          },
          totalGroupsIn: { 
            $sum: { 
              $add: ['$cwInGroups', '$polnetInGroups', '$prmInGroups', '$vhfRgInGroups', '$vhfEventsInGroups'] 
            }
          },
          totalGroupsOut: { 
            $sum: { 
              $add: ['$cwOutGroups', '$polnetOutGroups', '$prmOutGroups', '$vhfRgOutGroups', '$vhfEventsOutGroups'] 
            }
          }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    res.status(200).json({
      success: true,
      data: {
        historical: historicalData,
        current: currentData
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Monthly zone-wise report
router.get('/reports/monthly-zone', protect, checkTFCAccess, async (req, res) => {
  try {
    const { year, month } = req.query;

    if (!year || !month) {
      return res.status(400).json({
        success: false,
        message: 'Year and month are required'
      });
    }

    const data = await MonthlyMessage.find({
      year: parseInt(year),
      month: parseInt(month)
    }).sort({ zone: 1 });

    res.status(200).json({
      success: true,
      count: data.length,
      data
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

module.exports = router;