const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Employee = require('../models/Employee');

// Load env vars
dotenv.config();

const updateEmployeeRanks = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const employees = await Employee.find();
    console.log(`\n📦 Processing ${employees.length} employees...\n`);

    let updatedCount = 0;

    for (const employee of employees) {
      const originalRank = employee.rank;
      
      // Check if rank contains '/'
      if (originalRank.includes('/')) {
        const [designation, number] = originalRank.split('/');
        
        employee.rank = designation.trim();
        employee.rankNumber = number.trim();
        
        await employee.save();
        
        console.log(`  ✅ ${employee.name}`);
        console.log(`     ${originalRank} → Rank: ${employee.rank}, Number: ${employee.rankNumber}`);
        updatedCount++;
      } else {
        // No number, just set rank
        employee.rank = originalRank.trim();
        employee.rankNumber = '';
        await employee.save();
        
        console.log(`  ✅ ${employee.name}`);
        console.log(`     Rank: ${employee.rank} (No number)`);
        updatedCount++;
      }
    }

    console.log('\n🎉 =================================');
    console.log('🎉 MIGRATION COMPLETED!');
    console.log('🎉 =================================\n');
    console.log(`✅ Total Employees Updated: ${updatedCount}\n`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
};

updateEmployeeRanks();
