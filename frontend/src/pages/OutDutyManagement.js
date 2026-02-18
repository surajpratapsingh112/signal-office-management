import React, { useState, useEffect } from 'react';
import { outDutyAPI, employeesAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import Layout from '../components/Layout';

const OutDutyManagement = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [outDuties, setOutDuties] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [filterStatus, setFilterStatus] = useState('ONGOING');
  const [filterType, setFilterType] = useState('');
  const [activeTab, setActiveTab] = useState('ALL'); // ALL, OUT_DUTY, TRAINING

  useEffect(() => {
    fetchData();
  }, [filterStatus]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [outDutiesRes, employeesRes] = await Promise.all([
        outDutyAPI.getAll({ status: filterStatus }),
        employeesAPI.getAll()
      ]);

      setOutDuties(outDutiesRes.data.data);
      setEmployees(employeesRes.data.data);
    } catch (error) {
      console.error('Error fetching data:', error);
      alert('Error loading data');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkReturn = async (id) => {
    if (!window.confirm('क्या आप इस employee की वापसी mark करना चाहते हैं?')) {
      return;
    }

    try {
      await outDutyAPI.markReturn(id, new Date().toISOString());
      alert('Return marked successfully!');
      fetchData();
    } catch (error) {
      console.error('Error:', error);
      alert('Error: ' + (error.response?.data?.message || 'Failed to mark return'));
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('क्या आप इस entry को delete करना चाहते हैं?')) {
      return;
    }

    try {
      await outDutyAPI.delete(id);
      alert('Entry deleted successfully!');
      fetchData();
    } catch (error) {
      console.error('Error:', error);
      alert('Error: ' + (error.response?.data?.message || 'Failed to delete'));
    }
  };

  const formatDate = (date) => {
    if (!date) return 'TBD';
    return new Date(date).toLocaleDateString('en-IN');
  };

  const getDutyTypeLabel = (type) => {
    const labels = {
      'OUT_DUTY': 'आउट ड्यूटी',
      'TRAINING_OUTSIDE_DISTRICT': 'ट्रेनिंग (जनपद से बाहर)',
      'TRAINING_WITHIN_DISTRICT': 'ट्रेनिंग (जनपद में)',
      'TRAINING_HQ': 'विभागीय ट्रेनिंग (मुख्यालय)',
      'DEPUTATION': 'प्रतिनियुक्ति',
      'OFFICIAL_TOUR': 'सरकारी दौरा'
    };
    return labels[type] || type;
  };

  const getDutyTypeColor = (type) => {
    const colors = {
      'OUT_DUTY': 'bg-orange-100 text-orange-800',
      'TRAINING_OUTSIDE_DISTRICT': 'bg-blue-100 text-blue-800',
      'TRAINING_WITHIN_DISTRICT': 'bg-cyan-100 text-cyan-800',
      'TRAINING_HQ': 'bg-purple-100 text-purple-800',
      'DEPUTATION': 'bg-indigo-100 text-indigo-800',
      'OFFICIAL_TOUR': 'bg-green-100 text-green-800'
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
  };

  const getStatusBadge = (status) => {
    const badges = {
      'ONGOING': 'bg-yellow-100 text-yellow-800',
      'RETURNED': 'bg-green-100 text-green-800',
      'CANCELLED': 'bg-red-100 text-red-800'
    };
    return badges[status] || 'bg-gray-100 text-gray-800';
  };

  // Filter duties based on active tab
  const getFilteredDuties = () => {
    let filtered = outDuties;

    // Filter by tab
    if (activeTab === 'OUT_DUTY') {
      filtered = filtered.filter(d => d.dutyType === 'OUT_DUTY' || d.dutyType === 'DEPUTATION' || d.dutyType === 'OFFICIAL_TOUR');
    } else if (activeTab === 'TRAINING') {
      filtered = filtered.filter(d => 
        d.dutyType === 'TRAINING_OUTSIDE_DISTRICT' || 
        d.dutyType === 'TRAINING_WITHIN_DISTRICT' || 
        d.dutyType === 'TRAINING_HQ'
      );
    }

    // Filter by type
    if (filterType) {
      filtered = filtered.filter(d => d.dutyType === filterType);
    }

    return filtered;
  };

  const filteredDuties = getFilteredDuties();

  // Stats
  const stats = {
    totalOngoing: outDuties.filter(d => d.status === 'ONGOING').length,
    ongoingOutDuty: outDuties.filter(d => d.status === 'ONGOING' && (d.dutyType === 'OUT_DUTY' || d.dutyType === 'DEPUTATION' || d.dutyType === 'OFFICIAL_TOUR')).length,
    ongoingTraining: outDuties.filter(d => d.status === 'ONGOING' && (d.dutyType.includes('TRAINING'))).length,
    returned: outDuties.filter(d => d.status === 'RETURNED').length
  };

  const handleExportReport = () => {
    // Create CSV content
    const headers = ['Employee Name', 'PNO', 'Rank', 'Type', 'Location', 'Start Date', 'Return Date', 'Status'];
    const rows = filteredDuties.map(d => [
      d.employee?.name,
      d.employee?.pno,
      d.employee?.rank,
      getDutyTypeLabel(d.dutyType),
      d.location,
      formatDate(d.startDate),
      d.status === 'RETURNED' ? formatDate(d.actualReturnDate) : formatDate(d.returnDate),
      d.status
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    // Download
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `out-duty-report-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

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
          <h1 className="text-3xl font-bold text-gray-800">आउट ड्यूटी एवं ट्रेनिंग प्रबंधन</h1>
          <p className="text-gray-600 mt-1">
            Out Duty और Training के लिए employee tracking
          </p>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-xl shadow-md mb-6">
          <div className="flex border-b">
            <button
              onClick={() => setActiveTab('ALL')}
              className={`px-6 py-4 font-semibold transition ${
                activeTab === 'ALL'
                  ? 'border-b-2 border-blue-600 text-blue-600'
                  : 'text-gray-600 hover:text-blue-600'
              }`}
            >
              सभी ({outDuties.length})
            </button>
            <button
              onClick={() => setActiveTab('OUT_DUTY')}
              className={`px-6 py-4 font-semibold transition ${
                activeTab === 'OUT_DUTY'
                  ? 'border-b-2 border-blue-600 text-blue-600'
                  : 'text-gray-600 hover:text-blue-600'
              }`}
            >
              आउट ड्यूटी ({stats.ongoingOutDuty})
            </button>
            <button
              onClick={() => setActiveTab('TRAINING')}
              className={`px-6 py-4 font-semibold transition ${
                activeTab === 'TRAINING'
                  ? 'border-b-2 border-blue-600 text-blue-600'
                  : 'text-gray-600 hover:text-blue-600'
              }`}
            >
              ट्रेनिंग ({stats.ongoingTraining})
            </button>
          </div>

          {/* Filters */}
          <div className="p-6">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-4 flex-wrap">
                {/* Status Filter */}
                <div className="flex items-center gap-2">
                  <label className="text-sm font-medium text-gray-700">
                    Status:
                  </label>
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">All</option>
                    <option value="ONGOING">Ongoing</option>
                    <option value="RETURNED">Returned</option>
                    <option value="CANCELLED">Cancelled</option>
                  </select>
                </div>

                {/* Type Filter */}
                <div className="flex items-center gap-2">
                  <label className="text-sm font-medium text-gray-700">
                    Type:
                  </label>
                  <select
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">All Types</option>
                    <option value="OUT_DUTY">आउट ड्यूटी</option>
                    <option value="TRAINING_OUTSIDE_DISTRICT">ट्रेनिंग (जनपद से बाहर)</option>
                    <option value="TRAINING_WITHIN_DISTRICT">ट्रेनिंग (जनपद में)</option>
                    <option value="TRAINING_HQ">विभागीय ट्रेनिंग</option>
                    <option value="DEPUTATION">प्रतिनियुक्ति</option>
                    <option value="OFFICIAL_TOUR">सरकारी दौरा</option>
                  </select>
                </div>

                {/* Export Button */}
                <button
                  onClick={handleExportReport}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold flex items-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Export Report
                </button>
              </div>

              {/* Add Button */}
              {user?.role === 'office_admin' && (
                <button
                  onClick={() => setShowAddModal(true)}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold flex items-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Add Entry
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <div className="bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-xl shadow-lg p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-yellow-100 text-sm font-medium">Currently Out</p>
                <p className="text-3xl font-bold mt-1">{stats.totalOngoing}</p>
              </div>
              <div className="bg-white bg-opacity-30 rounded-full p-3">
                <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"/>
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-orange-400 to-orange-600 rounded-xl shadow-lg p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-100 text-sm font-medium">On Out Duty</p>
                <p className="text-3xl font-bold mt-1">{stats.ongoingOutDuty}</p>
              </div>
              <div className="bg-white bg-opacity-30 rounded-full p-3">
                <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd"/>
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-blue-400 to-blue-600 rounded-xl shadow-lg p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm font-medium">On Training</p>
                <p className="text-3xl font-bold mt-1">{stats.ongoingTraining}</p>
              </div>
              <div className="bg-white bg-opacity-30 rounded-full p-3">
                <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3zM3.31 9.397L5 10.12v4.102a8.969 8.969 0 00-1.05-.174 1 1 0 01-.89-.89 11.115 11.115 0 01.25-3.762zM9.3 16.573A9.026 9.026 0 007 14.935v-3.957l1.818.78a3 3 0 002.364 0l5.508-2.361a11.026 11.026 0 01.25 3.762 1 1 0 01-.89.89 8.968 8.968 0 00-5.35 2.524 1 1 0 01-1.4 0zM6 18a1 1 0 001-1v-2.065a8.935 8.935 0 00-2-.712V17a1 1 0 001 1z"/>
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-green-400 to-green-600 rounded-xl shadow-lg p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm font-medium">Returned</p>
                <p className="text-3xl font-bold mt-1">{stats.returned}</p>
              </div>
              <div className="bg-white bg-opacity-30 rounded-full p-3">
                <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Table */}
        {filteredDuties.length === 0 ? (
          <div className="bg-white rounded-xl shadow-md p-12 text-center">
            <svg className="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h3 className="text-lg font-semibold text-gray-700 mb-2">No Entries Found</h3>
            <p className="text-gray-500">
              {filterStatus ? `No ${filterStatus.toLowerCase()} entries` : 'No entries found'}
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-md overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b-2 border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase">Employee</th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase">Type</th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase">Location</th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase">Start Date</th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase">Return Date</th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase">Status</th>
                    <th className="px-6 py-3 text-center text-xs font-bold text-gray-600 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredDuties.map((duty) => (
                    <tr key={duty._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{duty.employee?.name}</div>
                          <div className="text-xs text-gray-500">
                            {duty.employee?.rank} - {duty.employee?.pno}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold ${getDutyTypeColor(duty.dutyType)}`}>
                          {getDutyTypeLabel(duty.dutyType)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">{duty.location}</td>
                      <td className="px-6 py-4 text-sm text-gray-900">{formatDate(duty.startDate)}</td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">
                          {duty.status === 'RETURNED' 
                            ? formatDate(duty.actualReturnDate)
                            : formatDate(duty.returnDate)
                          }
                        </div>
                        {duty.status === 'RETURNED' && duty.returnDate && (
                          <div className="text-xs text-gray-500">
                            Expected: {formatDate(duty.returnDate)}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold ${getStatusBadge(duty.status)}`}>
                          {duty.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          {duty.status === 'ONGOING' && user?.role === 'office_admin' && (
                            <button
                              onClick={() => handleMarkReturn(duty._id)}
                              className="px-3 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 font-semibold"
                            >
                              Mark Return
                            </button>
                          )}
                          
                          {user?.role === 'office_admin' && (
                            <button
                              onClick={() => handleDelete(duty._id)}
                              className="px-3 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700 font-semibold"
                            >
                              Delete
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Add Modal */}
        {showAddModal && (
          <AddOutDutyModal
            employees={employees}
            onClose={() => setShowAddModal(false)}
            onSuccess={() => {
              setShowAddModal(false);
              fetchData();
            }}
          />
        )}
      </div>
    </Layout>
  );
};

// Add Out Duty Modal Component
const AddOutDutyModal = ({ employees, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    employee: '',
    dutyType: 'OUT_DUTY',
    location: '',
    purpose: '',
    startDate: '',
    returnDate: '',
    orderNumber: '',
    orderDate: '',
    remarks: ''
  });
  const [saving, setSaving] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.employee || !formData.location || !formData.startDate) {
      alert('कृपया सभी required fields भरें!');
      return;
    }

    setSaving(true);

    try {
      await outDutyAPI.create(formData);
      alert('Entry added successfully!');
      onSuccess();
    } catch (error) {
      console.error('Error:', error);
      alert('Error: ' + (error.response?.data?.message || 'Failed to add entry'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">Add Out Duty / Training</h2>
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Employee */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Employee *
              </label>
              <select
                name="employee"
                value={formData.employee}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">-- Select Employee --</option>
                {employees.map(emp => (
                  <option key={emp._id} value={emp._id}>
                    {emp.name} - {emp.rank} ({emp.pno})
                  </option>
                ))}
              </select>
            </div>

            {/* Duty Type */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Type *
              </label>
              <select
                name="dutyType"
                value={formData.dutyType}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <optgroup label="Out Duty">
                  <option value="OUT_DUTY">आउट ड्यूटी</option>
                  <option value="DEPUTATION">प्रतिनियुक्ति</option>
                  <option value="OFFICIAL_TOUR">सरकारी दौरा</option>
                </optgroup>
                <optgroup label="Training">
                  <option value="TRAINING_OUTSIDE_DISTRICT">ट्रेनिंग (जनपद से बाहर)</option>
                  <option value="TRAINING_WITHIN_DISTRICT">ट्रेनिंग (जनपद में)</option>
                  <option value="TRAINING_HQ">विभागीय ट्रेनिंग (मुख्यालय)</option>
                </optgroup>
              </select>
            </div>

            {/* Location */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Location *
              </label>
              <input
                type="text"
                name="location"
                value={formData.location}
                onChange={handleChange}
                required
                placeholder="e.g., Delhi, Varanasi, मुख्यालय, etc."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Start Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Start Date *
              </label>
              <input
                type="date"
                name="startDate"
                value={formData.startDate}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Purpose */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Purpose / Details
              </label>
              <textarea
                name="purpose"
                value={formData.purpose}
                onChange={handleChange}
                rows={2}
                placeholder="Purpose or details of duty/training"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Return Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Expected Return Date (optional)
              </label>
              <input
                type="date"
                name="returnDate"
                value={formData.returnDate}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-gray-500 mt-1">Leave blank if TBD</p>
            </div>

            {/* Order Number */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Order Number
              </label>
              <input
                type="text"
                name="orderNumber"
                value={formData.orderNumber}
                onChange={handleChange}
                placeholder="e.g., 123/2026"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Order Date */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Order Date
              </label>
              <input
                type="date"
                name="orderDate"
                value={formData.orderDate}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Remarks */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Remarks
              </label>
              <textarea
                name="remarks"
                value={formData.remarks}
                onChange={handleChange}
                rows={2}
                placeholder="Any additional remarks"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
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
              Save Entry
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default OutDutyManagement;