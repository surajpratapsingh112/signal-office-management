import React, { useState, useEffect } from 'react';
import { tfcAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import Layout from '../components/Layout';

const TFCManagement = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('import'); // import, entry, view
  const [loading, setLoading] = useState(false);
  const [yearlyData, setYearlyData] = useState([]);
  const [monthlyData, setMonthlyData] = useState([]);
  
  // Import Historical Data
  const [importFile, setImportFile] = useState(null);
  const [importLoading, setImportLoading] = useState(false);

  // Monthly Entry Form
  const [formData, setFormData] = useState({
    year: new Date().getFullYear(),
    month: new Date().getMonth() + 1,
    zone: 'Agra',
    
    cwInMessages: 0,
    cwOutMessages: 0,
    cwInGroups: 0,
    cwOutGroups: 0,
    
    polnetInMessages: 0,
    polnetOutMessages: 0,
    polnetInGroups: 0,
    polnetOutGroups: 0,
    
    prmInMessages: 0,
    prmOutMessages: 0,
    prmInGroups: 0,
    prmOutGroups: 0,
    
    vhfRgInMessages: 0,
    vhfRgOutMessages: 0,
    vhfRgInGroups: 0,
    vhfRgOutGroups: 0,
    
    vhfEventsInMessages: 0,
    vhfEventsOutMessages: 0,
    vhfEventsInGroups: 0,
    vhfEventsOutGroups: 0,
    
    remarks: ''
  });

  const zones = ['Agra', 'Bareilly', 'Kanpur', 'Prayagraj', 'Gorakhpur', 'Varanasi', 'Meerut', 'Lucknow', 'RHQ'];
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  useEffect(() => {
    if (activeTab === 'view') {
      fetchMonthlyData();
    }
  }, [activeTab]);

  const fetchMonthlyData = async () => {
    try {
      setLoading(true);
      const response = await tfcAPI.getMonthly({});
      setMonthlyData(response.data.data);
    } catch (error) {
      console.error('Error fetching monthly data:', error);
      alert('Error loading data');
    } finally {
      setLoading(false);
    }
  };

  const handleImportFile = async () => {
    if (!importFile) {
      alert('Please select a file first!');
      return;
    }

    const formData = new FormData();
    formData.append('file', importFile);

    try {
      setImportLoading(true);
      const response = await tfcAPI.importYearly(formData);
      alert(response.data.message);
      setImportFile(null);
      setActiveTab('view');
    } catch (error) {
      console.error('Import error:', error);
      alert('Error: ' + (error.response?.data?.message || 'Import failed'));
    } finally {
      setImportLoading(false);
    }
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: name === 'zone' ? value : (value === '' ? 0 : parseInt(value))
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      await tfcAPI.createMonthly(formData);
      alert('Data saved successfully!');
      
      // Reset form
      setFormData({
        ...formData,
        cwInMessages: 0,
        cwOutMessages: 0,
        cwInGroups: 0,
        cwOutGroups: 0,
        polnetInMessages: 0,
        polnetOutMessages: 0,
        polnetInGroups: 0,
        polnetOutGroups: 0,
        prmInMessages: 0,
        prmOutMessages: 0,
        prmInGroups: 0,
        prmOutGroups: 0,
        vhfRgInMessages: 0,
        vhfRgOutMessages: 0,
        vhfRgInGroups: 0,
        vhfRgOutGroups: 0,
        vhfEventsInMessages: 0,
        vhfEventsOutMessages: 0,
        vhfEventsInGroups: 0,
        vhfEventsOutGroups: 0,
        remarks: ''
      });
      
      setActiveTab('view');
    } catch (error) {
      console.error('Error saving data:', error);
      alert('Error: ' + (error.response?.data?.message || 'Save failed'));
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this entry?')) return;

    try {
      await tfcAPI.deleteMonthly(id);
      alert('Entry deleted successfully!');
      fetchMonthlyData();
    } catch (error) {
      console.error('Delete error:', error);
      alert('Error: ' + (error.response?.data?.message || 'Delete failed'));
    }
  };

  const isRHQ = formData.zone === 'RHQ';

  return (
    <Layout>
      <div className="p-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-800">TFC Store Management</h1>
          <p className="text-gray-600 mt-1">Manage TFC message data and imports</p>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-xl shadow-md mb-6">
          <div className="flex border-b">
            <button
              onClick={() => setActiveTab('import')}
              className={`px-6 py-4 font-semibold transition ${
                activeTab === 'import'
                  ? 'border-b-2 border-blue-600 text-blue-600'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              Import Historical Data
            </button>
            <button
              onClick={() => setActiveTab('entry')}
              className={`px-6 py-4 font-semibold transition ${
                activeTab === 'entry'
                  ? 'border-b-2 border-blue-600 text-blue-600'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              Monthly Data Entry
            </button>
            <button
              onClick={() => setActiveTab('view')}
              className={`px-6 py-4 font-semibold transition ${
                activeTab === 'view'
                  ? 'border-b-2 border-blue-600 text-blue-600'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              View Entries
            </button>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {/* Import Historical Data Tab */}
            {activeTab === 'import' && (
              <div>
                <h2 className="text-xl font-bold text-gray-800 mb-4">
                  Import Yearly Data (2021-2024)
                </h2>
                <p className="text-gray-600 mb-6">
                  Upload Excel file containing historical yearly data (2021-2024)
                </p>

                <div className="max-w-md">
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Select Excel File
                    </label>
                    <input
                      type="file"
                      accept=".xlsx,.xls"
                      onChange={(e) => setImportFile(e.target.files[0])}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <button
                    onClick={handleImportFile}
                    disabled={!importFile || importLoading}
                    className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {importLoading ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                        Importing...
                      </>
                    ) : (
                      <>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                        </svg>
                        Upload & Import
                      </>
                    )}
                  </button>

                  <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="text-sm text-yellow-800">
                      <strong>Note:</strong> This will import all yearly data (2021-2024) from the Excel file. 
                      Existing data will be replaced.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Monthly Data Entry Tab */}
            {activeTab === 'entry' && (
              <div>
                <h2 className="text-xl font-bold text-gray-800 mb-4">
                  Add Monthly Data (2025 onwards)
                </h2>

                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Year, Month, Zone Selection */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Year *
                      </label>
                      <select
                        name="year"
                        value={formData.year}
                        onChange={handleFormChange}
                        required
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
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
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Month *
                      </label>
                      <select
                        name="month"
                        value={formData.month}
                        onChange={handleFormChange}
                        required
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      >
                        {months.map((month, index) => (
                          <option key={month} value={index + 1}>
                            {month}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Zone *
                      </label>
                      <select
                        name="zone"
                        value={formData.zone}
                        onChange={handleFormChange}
                        required
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      >
                        {zones.map(zone => (
                          <option key={zone} value={zone}>{zone}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* CW Data */}
                  <div className="border rounded-lg p-4">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">CW Data</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">IN Messages</label>
                        <input type="number" name="cwInMessages" value={formData.cwInMessages} onChange={handleFormChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">OUT Messages</label>
                        <input type="number" name="cwOutMessages" value={formData.cwOutMessages} onChange={handleFormChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">IN Groups</label>
                        <input type="number" name="cwInGroups" value={formData.cwInGroups} onChange={handleFormChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">OUT Groups</label>
                        <input type="number" name="cwOutGroups" value={formData.cwOutGroups} onChange={handleFormChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg" />
                      </div>
                    </div>
                  </div>

                  {/* POLNET Data */}
                  <div className="border rounded-lg p-4">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">POLNET Data</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">IN Messages</label>
                        <input type="number" name="polnetInMessages" value={formData.polnetInMessages} onChange={handleFormChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">OUT Messages</label>
                        <input type="number" name="polnetOutMessages" value={formData.polnetOutMessages} onChange={handleFormChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">IN Groups</label>
                        <input type="number" name="polnetInGroups" value={formData.polnetInGroups} onChange={handleFormChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">OUT Groups</label>
                        <input type="number" name="polnetOutGroups" value={formData.polnetOutGroups} onChange={handleFormChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg" />
                      </div>
                    </div>
                  </div>

                  {/* PRM Data */}
                  <div className="border rounded-lg p-4">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">PRM (Police Radio Mail)</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">IN Messages</label>
                        <input type="number" name="prmInMessages" value={formData.prmInMessages} onChange={handleFormChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">OUT Messages</label>
                        <input type="number" name="prmOutMessages" value={formData.prmOutMessages} onChange={handleFormChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">IN Groups</label>
                        <input type="number" name="prmInGroups" value={formData.prmInGroups} onChange={handleFormChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">OUT Groups</label>
                        <input type="number" name="prmOutGroups" value={formData.prmOutGroups} onChange={handleFormChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg" />
                      </div>
                    </div>
                  </div>

                  {/* VHF RG Data - Hidden for RHQ */}
                  {!isRHQ && (
                    <div className="border rounded-lg p-4">
                      <h3 className="text-lg font-semibold text-gray-800 mb-4">VHF RG Data</h3>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">IN Messages</label>
                          <input type="number" name="vhfRgInMessages" value={formData.vhfRgInMessages} onChange={handleFormChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg" />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">OUT Messages</label>
                          <input type="number" name="vhfRgOutMessages" value={formData.vhfRgOutMessages} onChange={handleFormChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg" />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">IN Groups</label>
                          <input type="number" name="vhfRgInGroups" value={formData.vhfRgInGroups} onChange={handleFormChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg" />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">OUT Groups</label>
                          <input type="number" name="vhfRgOutGroups" value={formData.vhfRgOutGroups} onChange={handleFormChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg" />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* VHF Events Data - Hidden for RHQ */}
                  {!isRHQ && (
                    <div className="border rounded-lg p-4">
                      <h3 className="text-lg font-semibold text-gray-800 mb-4">VHF Events Data</h3>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">IN Messages</label>
                          <input type="number" name="vhfEventsInMessages" value={formData.vhfEventsInMessages} onChange={handleFormChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg" />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">OUT Messages</label>
                          <input type="number" name="vhfEventsOutMessages" value={formData.vhfEventsOutMessages} onChange={handleFormChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg" />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">IN Groups</label>
                          <input type="number" name="vhfEventsInGroups" value={formData.vhfEventsInGroups} onChange={handleFormChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg" />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">OUT Groups</label>
                          <input type="number" name="vhfEventsOutGroups" value={formData.vhfEventsOutGroups} onChange={handleFormChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg" />
                        </div>
                      </div>
                    </div>
                  )}

                  {isRHQ && (
                    <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <p className="text-sm text-blue-800">
                        ℹ️ <strong>Note:</strong> VHF facilities are not available at RHQ
                      </p>
                    </div>
                  )}

                  {/* Remarks */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Remarks (Optional)
                    </label>
                    <textarea
                      name="remarks"
                      value={formData.remarks}
                      onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                      rows={3}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="Any additional notes..."
                    />
                  </div>

                  {/* Submit Button */}
                  <div className="flex justify-end gap-4">
                    <button
                      type="button"
                      onClick={() => setActiveTab('view')}
                      className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-semibold"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      {loading ? (
                        <>
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                          Saving...
                        </>
                      ) : (
                        'Save Entry'
                      )}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* View Entries Tab */}
            {activeTab === 'view' && (
              <div>
                <h2 className="text-xl font-bold text-gray-800 mb-4">All Entries</h2>

                {loading ? (
                  <div className="flex justify-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                  </div>
                ) : monthlyData.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <p>No entries found. Add your first entry!</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50 border-b">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Year</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Month</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Zone</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Messages</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Groups</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {monthlyData.map((entry) => {
                          const totalMessages = 
                            entry.cwInMessages + entry.cwOutMessages +
                            entry.polnetInMessages + entry.polnetOutMessages +
                            entry.prmInMessages + entry.prmOutMessages +
                            entry.vhfRgInMessages + entry.vhfRgOutMessages +
                            entry.vhfEventsInMessages + entry.vhfEventsOutMessages;
                          
                          const totalGroups =
                            entry.cwInGroups + entry.cwOutGroups +
                            entry.polnetInGroups + entry.polnetOutGroups +
                            entry.prmInGroups + entry.prmOutGroups +
                            entry.vhfRgInGroups + entry.vhfRgOutGroups +
                            entry.vhfEventsInGroups + entry.vhfEventsOutGroups;

                          return (
                            <tr key={entry._id} className="hover:bg-gray-50">
                              <td className="px-4 py-3 text-sm text-gray-900">{entry.year}</td>
                              <td className="px-4 py-3 text-sm text-gray-900">{months[entry.month - 1]}</td>
                              <td className="px-4 py-3 text-sm text-gray-900">{entry.zone}</td>
                              <td className="px-4 py-3 text-sm text-gray-900">{totalMessages.toLocaleString()}</td>
                              <td className="px-4 py-3 text-sm text-gray-900">{totalGroups.toLocaleString()}</td>
                              <td className="px-4 py-3 text-sm space-x-2">
                                <button
                                  onClick={() => handleDelete(entry._id)}
                                  className="text-red-600 hover:text-red-800 font-semibold"
                                >
                                  Delete
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default TFCManagement;