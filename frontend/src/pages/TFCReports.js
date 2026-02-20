import React, { useState, useEffect } from 'react';
import { tfcAPI } from '../services/api';
import Layout from '../components/Layout';
import * as XLSX from 'xlsx';

const TFCReports = () => {
  const [activeReport, setActiveReport] = useState('yearly'); // yearly, monthly, station
  const [loading, setLoading] = useState(false);
  
  // Yearly Summary Data
  const [yearlySummary, setYearlySummary] = useState({ historical: [], current: [] });
  
  // Monthly Report Filters
  const [monthlyYear, setMonthlyYear] = useState(new Date().getFullYear());
  const [monthlyMonth, setMonthlyMonth] = useState(new Date().getMonth() + 1);
  const [monthlyData, setMonthlyData] = useState([]);
  
  // Station Report Filters
  const [stationYear, setStationYear] = useState(2021);
  const [stationData, setStationData] = useState([]);

  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  useEffect(() => {
    if (activeReport === 'yearly') {
      fetchYearlySummary();
    } else if (activeReport === 'monthly') {
      fetchMonthlyReport();
    } else if (activeReport === 'station') {
      fetchStationReport();
    }
  }, [activeReport, monthlyYear, monthlyMonth, stationYear]);

  const fetchYearlySummary = async () => {
    try {
      setLoading(true);
      const response = await tfcAPI.getYearlySummary();
      setYearlySummary(response.data.data);
    } catch (error) {
      console.error('Error fetching yearly summary:', error);
      alert('Error loading report');
    } finally {
      setLoading(false);
    }
  };

  const fetchMonthlyReport = async () => {
    try {
      setLoading(true);
      const response = await tfcAPI.getMonthlyZoneReport({
        year: monthlyYear,
        month: monthlyMonth
      });
      setMonthlyData(response.data.data);
    } catch (error) {
      console.error('Error fetching monthly report:', error);
      alert('Error loading report');
    } finally {
      setLoading(false);
    }
  };

  const fetchStationReport = async () => {
    try {
      setLoading(true);
      const response = await tfcAPI.getYearly();
      const filtered = response.data.data.filter(item => item.year === stationYear);
      setStationData(filtered);
    } catch (error) {
      console.error('Error fetching station report:', error);
      alert('Error loading report');
    } finally {
      setLoading(false);
    }
  };

  const exportYearlyToExcel = () => {
    const allData = [
      ...yearlySummary.historical.map(item => ({
        Year: item._id,
        'Messages IN': item.totalMessagesIn,
        'Messages OUT': item.totalMessagesOut,
        'Messages TOTAL': item.totalMessages,
        'Groups IN': item.totalGroupsIn,
        'Groups OUT': item.totalGroupsOut,
        'Groups TOTAL': item.totalGroups,
        Type: 'Historical'
      })),
      ...yearlySummary.current.map(item => ({
        Year: item._id,
        'Messages IN': item.totalMessagesIn,
        'Messages OUT': item.totalMessagesOut,
        'Messages TOTAL': item.totalMessagesIn + item.totalMessagesOut,
        'Groups IN': item.totalGroupsIn,
        'Groups OUT': item.totalGroupsOut,
        'Groups TOTAL': item.totalGroupsIn + item.totalGroupsOut,
        Type: 'Current (Zone-wise)'
      }))
    ];

    const ws = XLSX.utils.json_to_sheet(allData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Yearly Summary');
    XLSX.writeFile(wb, `TFC_Yearly_Summary_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const exportMonthlyToExcel = () => {
    const data = monthlyData.map(entry => ({
      Zone: entry.zone,
      'CW Messages': entry.cwInMessages + entry.cwOutMessages,
      'CW Groups': entry.cwInGroups + entry.cwOutGroups,
      'POLNET Messages': entry.polnetInMessages + entry.polnetOutMessages,
      'POLNET Groups': entry.polnetInGroups + entry.polnetOutGroups,
      'PRM Messages': entry.prmInMessages + entry.prmOutMessages,
      'PRM Groups': entry.prmInGroups + entry.prmOutGroups,
      'VHF RG Messages': entry.vhfRgInMessages + entry.vhfRgOutMessages,
      'VHF RG Groups': entry.vhfRgInGroups + entry.vhfRgOutGroups,
      'VHF Events Messages': entry.vhfEventsInMessages + entry.vhfEventsOutMessages,
      'VHF Events Groups': entry.vhfEventsInGroups + entry.vhfEventsOutGroups
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Monthly Report');
    XLSX.writeFile(wb, `TFC_Monthly_${monthlyYear}_${months[monthlyMonth - 1]}.xlsx`);
  };

  const exportStationToExcel = () => {
    const data = stationData.map(item => ({
      Station: item.station,
      'Messages IN': item.messagesIn,
      'Messages OUT': item.messagesOut,
      'Messages TOTAL': item.messagesTotal,
      'Groups IN': item.groupsIn,
      'Groups OUT': item.groupsOut,
      'Groups TOTAL': item.groupsTotal
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Station Report');
    XLSX.writeFile(wb, `TFC_Station_${stationYear}.xlsx`);
  };

  return (
    <Layout>
      <div className="p-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-800">TFC Reports</h1>
          <p className="text-gray-600 mt-1">View and export TFC message reports</p>
        </div>

        {/* Report Type Selector */}
        <div className="bg-white rounded-xl shadow-md mb-6">
          <div className="flex border-b">
            <button
              onClick={() => setActiveReport('yearly')}
              className={`px-6 py-4 font-semibold transition ${
                activeReport === 'yearly'
                  ? 'border-b-2 border-blue-600 text-blue-600'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              Yearly Summary (2021-2025)
            </button>
            <button
              onClick={() => setActiveReport('monthly')}
              className={`px-6 py-4 font-semibold transition ${
                activeReport === 'monthly'
                  ? 'border-b-2 border-blue-600 text-blue-600'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              Monthly Zone-wise (2025+)
            </button>
            <button
              onClick={() => setActiveReport('station')}
              className={`px-6 py-4 font-semibold transition ${
                activeReport === 'station'
                  ? 'border-b-2 border-blue-600 text-blue-600'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              Station-wise (2021-2024)
            </button>
          </div>

          <div className="p-6">
            {loading ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              </div>
            ) : (
              <>
                {/* Yearly Summary Report */}
                {activeReport === 'yearly' && (
                  <div>
                    <div className="flex justify-between items-center mb-4">
                      <h2 className="text-xl font-bold text-gray-800">Yearly Summary (2021-2025)</h2>
                      <button
                        onClick={exportYearlyToExcel}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold flex items-center gap-2"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        Export Excel
                      </button>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-gray-50 border-b">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase">Year</th>
                            <th className="px-4 py-3 text-right text-xs font-bold text-gray-600 uppercase">Messages IN</th>
                            <th className="px-4 py-3 text-right text-xs font-bold text-gray-600 uppercase">Messages OUT</th>
                            <th className="px-4 py-3 text-right text-xs font-bold text-gray-600 uppercase">Messages TOTAL</th>
                            <th className="px-4 py-3 text-right text-xs font-bold text-gray-600 uppercase">Groups IN</th>
                            <th className="px-4 py-3 text-right text-xs font-bold text-gray-600 uppercase">Groups OUT</th>
                            <th className="px-4 py-3 text-right text-xs font-bold text-gray-600 uppercase">Groups TOTAL</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {yearlySummary.historical.map((item) => (
                            <tr key={item._id} className="hover:bg-gray-50">
                              <td className="px-4 py-3 font-semibold text-gray-900">{item._id}</td>
                              <td className="px-4 py-3 text-right text-gray-900">{item.totalMessagesIn?.toLocaleString() || 0}</td>
                              <td className="px-4 py-3 text-right text-gray-900">{item.totalMessagesOut?.toLocaleString() || 0}</td>
                              <td className="px-4 py-3 text-right text-gray-900 font-semibold">{item.totalMessages?.toLocaleString() || 0}</td>
                              <td className="px-4 py-3 text-right text-gray-900">{item.totalGroupsIn?.toLocaleString() || 0}</td>
                              <td className="px-4 py-3 text-right text-gray-900">{item.totalGroupsOut?.toLocaleString() || 0}</td>
                              <td className="px-4 py-3 text-right text-gray-900 font-semibold">{item.totalGroups?.toLocaleString() || 0}</td>
                            </tr>
                          ))}
                          {yearlySummary.current.map((item) => (
                            <tr key={item._id} className="hover:bg-gray-50 bg-blue-50">
                              <td className="px-4 py-3 font-semibold text-gray-900">{item._id}</td>
                              <td className="px-4 py-3 text-right text-gray-900">{item.totalMessagesIn?.toLocaleString() || 0}</td>
                              <td className="px-4 py-3 text-right text-gray-900">{item.totalMessagesOut?.toLocaleString() || 0}</td>
                              <td className="px-4 py-3 text-right text-gray-900 font-semibold">{((item.totalMessagesIn || 0) + (item.totalMessagesOut || 0)).toLocaleString()}</td>
                              <td className="px-4 py-3 text-right text-gray-900">{item.totalGroupsIn?.toLocaleString() || 0}</td>
                              <td className="px-4 py-3 text-right text-gray-900">{item.totalGroupsOut?.toLocaleString() || 0}</td>
                              <td className="px-4 py-3 text-right text-gray-900 font-semibold">{((item.totalGroupsIn || 0) + (item.totalGroupsOut || 0)).toLocaleString()}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {yearlySummary.historical.length === 0 && yearlySummary.current.length === 0 && (
                      <div className="text-center py-12 text-gray-500">
                        <p>No data available. Please import historical data or add entries.</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Monthly Zone-wise Report */}
                {activeReport === 'monthly' && (
                  <div>
                    <div className="flex justify-between items-center mb-4">
                      <h2 className="text-xl font-bold text-gray-800">Monthly Zone-wise Report</h2>
                      <button
                        onClick={exportMonthlyToExcel}
                        disabled={monthlyData.length === 0}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold flex items-center gap-2 disabled:bg-gray-400 disabled:cursor-not-allowed"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        Export Excel
                      </button>
                    </div>

                    {/* Filters */}
                    <div className="flex gap-4 mb-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Year</label>
                        <select
                          value={monthlyYear}
                          onChange={(e) => setMonthlyYear(parseInt(e.target.value))}
                          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        >
                          <option value={2025}>2025</option>
                          <option value={2026}>2026</option>
                          <option value={2027}>2027</option>
                          <option value={2028}>2028</option>
                          <option value={2029}>2029</option>
                          <option value={2030}>2030</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Month</label>
                        <select
                          value={monthlyMonth}
                          onChange={(e) => setMonthlyMonth(parseInt(e.target.value))}
                          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        >
                          {months.map((month, index) => (
                            <option key={month} value={index + 1}>{month}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-gray-50 border-b">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase">Zone</th>
                            <th className="px-4 py-3 text-right text-xs font-bold text-gray-600 uppercase">CW</th>
                            <th className="px-4 py-3 text-right text-xs font-bold text-gray-600 uppercase">POLNET</th>
                            <th className="px-4 py-3 text-right text-xs font-bold text-gray-600 uppercase">PRM</th>
                            <th className="px-4 py-3 text-right text-xs font-bold text-gray-600 uppercase">VHF RG</th>
                            <th className="px-4 py-3 text-right text-xs font-bold text-gray-600 uppercase">VHF Events</th>
                            <th className="px-4 py-3 text-right text-xs font-bold text-gray-600 uppercase">TOTAL Groups</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {monthlyData.map((entry) => {
                            const cwTotal = entry.cwInGroups + entry.cwOutGroups;
                            const polnetTotal = entry.polnetInGroups + entry.polnetOutGroups;
                            const prmTotal = entry.prmInGroups + entry.prmOutGroups;
                            const vhfRgTotal = entry.vhfRgInGroups + entry.vhfRgOutGroups;
                            const vhfEventsTotal = entry.vhfEventsInGroups + entry.vhfEventsOutGroups;
                            const grandTotal = cwTotal + polnetTotal + prmTotal + vhfRgTotal + vhfEventsTotal;

                            return (
                              <tr key={entry._id} className="hover:bg-gray-50">
                                <td className="px-4 py-3 font-semibold text-gray-900">{entry.zone}</td>
                                <td className="px-4 py-3 text-right text-gray-900">{cwTotal.toLocaleString()}</td>
                                <td className="px-4 py-3 text-right text-gray-900">{polnetTotal.toLocaleString()}</td>
                                <td className="px-4 py-3 text-right text-gray-900">{prmTotal.toLocaleString()}</td>
                                <td className="px-4 py-3 text-right text-gray-900">{entry.zone === 'RHQ' ? 'N/A' : vhfRgTotal.toLocaleString()}</td>
                                <td className="px-4 py-3 text-right text-gray-900">{entry.zone === 'RHQ' ? 'N/A' : vhfEventsTotal.toLocaleString()}</td>
                                <td className="px-4 py-3 text-right text-gray-900 font-semibold">{grandTotal.toLocaleString()}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>

                    {monthlyData.length === 0 && (
                      <div className="text-center py-12 text-gray-500">
                        <p>No data available for {months[monthlyMonth - 1]} {monthlyYear}</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Station-wise Report */}
                {activeReport === 'station' && (
                  <div>
                    <div className="flex justify-between items-center mb-4">
                      <h2 className="text-xl font-bold text-gray-800">Station-wise Report (2021-2024)</h2>
                      <button
                        onClick={exportStationToExcel}
                        disabled={stationData.length === 0}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold flex items-center gap-2 disabled:bg-gray-400 disabled:cursor-not-allowed"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        Export Excel
                      </button>
                    </div>

                    {/* Year Filter */}
                    <div className="mb-6">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Select Year</label>
                      <select
                        value={stationYear}
                        onChange={(e) => setStationYear(parseInt(e.target.value))}
                        className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      >
                        <option value={2021}>2021</option>
                        <option value={2022}>2022</option>
                        <option value={2023}>2023</option>
                        <option value={2024}>2024</option>
                      </select>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-gray-50 border-b">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase">Station</th>
                            <th className="px-4 py-3 text-right text-xs font-bold text-gray-600 uppercase">Messages IN</th>
                            <th className="px-4 py-3 text-right text-xs font-bold text-gray-600 uppercase">Messages OUT</th>
                            <th className="px-4 py-3 text-right text-xs font-bold text-gray-600 uppercase">Messages TOTAL</th>
                            <th className="px-4 py-3 text-right text-xs font-bold text-gray-600 uppercase">Groups IN</th>
                            <th className="px-4 py-3 text-right text-xs font-bold text-gray-600 uppercase">Groups OUT</th>
                            <th className="px-4 py-3 text-right text-xs font-bold text-gray-600 uppercase">Groups TOTAL</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {stationData.map((item) => (
                            <tr key={item._id} className="hover:bg-gray-50">
                              <td className="px-4 py-3 font-semibold text-gray-900">{item.station}</td>
                              <td className="px-4 py-3 text-right text-gray-900">{item.messagesIn.toLocaleString()}</td>
                              <td className="px-4 py-3 text-right text-gray-900">{item.messagesOut.toLocaleString()}</td>
                              <td className="px-4 py-3 text-right text-gray-900 font-semibold">{item.messagesTotal.toLocaleString()}</td>
                              <td className="px-4 py-3 text-right text-gray-900">{item.groupsIn.toLocaleString()}</td>
                              <td className="px-4 py-3 text-right text-gray-900">{item.groupsOut.toLocaleString()}</td>
                              <td className="px-4 py-3 text-right text-gray-900 font-semibold">{item.groupsTotal.toLocaleString()}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {stationData.length === 0 && (
                      <div className="text-center py-12 text-gray-500">
                        <p>No data available for year {stationYear}. Please import historical data first.</p>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default TFCReports;