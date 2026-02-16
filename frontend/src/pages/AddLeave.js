import React, { useState, useEffect } from 'react';
import { leavesAPI, employeesAPI, holidaysAPI } from '../services/api';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';

const AddLeave = () => {
  const navigate = useNavigate();
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    employee: '',
    leaveType: '',
    startDate: '',
    endDate: '',
    permissionDates: [],
    remarks: ''
  });
  const [leaveCalculation, setLeaveCalculation] = useState({
    totalDays: 0,
    allDates: [],
    gazettedHolidays: [],
    restrictedHolidays: []
  });
  const [balance, setBalance] = useState(null);

  useEffect(() => {
    fetchEmployees();
  }, []);

  useEffect(() => {
    if (formData.employee) {
      fetchBalance();
    }
  }, [formData.employee]);

  useEffect(() => {
    if (formData.startDate && formData.endDate) {
      calculateLeaveDays();
    }
  }, [formData.startDate, formData.endDate]);

  const fetchEmployees = async () => {
    try {
      const response = await employeesAPI.getAll();
      setEmployees(response.data.data);
    } catch (error) {
      console.error('Error fetching employees:', error);
    }
  };

  const fetchBalance = async () => {
    try {
      const response = await leavesAPI.getBalance(formData.employee);
      setBalance(response.data.data);
    } catch (error) {
      console.error('Error fetching balance:', error);
    }
  };

  const isWeekend = (date) => {
    const day = date.getDay();
    return day === 0 || day === 6; // Sunday or Saturday
  };

  const calculateLeaveDays = async () => {
    try {
      const start = new Date(formData.startDate);
      const end = new Date(formData.endDate);

      if (start > end) {
        alert('End date must be after start date');
        return;
      }

      // Fetch holidays in range
      const holidaysRes = await holidaysAPI.getRange(formData.startDate, formData.endDate);
      const holidaysInRange = holidaysRes.data.data;

      const gazettedHolidays = holidaysInRange.filter(h => h.type === 'GAZETTED');
      const restrictedHolidays = holidaysInRange.filter(h => h.type === 'RESTRICTED');

      // Calculate total days (ALL days are working in police)
      const totalDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;

      // Get all dates in range
      const allDates = [];
      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        const dateObj = new Date(d);
        const dateStr = dateObj.toISOString().split('T')[0];
        
        // Check if this date is a gazetted holiday
        const gazettedHoliday = gazettedHolidays.find(h => 
          new Date(h.date).toISOString().split('T')[0] === dateStr
        );

        // Check if this date is a restricted holiday
        const restrictedHoliday = restrictedHolidays.find(h => 
          new Date(h.date).toISOString().split('T')[0] === dateStr
        );

        allDates.push({
          date: new Date(dateObj),
          dateStr,
          isWeekend: isWeekend(dateObj),
          gazettedHoliday: gazettedHoliday || null,
          restrictedHoliday: restrictedHoliday || null,
          canTakePermission: isWeekend(dateObj) || gazettedHoliday
        });
      }

      setLeaveCalculation({
        totalDays,
        allDates,
        gazettedHolidays,
        restrictedHolidays
      });
    } catch (error) {
      console.error('Error calculating leave:', error);
    }
  };

  const handlePermissionToggle = (dateStr) => {
    setFormData(prev => ({
      ...prev,
      permissionDates: prev.permissionDates.includes(dateStr)
        ? prev.permissionDates.filter(d => d !== dateStr)
        : [...prev.permissionDates, dateStr]
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Calculate CL days (total - permissions)
    const clDays = formData.leaveType === 'CL' 
      ? leaveCalculation.totalDays - formData.permissionDates.length 
      : leaveCalculation.totalDays;

    // Validation
    if (formData.leaveType === 'CL') {
      if (balance && balance.casualLeave.remaining < clDays) {
        alert(`अपर्याप्त CL balance!\nRequired: ${clDays} days\nAvailable: ${balance.casualLeave.remaining} days`);
        return;
      }

      if (formData.permissionDates.length > 0 && balance && balance.permissions.remaining < formData.permissionDates.length) {
        alert(`अपर्याप्त Permission balance!\nRequired: ${formData.permissionDates.length}\nAvailable: ${balance.permissions.remaining}`);
        return;
      }
    } else if (formData.leaveType === 'RL') {
      // Check if all dates are restricted holidays
      const invalidRLDates = leaveCalculation.allDates.filter(d => !d.restrictedHoliday);
      if (invalidRLDates.length > 0) {
        alert('RL केवल Restricted Holiday list की dates पर ली जा सकती है।\n\nInvalid dates: ' + 
          invalidRLDates.map(d => d.dateStr).join(', '));
        return;
      }

      if (balance && balance.restrictedLeave.remaining < leaveCalculation.totalDays) {
        alert(`अपर्याप्त RL balance!\nRequired: ${leaveCalculation.totalDays}\nAvailable: ${balance.restrictedLeave.remaining}`);
        return;
      }
    }

    setLoading(true);

    try {
      await leavesAPI.create(formData);
      alert('Leave record successfully added!');
      navigate('/leaves');
    } catch (error) {
      console.error('Error creating leave:', error);
      alert('Error: ' + (error.response?.data?.message || 'Failed to create leave'));
    } finally {
      setLoading(false);
    }
  };

  const selectedEmployee = employees.find(e => e._id === formData.employee);

  // Calculate final values
  const clDaysRequired = formData.leaveType === 'CL' 
    ? leaveCalculation.totalDays - formData.permissionDates.length 
    : 0;
  const permissionsRequired = formData.permissionDates.length;

  return (
    <Layout>
      <div className="p-6 max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => navigate('/leaves')}
            className="text-blue-600 hover:text-blue-800 flex items-center gap-2 mb-4"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Leave Dashboard
          </button>
          <h1 className="text-3xl font-bold text-gray-800">Add Leave Record</h1>
          <p className="text-gray-600 mt-1">मानव सम्पदा पोर्टल से approved leave का record यहाँ add करें</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Employee Selection */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Employee Details</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  कर्मचारी चुनें *
                </label>
                <select
                  value={formData.employee}
                  onChange={(e) => setFormData({ ...formData, employee: e.target.value })}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select Employee</option>
                  {employees.map(emp => (
                    <option key={emp._id} value={emp._id}>
                      {emp.name} - {emp.pno} ({emp.rank})
                    </option>
                  ))}
                </select>
              </div>

              {selectedEmployee && (
                <>
                  <div className="bg-blue-50 p-3 rounded-lg">
                    <p className="text-xs text-blue-600 font-semibold mb-1">Unit</p>
                    <p className="text-sm text-gray-800">{selectedEmployee.currentUnit?.name}</p>
                  </div>
                  <div className="bg-blue-50 p-3 rounded-lg">
                    <p className="text-xs text-blue-600 font-semibold mb-1">Mobile</p>
                    <p className="text-sm text-gray-800">{selectedEmployee.mobile}</p>
                  </div>
                </>
              )}
            </div>

            {/* Leave Balance */}
            {balance && (
              <div className="mt-4 p-4 bg-green-50 rounded-lg">
                <p className="text-sm font-semibold text-green-800 mb-2">Current Leave Balance:</p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                  <div>
                    <p className="text-gray-600">CL</p>
                    <p className="font-bold text-green-700">{balance.casualLeave.remaining}/{balance.casualLeave.total}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Permissions</p>
                    <p className="font-bold text-green-700">{balance.permissions.remaining}/{balance.permissions.total}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">RL</p>
                    <p className="font-bold text-green-700">{balance.restrictedLeave.remaining}/{balance.restrictedLeave.total}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">EL Used</p>
                    <p className="font-bold text-green-700">{balance.earnedLeave.used}</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Leave Details */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Leave Details</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Leave Type *
                </label>
                <select
                  value={formData.leaveType}
                  onChange={(e) => {
                    setFormData({ ...formData, leaveType: e.target.value, permissionDates: [] });
                  }}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select Type</option>
                  <option value="CL">CL - Casual Leave</option>
                  <option value="RL">RL - Restricted Leave</option>
                  <option value="EL">EL - Earned Leave</option>
                  <option value="MEDICAL">Medical Leave</option>
                  <option value="MATERNITY">Maternity Leave</option>
                  <option value="CCL">CCL - Child Care Leave</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Start Date *
                </label>
                <input
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value, permissionDates: [] })}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  End Date *
                </label>
                <input
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value, permissionDates: [] })}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Remarks (Optional)
                </label>
                <textarea
                  value={formData.remarks}
                  onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                  rows="2"
                  placeholder="Family function, Medical emergency, etc."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Leave Calculation */}
          {formData.startDate && formData.endDate && leaveCalculation.totalDays > 0 && (
            <div className="bg-white rounded-xl shadow-md p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4">Leave Calculation</h2>
              
              <div className="mb-4 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                <p className="text-sm font-semibold text-yellow-800 mb-2">📌 पुलिस विभाग में:</p>
                <ul className="text-sm text-yellow-700 space-y-1 ml-4">
                  <li>• सभी दिन working days हैं (कोई weekend नहीं)</li>
                  <li>• इसीलिए 30 CL दी जाती है (365 days duty)</li>
                  <li>• Permission केवल Saturday/Sunday/Gazetted Holiday पर ली जा सकती है</li>
                  <li>• Permission = SEPARATE count (CL में नहीं कटती)</li>
                </ul>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
                <div className="bg-blue-50 p-4 rounded-lg text-center">
                  <p className="text-2xl font-bold text-blue-600">{leaveCalculation.totalDays}</p>
                  <p className="text-sm text-gray-600">Total Days</p>
                  <p className="text-xs text-gray-500">(All Working)</p>
                </div>
                {formData.leaveType === 'CL' && (
                  <>
                    <div className="bg-green-50 p-4 rounded-lg text-center">
                      <p className="text-2xl font-bold text-green-600">{clDaysRequired}</p>
                      <p className="text-sm text-gray-600">CL Required</p>
                      <p className="text-xs text-gray-500">(Total - Permissions)</p>
                    </div>
                    <div className="bg-orange-50 p-4 rounded-lg text-center">
                      <p className="text-2xl font-bold text-orange-600">{permissionsRequired}</p>
                      <p className="text-sm text-gray-600">Permissions</p>
                      <p className="text-xs text-gray-500">(Selected)</p>
                    </div>
                  </>
                )}
              </div>

              {/* Date-wise breakdown */}
              <div className="mt-4">
                <h3 className="text-sm font-semibold text-gray-700 mb-3">Date-wise Breakdown:</h3>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {leaveCalculation.allDates.map((day, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3 flex-1">
                        <div className="text-center min-w-[80px]">
                          <div className="text-sm font-bold text-gray-800">
                            {day.date.toLocaleDateString('hi-IN')}
                          </div>
                          <div className="text-xs text-gray-500">
                            {day.date.toLocaleDateString('en-US', { weekday: 'short' })}
                          </div>
                        </div>
                        <div className="flex-1">
                          {day.isWeekend && (
                            <span className="inline-block px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs mr-2">
                              {day.date.getDay() === 0 ? 'Sunday' : 'Saturday'}
                            </span>
                          )}
                          {day.gazettedHoliday && (
                            <span className="inline-block px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs mr-2">
                              🎉 {day.gazettedHoliday.name}
                            </span>
                          )}
                          {day.restrictedHoliday && (
                            <span className="inline-block px-2 py-1 bg-orange-100 text-orange-700 rounded text-xs">
                              RL: {day.restrictedHoliday.name}
                            </span>
                          )}
                          {!day.isWeekend && !day.gazettedHoliday && !day.restrictedHoliday && (
                            <span className="text-xs text-gray-500">Regular Working Day</span>
                          )}
                        </div>
                      </div>
                      
                      {/* Permission checkbox (only for CL and valid dates) */}
                      {formData.leaveType === 'CL' && day.canTakePermission && (
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={formData.permissionDates.includes(day.dateStr)}
                            onChange={() => handlePermissionToggle(day.dateStr)}
                            className="w-4 h-4 text-orange-600 rounded focus:ring-orange-500"
                          />
                          <span className="text-xs font-semibold text-orange-600">Permission</span>
                        </label>
                      )}
                      
                      {formData.leaveType === 'CL' && !day.canTakePermission && (
                        <span className="text-xs text-gray-400">CL</span>
                      )}

                      {formData.leaveType === 'RL' && day.restrictedHoliday && (
                        <span className="text-xs text-green-600 font-semibold">✓ Valid RL</span>
                      )}

                      {formData.leaveType === 'RL' && !day.restrictedHoliday && (
                        <span className="text-xs text-red-600 font-semibold">✗ Invalid</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Balance Impact */}
              {balance && formData.leaveType === 'CL' && (
                <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                  <p className="text-sm font-semibold text-blue-800 mb-2">Balance Impact:</p>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-gray-600">CL Required</p>
                      <p className="font-bold text-blue-700">{clDaysRequired} days</p>
                    </div>
                    <div>
                      <p className="text-gray-600">CL After</p>
                      <p className={`font-bold ${
                        balance.casualLeave.remaining - clDaysRequired >= 0 
                          ? 'text-green-700' 
                          : 'text-red-700'
                      }`}>
                        {balance.casualLeave.remaining - clDaysRequired}/{balance.casualLeave.total}
                      </p>
                    </div>
                    {permissionsRequired > 0 && (
                      <>
                        <div>
                          <p className="text-gray-600">Permissions Required</p>
                          <p className="font-bold text-orange-700">{permissionsRequired}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Permissions After</p>
                          <p className={`font-bold ${
                            balance.permissions.remaining - permissionsRequired >= 0 
                              ? 'text-green-700' 
                              : 'text-red-700'
                          }`}>
                            {balance.permissions.remaining - permissionsRequired}/{balance.permissions.total}
                          </p>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Submit Button */}
          <div className="flex gap-4 justify-end">
            <button
              type="button"
              onClick={() => navigate('/leaves')}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold disabled:bg-blue-400"
            >
              {loading ? 'Saving...' : 'Add Leave Record'}
            </button>
          </div>
        </form>
      </div>
    </Layout>
  );
};

export default AddLeave;