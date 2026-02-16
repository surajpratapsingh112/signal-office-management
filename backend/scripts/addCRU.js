const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Unit = require('../models/Unit');

// Load env vars
dotenv.config();

const addCRU = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Check if CRU already exists
    const existingCRU = await Unit.findOne({ code: 'CRU' });
    
    if (existingCRU) {
      console.log('⚠️  CRU unit already exists!');
      process.exit(0);
    }

    // Add CRU unit
    const cru = await Unit.create({
      name: 'सीआरयू',
      code: 'CRU',
      description: 'Central Receiving Unit'
    });

    console.log('\n✅ CRU unit successfully added!');
    console.log(`   Name: ${cru.name}`);
    console.log(`   Code: ${cru.code}\n`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
};

addCRU();