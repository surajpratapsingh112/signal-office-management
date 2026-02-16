import React, { useState, useEffect } from 'react';
import { leavesAPI, employeesAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import Layout from '../components/Layout';
import * as XLSX from 'xlsx';

const LeaveReports = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [employees, setEmployees] = useState([]);
  const [reportData, setReportData] = useState([]);
  const [filters, setFilters] = useState({
    startDate: new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    selectedEmployees: [],
    leaveTypes: {
      CL: true,
      RL: true,
      EL: true,
      MEDICAL: true,
      MATERNITY: false,
      CCL: false,
      PERMISSION: true
    }
  });

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    try {
      const response = await employeesAPI.getAll();
      setEmployees(response.data.data);
    } catch (error) {
      console.error('Error fetching employees:', error);
      alert('Error loading employees');
    }
  };

  const handleGenerateReport = async () => {
    setLoading(true);
    try {
      // Fetch all leaves in date range
      const response = await leavesAPI.getAll({
        startDate: filters.startDate,
        endDate: filters.endDate
      });

      let leaves = response.data.data;

      // Filter by selected employees
      if (filters.selectedEmployees.length > 0) {
        leaves = leaves.filter(leave => 
          filters.selectedEmployees.includes(leave.employee._id)
        );
      }

      // Filter by leave types
      const selectedLeaveTypes = Object.keys(filters.leaveTypes).filter(
        type => filters.leaveTypes[type]
      );
      
      leaves = leaves.filter(leave => selectedLeaveTypes.includes(leave.leaveType));

      // Filter by date range overlap
      leaves = leaves.filter(leave => {
        const leaveStart = new Date(leave.startDate);
        const leaveEnd = new Date(leave.endDate);
        const filterStart = new Date(filters.startDate);
        const filterEnd = new Date(filters.endDate);
        
        return leaveStart <= filterEnd && leaveEnd >= filterStart;
      });

      // Process and aggregate data
      const processedData = processLeaveData(leaves);
      setReportData(processedData);

    } catch (error) {
      console.error('Error generating report:', error);
      alert('Error: ' + (error.response?.data?.message || 'Failed to generate report'));
    } finally {
      setLoading(false);
    }
  };

  const processLeaveData = (leaves) => {
    const employeeMap = {};

    leaves.forEach(leave => {
      const empId = leave.employee._id;
      
      if (!employeeMap[empId]) {
        employeeMap[empId] = {
          employee: leave.employee,
          leaves: [],
          summary: {
            CL: 0,
            RL: 0,
            EL: 0,
            MEDICAL: 0,
            MATERNITY: 0,
            CCL: 0,
            PERMISSION: 0,
            totalDays: 0
          }
        };
      }

      employeeMap[empId].leaves.push(leave);

      // Calculate days within filter range
      const leaveStart = new Date(Math.max(new Date(leave.startDate), new Date(filters.startDate)));
      const leaveEnd = new Date(Math.min(new Date(leave.endDate), new Date(filters.endDate)));
      const daysInRange = Math.ceil((leaveEnd - leaveStart) / (1000 * 60 * 60 * 24)) + 1;

      if (leave.leaveType === 'CL') {
        employeeMap[empId].summary.CL += daysInRange - (leave.permissionsUsed || 0);
        employeeMap[empId].summary.PERMISSION += leave.permissionsUsed || 0;
      } else {
        employeeMap[empId].summary[leave.leaveType] += daysInRange;
      }
      
      employeeMap[empId].summary.totalDays += daysInRange;
    });

    return Object.values(employeeMap);
  };

  const handleExportToExcel = () => {
    if (reportData.length === 0) {
      alert('कोई data नहीं है export करने के लिए!');
      return;
    }

    const excelData = reportData.map(item => ({
      'Employee Name': item.employee.name,
      'PNO': item.employee.pno,
      'Rank': item.employee.rank,
      'Unit': item.employee.currentUnit?.name || 'N/A',
      'CL Days': item.summary.CL,
      'RL Days': item.summary.RL,
      'EL Days': item.summary.EL,
      'Medical Days': item.summary.MEDICAL,
      'Maternity Days': item.summary.MATERNITY,
      'CCL Days': item.summary.CCL,
      'Permissions': item.summary.PERMISSION,
      'Total Days': item.summary.totalDays
    }));

    const ws = XLSX.utils.json_to_sheet(excelData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Leave Report');

    // Add summary row
    const summaryData = calculateGrandTotal();
    const summaryRow = {
      'Employee Name': 'GRAND TOTAL',
      'PNO': '',
      'Rank': '',
      'Unit': '',
      'CL Days': summaryData.CL,
      'RL Days': summaryData.RL,
      'EL Days': summaryData.EL,
      'Medical Days': summaryData.MEDICAL,
      'Maternity Days': summaryData.MATERNITY,
      'CCL Days': summaryData.CCL,
      'Permissions': summaryData.PERMISSION,
      'Total Days': summaryData.totalDays
    };
    
    XLSX.utils.sheet_add_json(ws, [summaryRow], { origin: -1, skipHeader: true });

    const fileName = `Leave_Report_${filters.startDate}_to_${filters.endDate}.xlsx`;
    XLSX.writeFile(wb, fileName);
  };

  const handlePrint = () => {
    window.print();
  };

  const calculateGrandTotal = () => {
    return reportData.reduce((acc, item) => {
      acc.CL += item.summary.CL;
      acc.RL += item.summary.RL;
      acc.EL += item.summary.EL;
      acc.MEDICAL += item.summary.MEDICAL;
      acc.MATERNITY += item.summary.MATERNITY;
      acc.CCL += item.summary.CCL;
      acc.PERMISSION += item.summary.PERMISSION;
      acc.totalDays += item.summary.totalDays;
      return acc;
    }, {
      CL: 0, RL: 0, EL: 0, MEDICAL: 0, MATERNITY: 0, CCL: 0, PERMISSION: 0, totalDays: 0
    });
  };

  const handleToggleEmployee = (empId) => {
    setFilters(prev => ({
      ...prev,
      selectedEmployees: prev.selectedEmployees.includes(empId)
        ? prev.selectedEmployees.filter(id => id !== empId)
        : [...prev.selectedEmployees, empId]
    }));
  };

  const handleSelectAllEmployees = () => {
    setFilters(prev => ({
      ...prev,
      selectedEmployees: employees.map(emp => emp._id)
    }));
  };

  const handleDeselectAllEmployees = () => {
    setFilters(prev => ({
      ...prev,
      selectedEmployees: []
    }));
  };

  const handleToggleLeaveType = (type) => {
    setFilters(prev => ({
      ...prev,
      leaveTypes: {
        ...prev.leaveTypes,
        [type]: !prev.leaveTypes[type]
      }
    }));
  };

  const grandTotal = reportData.length > 0 ? calculateGrandTotal() : null;

  return (
    <Layout>
      <div className="p-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-800">Leave Reports</h1>
          <p className="text-gray-600 mt-1">Generate detailed leave reports with filters</p>
        </div>

        {/* Filters Section */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-6 print:hidden">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Filters</h2>

          {/* Date Range */}
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Date Range</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  From Date *
                </label>
                <input
                  type="date"
                  value={filters.startDate}
                  onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  To Date *
                </label>
                <input
                  type="date"
                  value={filters.endDate}
                  onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                  min={filters.startDate}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Leave Types */}
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Leave Types (Select Multiple)</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {Object.keys(filters.leaveTypes).map(type => (
                <label key={type} className={`flex items-center gap-2 p-3 border-2 rounded-lg cursor-pointer transition ${
                  filters.leaveTypes[type] ? 'border-blue-600 bg-blue-50' : 'border-gray-300 hover:border-blue-300'
                }`}>
                  <input
                    type="checkbox"
                    checked={filters.leaveTypes[type]}
                    onChange={() => handleToggleLeaveType(type)}
                    className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium">{type}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Employee Selection */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-700">
                Select Employees (Optional - Leave blank for all)
              </h3>
              <div className="flex gap-2">
                <button
                  onClick={handleSelectAllEmployees}
                  className="px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 font-semibold"
                >
                  Select All
                </button>
                <button
                  onClick={handleDeselectAllEmployees}
                  className="px-3 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200 font-semibold"
                >
                  Clear
                </button>
              </div>
            </div>
            
            <div className="max-h-60 overflow-y-auto border border-gray-300 rounded-lg p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                {employees.map(emp => (
                  <label key={emp._id} className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded cursor-pointer">
                    <input
                      type="checkbox"
                      checked={filters.selectedEmployees.includes(emp._id)}
                      onChange={() => handleToggleEmployee(emp._id)}
                      className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm">
                      {emp.name} ({emp.rank})
                    </span>
                  </label>
                ))}
              </div>
            </div>
            {filters.selectedEmployees.length > 0 && (
              <p className="text-sm text-gray-600 mt-2">
                Selected: {filters.selectedEmployees.length} employee(s)
              </p>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4">
            <button
              onClick={handleGenerateReport}
              disabled={loading}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold disabled:bg-blue-400 flex items-center gap-2"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Generating...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Generate Report
                </>
              )}
            </button>

            {reportData.length > 0 && (
              <>
                <button
                  onClick={handleExportToExcel}
                  className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold flex items-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Export to Excel
                </button>

                <button
                  onClick={handlePrint}
                  className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-semibold flex items-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                  </svg>
                  Print
                </button>
              </>
            )}
          </div>
        </div>

        {/* Report Results */}
        {reportData.length > 0 && (
          <div className="bg-white rounded-xl shadow-md overflow-hidden">
            {/* Print Header */}
            <div className="hidden print:block p-6 border-b">
              <h1 className="text-2xl font-bold text-center">UP Police Signal Office</h1>
              <h2 className="text-xl font-bold text-center mt-2">Leave Report</h2>
              <p className="text-center text-gray-600 mt-1">
                Period: {new Date(filters.startDate).toLocaleDateString('hi-IN')} to {new Date(filters.endDate).toLocaleDateString('hi-IN')}
              </p>
            </div>

            <div className="p-6 border-b print:hidden">
              <h2 className="text-xl font-bold text-gray-800">
                Report Results ({reportData.length} employee{reportData.length !== 1 ? 's' : ''})
              </h2>
              <p className="text-gray-600 text-sm mt-1">
                Showing leave data from {new Date(filters.startDate).toLocaleDateString('hi-IN')} to {new Date(filters.endDate).toLocaleDateString('hi-IN')}
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">S.No</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Employee</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">PNO</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rank</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Unit</th>
                    {filters.leaveTypes.CL && <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">CL</th>}
                    {filters.leaveTypes.RL && <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">RL</th>}
                    {filters.leaveTypes.EL && <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">EL</th>}
                    {filters.leaveTypes.MEDICAL && <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Medical</th>}
                    {filters.leaveTypes.MATERNITY && <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Maternity</th>}
                    {filters.leaveTypes.CCL && <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">CCL</th>}
                    {filters.leaveTypes.PERMISSION && <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Permission</th>}
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase bg-blue-50">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {reportData.map((item, index) => (
                    <tr key={item.employee._id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-gray-900">{index + 1}</td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-900">{item.employee.name}</div>
                      </td>
                      <td className="px-4 py-3 text-gray-900">{item.employee.pno}</td>
                      <td className="px-4 py-3 text-gray-900">{item.employee.rank}</td>
                      <td className="px-4 py-3 text-gray-900">{item.employee.currentUnit?.name || 'N/A'}</td>
                      {filters.leaveTypes.CL && <td className="px-4 py-3 text-center text-blue-600 font-semibold">{item.summary.CL || '-'}</td>}
                      {filters.leaveTypes.RL && <td className="px-4 py-3 text-center text-purple-600 font-semibold">{item.summary.RL || '-'}</td>}
                      {filters.leaveTypes.EL && <td className="px-4 py-3 text-center text-green-600 font-semibold">{item.summary.EL || '-'}</td>}
                      {filters.leaveTypes.MEDICAL && <td className="px-4 py-3 text-center text-red-600 font-semibold">{item.summary.MEDICAL || '-'}</td>}
                      {filters.leaveTypes.MATERNITY && <td className="px-4 py-3 text-center text-pink-600 font-semibold">{item.summary.MATERNITY || '-'}</td>}
                      {filters.leaveTypes.CCL && <td className="px-4 py-3 text-center text-indigo-600 font-semibold">{item.summary.CCL || '-'}</td>}
                      {filters.leaveTypes.PERMISSION && <td className="px-4 py-3 text-center text-orange-600 font-semibold">{item.summary.PERMISSION || '-'}</td>}
                      <td className="px-4 py-3 text-center font-bold text-gray-900 bg-blue-50">{item.summary.totalDays}</td>
                    </tr>
                  ))}

                  {/* Grand Total Row */}
                  {grandTotal && (
                    <tr className="bg-gray-100 font-bold">
                      <td colSpan="5" className="px-4 py-3 text-right text-gray-900">GRAND TOTAL:</td>
                      {filters.leaveTypes.CL && <td className="px-4 py-3 text-center text-blue-700">{grandTotal.CL}</td>}
                      {filters.leaveTypes.RL && <td className="px-4 py-3 text-center text-purple-700">{grandTotal.RL}</td>}
                      {filters.leaveTypes.EL && <td className="px-4 py-3 text-center text-green-700">{grandTotal.EL}</td>}
                      {filters.leaveTypes.MEDICAL && <td className="px-4 py-3 text-center text-red-700">{grandTotal.MEDICAL}</td>}
                      {filters.leaveTypes.MATERNITY && <td className="px-4 py-3 text-center text-pink-700">{grandTotal.MATERNITY}</td>}
                      {filters.leaveTypes.CCL && <td className="px-4 py-3 text-center text-indigo-700">{grandTotal.CCL}</td>}
                      {filters.leaveTypes.PERMISSION && <td className="px-4 py-3 text-center text-orange-700">{grandTotal.PERMISSION}</td>}
                      <td className="px-4 py-3 text-center text-gray-900 bg-blue-100">{grandTotal.totalDays}</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* No Data Message */}
        {!loading && reportData.length === 0 && (
          <div className="bg-white rounded-xl shadow-md p-12 text-center">
            <svg className="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h3 className="text-lg font-semibold text-gray-700 mb-2">No Report Generated</h3>
            <p className="text-gray-500">
              Set your filters and click "Generate Report" to view leave data
            </p>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default LeaveReports;