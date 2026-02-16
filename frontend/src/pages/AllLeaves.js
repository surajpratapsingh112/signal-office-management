import React, { useState, useEffect } from 'react';
import { leavesAPI, employeesAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import Layout from '../components/Layout';

const AllLeaves = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [leaves, setLeaves] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [filters, setFilters] = useState({
    employee: '',
    status: '',
    leaveType: '',
    startDate: '',
    endDate: '',
    searchText: ''
  });
  const [selectedLeave, setSelectedLeave] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [leavesRes, employeesRes] = await Promise.all([
        leavesAPI.getAll(),
        employeesAPI.getAll()
      ]);

      setLeaves(leavesRes.data.data);
      setEmployees(employeesRes.data.data);
    } catch (error) {
      console.error('Error fetching data:', error);
      alert('Error loading data');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (leaveId, employeeName) => {
    if (!window.confirm(`क्या आप ${employeeName} की leave record को delete करना चाहते हैं?\n\nBalance restore हो जाएगा।`)) {
      return;
    }

    try {
      await leavesAPI.delete(leaveId);
      alert('Leave record deleted successfully!');
      fetchData();
    } catch (error) {
      console.error('Error:', error);
      alert('Error: ' + (error.response?.data?.message || 'Failed to delete'));
    }
  };

  const handleEdit = (leave) => {
    setSelectedLeave(leave);
    setShowEditModal(true);
  };

  const handleResetFilters = () => {
    setFilters({
      employee: '',
      status: '',
      leaveType: '',
      startDate: '',
      endDate: '',
      searchText: ''
    });
  };

  // Filter leaves
  const filteredLeaves = leaves.filter(leave => {
    // Employee filter
    if (filters.employee && leave.employee._id !== filters.employee) {
      return false;
    }

    // Status filter
    if (filters.status && leave.status !== filters.status) {
      return false;
    }

    // Leave type filter
    if (filters.leaveType && leave.leaveType !== filters.leaveType) {
      return false;
    }

    // Date range filter
    if (filters.startDate) {
      const leaveStart = new Date(leave.startDate);
      const filterStart = new Date(filters.startDate);
      if (leaveStart < filterStart) return false;
    }

    if (filters.endDate) {
      const leaveEnd = new Date(leave.endDate);
      const filterEnd = new Date(filters.endDate);
      if (leaveEnd > filterEnd) return false;
    }

    // Search text filter (name, pno, rank)
    if (filters.searchText) {
      const searchLower = filters.searchText.toLowerCase();
      const nameMatch = leave.employee.name.toLowerCase().includes(searchLower);
      const pnoMatch = leave.employee.pno.toLowerCase().includes(searchLower);
      const rankMatch = leave.employee.rank.toLowerCase().includes(searchLower);
      
      if (!nameMatch && !pnoMatch && !rankMatch) return false;
    }

    return true;
  });

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
          <h1 className="text-3xl font-bold text-gray-800">All Leaves Management</h1>
          <p className="text-gray-600 mt-1">View, Edit, and Delete all leave records</p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-6">
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
            {/* Search Text */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Search (Name/PNO/Rank)
              </label>
              <input
                type="text"
                value={filters.searchText}
                onChange={(e) => setFilters({ ...filters, searchText: e.target.value })}
                placeholder="Type to search..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Employee Dropdown */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Employee
              </label>
              <select
                value={filters.employee}
                onChange={(e) => setFilters({ ...filters, employee: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Employees</option>
                {employees.map(emp => (
                  <option key={emp._id} value={emp._id}>
                    {emp.name} - {emp.rank}
                  </option>
                ))}
              </select>
            </div>

            {/* Status */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <select
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Status</option>
                <option value="ON_LEAVE">On Leave</option>
                <option value="RETURNED">Returned</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
            </div>

            {/* Leave Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Leave Type
              </label>
              <select
                value={filters.leaveType}
                onChange={(e) => setFilters({ ...filters, leaveType: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Types</option>
                <option value="CL">CL - Casual Leave</option>
                <option value="RL">RL - Restricted Leave</option>
                <option value="EL">EL - Earned Leave</option>
                <option value="MEDICAL">Medical Leave</option>
                <option value="MATERNITY">Maternity Leave</option>
                <option value="CCL">CCL</option>
              </select>
            </div>

            {/* Start Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                From Date
              </label>
              <input
                type="date"
                value={filters.startDate}
                onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* End Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                To Date
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

          {/* Results Count */}
          <div className="mt-4 pt-4 border-t">
            <p className="text-sm text-gray-600">
              Showing <span className="font-bold text-blue-600">{filteredLeaves.length}</span> of <span className="font-bold">{leaves.length}</span> total leaves
            </p>
          </div>
        </div>

        {/* Leaves Table */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="p-6 border-b">
            <h2 className="text-xl font-bold text-gray-800">Leave Records ({filteredLeaves.length})</h2>
          </div>

          {filteredLeaves.length === 0 ? (
            <div className="p-12 text-center text-gray-500">
              No leaves found matching your filters
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">S.No</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Employee</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Leave Type</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Duration</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Days</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Arrival</th>
                    {user?.role === 'office_admin' && (
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredLeaves.map((leave, index) => (
                    <tr key={leave._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{index + 1}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{leave.employee.name}</div>
                        <div className="text-xs text-gray-500">{leave.employee.rank} - {leave.employee.pno}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                          leave.leaveType === 'CL' ? 'bg-blue-100 text-blue-800' :
                          leave.leaveType === 'RL' ? 'bg-purple-100 text-purple-800' :
                          leave.leaveType === 'EL' ? 'bg-green-100 text-green-800' :
                          leave.leaveType === 'MEDICAL' ? 'bg-red-100 text-red-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {leave.leaveType}
                        </span>
                        {leave.medicalRestStartDate && (
                          <div className="mt-1">
                            <span className="px-2 py-1 text-xs font-semibold rounded-full bg-pink-100 text-pink-800">
                              + Medical
                            </span>
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div>{new Date(leave.startDate).toLocaleDateString('hi-IN')}</div>
                        <div className="text-xs text-gray-500">to</div>
                        <div>{new Date(leave.endDate).toLocaleDateString('hi-IN')}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                        {leave.totalDays} days
                        {leave.permissionsUsed > 0 && (
                          <div className="text-xs text-orange-600">+{leave.permissionsUsed} perm</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                          leave.status === 'ON_LEAVE' ? 'bg-blue-100 text-blue-800' :
                          leave.status === 'RETURNED' ? 'bg-green-100 text-green-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {leave.status === 'ON_LEAVE' ? 'On Leave' :
                           leave.status === 'RETURNED' ? 'Returned' :
                           leave.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-semibold text-green-600">
                          {new Date(leave.arrivalDate).toLocaleDateString('hi-IN')}
                        </div>
                        <div className="text-xs text-gray-500">
                          {new Date(leave.arrivalDate).toLocaleDateString('en-US', { weekday: 'short' })}
                        </div>
                      </td>
                      {user?.role === 'office_admin' && (
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleEdit(leave)}
                              className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded hover:bg-indigo-200 font-semibold"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDelete(leave._id, leave.employee.name)}
                              className="px-3 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200 font-semibold"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Edit Modal */}
        {showEditModal && selectedLeave && (
          <EditLeaveModal
            leave={selectedLeave}
            onClose={() => {
              setShowEditModal(false);
              setSelectedLeave(null);
            }}
            onSuccess={() => {
              setShowEditModal(false);
              setSelectedLeave(null);
              fetchData();
            }}
          />
        )}
      </div>
    </Layout>
  );
};

// Edit Leave Modal Component (Same as LeaveDashboard)
const EditLeaveModal = ({ leave, onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    startDate: new Date(leave.startDate).toISOString().split('T')[0],
    endDate: new Date(leave.endDate).toISOString().split('T')[0],
    remarks: leave.remarks || ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!window.confirm('क्या आप इस leave record को update करना चाहते हैं?')) {
      return;
    }

    setLoading(true);

    try {
      await leavesAPI.update(leave._id, formData);
      alert('Leave updated successfully!');
      onSuccess();
    } catch (error) {
      console.error('Error:', error);
      alert('Error: ' + (error.response?.data?.message || 'Failed to update'));
    } finally {
      setLoading(false);
    }
  };

  const totalDays = Math.ceil(
    (new Date(formData.endDate) - new Date(formData.startDate)) / (1000 * 60 * 60 * 24)
  ) + 1;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl max-w-2xl w-full" onClick={(e) => e.stopPropagation()}>
        <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 text-white p-6 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">Edit Leave - {leave.employee.name}</h2>
            <button onClick={onClose} className="text-white hover:bg-indigo-500 rounded-full p-2">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="p-4 bg-blue-50 rounded-lg">
            <h3 className="font-bold text-blue-800 mb-2">Current Leave:</h3>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-gray-600">Leave Type</p>
                <p className="font-semibold">{leave.leaveType}</p>
              </div>
              <div>
                <p className="text-gray-600">Status</p>
                <p className="font-semibold">{leave.status}</p>
              </div>
              <div>
                <p className="text-gray-600">Duration</p>
                <p className="font-semibold">{leave.totalDays} days</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Start Date *
              </label>
              <input
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                End Date *
              </label>
              <input
                type="date"
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                required
                min={formData.startDate}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Remarks (Optional)
            </label>
            <textarea
              value={formData.remarks}
              onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
              rows="2"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="p-4 bg-indigo-50 rounded-lg">
            <h3 className="font-bold text-indigo-800 mb-2">New Duration:</h3>
            <div className="text-sm">
              <p><span className="font-semibold">Total Days:</span> {totalDays}</p>
              <p><span className="font-semibold">Arrival Date:</span> {new Date(new Date(formData.endDate).getTime() + 24*60*60*1000).toLocaleDateString('hi-IN')}</p>
            </div>
          </div>

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
              disabled={loading}
              className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-semibold disabled:bg-indigo-400"
            >
              {loading ? 'Updating...' : 'Update Leave'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AllLeaves;