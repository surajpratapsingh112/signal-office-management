import React, { useState, useEffect } from 'react';
import { employeesAPI, unitsAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import Layout from '../components/Layout';
import * as XLSX from 'xlsx';

const EmployeeReports = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [employees, setEmployees] = useState([]);
  const [units, setUnits] = useState([]);
  const [filteredEmployees, setFilteredEmployees] = useState([]);
  const [selectedEmployees, setSelectedEmployees] = useState([]);
  
  const [filters, setFilters] = useState({
    searchText: '',
    unit: '',
    rank: '',
    gender: '',
    bloodGroup: '',
    pensionType: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [filters, employees]);

  const fetchData = async () => {
    try {
      const [employeesRes, unitsRes] = await Promise.all([
        employeesAPI.getAll(),
        unitsAPI.getAll()
      ]);

      setEmployees(employeesRes.data.data);
      setUnits(unitsRes.data.data);
      setFilteredEmployees(employeesRes.data.data);
      
    } catch (error) {
      console.error('Error fetching data:', error);
      alert('Error loading data');
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...employees];

    // Search text filter
    if (filters.searchText) {
      filtered = filtered.filter(emp =>
        emp.name.toLowerCase().includes(filters.searchText.toLowerCase()) ||
        emp.pno.includes(filters.searchText) ||
        emp.mobile.includes(filters.searchText)
      );
    }

    // Unit filter
    if (filters.unit) {
      filtered = filtered.filter(emp => emp.currentUnit?._id === filters.unit);
    }

    // Rank filter
    if (filters.rank) {
      filtered = filtered.filter(emp => emp.rank === filters.rank);
    }

    // Gender filter
    if (filters.gender) {
      filtered = filtered.filter(emp => emp.gender === filters.gender);
    }

    // Blood Group filter
    if (filters.bloodGroup) {
      filtered = filtered.filter(emp => emp.bloodGroup === filters.bloodGroup);
    }

    // Pension Type filter
    if (filters.pensionType) {
      filtered = filtered.filter(emp => emp.pensionType === filters.pensionType);
    }

    setFilteredEmployees(filtered);
  };

  const handleSelectAll = () => {
    setSelectedEmployees(filteredEmployees.map(emp => emp._id));
  };

  const handleDeselectAll = () => {
    setSelectedEmployees([]);
  };

  const handleToggleEmployee = (empId) => {
    if (selectedEmployees.includes(empId)) {
      setSelectedEmployees(selectedEmployees.filter(id => id !== empId));
    } else {
      setSelectedEmployees([...selectedEmployees, empId]);
    }
  };

  const handleResetFilters = () => {
    setFilters({
      searchText: '',
      unit: '',
      rank: '',
      gender: '',
      bloodGroup: '',
      pensionType: ''
    });
  };

  const handleExportExcel = () => {
    if (selectedEmployees.length === 0) {
      alert('कृपया कम से कम एक employee select करें!');
      return;
    }

    const reportData = employees
  .filter(emp => selectedEmployees.includes(emp._id))
  .map((emp, index) => ({
    'S.No': index + 1,
    'Name': emp.name,
    'PNO': emp.pno,
    'Rank': emp.rank,
    'Rank Number': emp.rankNumber || '-',
    'Mobile': emp.mobile,
    'Blood Group': emp.bloodGroup,
    'Gender': emp.gender,
    'Marital Status': emp.maritalStatus,
    'Pension Type': emp.pensionType,
    'Pension Number': emp.pensionNumber,
    'Current Unit': emp.currentUnit?.name || '-',
    'Other Unit Details': emp.otherUnitDetails || '-',  // ← ADD THIS LINE
    'Posting Date': new Date(emp.postingDate).toLocaleDateString('en-GB')
  }));

    const ws = XLSX.utils.json_to_sheet(reportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Employees');

    // Auto-size columns
    const maxWidth = 20;
    const wscols = Object.keys(reportData[0] || {}).map(() => ({ wch: maxWidth }));
    ws['!cols'] = wscols;

    const fileName = `Employee_Report_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(wb, fileName);
  };

  const handlePrint = () => {
    if (selectedEmployees.length === 0) {
      alert('कृपया कम से कम एक employee select करें!');
      return;
    }

    window.print();
  };

  // Get unique values for filters
  const ranks = [...new Set(employees.map(emp => emp.rank))].sort();
  const bloodGroups = [...new Set(employees.map(emp => emp.bloodGroup))].sort();
  const pensionTypes = [...new Set(employees.map(emp => emp.pensionType))].sort();

  const reportEmployees = employees.filter(emp => selectedEmployees.includes(emp._id));

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
        {/* Header - Hide on print */}
        <div className="mb-6 print:hidden">
          <h1 className="text-3xl font-bold text-gray-800">Employee Reports</h1>
          <p className="text-gray-600 mt-1">
            Generate comprehensive employee reports with filters
          </p>
        </div>

        {/* Filters - Hide on print */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-6 print:hidden">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-800">Filters</h2>
            <button
              onClick={handleResetFilters}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-semibold text-sm"
            >
              Reset Filters
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Search (Name/PNO/Mobile)
              </label>
              <input
                type="text"
                value={filters.searchText}
                onChange={(e) => setFilters({ ...filters, searchText: e.target.value })}
                placeholder="Type to search..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Unit */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Unit
              </label>
              <select
                value={filters.unit}
                onChange={(e) => setFilters({ ...filters, unit: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Units</option>
                {units.map(unit => (
                  <option key={unit._id} value={unit._id}>{unit.name}</option>
                ))}
              </select>
            </div>

            {/* Rank */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Rank
              </label>
              <select
                value={filters.rank}
                onChange={(e) => setFilters({ ...filters, rank: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Ranks</option>
                {ranks.map(rank => (
                  <option key={rank} value={rank}>{rank}</option>
                ))}
              </select>
            </div>

            {/* Gender */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Gender
              </label>
              <select
                value={filters.gender}
                onChange={(e) => setFilters({ ...filters, gender: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All</option>
                <option value="MALE">MALE</option>
                <option value="FEMALE">FEMALE</option>
                <option value="OTHER">OTHER</option>
              </select>
            </div>

            {/* Blood Group */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Blood Group
              </label>
              <select
                value={filters.bloodGroup}
                onChange={(e) => setFilters({ ...filters, bloodGroup: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All</option>
                {bloodGroups.map(bg => (
                  <option key={bg} value={bg}>{bg}</option>
                ))}
              </select>
            </div>

            {/* Pension Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Pension Type
              </label>
              <select
                value={filters.pensionType}
                onChange={(e) => setFilters({ ...filters, pensionType: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All</option>
                {pensionTypes.map(pt => (
                  <option key={pt} value={pt}>{pt}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Filter Results Info */}
          <div className="mt-4 flex items-center justify-between">
            <p className="text-sm text-gray-600">
              Showing {filteredEmployees.length} of {employees.length} employees
            </p>
          </div>
        </div>

        {/* Employee Selection - Hide on print */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-6 print:hidden">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-800">
              Select Employees for Report
            </h2>
            <div className="flex gap-2">
              <button
                onClick={handleSelectAll}
                className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 font-semibold text-sm"
              >
                Select All Filtered ({filteredEmployees.length})
              </button>
              <button
                onClick={handleDeselectAll}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-semibold text-sm"
              >
                Deselect All
              </button>
            </div>
          </div>

          <div className="max-h-96 overflow-y-auto border border-gray-300 rounded-lg p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
              {filteredEmployees.map(emp => (
                <label
                  key={emp._id}
                  className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={selectedEmployees.includes(emp._id)}
                    onChange={() => handleToggleEmployee(emp._id)}
                    className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                  />
                  <div className="flex-1">
                    <div className="text-sm font-medium text-gray-900">{emp.name}</div>
                    <div className="text-xs text-gray-500">
                      {emp.rank} - {emp.pno}
                    </div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {selectedEmployees.length > 0 && (
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800 font-semibold">
                Selected: {selectedEmployees.length} employee(s)
              </p>
            </div>
          )}
        </div>

        {/* Action Buttons - Hide on print */}
        <div className="flex gap-4 mb-6 print:hidden">
          <button
            onClick={handleExportExcel}
            disabled={selectedEmployees.length === 0}
            className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Export to Excel
          </button>

          <button
            onClick={handlePrint}
            disabled={selectedEmployees.length === 0}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
            Print Report
          </button>
        </div>

        {/* Report Display */}
        {selectedEmployees.length > 0 ? (
          <div className="bg-white rounded-xl shadow-md overflow-hidden print:shadow-none">
            {/* Print Header - Only visible on print */}
            <div className="hidden print:block p-6 border-b">
              <div className="text-center">
                <h1 className="text-2xl font-bold text-gray-800 mb-2">
                  Signal Office Employee Report
                </h1>
                <p className="text-sm text-gray-600">
                  Generated on: {new Date().toLocaleDateString('en-GB')} at {new Date().toLocaleTimeString('en-GB')}
                </p>
                <p className="text-sm text-gray-600">
                  Total Employees: {selectedEmployees.length}
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b print:bg-gray-200">
  <tr>
    <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase">S.No</th>
    <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase">Name</th>
    <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase">PNO</th>
    <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase">Rank</th>
    <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase">Mobile</th>
    <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase">Blood Group</th>
    <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase">Gender</th>
    <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase">Pension Type</th>
    <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase">Pension Number</th>
    <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase">Unit</th>
    <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase">Other Unit</th>  {/* ← ADD THIS */}
  </tr>
</thead>
                <tbody className="divide-y divide-gray-200">
  {reportEmployees.map((emp, index) => (
    <tr key={emp._id} className="hover:bg-gray-50 print:hover:bg-transparent">
      <td className="px-4 py-3 text-gray-900">{index + 1}</td>
      <td className="px-4 py-3">
        <div className="font-medium text-gray-900">{emp.name}</div>
      </td>
      <td className="px-4 py-3 text-gray-900">{emp.pno}</td>
      <td className="px-4 py-3 text-gray-900">
        {emp.rank}{emp.rankNumber ? `/${emp.rankNumber}` : ''}
      </td>
      <td className="px-4 py-3 text-gray-900">{emp.mobile}</td>
      <td className="px-4 py-3 text-gray-900">{emp.bloodGroup}</td>
      <td className="px-4 py-3 text-gray-900">{emp.gender}</td>
      <td className="px-4 py-3 text-gray-900">{emp.pensionType}</td>
      <td className="px-4 py-3 text-gray-900">{emp.pensionNumber}</td>
      <td className="px-4 py-3 text-gray-900">{emp.currentUnit?.name || '-'}</td>
      <td className="px-4 py-3 text-gray-900">{emp.otherUnitDetails || '-'}</td>  {/* ← ADD THIS */}
    </tr>
  ))}
</tbody>
              </table>
            </div>

            {/* Print Footer - Only visible on print */}
            <div className="hidden print:block p-6 border-t text-center text-xs text-gray-600">
              <p>Signal Office Management System - Employee Report</p>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-md p-12 text-center print:hidden">
            <svg className="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h3 className="text-lg font-semibold text-gray-700 mb-2">
              No Employees Selected
            </h3>
            <p className="text-gray-500">
              Please select employees from the list above to generate report
            </p>
          </div>
        )}
      </div>

      {/* Print-specific styles */}
      <style jsx>{`
        @media print {
          @page {
            size: A4 landscape;
            margin: 1cm;
          }
          
          body {
            print-color-adjust: exact;
            -webkit-print-color-adjust: exact;
          }

          .print\\:hidden {
            display: none !important;
          }

          .print\\:block {
            display: block !important;
          }

          .print\\:shadow-none {
            box-shadow: none !important;
          }

          .print\\:bg-gray-200 {
            background-color: #e5e7eb !important;
          }

          table {
            page-break-inside: auto;
          }

          tr {
            page-break-inside: avoid;
            page-break-after: auto;
          }

          thead {
            display: table-header-group;
          }

          tfoot {
            display: table-footer-group;
          }
        }
      `}</style>
    </Layout>
  );
};

export default EmployeeReports;
