const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Employee = require('../models/Employee');
const LeaveBalance = require('../models/LeaveBalance');
const Unit = require('../models/Unit');

// Load env vars
dotenv.config();

// Employees data - आपकी 67 employees
const employeesData = [
  { name: 'PINKI KUMARI', pno: '065010017', rank: 'RI', mobile: '8840102749', bloodGroup: 'O+', maritalStatus: 'MARRIED', gender: 'FEMALE', pensionType: 'NPS', pensionNumber: '110093401275' },
  { name: 'VIJAI NARAIN SINGH', pno: '871020549', rank: 'RSI', mobile: '9453507345', bloodGroup: 'B+', maritalStatus: 'MARRIED', gender: 'MALE', pensionType: 'GPF', pensionNumber: 'PU-141824' },
  { name: 'SEWAK RAM DUBEY', pno: '891020255', rank: 'RSI', mobile: '9450287122', bloodGroup: 'B+', maritalStatus: 'MARRIED', gender: 'MALE', pensionType: 'GPF', pensionNumber: 'PU-156040' },
  { name: 'NEERAJ SINGH', pno: '971020423', rank: 'RSI', mobile: '9450364582', bloodGroup: 'B+', maritalStatus: 'MARRIED', gender: 'MALE', pensionType: 'GPF', pensionNumber: 'PU-144994' },
  { name: 'IQBAL AHMAD SIDDIQUI', pno: '971022461', rank: 'RSI', mobile: '7905247568', bloodGroup: 'A+', maritalStatus: 'MARRIED', gender: 'MALE', pensionType: 'GPF', pensionNumber: 'PU-148037' },
  { name: 'RAJESH PANDEY', pno: '971021107', rank: 'RSI', mobile: '9450755756', bloodGroup: 'O+', maritalStatus: 'MARRIED', gender: 'MALE', pensionType: 'GPF', pensionNumber: 'PU-144976' },
  { name: 'MANOJ KUMAR DWIVEDI', pno: '971021790', rank: 'RSI', mobile: '9453847877', bloodGroup: 'A+', maritalStatus: 'MARRIED', gender: 'MALE', pensionType: 'GPF', pensionNumber: 'PU-145606' },
  { name: 'DILEEP KUMAR', pno: '971026753', rank: 'HOM/3879', mobile: '7007210767', bloodGroup: 'O+', maritalStatus: 'MARRIED', gender: 'MALE', pensionType: 'GPF', pensionNumber: 'PU-151323' },
  { name: 'SHIV GOPAL SINGH', pno: '971026809', rank: 'HOM/3883', mobile: '9450134409', bloodGroup: 'B+', maritalStatus: 'MARRIED', gender: 'MALE', pensionType: 'GPF', pensionNumber: 'PU-147847' },
  { name: 'AVINASH SINGH AHLUWALIYA', pno: '111020557', rank: 'HO/4794', mobile: '9415104163', bloodGroup: 'O+', maritalStatus: 'MARRIED', gender: 'MALE', pensionType: 'UPTRON', pensionNumber: 'UPTRON' },
  { name: 'SANTOSH PRAKASH PANDEY', pno: '041020092', rank: 'HO/1249', mobile: '9455585254', bloodGroup: 'A+', maritalStatus: 'MARRIED', gender: 'MALE', pensionType: 'GPF', pensionNumber: 'PU-152086' },
  { name: 'RAM NIWAS', pno: '961020941', rank: 'HO/1554', mobile: '9415548515', bloodGroup: 'B+', maritalStatus: 'MARRIED', gender: 'MALE', pensionType: 'GPF', pensionNumber: 'PU-148812' },
  { name: 'ANAND KUMAR TIWARI', pno: '961021104', rank: 'HO/23', mobile: '9532927769', bloodGroup: 'AB+', maritalStatus: 'MARRIED', gender: 'MALE', pensionType: 'GPF', pensionNumber: 'PU-164695' },
  { name: 'AJAY KUMAR SINGH', pno: '975012262', rank: 'HO/4225', mobile: '7007165541', bloodGroup: 'A+', maritalStatus: 'MARRIED', gender: 'MALE', pensionType: 'GPF', pensionNumber: 'PU-148149' },
  { name: 'RAHUL CHAUDHARY', pno: '061026793', rank: 'HO/5144', mobile: '9580939601', bloodGroup: 'AB+', maritalStatus: 'MARRIED', gender: 'MALE', pensionType: 'NPS', pensionNumber: '110073388027' },
  { name: 'SUBAS RAM PRAJAPATI', pno: '961020550', rank: 'HO/654', mobile: '9450429513', bloodGroup: 'O+', maritalStatus: 'MARRIED', gender: 'MALE', pensionType: 'GPF', pensionNumber: 'PU-147359' },
  { name: 'SHESH MANI TRIPATHI', pno: '961020260', rank: 'HO/876', mobile: '9415910138', bloodGroup: 'A+', maritalStatus: 'MARRIED', gender: 'MALE', pensionType: 'GPF', pensionNumber: 'PU-156045' },
  { name: 'ANIL KUMAR JAISWAR', pno: '961020345', rank: 'HO/990', mobile: '7270874160', bloodGroup: 'B+', maritalStatus: 'MARRIED', gender: 'MALE', pensionType: 'GPF', pensionNumber: 'PU-156030' },
  { name: 'YOGENDRA PRATAP SINGH', pno: '061022137', rank: 'HO/5618', mobile: '8181085591', bloodGroup: 'B+', maritalStatus: 'MARRIED', gender: 'MALE', pensionType: 'NPS', pensionNumber: '110003390955' },
  { name: 'DIVYA BAJPAI', pno: '061026634', rank: 'HO/5118', mobile: '7355216328', bloodGroup: 'A+', maritalStatus: 'MARRIED', gender: 'FEMALE', pensionType: 'NPS', pensionNumber: '111003391449' },
  { name: 'KUSHA MISHRA', pno: '061027826', rank: 'HO/5121', mobile: '6394040393', bloodGroup: 'B+', maritalStatus: 'MARRIED', gender: 'FEMALE', pensionType: 'NPS', pensionNumber: '110083401253' },
  { name: 'KAVITA PANDEY', pno: '061024553', rank: 'HO/5675', mobile: '9554030999', bloodGroup: 'O-', maritalStatus: 'MARRIED', gender: 'FEMALE', pensionType: 'NPS', pensionNumber: '110021998842' },
  { name: 'NAZIA ABBAS ABIDI', pno: '061026676', rank: 'HO/5124', mobile: '7652001819', bloodGroup: 'B+', maritalStatus: 'MARRIED', gender: 'FEMALE', pensionType: 'NPS', pensionNumber: '111003401249' },
  { name: 'NEELAM YADAV', pno: '061027783', rank: 'HO/5125', mobile: '7905668948', bloodGroup: 'O+', maritalStatus: 'MARRIED', gender: 'FEMALE', pensionType: 'NPS', pensionNumber: '110033390928' },
  { name: 'POONAM', pno: '061026777', rank: 'HO/5136', mobile: '8318061159', bloodGroup: 'O+', maritalStatus: 'MARRIED', gender: 'FEMALE', pensionType: 'NPS', pensionNumber: '110073390943' },
  { name: 'NIDHI YADAV', pno: '061026722', rank: 'HO/5130', mobile: '8765582647', bloodGroup: 'B-', maritalStatus: 'MARRIED', gender: 'FEMALE', pensionType: 'NPS', pensionNumber: '111003390933' },
  { name: 'NIDHI SHUKLA', pno: '061026706', rank: 'HO/5128', mobile: '9451833264', bloodGroup: 'AB+', maritalStatus: 'MARRIED', gender: 'FEMALE', pensionType: 'NPS', pensionNumber: '110033390931' },
  { name: 'KIRTIKA SRIVASTAVA', pno: '061027800', rank: 'HO/5161', mobile: '9198078111', bloodGroup: 'O+', maritalStatus: 'MARRIED', gender: 'FEMALE', pensionType: 'NPS', pensionNumber: '110043391469' },
  { name: 'SHABEENA SIDDIQUI', pno: '061026894', rank: 'HO/5167', mobile: '7275782693', bloodGroup: 'O+', maritalStatus: 'MARRIED', gender: 'FEMALE', pensionType: 'NPS', pensionNumber: '110093401373' },
  { name: 'SHAZIA SIDDIQUI', pno: '061026908', rank: 'HO/5168', mobile: '7376083365', bloodGroup: 'A+', maritalStatus: 'MARRIED', gender: 'FEMALE', pensionType: 'NPS', pensionNumber: '110014757600' },
  { name: 'VANDANA PANDEY', pno: '061026865', rank: 'HO/5171', mobile: '7982301232', bloodGroup: 'O+', maritalStatus: 'MARRIED', gender: 'FEMALE', pensionType: 'NPS', pensionNumber: '110062460925' },
  { name: 'KAVITA SHARMA', pno: '061026982', rank: 'HO/5177', mobile: '7905424528', bloodGroup: 'B-', maritalStatus: 'MARRIED', gender: 'FEMALE', pensionType: 'NPS', pensionNumber: '110083391467' },
  { name: 'BABITA SINGH', pno: '061027060', rank: 'HO/5185', mobile: '7985902522', bloodGroup: 'O+', maritalStatus: 'MARRIED', gender: 'FEMALE', pensionType: 'NPS', pensionNumber: '110063391440' },
  { name: 'ANJU DEVRANI', pno: '061027103', rank: 'HO/5189', mobile: '9956619644', bloodGroup: 'A+', maritalStatus: 'MARRIED', gender: 'FEMALE', pensionType: 'NPS', pensionNumber: '110093401261' },
  { name: 'SHIKHA TRIVEDI', pno: '061027158', rank: 'HO/5196', mobile: '8081433960', bloodGroup: 'B+', maritalStatus: 'MARRIED', gender: 'FEMALE', pensionType: 'NPS', pensionNumber: '110083391484' },
  { name: 'VANDANA SINGH', pno: '061027161', rank: 'HO/5198', mobile: '9208406440', bloodGroup: 'O+', maritalStatus: 'MARRIED', gender: 'FEMALE', pensionType: 'NPS', pensionNumber: '110093390925' },
  { name: 'SEEMA YADAV', pno: '061027187', rank: 'HO/5202', mobile: '7007306474', bloodGroup: 'O+', maritalStatus: 'MARRIED', gender: 'FEMALE', pensionType: 'NPS', pensionNumber: '110053401358' },
  { name: 'TAZWER DARAKHSHAN', pno: '061024393', rank: 'HO/5654', mobile: '8765805856', bloodGroup: 'B+', maritalStatus: 'MARRIED', gender: 'FEMALE', pensionType: 'NPS', pensionNumber: '110061998885' },
  { name: 'NAMRATA RAI', pno: '061027709', rank: 'HO/5735', mobile: '9621809030', bloodGroup: 'B+', maritalStatus: 'MARRIED', gender: 'FEMALE', pensionType: 'NPS', pensionNumber: '111003401364' },
  { name: 'KAVITA SINGH', pno: '061027275', rank: 'HO/5231', mobile: '9473901782', bloodGroup: 'O+', maritalStatus: 'MARRIED', gender: 'FEMALE', pensionType: 'NPS', pensionNumber: '110063391468' },
  { name: 'PARVEEN FATIMA', pno: '061027086', rank: 'HO/5187', mobile: '9415285786', bloodGroup: 'O+', maritalStatus: 'MARRIED', gender: 'FEMALE', pensionType: 'NPS', pensionNumber: '110023390940' },
  { name: 'MEENA GAUTAM', pno: '061026663', rank: 'HO/5123', mobile: '7380895530', bloodGroup: 'B+', maritalStatus: 'MARRIED', gender: 'FEMALE', pensionType: 'NPS', pensionNumber: '110013401248' },
  { name: 'NEELAM KUSHWAHA', pno: '061028252', rank: 'HO/6025', mobile: '8604285758', bloodGroup: 'A+', maritalStatus: 'MARRIED', gender: 'FEMALE', pensionType: 'NPS', pensionNumber: '110023401242' },
  { name: 'RITU PANDEY', pno: '061027002', rank: 'HO/5179', mobile: '9452903349', bloodGroup: 'O+', maritalStatus: 'MARRIED', gender: 'FEMALE', pensionType: 'NPS', pensionNumber: '110013401380' },
  { name: 'SEEMA SHARMA', pno: '061026966', rank: 'HO/5175', mobile: '9451096438', bloodGroup: 'A+', maritalStatus: 'MARRIED', gender: 'FEMALE', pensionType: 'NPS', pensionNumber: '111003401381' },
  { name: 'RUPALI SRIVASTAVA', pno: '061026878', rank: 'HO/5163', mobile: '9451533642', bloodGroup: 'A+', maritalStatus: 'MARRIED', gender: 'FEMALE', pensionType: 'NPS', pensionNumber: '110063401383' },
  { name: 'SARLA', pno: '061027855', rank: 'HO/5687', mobile: '8574798042', bloodGroup: 'A+', maritalStatus: 'MARRIED', gender: 'FEMALE', pensionType: 'NPS', pensionNumber: '110053391477' },
  { name: 'KAMLESH KUMAR SHUKLA', pno: '131020087', rank: 'AO/1899', mobile: '9935695249', bloodGroup: 'O+', maritalStatus: 'MARRIED', gender: 'MALE', pensionType: 'NPS', pensionNumber: '110023861615' },
  { name: 'SANGEETA BHARTI', pno: '121020101', rank: 'AO/4701', mobile: '9451724707', bloodGroup: 'A+', maritalStatus: 'WIDOW', gender: 'FEMALE', pensionType: 'NPS', pensionNumber: '110093861617' },
  { name: 'SANGEETA', pno: '061029734', rank: 'AO/5208', mobile: '7651858383', bloodGroup: 'A+', maritalStatus: 'MARRIED', gender: 'FEMALE', pensionType: 'NPS', pensionNumber: '110043401353' },
  { name: 'SEEMA KHAN', pno: '061029167', rank: 'AO/5206', mobile: '9198641297', bloodGroup: 'O+', maritalStatus: 'MARRIED', gender: 'FEMALE', pensionType: 'NPS', pensionNumber: '110023401354' },
  { name: 'KAMLA DEVI', pno: '061029659', rank: 'AO/5207', mobile: '9005070654', bloodGroup: 'O+', maritalStatus: 'MARRIED', gender: 'FEMALE', pensionType: 'NPS', pensionNumber: '110083401298' },
  { name: 'SARITA TRIPATHI', pno: '061028959', rank: 'AO/5209', mobile: '9454318817', bloodGroup: 'B+', maritalStatus: 'MARRIED', gender: 'FEMALE', pensionType: 'GPF', pensionNumber: 'PU-144692' },
  { name: 'SUMAN SINGH', pno: '171020151', rank: 'AO/5598', mobile: '7839146842', bloodGroup: 'B+', maritalStatus: 'WIDOW', gender: 'FEMALE', pensionType: 'NPS', pensionNumber: '111102764318' },
  { name: 'PRATIMA YADAV', pno: '181020200', rank: 'AO/5028', mobile: '7376307098', bloodGroup: 'O+', maritalStatus: 'WIDOW', gender: 'FEMALE', pensionType: 'NPS', pensionNumber: '110182819707' },
  { name: 'UDAI KUMARI', pno: '181020255', rank: 'AO/5135', mobile: '9076816407', bloodGroup: 'B+', maritalStatus: 'MARRIED', gender: 'FEMALE', pensionType: 'NPS', pensionNumber: '110172985153' },
  { name: 'BABITA DEVI', pno: '095010276', rank: 'MESSANGER', mobile: '9450175223', bloodGroup: 'O+', maritalStatus: 'WIDOW', gender: 'FEMALE', pensionType: 'NPS', pensionNumber: '110022445926' },
  { name: 'FAREENA PARVEEN', pno: '031020578', rank: 'MESSANGER', mobile: '8317056066', bloodGroup: 'A+', maritalStatus: 'MARRIED', gender: 'FEMALE', pensionType: 'GPF', pensionNumber: '089/203428' },
  { name: 'VINEETA GIHAR', pno: '071020062', rank: 'MESSANGER', mobile: '9140295597', bloodGroup: 'B+', maritalStatus: 'WIDOW', gender: 'FEMALE', pensionType: 'NPS', pensionNumber: '110013390963' },
  { name: 'KAMLESH KUMARI', pno: '031020666', rank: 'MESSANGER', mobile: '9305958759', bloodGroup: 'O+', maritalStatus: 'MARRIED', gender: 'FEMALE', pensionType: 'GPF', pensionNumber: '089/203433' },
  { name: 'MANJU GUPTA', pno: '181020154', rank: 'MESSANGER', mobile: '9450658404', bloodGroup: 'O+', maritalStatus: 'WIDOW', gender: 'FEMALE', pensionType: 'NPS', pensionNumber: '110152825114' },
  { name: 'MOHD JAMAL', pno: '951022029', rank: 'MESSANGER', mobile: '9450640538', bloodGroup: 'AB+', maritalStatus: 'MARRIED', gender: 'MALE', pensionType: 'GPF', pensionNumber: '089/173431' },
  { name: 'PERMESH KUMAR SHARMA', pno: '911022607', rank: 'MESSANGER', mobile: '8795318828', bloodGroup: 'O+', maritalStatus: 'MARRIED', gender: 'MALE', pensionType: 'GPF', pensionNumber: '089/152134' },
  { name: 'SUBASH CHANDRA TIWARI', pno: '941022039', rank: 'MESSANGER', mobile: '9455279077', bloodGroup: 'O+', maritalStatus: 'MARRIED', gender: 'MALE', pensionType: 'GPF', pensionNumber: '089/161455' },
  { name: 'SUSHIL KUMAR SINGH', pno: '911022391', rank: 'MESSANGER', mobile: '9415657000', bloodGroup: 'B+', maritalStatus: 'MARRIED', gender: 'MALE', pensionType: 'GPF', pensionNumber: '089/152138' },
  { name: 'VIRENDRA KUMAR MISHRA', pno: '911022232', rank: 'MESSANGER', mobile: '9450450677', bloodGroup: 'AB+', maritalStatus: 'MARRIED', gender: 'MALE', pensionType: 'GPF', pensionNumber: '089/161520' },
  { name: 'KRISHNA KUMAR', pno: '061020043', rank: 'MESSANGER', mobile: '7905596167', bloodGroup: 'AB+', maritalStatus: 'MARRIED', gender: 'MALE', pensionType: 'NPS', pensionNumber: '110072445929' }
];

