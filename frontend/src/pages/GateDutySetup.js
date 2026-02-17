import React, { useState, useEffect } from 'react';
import { gateDutyAPI, employeesAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import Layout from '../components/Layout';

const GateDutySetup = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [employees, setEmployees] = useState([]);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [duties, setDuties] = useState([]);

  const slotKeys = ['MAIN_MORNING', 'MAIN_EVENING', 'SCHOOL_MORNING', 'SCHOOL_EVENING'];
  
  const slotLabels = {
    'MAIN_MORNING': 'Main (06-14)',
    'MAIN_EVENING': 'Main (14-22)',
    'SCHOOL_MORNING': 'School (06-14)',
    'SCHOOL_EVENING': 'School (14-22)'
  };

  useEffect(() => {
    fetchData();
  }, [selectedYear]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      const [employeesRes, setupRes] = await Promise.all([
        employeesAPI.getAll(),
        gateDutyAPI.getSetup(selectedYear).catch(() => ({ data: { data: [] } }))
      ]);

      setEmployees(employeesRes.data.data);
      
      // Initialize duties array (1-31 dates)
      const existingDuties = setupRes.data.data;
      const dutiesArray = [];
      
      for (let date = 1; date <= 31; date++) {
        const existing = existingDuties.find(d => d.date === date);
        
        dutiesArray.push({
          date,
          _id: existing?._id || null,
          slots: {
            MAIN_MORNING: {
              permanentEmployee: existing?.slots?.MAIN_MORNING?.permanentEmployee?._id || ''
            },
            MAIN_EVENING: {
              permanentEmployee: existing?.slots?.MAIN_EVENING?.permanentEmployee?._id || ''
            },
            SCHOOL_MORNING: {
              permanentEmployee: existing?.slots?.SCHOOL_MORNING?.permanentEmployee?._id || ''
            },
            SCHOOL_EVENING: {
              permanentEmployee: existing?.slots?.SCHOOL_EVENING?.permanentEmployee?._id || ''
            }
          }
        });
      }
      
      setDuties(dutiesArray);
      
    } catch (error) {
      console.error('Error fetching data:', error);
      alert('Error loading data');
    } finally {
      setLoading(false);
    }
  };

  const handleSlotChange = (date, slotKey, employeeId) => {
    setDuties(prevDuties =>
      prevDuties.map(duty =>
        duty.date === date
          ? {
              ...duty,
              slots: {
                ...duty.slots,
                [slotKey]: {
                  permanentEmployee: employeeId
                }
              }
            }
          : duty
      )
    );
  };

