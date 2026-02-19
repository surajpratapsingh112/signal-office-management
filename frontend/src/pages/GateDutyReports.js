import React, { useState, useEffect } from 'react';
import { gateDutyAPI, employeesAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import Layout from '../components/Layout';
import * as XLSX from 'xlsx';

const GateDutyReports = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [reportType, setReportType] = useState('monthly');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [reportData, setReportData] = useState(null);
  const [employees, setEmployees] = useState([]);

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
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    try {
      const response = await employeesAPI.getAll();
      setEmployees(response.data.data);
    } catch (error) {
      console.error('Error fetching employees:', error);
    }
  };

  const handleGenerateReport = async () => {
    setLoading(true);
    setReportData(null);

    try {
      if (reportType === 'monthly') {
        await generateMonthlyReport();
      } else if (reportType === 'yearly') {
        await generateYearlyReport();
      } else if (reportType === 'replacement') {
        await generateReplacementReport();
      }
    } catch (error) {
      console.error('Error generating report:', error);
      alert('Error: ' + (error.response?.data?.message || 'Failed to generate report'));
    } finally {
      setLoading(false);
    }
  };

  const generateMonthlyReport = async () => {
    const response = await gateDutyAPI.getMonthlyRoster(selectedYear, selectedMonth);
    setReportData({
      type: 'monthly',
      data: response.data.data,
      year: selectedYear,
      month: selectedMonth
    });
  };

  const generateYearlyReport = async () => {
    // Fetch all 12 months data
    const promises = [];
    for (let month = 1; month <= 12; month++) {
      promises.push(
        gateDutyAPI.getMonthlyRoster(selectedYear, month).catch(() => ({ data: { data: [] } }))
      );
    }

    const results = await Promise.all(promises);
    
    // Process yearly summary
    const employeeSummary = {};

    results.forEach((result, monthIndex) => {
      const roster = result.data.data;
      
      roster.forEach(dateEntry => {
        const slotKeys = ['MAIN_MORNING', 'MAIN_EVENING', 'SCHOOL_MORNING', 'SCHOOL_EVENING'];
        
        slotKeys.forEach(slotKey => {
          const slot = dateEntry.slots[slotKey];
          if (slot && slot.effectiveEmployee) {
            const empId = slot.effectiveEmployee._id;
            
            if (!employeeSummary[empId]) {
              employeeSummary[empId] = {
                employee: slot.effectiveEmployee,
                monthlyDuties: Array(12).fill(0),
                totalDuties: 0,
                replacements: 0
              };
            }
            
            employeeSummary[empId].monthlyDuties[monthIndex]++;
            employeeSummary[empId].totalDuties++;
            
            if (slot.hasReplacement && slot.replacementDetails?.replacementEmployee._id === empId) {
              employeeSummary[empId].replacements++;
            }
          }
        });
      });
    });

    setReportData({
      type: 'yearly',
      data: Object.values(employeeSummary),
      year: selectedYear
    });
  };

  const generateReplacementReport = async () => {
    // Fetch all 12 months data
    const promises = [];
    for (let month = 1; month <= 12; month++) {
      promises.push(
        gateDutyAPI.getMonthlyRoster(selectedYear, month).catch(() => ({ data: { data: [] } }))
      );
    }

    const results = await Promise.all(promises);
    
    // Extract all replacements
    const replacements = [];

    results.forEach((result, monthIndex) => {
      const roster = result.data.data;
      const month = monthIndex + 1;
      
      roster.forEach(dateEntry => {
        const slotKeys = ['MAIN_MORNING', 'MAIN_EVENING', 'SCHOOL_MORNING', 'SCHOOL_EVENING'];
        
        slotKeys.forEach(slotKey => {
          const slot = dateEntry.slots[slotKey];
          if (slot && slot.hasReplacement && slot.replacementDetails) {
            replacements.push({
              date: dateEntry.date,
              month: month,
              slot: slotKey,
              permanentEmployee: slot.permanentEmployee,
              replacementEmployee: slot.replacementDetails.replacementEmployee,
              reason: slot.replacementDetails.reason || '-',
              createdAt: slot.replacementDetails.createdAt
            });
          }
        });
      });
    });

    setReportData({
      type: 'replacement',
      data: replacements,
      year: selectedYear
    });
  };

  const handleExportExcel = () => {
    if (!reportData) return;

    let wsData = [];
    let fileName = '';

    if (reportData.type === 'monthly') {
      fileName = `Gate_Duty_Monthly_Report_${months.find(m => m.value === reportData.month)?.label}_${reportData.year}.xlsx`;
      
      reportData.data.forEach(dateEntry => {
        const slotKeys = ['MAIN_MORNING', 'MAIN_EVENING', 'SCHOOL_MORNING', 'SCHOOL_EVENING'];
        
        slotKeys.forEach(slotKey => {
          const slot = dateEntry.slots[slotKey];
          if (slot) {
            wsData.push({
              'Date': dateEntry.date,
              'Slot': slotLabels[slotKey],
              'Permanent Employee': slot.permanentEmployee?.name || '-',
              'PNO': slot.permanentEmployee?.pno || '-',
              'Status': slot.hasReplacement ? 'Replaced' : 'Active',
              'Effective Employee': slot.effectiveEmployee?.name || '-',
              'Effective PNO': slot.effectiveEmployee?.pno || '-'
            });
          }
        });
      });
    } else if (reportData.type === 'yearly') {
      fileName = `Gate_Duty_Yearly_Summary_${reportData.year}.xlsx`;
      
      reportData.data.forEach(item => {
        const row = {
          'Name': item.employee.name,
          'PNO': item.employee.pno,
          'Rank': item.employee.rank,
          'Total Duties': item.totalDuties,
          'As Replacement': item.replacements
        };
        
        months.forEach((month, index) => {
          row[month.label] = item.monthlyDuties[index] || 0;
        });
        
        wsData.push(row);
      });
    } else if (reportData.type === 'replacement') {
      fileName = `Gate_Duty_Replacement_History_${reportData.year}.xlsx`;
      
      reportData.data.forEach(item => {
        wsData.push({
          'Date': `${item.date} ${months.find(m => m.value === item.month)?.label}`,
          'Slot': slotLabels[item.slot],
          'Permanent Employee': item.permanentEmployee?.name || '-',
          'Permanent PNO': item.permanentEmployee?.pno || '-',
          'Replacement Employee': item.replacementEmployee?.name || '-',
          'Replacement PNO': item.replacementEmployee?.pno || '-',
          'Reason': item.reason,
          'Created': new Date(item.createdAt).toLocaleDateString('en-GB')
        });
      });
    }

    const ws = XLSX.utils.json_to_sheet(wsData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Report');

    // Auto-size columns
    const maxWidth = 20;
    const wscols = Object.keys(wsData[0] || {}).map(() => ({ wch: maxWidth }));
    ws['!cols'] = wscols;

    XLSX.writeFile(wb, fileName);
  };

  const handlePrint = () => {
    window.print();
  };

  const years = [];
  const currentYear = new Date().getFullYear();
  for (let i = currentYear - 2; i <= currentYear + 1; i++) {
    years.push(i);
  }

  return (
    <Layout>
      <div className="p-6">
        {/* Header - Hide on print */}
        <div className="mb-6 print:hidden">
          <h1 className="text-3xl font-bold text-gray-800">Gate Duty Reports</h1>
          <p className="text-gray-600 mt-1">
            Generate monthly, yearly, and replacement history reports
          </p>
        </div>

        {/* Filters - Hide on print */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-6 print:hidden">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Report Configuration</h2>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            {/* Report Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Report Type
              </label>
              <select
                value={reportType}
                onChange={(e) => setReportType(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="monthly">Monthly Report</option>
                <option value="yearly">Yearly Summary</option>
                <option value="replacement">Replacement History</option>
              </select>
            </div>

            {/* Year */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Year
              </label>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                {years.map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>

            {/* Month (only for monthly report) */}
            {reportType === 'monthly' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Month
                </label>
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  {months.map(month => (
                    <option key={month.value} value={month.value}>{month.label}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Generate Button */}
            <div className="flex items-end">
              <button
                onClick={handleGenerateReport}
                disabled={loading}
                className="w-full px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading && (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                )}
                Generate Report
              </button>
            </div>
          </div>

          {/* Export Buttons */}
          {reportData && (
            <div className="flex gap-4 pt-4 border-t">
              <button
                onClick={handleExportExcel}
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Export to Excel
              </button>

              <button
                onClick={handlePrint}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                </svg>
                Print Report
              </button>
            </div>
          )}
        </div>

        {/* Report Display */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        )}

        {!loading && !reportData && (
          <div className="bg-white rounded-xl shadow-md p-12 text-center print:hidden">
            <svg className="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h3 className="text-lg font-semibold text-gray-700 mb-2">
              No Report Generated
            </h3>
            <p className="text-gray-500">
              Select report type and click "Generate Report" to view data
            </p>
          </div>
        )}

        {/* Monthly Report Display */}
        {reportData && reportData.type === 'monthly' && (
          <div className="bg-white rounded-xl shadow-md overflow-hidden print:shadow-none">
            {/* Print Header */}
            <div className="hidden print:block p-6 border-b">
              <div className="text-center">
                <h1 className="text-2xl font-bold text-gray-800 mb-2">
                  Gate Duty Monthly Report
                </h1>
                <p className="text-sm text-gray-600">
                  {months.find(m => m.value === reportData.month)?.label} {reportData.year}
                </p>
                <p className="text-sm text-gray-600">
                  Generated on: {new Date().toLocaleDateString('en-GB')}
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b print:bg-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase">Date</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase">Slot</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase">Permanent Employee</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase">Effective Employee</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {reportData.data.map((dateEntry) => {
                    const slotKeys = ['MAIN_MORNING', 'MAIN_EVENING', 'SCHOOL_MORNING', 'SCHOOL_EVENING'];
                    const assignedSlots = slotKeys.filter(key => dateEntry.slots[key]);
                    
                    if (assignedSlots.length === 0) return null;

                    return assignedSlots.map((slotKey, index) => {
                      const slot = dateEntry.slots[slotKey];
                      
                      return (
                        <tr key={`${dateEntry.date}-${slotKey}`} className="hover:bg-gray-50 print:hover:bg-transparent">
                          {index === 0 && (
                            <td className="px-4 py-3 font-semibold text-gray-900" rowSpan={assignedSlots.length}>
                              {dateEntry.date}
                            </td>
                          )}
                          <td className="px-4 py-3 text-gray-900">{slotLabels[slotKey]}</td>
                          <td className="px-4 py-3">
                            <div className="font-medium text-gray-900">{slot.permanentEmployee?.name}</div>
                            <div className="text-xs text-gray-500">{slot.permanentEmployee?.pno}</div>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                              slot.hasReplacement ? 'bg-orange-100 text-orange-800' : 'bg-green-100 text-green-800'
                            }`}>
                              {slot.hasReplacement ? 'Replaced' : 'Active'}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="font-medium text-gray-900">{slot.effectiveEmployee?.name}</div>
                            <div className="text-xs text-gray-500">{slot.effectiveEmployee?.pno}</div>
                          </td>
                        </tr>
                      );
                    });
                  })}
                </tbody>
              </table>
            </div>

            {/* Print Footer */}
            <div className="hidden print:block p-6 border-t text-center text-xs text-gray-600">
              <p>Signal Office - Gate Duty Report</p>
            </div>
          </div>
        )}

        {/* Yearly Summary Display */}
        {reportData && reportData.type === 'yearly' && (
          <div className="bg-white rounded-xl shadow-md overflow-hidden print:shadow-none">
            {/* Print Header */}
            <div className="hidden print:block p-6 border-b">
              <div className="text-center">
                <h1 className="text-2xl font-bold text-gray-800 mb-2">
                  Gate Duty Yearly Summary
                </h1>
                <p className="text-sm text-gray-600">Year: {reportData.year}</p>
                <p className="text-sm text-gray-600">
                  Generated on: {new Date().toLocaleDateString('en-GB')}
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b print:bg-gray-200">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-bold text-gray-600 uppercase">Name</th>
                    <th className="px-3 py-2 text-left text-xs font-bold text-gray-600 uppercase">PNO</th>
                    <th className="px-3 py-2 text-left text-xs font-bold text-gray-600 uppercase">Rank</th>
                    <th className="px-3 py-2 text-center text-xs font-bold text-gray-600 uppercase">Jan</th>
                    <th className="px-3 py-2 text-center text-xs font-bold text-gray-600 uppercase">Feb</th>
                    <th className="px-3 py-2 text-center text-xs font-bold text-gray-600 uppercase">Mar</th>
                    <th className="px-3 py-2 text-center text-xs font-bold text-gray-600 uppercase">Apr</th>
                    <th className="px-3 py-2 text-center text-xs font-bold text-gray-600 uppercase">May</th>
                    <th className="px-3 py-2 text-center text-xs font-bold text-gray-600 uppercase">Jun</th>
                    <th className="px-3 py-2 text-center text-xs font-bold text-gray-600 uppercase">Jul</th>
                    <th className="px-3 py-2 text-center text-xs font-bold text-gray-600 uppercase">Aug</th>
                    <th className="px-3 py-2 text-center text-xs font-bold text-gray-600 uppercase">Sep</th>
                    <th className="px-3 py-2 text-center text-xs font-bold text-gray-600 uppercase">Oct</th>
                    <th className="px-3 py-2 text-center text-xs font-bold text-gray-600 uppercase">Nov</th>
                    <th className="px-3 py-2 text-center text-xs font-bold text-gray-600 uppercase">Dec</th>
                    <th className="px-3 py-2 text-center text-xs font-bold text-gray-600 uppercase bg-blue-50">Total</th>
                    <th className="px-3 py-2 text-center text-xs font-bold text-gray-600 uppercase bg-orange-50">Repl.</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {reportData.data.map((item) => (
                    <tr key={item.employee._id} className="hover:bg-gray-50 print:hover:bg-transparent">
                      <td className="px-3 py-2 font-medium text-gray-900">{item.employee.name}</td>
                      <td className="px-3 py-2 text-gray-900">{item.employee.pno}</td>
                      <td className="px-3 py-2 text-gray-900">{item.employee.rank}</td>
                      {item.monthlyDuties.map((count, index) => (
                        <td key={index} className="px-3 py-2 text-center text-gray-900">
                          {count || '-'}
                        </td>
                      ))}
                      <td className="px-3 py-2 text-center font-bold text-blue-700 bg-blue-50">
                        {item.totalDuties}
                      </td>
                      <td className="px-3 py-2 text-center font-bold text-orange-700 bg-orange-50">
                        {item.replacements}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Print Footer */}
            <div className="hidden print:block p-6 border-t text-center text-xs text-gray-600">
              <p>Signal Office - Gate Duty Yearly Summary</p>
            </div>
          </div>
        )}

        {/* Replacement History Display */}
        {reportData && reportData.type === 'replacement' && (
          <div className="bg-white rounded-xl shadow-md overflow-hidden print:shadow-none">
            {/* Print Header */}
            <div className="hidden print:block p-6 border-b">
              <div className="text-center">
                <h1 className="text-2xl font-bold text-gray-800 mb-2">
                  Gate Duty Replacement History
                </h1>
                <p className="text-sm text-gray-600">Year: {reportData.year}</p>
                <p className="text-sm text-gray-600">
                  Total Replacements: {reportData.data.length}
                </p>
                <p className="text-sm text-gray-600">
                  Generated on: {new Date().toLocaleDateString('en-GB')}
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b print:bg-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase">S.No</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase">Date</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase">Slot</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase">Permanent Employee</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase">Replacement Employee</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase">Reason</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase">Created</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {reportData.data.map((item, index) => (
                    <tr key={index} className="hover:bg-gray-50 print:hover:bg-transparent">
                      <td className="px-4 py-3 text-gray-900">{index + 1}</td>
                      <td className="px-4 py-3 text-gray-900">
                        {item.date} {months.find(m => m.value === item.month)?.label}
                      </td>
                      <td className="px-4 py-3 text-gray-900">{slotLabels[item.slot]}</td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-900">{item.permanentEmployee?.name}</div>
                        <div className="text-xs text-gray-500">{item.permanentEmployee?.pno}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-900">{item.replacementEmployee?.name}</div>
                        <div className="text-xs text-gray-500">{item.replacementEmployee?.pno}</div>
                      </td>
                      <td className="px-4 py-3 text-gray-900">{item.reason}</td>
                      <td className="px-4 py-3 text-gray-900">
                        {new Date(item.createdAt).toLocaleDateString('en-GB')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {reportData.data.length === 0 && (
              <div className="p-12 text-center text-gray-500">
                No replacements found for {reportData.year}
              </div>
            )}

            {/* Print Footer */}
            <div className="hidden print:block p-6 border-t text-center text-xs text-gray-600">
              <p>Signal Office - Gate Duty Replacement History</p>
            </div>
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

          .print\\:hover\\:bg-transparent:hover {
            background-color: transparent !important;
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

export default GateDutyReports;