const importEmployees = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Get Signal Office unit (default unit for all employees)
    const signalOffice = await Unit.findOne({ code: 'SIGNAL_OFFICE' });
    
    if (!signalOffice) {
      console.log('❌ Signal Office unit not found! Please run initialize.js first.');
      process.exit(1);
    }

    console.log('\n📦 Importing 67 Employees...\n');

    const currentYear = new Date().getFullYear();
    let successCount = 0;
    let skipCount = 0;

    for (const empData of employeesData) {
      try {
        // Check if employee already exists
        const existing = await Employee.findOne({ pno: empData.pno });
        
        if (existing) {
          console.log(`  ⏭️  Skipped: ${empData.name} (already exists)`);
          skipCount++;
          continue;
        }

        // Create employee
        const employee = await Employee.create({
          ...empData,
          currentUnit: signalOffice._id,
          postingDate: new Date()
        });

        // Create leave balance
        await LeaveBalance.create({
          employee: employee._id,
          year: currentYear
        });

        console.log(`  ✅ Imported: ${empData.name} (${empData.rank})`);
        successCount++;
      } catch (error) {
        console.log(`  ❌ Error importing ${empData.name}: ${error.message}`);
      }
    }

    console.log('\n🎉 =================================');
    console.log('🎉 IMPORT COMPLETED!');
    console.log('🎉 =================================\n');
    console.log(`✅ Successfully Imported: ${successCount}`);
    console.log(`⏭️  Skipped (already exists): ${skipCount}`);
    console.log(`📊 Total in Database: ${successCount + skipCount}\n`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
};

importEmployees();