const handleSave = async () => {
  // Prepare data - convert empty strings to null
  const validDuties = duties.map(duty => {
    // Clean up slots - convert empty strings to null
    const cleanedSlots = {};
    
    ['MAIN_MORNING', 'MAIN_EVENING', 'SCHOOL_MORNING', 'SCHOOL_EVENING'].forEach(slotKey => {
      const employeeId = duty.slots[slotKey]?.permanentEmployee;
      cleanedSlots[slotKey] = {
        permanentEmployee: employeeId && employeeId !== '' ? employeeId : null
      };
    });
    
    return {
      date: duty.date,
      slots: cleanedSlots
    };
  });

  if (!window.confirm(`${selectedYear} के लिए Gate Duty Setup save करें?\n\nयह पूरे साल के लिए permanent setup है।`)) {
    return;
  }

  setSaving(true);

  try {
    await gateDutyAPI.createSetup({
      year: selectedYear,
      duties: validDuties
    });

    alert('Gate Duty Setup successfully saved!');
    fetchData();
    
  } catch (error) {
    console.error('Error saving setup:', error);
    alert('Error: ' + (error.response?.data?.message || 'Failed to save'));
  } finally {
    setSaving(false);
  }
};


  const getAssignedSlotsCount = (duty) => {
    return slotKeys.filter(key => duty.slots[key]?.permanentEmployee).length;
  };

  const years = [];
  const currentYear = new Date().getFullYear();
  for (let i = currentYear - 1; i <= currentYear + 2; i++) {
    years.push(i);
  }

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="p-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-800">Gate Duty Setup</h1>
          <p className="text-gray-600 mt-1">
            पूरे साल के लिए permanent gate duty roster बनाएं
          </p>
        </div>

        {/* Year Selector & Save Button */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <label className="text-sm font-medium text-gray-700">
                Select Year:
              </label>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                {years.map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>

            <button
              onClick={handleSave}
              disabled={saving}
              className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-semibold disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {saving && (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              )}
              💾 Save Setup
            </button>
          </div>
        </div>

        {/* Info Box */}
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-start gap-3">
            <svg className="w-6 h-6 text-blue-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            <div>
              <h3 className="font-semibold text-blue-800">Setup Instructions</h3>
              <ul className="text-sm text-blue-700 mt-1 list-disc list-inside space-y-1">
                <li>प्रत्येक date के लिए 4 slots हैं: Main Gate (Morning/Evening), School Gate (Morning/Evening)</li>
                <li>एक date पर multiple employees assign कर सकते हैं (different slots पर)</li>
                <li>एक employee का एक ही date पर multiple slots में duty हो सकती है</li>
                <li>Empty slots allowed - सभी slots भरना जरूरी नहीं</li>
                <li>यह setup पूरे साल के लिए permanent है</li>
                <li>Monthly replacements बाद में "Gate Duty Roster" page से करें</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Gate Duty Table */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b-2 border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-center text-xs font-bold text-gray-600 uppercase sticky left-0 bg-gray-50 z-10">
                    Date
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase">
                    Main Gate<br/>(0600-1400)
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase">
                    Main Gate<br/>(1400-2200)
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase">
                    School Gate<br/>(0600-1400)
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase">
                    School Gate<br/>(1400-2200)
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-bold text-gray-600 uppercase">
                    Assigned<br/>Slots
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {duties.map((duty) => {
                  const assignedCount = getAssignedSlotsCount(duty);
                  
                  return (
                    <tr key={duty.date} className="hover:bg-gray-50">
                      {/* Date Column - Sticky */}
                      <td className="px-4 py-4 whitespace-nowrap sticky left-0 bg-white z-10">
                        <div className="flex items-center justify-center">
                          <div className={`w-10 h-10 rounded-full font-bold flex items-center justify-center text-sm ${
                            assignedCount > 0 
                              ? 'bg-blue-100 text-blue-800' 
                              : 'bg-gray-100 text-gray-500'
                          }`}>
                            {duty.date}
                          </div>
                        </div>
                      </td>

                      {/* Main Morning Slot */}
                      <td className="px-4 py-3">
                        <select
                          value={duty.slots.MAIN_MORNING?.permanentEmployee || ''}
                          onChange={(e) => handleSlotChange(duty.date, 'MAIN_MORNING', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                        >
                          <option value="">-- None --</option>
                          {employees.map(emp => (
                            <option key={emp._id} value={emp._id}>
                              {emp.name} ({emp.rank})
                            </option>
                          ))}
                        </select>
                      </td>

                      {/* Main Evening Slot */}
                      <td className="px-4 py-3">
                        <select
                          value={duty.slots.MAIN_EVENING?.permanentEmployee || ''}
                          onChange={(e) => handleSlotChange(duty.date, 'MAIN_EVENING', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                        >
                          <option value="">-- None --</option>
                          {employees.map(emp => (
                            <option key={emp._id} value={emp._id}>
                              {emp.name} ({emp.rank})
                            </option>
                          ))}
                        </select>
                      </td>

                      {/* School Morning Slot */}
                      <td className="px-4 py-3">
                        <select
                          value={duty.slots.SCHOOL_MORNING?.permanentEmployee || ''}
                          onChange={(e) => handleSlotChange(duty.date, 'SCHOOL_MORNING', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                        >
                          <option value="">-- None --</option>
                          {employees.map(emp => (
                            <option key={emp._id} value={emp._id}>
                              {emp.name} ({emp.rank})
                            </option>
                          ))}
                        </select>
                      </td>

                      {/* School Evening Slot */}
                      <td className="px-4 py-3">
                        <select
                          value={duty.slots.SCHOOL_EVENING?.permanentEmployee || ''}
                          onChange={(e) => handleSlotChange(duty.date, 'SCHOOL_EVENING', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                        >
                          <option value="">-- None --</option>
                          {employees.map(emp => (
                            <option key={emp._id} value={emp._id}>
                              {emp.name} ({emp.rank})
                            </option>
                          ))}
                        </select>
                      </td>

                      {/* Assigned Count */}
                      <td className="px-4 py-4 text-center">
                        <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold ${
                          assignedCount === 4 ? 'bg-green-100 text-green-800' :
                          assignedCount > 0 ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-500'
                        }`}>
                          {assignedCount}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Summary */}
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <span className="font-semibold text-gray-700">Total Dates:</span>
              <span className="ml-2 text-gray-900">31</span>
            </div>
            <div>
              <span className="font-semibold text-gray-700">Dates with Duties:</span>
              <span className="ml-2 text-gray-900">
                {duties.filter(d => getAssignedSlotsCount(d) > 0).length}
              </span>
            </div>
            <div>
              <span className="font-semibold text-gray-700">Total Slots Assigned:</span>
              <span className="ml-2 text-gray-900">
                {duties.reduce((sum, d) => sum + getAssignedSlotsCount(d), 0)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default GateDutySetup;