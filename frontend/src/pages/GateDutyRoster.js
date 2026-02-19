import React, { useState, useEffect } from 'react';
import { gateDutyAPI, employeesAPI, outDutyAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import Layout from '../components/Layout';
import ReplacementNotice from '../components/ReplacementNotice';

const GateDutyRoster = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [employees, setEmployees] = useState([]);
  const [outDutyData, setOutDutyData] = useState([]);
  const [roster, setRoster] = useState([]);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [showReplaceModal, setShowReplaceModal] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [showNotice, setShowNotice] = useState(false);
  const [noticeData, setNoticeData] = useState(null);

  const months = [
    { value: 1, label: 'January' },
    { value: 2, label: 'February' },
    { value: 3, label: 'March' },
    { value: 4, label: 'April' },
    { value: 5, label: 'May' },
    { value: 6, label: 'June' },
    { value: 7, label: 'July' },
    { value: 8, label: 'August' },
    { value: 9, label: 'September' },
    { value: 10, label: 'October' },
    { value: 11, label: 'November' },
    { value: 12, label: 'December' }
  ];

  const slotLabels = {
    'MAIN_MORNING': 'Main (06-14)',
    'MAIN_EVENING': 'Main (14-22)',
    'SCHOOL_MORNING': 'School (06-14)',
    'SCHOOL_EVENING': 'School (14-22)'
  };

  useEffect(() => {
    fetchData();
  }, [selectedYear, selectedMonth]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      const [employeesRes, rosterRes, outDutyRes] = await Promise.all([
        employeesAPI.getAll(),
        gateDutyAPI.getMonthlyRoster(selectedYear, selectedMonth),
        outDutyAPI.getAll({ status: 'ONGOING' }).catch(() => ({ data: { data: [] } }))
      ]);

      setEmployees(employeesRes.data.data);
      setRoster(rosterRes.data.data);
      setOutDutyData(outDutyRes.data.data);
      
    } catch (error) {
      console.error('Error fetching data:', error);
      alert('Error loading data');
    } finally {
      setLoading(false);
    }
  };

  const handleReplaceClick = (date, slotKey, slotData) => {
    setSelectedSlot({
      date,
      slotKey,
      permanentEmployee: slotData.permanentEmployee,
      currentReplacement: slotData.replacementDetails
    });
    setShowReplaceModal(true);
  };

  const handleRemoveReplacement = async (date, slotKey) => {
    if (!window.confirm('क्या आप इस replacement को remove करना चाहते हैं?')) {
      return;
    }

    try {
      await gateDutyAPI.removeReplacement(date, selectedMonth, selectedYear, slotKey);
      alert('Replacement removed successfully!');
      fetchData();
    } catch (error) {
      console.error('Error:', error);
      alert('Error: ' + (error.response?.data?.message || 'Failed to remove'));
    }
  };

  const handlePrintNotice = (replacement) => {
    setNoticeData(replacement);
    setShowNotice(true);
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
          <h1 className="text-3xl font-bold text-gray-800">Gate Duty Monthly Roster</h1>
          <p className="text-gray-600 mt-1">
            Monthly replacements और duty status देखें
          </p>
        </div>

        {/* Month & Year Selector */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-6">
          <div className="flex items-center gap-6 flex-wrap">
            <div className="flex items-center gap-3">
              <label className="text-sm font-medium text-gray-700">
                Year:
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

            <div className="flex items-center gap-3">
              <label className="text-sm font-medium text-gray-700">
                Month:
              </label>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                {months.map(month => (
                  <option key={month.value} value={month.value}>{month.label}</option>
                ))}
              </select>
            </div>

            <div className="ml-auto">
              <span className="text-sm text-gray-600">
                Viewing: <strong>{months.find(m => m.value === selectedMonth)?.label} {selectedYear}</strong>
              </span>
            </div>
          </div>
        </div>

        {/* Info Box */}
        <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-start gap-3">
            <svg className="w-6 h-6 text-yellow-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <div>
              <h3 className="font-semibold text-yellow-800">Monthly Replacements</h3>
              <p className="text-sm text-yellow-700 mt-1">
                यह page केवल इस महीने के लिए temporary replacements के लिए है। 
                Permanent changes के लिए "Gate Duty Setup" page use करें।
              </p>
            </div>
          </div>
        </div>

        {/* Roster Table */}
        {roster.length === 0 ? (
          <div className="bg-white rounded-xl shadow-md p-12 text-center">
            <svg className="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="text-lg font-semibold text-gray-700 mb-2">No Gate Duty Setup Found</h3>
            <p className="text-gray-500 mb-4">
              कृपया पहले "Gate Duty Setup" page से {selectedYear} के लिए setup करें।
            </p>
            <button
              onClick={() => window.location.href = '/gate-duty/setup'}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Go to Setup
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-md overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b-2 border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-center text-xs font-bold text-gray-600 uppercase sticky left-0 bg-gray-50 z-10">
                      Date
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase">
                      Slot
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase">
                      Permanent Employee
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase">
                      Status
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase">
                      This Month Duty
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-bold text-gray-600 uppercase">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {roster.map((dateEntry) => {
                    const slotKeys = ['MAIN_MORNING', 'MAIN_EVENING', 'SCHOOL_MORNING', 'SCHOOL_EVENING'];
                    const assignedSlots = slotKeys.filter(key => dateEntry.slots[key]);
                    
                    if (assignedSlots.length === 0) return null;

                    return assignedSlots.map((slotKey, index) => {
                      const slotData = dateEntry.slots[slotKey];
                      const isReplaced = slotData.hasReplacement;
                      const effectiveEmp = slotData.effectiveEmployee;
                      const permanentEmp = slotData.permanentEmployee;

                      return (
                        <tr key={`${dateEntry.date}-${slotKey}`} className="hover:bg-gray-50">
                          {/* Date - only show for first slot of each date */}
                          {index === 0 && (
                            <td 
                              className="px-4 py-4 sticky left-0 bg-white z-10 border-r" 
                              rowSpan={assignedSlots.length}
                            >
                              <div className="flex items-center justify-center">
                                <div className="w-10 h-10 bg-blue-100 text-blue-800 rounded-full font-bold flex items-center justify-center text-sm">
                                  {dateEntry.date}
                                </div>
                              </div>
                            </td>
                          )}

                          {/* Slot */}
                          <td className="px-4 py-4">
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-purple-100 text-purple-800">
                              {slotLabels[slotKey]}
                            </span>
                          </td>

                          {/* Permanent Employee */}
                          <td className="px-4 py-4">
                            <div className="text-sm font-medium text-gray-900">
                              {permanentEmp?.name}
                            </div>
                            <div className="text-xs text-gray-500">
                              {permanentEmp?.rank} - {permanentEmp?.pno}
                            </div>
                          </td>

                          {/* Status */}
                          <td className="px-4 py-4">
                            {isReplaced ? (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-orange-100 text-orange-800">
                                🔄 Replaced
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800">
                                ✓ Active
                              </span>
                            )}
                          </td>

                          {/* This Month Duty */}
                          <td className="px-4 py-4">
                            <div className="text-sm font-medium text-gray-900">
                              {effectiveEmp?.name}
                            </div>
                            <div className="text-xs text-gray-500">
                              {effectiveEmp?.rank} - {effectiveEmp?.pno}
                            </div>
                          </td>

                          {/* Actions */}
                          <td className="px-4 py-4 text-center">
                            <div className="flex items-center justify-center gap-2">
                              <button
                                onClick={() => handleReplaceClick(dateEntry.date, slotKey, slotData)}
                                className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 font-semibold"
                              >
                                {isReplaced ? 'Change' : 'Replace'}
                              </button>
                              
                              {isReplaced && (
                                <>
                                  <button
                                    onClick={() => handleRemoveReplacement(dateEntry.date, slotKey)}
                                    className="px-3 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700 font-semibold"
                                  >
                                    Remove
                                  </button>
                                  <button
                                    onClick={() => handlePrintNotice(slotData.replacementDetails)}
                                    className="px-3 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 font-semibold flex items-center gap-1"
                                  >
                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                                    </svg>
                                    Notice
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    });
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Replacement Modal */}
        {showReplaceModal && selectedSlot && (
          <ReplaceModal
            slot={selectedSlot}
            employees={employees}
            outDutyData={outDutyData}
            month={selectedMonth}
            year={selectedYear}
            onClose={() => {
              setShowReplaceModal(false);
              setSelectedSlot(null);
            }}
            onSuccess={() => {
              setShowReplaceModal(false);
              setSelectedSlot(null);
              fetchData();
            }}
          />
        )}

        {/* Replacement Notice */}
        {showNotice && noticeData && (
          <ReplacementNotice
            replacement={noticeData}
            onClose={() => {
              setShowNotice(false);
              setNoticeData(null);
            }}
          />
        )}
      </div>
    </Layout>
  );
};

// Replacement Modal Component
const ReplaceModal = ({ slot, employees, outDutyData, month, year, onClose, onSuccess }) => {
  const [selectedEmployee, setSelectedEmployee] = useState(
    slot.currentReplacement?.replacementEmployee?._id || ''
  );
  const [reason, setReason] = useState(slot.currentReplacement?.reason || '');
  const [saving, setSaving] = useState(false);
  const [warning, setWarning] = useState('');

  const monthNames = ['', 'January', 'February', 'March', 'April', 'May', 'June', 
                     'July', 'August', 'September', 'October', 'November', 'December'];

  const slotLabels = {
    'MAIN_MORNING': 'Main Gate (06:00-14:00)',
    'MAIN_EVENING': 'Main Gate (14:00-22:00)',
    'SCHOOL_MORNING': 'Training School Gate (06:00-14:00)',
    'SCHOOL_EVENING': 'Training School Gate (14:00-22:00)'
  };

  // Helper functions for out duty
  const isEmployeeOnOutDuty = (employeeId) => {
    return outDutyData.some(d => d.employee._id === employeeId);
  };

  const getEmployeeOutDutyInfo = (employeeId) => {
    return outDutyData.find(d => d.employee._id === employeeId);
  };

  const getDutyTypeLabel = (type) => {
    const labels = {
      'OUT_DUTY': 'आउट ड्यूटी',
      'TRAINING_OUTSIDE_DISTRICT': 'ट्रेनिंग (जनपद से बाहर)',
      'TRAINING_WITHIN_DISTRICT': 'ट्रेनिंग (जनपद में)',
      'TRAINING_HQ': 'विभागीय ट्रेनिंग',
      'DEPUTATION': 'प्रतिनियुक्ति',
      'OFFICIAL_TOUR': 'सरकारी दौरा'
    };
    return labels[type] || type;
  };

  const handleEmployeeChange = async (empId) => {
    setSelectedEmployee(empId);
    setWarning('');

    if (!empId) return;

    try {
      const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(slot.date).padStart(2, '0')}`;
      const response = await gateDutyAPI.checkAvailability(empId, dateStr);
      
      if (!response.data.data.available) {
        setWarning(`⚠️ Warning: ${employees.find(e => e._id === empId)?.name} is ${response.data.data.reason}`);
      }
    } catch (error) {
      console.error('Error checking availability:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!selectedEmployee) {
      alert('कृपया replacement employee select करें!');
      return;
    }

    setSaving(true);

    try {
      await gateDutyAPI.addReplacement({
        date: slot.date,
        year,
        month,
        slot: slot.slotKey,
        replacementEmployee: selectedEmployee,
        reason
      });

      alert('Replacement added successfully!');
      onSuccess();
      
    } catch (error) {
      console.error('Error:', error);
      alert('Error: ' + (error.response?.data?.message || 'Failed to add replacement'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">Add/Change Replacement</h2>
            <button
              onClick={onClose}
              className="text-white hover:bg-blue-500 rounded-full p-2"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Duty Details */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-semibold text-gray-800 mb-3">Duty Details</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Date:</span>
                <span className="ml-2 font-semibold">{slot.date} {monthNames[month]} {year}</span>
              </div>
              <div>
                <span className="text-gray-600">Slot:</span>
                <span className="ml-2 font-semibold">{slotLabels[slot.slotKey]}</span>
              </div>
              <div className="col-span-2">
                <span className="text-gray-600">Permanent Employee:</span>
                <span className="ml-2 font-semibold">
                  {slot.permanentEmployee?.name} ({slot.permanentEmployee?.rank})
                </span>
              </div>
            </div>
          </div>

          {/* Replacement Employee */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Replacement Employee *
            </label>
            <select
              value={selectedEmployee}
              onChange={(e) => handleEmployeeChange(e.target.value)}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">-- Select Employee --</option>
              {employees.map(emp => {
                const onOutDuty = isEmployeeOnOutDuty(emp._id);
                const outDutyInfo = getEmployeeOutDutyInfo(emp._id);
                return (
                  <option 
                    key={emp._id} 
                    value={emp._id}
                    style={onOutDuty ? { color: 'red', fontWeight: 'bold' } : {}}
                  >
                    {emp.name} - {emp.rank} ({emp.pno}) {onOutDuty ? `⚠️ ${getDutyTypeLabel(outDutyInfo.dutyType)}` : ''}
                  </option>
                );
              })}
            </select>

            {warning && (
              <div className="mt-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm text-yellow-800">{warning}</p>
              </div>
            )}
          </div>

          {/* Reason */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Reason (optional)
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              placeholder="e.g., On leave, Training, etc."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Submit Buttons */}
          <div className="flex gap-4 justify-end pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {saving && (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              )}
              Save Replacement
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default GateDutyRoster;