const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('../models/User');
const Unit = require('../models/Unit');

// Load env vars
dotenv.config();

// Units data - आपकी 9 sub-units
const unitsData = [
  { name: 'सिग्नल कार्यालय', code: 'SIGNAL_OFFICE' },
  { name: 'पुलिस रेडियो मेंल', code: 'POLICE_RADIO_MAIL' },
  { name: 'पोलनेट', code: 'POLNET' },
  { name: 'एसएसआई बेंच', code: 'SSI_BENCH' },
  { name: 'एचएफ केंद्र', code: 'HF_CENTER' },
  { name: 'टीएक्स रूम', code: 'TX_ROOM' },
  { name: 'साईफर केंद्र', code: 'CIPHER_CENTER' },
  { name: 'टीएफसी केंद्र', code: 'TFC_CENTER' },
  { name: 'सिग्नल स्टोर', code: 'SIGNAL_STORE' }
];

const initializeDatabase = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Check if data already exists
    const existingUsers = await User.countDocuments();
    const existingUnits = await Unit.countDocuments();

    if (existingUsers > 0 || existingUnits > 0) {
      console.log('⚠️  Data already exists!');
      console.log(`Users: ${existingUsers}, Units: ${existingUnits}`);
      console.log('Delete existing data first if you want to reinitialize.');
      process.exit(0);
    }

    console.log('\n📦 Creating Units...');
    
    // Create Units
    const createdUnits = [];
    for (const unitData of unitsData) {
      const unit = await Unit.create(unitData);
      createdUnits.push(unit);
      console.log(`  ✅ Created: ${unit.name} (${unit.code})`);
    }

    console.log('\n👤 Creating Office Admin User...');
    
    // Create Office Admin
    const adminUser = await User.create({
      username: 'admin',
      password: 'admin123',
      role: 'office_admin',
      name: 'Office Administrator'
    });
    console.log(`  ✅ Admin created: ${adminUser.username}`);

    console.log('\n👥 Creating Unit Incharge Users...');
    
    // Create Unit Incharge for each unit
    const unitIncharges = [];
    for (let i = 0; i < createdUnits.length; i++) {
      const unit = createdUnits[i];
      const username = `unit_${String.fromCharCode(97 + i)}`; // unit_a, unit_b, etc.
      
      const incharge = await User.create({
        username: username,
        password: 'password123',
        role: 'unit_incharge',
        name: `${unit.name} प्रभारी`,
        unitId: unit._id
      });
      
      // Update unit with incharge
      unit.inchargeId = incharge._id;
      await unit.save();
      
      unitIncharges.push(incharge);
      console.log(`  ✅ Created: ${username} for ${unit.name}`);
    }

    console.log('\n\n🎉 =================================');
    console.log('🎉 INITIALIZATION SUCCESSFUL!');
    console.log('🎉 =================================\n');

    console.log('📋 LOGIN CREDENTIALS:\n');
    console.log('Office Admin:');
    console.log('  Username: admin');
    console.log('  Password: admin123\n');
    
    console.log('Unit Incharges:');
    unitIncharges.forEach((incharge, index) => {
      console.log(`  ${incharge.username} / password123 - ${createdUnits[index].name}`);
    });

    console.log('\n✅ Total Users Created:', existingUsers + unitIncharges.length + 1);
    console.log('✅ Total Units Created:', createdUnits.length);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
};

initializeDatabase();