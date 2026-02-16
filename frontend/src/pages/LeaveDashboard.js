import React, { useState, useEffect } from 'react';
import { leavesAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import Layout from '../components/Layout';
import { useNavigate } from 'react-router-dom';

const LeaveDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [onLeave, setOnLeave] = useState([]);
  const [arrivals, setArrivals] = useState({
    today: [],
    tomorrow: [],
    upcoming: []
  });
  const [pendingApprovals, setPendingApprovals] = useState([]);
  const [selectedLeave, setSelectedLeave] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showExtendCLModal, setShowExtendCLModal] = useState(false);
  const [showAddMedicalModal, setShowAddMedicalModal] = useState(false);
  const [showExtendMedicalModal, setShowExtendMedicalModal] = useState(false);
  const [showApproveMedicalModal, setShowApproveMedicalModal] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const promises = [
        leavesAPI.getCurrentlyOnLeave(),
        leavesAPI.getArrivals()
      ];

      // Only admin can see pending approvals
      if (user?.role === 'office_admin') {
        promises.push(leavesAPI.getPendingApprovals());
      }

      const results = await Promise.all(promises);

      setOnLeave(results[0].data.data);
      setArrivals(results[1].data.data);
      
      if (user?.role === 'office_admin' && results[2]) {
        setPendingApprovals(results[2].data.data);
      }
    } catch (error) {
      console.error('Error fetching leave data:', error);
      alert('Error loading data');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkReturned = async (leaveId, employeeName) => {
    if (!window.confirm(`क्या ${employeeName} return हो गए हैं?`)) {
      return;
    }

    try {
      await leavesAPI.markReturned(leaveId);
      alert('Employee marked as returned!');
      fetchData();
    } catch (error) {
      console.error('Error:', error);
      alert('Error: ' + (error.response?.data?.message || 'Failed to update'));
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

  const handleViewDetails = async (leave) => {
    try {
      const response = await leavesAPI.getOne(leave._id);
      setSelectedLeave(response.data.data);
      setShowDetailModal(true);
    } catch (error) {
      console.error('Error fetching leave details:', error);
      alert('Error loading details');
    }
  };

  const handleEdit = (leave) => {
    setSelectedLeave(leave);
    setShowEditModal(true);
  };

  const handleExtendCL = (leave) => {
    setSelectedLeave(leave);
    setShowExtendCLModal(true);
  };

  const handleAddMedical = (leave) => {
    setSelectedLeave(leave);
    setShowAddMedicalModal(true);
  };

  const handleExtendMedical = (leave) => {
    setSelectedLeave(leave);
    setShowExtendMedicalModal(true);
  };

  const handleApproveMedical = (leave) => {
    setSelectedLeave(leave);
    setShowApproveMedicalModal(true);
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
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">छुट्टी प्रबंधन</h1>
            <p className="text-gray-600 mt-1">Leave Dashboard</p>
          </div>
          {user?.role === 'office_admin' && (
            <button
              onClick={() => navigate('/leaves/add')}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center gap-2 font-semibold"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Leave Record
            </button>
          )}
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm">Currently on Leave</p>
                <p className="text-3xl font-bold mt-2">{onLeave.length}</p>
              </div>
              <svg className="w-12 h-12 text-blue-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          </div>

          <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-xl p-6 text-white shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-red-100 text-sm">Arrivals Today</p>
                <p className="text-3xl font-bold mt-2">{arrivals.today.length}</p>
              </div>
              <svg className="w-12 h-12 text-red-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>

          <div className="bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-xl p-6 text-white shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-yellow-100 text-sm">Arrivals Tomorrow</p>
                <p className="text-3xl font-bold mt-2">{arrivals.tomorrow.length}</p>
              </div>
              <svg className="w-12 h-12 text-yellow-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 text-white shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-sm">Pending CRK Approval</p>
                <p className="text-3xl font-bold mt-2">{pendingApprovals.length}</p>
              </div>
              <svg className="w-12 h-12 text-purple-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>

        {/* Arrivals Alerts */}
        {(arrivals.today.length > 0 || arrivals.tomorrow.length > 0) && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {arrivals.today.length > 0 && (
              <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-red-500">
                <h3 className="text-lg font-bold text-red-600 mb-4 flex items-center gap-2">
                  <span className="bg-red-100 rounded-full p-2">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                    </svg>
                  </span>
                  Today's Arrivals ({arrivals.today.length})
                </h3>
                <div className="space-y-3">
                  {arrivals.today.map((leave) => (
                    <div key={leave._id} className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                      <div>
                        <p className="font-semibold text-gray-800">{leave.employee.name}</p>
                        <p className="text-sm text-gray-500">{leave.employee.rank} - {leave.leaveType} ({leave.totalDays} days)</p>
                      </div>
                      {user?.role === 'office_admin' && (
                        <button
                          onClick={() => handleMarkReturned(leave._id, leave.employee.name)}
                          className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
                        >
                          Mark Returned
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {arrivals.tomorrow.length > 0 && (
              <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-yellow-500">
                <h3 className="text-lg font-bold text-yellow-600 mb-4 flex items-center gap-2">
                  <span className="bg-yellow-100 rounded-full p-2">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                    </svg>
                  </span>
                  Tomorrow's Arrivals ({arrivals.tomorrow.length})
                </h3>
                <div className="space-y-3">
                  {arrivals.tomorrow.map((leave) => (
                    <div key={leave._id} className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                      <div>
                        <p className="font-semibold text-gray-800">{leave.employee.name}</p>
                        <p className="text-sm text-gray-500">{leave.employee.rank} - {leave.leaveType} ({leave.totalDays} days)</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
        {/* Pending CRK Approvals - Admin Only */}
        {pendingApprovals.length > 0 && user?.role === 'office_admin' && (
          <div className="mb-8 bg-white rounded-xl shadow-md overflow-hidden">
            <div className="p-6 bg-purple-50 border-b border-purple-200">
              <h2 className="text-xl font-bold text-purple-800 flex items-center gap-2">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Pending Medical Approvals (CRK) - {pendingApprovals.length}
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Employee</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">CL Details</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Medical Rest</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">To Cancel</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {pendingApprovals.map((leave) => (
                    <tr key={leave._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{leave.employee.name}</div>
                        <div className="text-xs text-gray-500">{leave.employee.rank} - {leave.employee.pno}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <div className="font-semibold text-green-600">Availed: {leave.clDaysAvailed} days</div>
                        <div className="text-xs text-gray-500">
                          {new Date(leave.startDate).toLocaleDateString('hi-IN')} - 
                          {new Date(leave.medicalRestStartDate).toLocaleDateString('hi-IN')}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <div className="font-semibold text-purple-600">{leave.medicalRestDays} days</div>
                        <div className="text-xs text-gray-500">
                          {new Date(leave.medicalRestStartDate).toLocaleDateString('hi-IN')} - 
                          {new Date(leave.medicalRestEndDate).toLocaleDateString('hi-IN')}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-semibold text-red-600">{leave.clDaysCancelled} days</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                        <button
                          onClick={() => handleViewDetails(leave)}
                          className="text-blue-600 hover:text-blue-800 font-semibold"
                        >
                          View
                        </button>
                        <button
                          onClick={() => handleApproveMedical(leave)}
                          className="text-purple-600 hover:text-purple-800 font-semibold"
                        >
                          Approve (CRK)
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Currently on Leave */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="p-6 border-b">
            <h2 className="text-xl font-bold text-gray-800">Currently on Leave ({onLeave.length})</h2>
          </div>
          
          {onLeave.length === 0 ? (
            <div className="p-12 text-center text-gray-500">
              कोई भी leave पर नहीं है 🎉
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Employee</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Unit</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Leave Type</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Duration</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Arrival</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {onLeave.map((leave) => (
                    <tr key={leave._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{leave.employee.name}</div>
                        <div className="text-xs text-gray-500">{leave.employee.rank} - {leave.employee.pno}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {leave.employee.currentUnit?.name || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                          {leave.leaveType}
                        </span>
                        {leave.medicalRestStartDate && (
                          <div className="mt-1">
                            <span className="px-2 py-1 text-xs font-semibold rounded-full bg-purple-100 text-purple-800">
                              + Medical Rest
                            </span>
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {leave.totalDays} days
                        {leave.permissionsUsed > 0 && (
                          <div className="text-xs text-orange-600">
                            +{leave.permissionsUsed} permission
                          </div>
                        )}
                        {leave.extensions.length > 0 && (
                          <div className="text-xs text-green-600">
                            Extended {leave.extensions.length}x
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {leave.medicalRestStartDate ? (
                          <div className="space-y-1">
                            <div className="text-green-600 font-semibold">
                              CL: {leave.clDaysAvailed} days ✓
                            </div>
                            <div className="text-purple-600 font-semibold">
                              Medical: {leave.medicalRestDays} days 🏥
                            </div>
                          </div>
                        ) : (
                          <span className="text-blue-600">Active</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-semibold text-green-600">
                          {new Date(leave.arrivalDate).toLocaleDateString('hi-IN')}
                        </div>
                        <div className="text-xs text-gray-500">
                          {new Date(leave.arrivalDate).toLocaleDateString('en-US', { weekday: 'short' })}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <div className="flex flex-col gap-1">
                          <button
                            onClick={() => handleViewDetails(leave)}
                            className="text-blue-600 hover:text-blue-800 font-semibold text-left"
                          >
                            View Details
                          </button>
                          {user?.role === 'office_admin' && (
                            <>
                              {leave.leaveType === 'CL' && !leave.medicalRestStartDate && (
                                <>
                                  <button
                                    onClick={() => handleEdit(leave)}
                                    className="text-indigo-600 hover:text-indigo-800 font-semibold text-left"
                                  >
                                    Edit
                                  </button>
                                  <button
                                    onClick={() => handleExtendCL(leave)}
                                    className="text-green-600 hover:text-green-800 font-semibold text-left"
                                  >
                                    Extend CL
                                  </button>
                                  <button
                                    onClick={() => handleAddMedical(leave)}
                                    className="text-purple-600 hover:text-purple-800 font-semibold text-left"
                                  >
                                    Add Medical
                                  </button>
                                </>
                              )}
                              {leave.medicalRestStartDate && (
                                <button
                                  onClick={() => handleExtendMedical(leave)}
                                  className="text-purple-600 hover:text-purple-800 font-semibold text-left"
                                >
                                  Extend Medical
                                </button>
                              )}
                              <button
                                onClick={() => handleMarkReturned(leave._id, leave.employee.name)}
                                className="text-orange-600 hover:text-orange-800 font-semibold text-left"
                              >
                                Mark Returned
                              </button>
                              <button
                                onClick={() => handleDelete(leave._id, leave.employee.name)}
                                className="text-red-600 hover:text-red-800 font-semibold text-left"
                              >
                                Delete
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Upcoming Arrivals */}
        {arrivals.upcoming.length > 0 && (
          <div className="mt-8 bg-white rounded-xl shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Upcoming Arrivals (Next 7 Days)</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {arrivals.upcoming.map((leave) => (
                <div key={leave._id} className="p-4 bg-green-50 rounded-lg border border-green-200">
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-semibold text-gray-800">{leave.employee.name}</p>
                    <span className="text-xs bg-green-600 text-white px-2 py-1 rounded">
                      {leave.leaveType}
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 mb-1">{leave.employee.rank}</p>
                  <p className="text-sm text-gray-600 mb-1">
                    Arrival: <span className="font-semibold text-green-600">
                      {new Date(leave.arrivalDate).toLocaleDateString('hi-IN')}
                    </span>
                  </p>
                  <p className="text-xs text-gray-500">
                    {leave.totalDays} days leave
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
        {/* Modals */}
        {showDetailModal && selectedLeave && (
          <LeaveDetailModal
            leave={selectedLeave}
            onClose={() => {
              setShowDetailModal(false);
              setSelectedLeave(null);
            }}
          />
        )}

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

        {showExtendCLModal && selectedLeave && (
          <ExtendCLModal
            leave={selectedLeave}
            onClose={() => {
              setShowExtendCLModal(false);
              setSelectedLeave(null);
            }}
            onSuccess={() => {
              setShowExtendCLModal(false);
              setSelectedLeave(null);
              fetchData();
            }}
          />
        )}

        {showAddMedicalModal && selectedLeave && (
          <AddMedicalRestModal
            leave={selectedLeave}
            onClose={() => {
              setShowAddMedicalModal(false);
              setSelectedLeave(null);
            }}
            onSuccess={() => {
              setShowAddMedicalModal(false);
              setSelectedLeave(null);
              fetchData();
            }}
          />
        )}

        {showExtendMedicalModal && selectedLeave && (
          <ExtendMedicalModal
            leave={selectedLeave}
            onClose={() => {
              setShowExtendMedicalModal(false);
              setSelectedLeave(null);
            }}
            onSuccess={() => {
              setShowExtendMedicalModal(false);
              setSelectedLeave(null);
              fetchData();
            }}
          />
        )}

        {showApproveMedicalModal && selectedLeave && (
          <ApproveMedicalModal
            leave={selectedLeave}
            onClose={() => {
              setShowApproveMedicalModal(false);
              setSelectedLeave(null);
            }}
            onSuccess={() => {
              setShowApproveMedicalModal(false);
              setSelectedLeave(null);
              fetchData();
            }}
          />
        )}
      </div>
    </Layout>
  );
};

// Leave Detail Modal Component
const LeaveDetailModal = ({ leave, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6 rounded-t-2xl sticky top-0">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">{leave.employee.name}</h2>
              <p className="text-blue-100 mt-1">{leave.employee.rank} - {leave.employee.pno}</p>
            </div>
            <button onClick={onClose} className="text-white hover:bg-blue-500 rounded-full p-2">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="p-6">
          <div className="mb-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Leave Timeline</h3>
            
            <div className="mb-4 p-4 bg-blue-50 rounded-lg border-l-4 border-blue-500">
              <div className="flex items-center gap-2 mb-2">
                <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                </svg>
                <span className="font-bold text-blue-800">Original {leave.leaveType}</span>
              </div>
              <div className="ml-7 space-y-1 text-sm">
                <p><span className="font-semibold">Duration:</span> {new Date(leave.originalStartDate || leave.startDate).toLocaleDateString('hi-IN')} - {new Date(leave.originalEndDate || leave.endDate).toLocaleDateString('hi-IN')}</p>
                <p><span className="font-semibold">Days:</span> {leave.originalTotalDays || leave.totalDays} days</p>
              </div>
            </div>

            {leave.extensions && leave.extensions.length > 0 && (
              <div className="mb-4">
                {leave.extensions.map((ext, index) => (
                  <div key={index} className="mb-2 p-4 bg-green-50 rounded-lg border-l-4 border-green-500">
                    <div className="flex items-center gap-2 mb-2">
                      <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" />
                      </svg>
                      <span className="font-bold text-green-800">Extension #{index + 1}</span>
                    </div>
                    <div className="ml-7 space-y-1 text-sm">
                      <p><span className="font-semibold">Extended by:</span> {ext.extendedDays} days</p>
                      <p><span className="font-semibold">New End Date:</span> {new Date(ext.newEndDate).toLocaleDateString('hi-IN')}</p>
                      {ext.reason && <p><span className="font-semibold">Reason:</span> {ext.reason}</p>}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {leave.medicalRestStartDate && (
              <div className="mb-4">
                <div className="p-4 bg-purple-50 rounded-lg border-l-4 border-purple-500">
                  <div className="flex items-center gap-2 mb-2">
                    <svg className="w-5 h-5 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1.323l3.954 1.582 1.599-.8a1 1 0 01.894 1.79l-1.233.616 1.738 5.42a1 1 0 01-.285 1.05A3.989 3.989 0 0115 15a3.989 3.989 0 01-2.667-1.019 1 1 0 01-.285-1.05l1.715-5.349L11 6.477V16h2a1 1 0 110 2H7a1 1 0 110-2h2V6.477L6.237 7.582l1.715 5.349a1 1 0 01-.285 1.05A3.989 3.989 0 015 15a3.989 3.989 0 01-2.667-1.019 1 1 0 01-.285-1.05l1.738-5.42-1.233-.617a1 1 0 01.894-1.788l1.599.799L9 4.323V3a1 1 0 011-1zm-5 8.274l-.818 2.552c.25.112.526.174.818.174.292 0 .569-.062.818-.174L5 10.274zm10 0l-.818 2.552c.25.112.526.174.818.174.292 0 .569-.062.818-.174L15 10.274z" clipRule="evenodd" />
                    </svg>
                    <span className="font-bold text-purple-800">Medical Rest</span>
                  </div>
                  <div className="ml-7 space-y-1 text-sm">
                    <p><span className="font-semibold">CL Availed:</span> {leave.clDaysAvailed} days</p>
                    <p><span className="font-semibold">Medical Rest:</span> {leave.medicalRestDays} days</p>
                    {leave.medicalRestReason && <p><span className="font-semibold">Reason:</span> {leave.medicalRestReason}</p>}
                    <p className="text-red-600 font-semibold">CL to Cancel: {leave.clDaysCancelled} days</p>
                  </div>
                </div>
              </div>
            )}

            <div className="p-4 bg-gray-100 rounded-lg">
              <h4 className="font-bold text-gray-800 mb-2">Current Status</h4>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-gray-600">Status</p>
                  <p className="font-semibold">{leave.status}</p>
                </div>
                <div>
                  <p className="text-gray-600">Expected Arrival</p>
                  <p className="font-semibold text-green-600">{new Date(leave.arrivalDate).toLocaleDateString('hi-IN')}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Edit Leave Modal Component
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
// Extend CL Modal
const ExtendCLModal = ({ leave, onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [extendedDays, setExtendedDays] = useState(1);
  const [reason, setReason] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await leavesAPI.extendCL(leave._id, {
        extendedDays: parseInt(extendedDays),
        reason
      });
      alert('CL successfully extended!');
      onSuccess();
    } catch (error) {
      console.error('Error:', error);
      alert('Error: ' + (error.response?.data?.message || 'Failed to extend'));
    } finally {
      setLoading(false);
    }
  };

  const newEndDate = new Date(leave.endDate);
  newEndDate.setDate(newEndDate.getDate() + parseInt(extendedDays || 0));

  const newArrivalDate = new Date(newEndDate);
  newArrivalDate.setDate(newArrivalDate.getDate() + 1);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl max-w-2xl w-full" onClick={(e) => e.stopPropagation()}>
        <div className="bg-gradient-to-r from-green-600 to-green-700 text-white p-6 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">Extend CL for {leave.employee.name}</h2>
            <button onClick={onClose} className="text-white hover:bg-green-500 rounded-full p-2">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="p-4 bg-blue-50 rounded-lg">
            <h3 className="font-bold text-blue-800 mb-2">Current Leave Status:</h3>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-gray-600">Duration</p>
                <p className="font-semibold">{new Date(leave.startDate).toLocaleDateString('hi-IN')} - {new Date(leave.endDate).toLocaleDateString('hi-IN')}</p>
              </div>
              <div>
                <p className="text-gray-600">Total Days</p>
                <p className="font-semibold">{leave.totalDays} days</p>
              </div>
              <div>
                <p className="text-gray-600">Expected Arrival</p>
                <p className="font-semibold text-green-600">{new Date(leave.arrivalDate).toLocaleDateString('hi-IN')}</p>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Extend By (Days) *
            </label>
            <input
              type="number"
              value={extendedDays}
              onChange={(e) => setExtendedDays(e.target.value)}
              min="1"
              max="30"
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Reason (Optional)
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows="2"
              placeholder="e.g., Family function extended"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
            />
          </div>

          <div className="p-4 bg-green-50 rounded-lg border border-green-200">
            <h3 className="font-bold text-green-800 mb-2">After Extension:</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>New End Date:</span>
                <span className="font-bold text-green-600">{newEndDate.toLocaleDateString('hi-IN')}</span>
              </div>
              <div className="flex justify-between">
                <span>New Expected Arrival:</span>
                <span className="font-bold text-green-600">{newArrivalDate.toLocaleDateString('hi-IN')}</span>
              </div>
              <div className="flex justify-between">
                <span>Total CL Days:</span>
                <span className="font-bold">{leave.totalDays + parseInt(extendedDays || 0)} days</span>
              </div>
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
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold disabled:bg-green-400"
            >
              {loading ? 'Extending...' : 'Extend CL'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Add Medical Rest Modal - FIXED VERSION
const AddMedicalRestModal = ({ leave, onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [medicalDays, setMedicalDays] = useState(7);
  const [reason, setReason] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await leavesAPI.addMedicalRest(leave._id, {
        medicalDays: parseInt(medicalDays),
        reason
      });
      alert('Medical rest successfully added!');
      onSuccess();
    } catch (error) {
      console.error('Error:', error);
      alert('Error: ' + (error.response?.data?.message || 'Failed to add medical rest'));
    } finally {
      setLoading(false);
    }
  };

  const today = new Date();
  const startDate = new Date(leave.startDate);
  const clDaysAvailed = Math.ceil((today - startDate) / (1000 * 60 * 60 * 24)) + 1;
  const clDaysCancelled = leave.totalDays - clDaysAvailed;

  const medicalStartDate = new Date(today);
  medicalStartDate.setDate(medicalStartDate.getDate() + 1);

  const medicalEndDate = new Date(medicalStartDate);
  medicalEndDate.setDate(medicalEndDate.getDate() + parseInt(medicalDays || 0) - 1);

  const newArrivalDate = new Date(medicalEndDate);
  newArrivalDate.setDate(newArrivalDate.getDate() + 1);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
        {/* Header - Fixed */}
        <div className="bg-gradient-to-r from-purple-600 to-purple-700 text-white p-6 rounded-t-2xl flex-shrink-0">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">Add Medical Rest for {leave.employee.name}</h2>
            <button onClick={onClose} className="text-white hover:bg-purple-500 rounded-full p-2">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Scrollable Form Content */}
        <div className="overflow-y-auto flex-1 p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Current Status */}
            <div className="p-4 bg-blue-50 rounded-lg">
              <h3 className="font-bold text-blue-800 mb-2">Current Leave Status:</h3>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-gray-600">Original CL</p>
                  <p className="font-semibold">{new Date(leave.startDate).toLocaleDateString('hi-IN')} - {new Date(leave.endDate).toLocaleDateString('hi-IN')} ({leave.totalDays} days)</p>
                </div>
                <div>
                  <p className="text-gray-600">CL Availed</p>
                  <p className="font-semibold text-green-600">{clDaysAvailed} days</p>
                </div>
                <div className="col-span-2">
                  <p className="text-gray-600">Remaining CL to Cancel</p>
                  <p className="font-semibold text-red-600">{clDaysCancelled} days (will be cancelled after CRK approval)</p>
                </div>
              </div>
            </div>

            {/* Medical Rest Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Medical Rest Duration (Days) *
              </label>
              <input
                type="number"
                value={medicalDays}
                onChange={(e) => setMedicalDays(e.target.value)}
                min="1"
                max="90"
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Doctor's Advice / Reason *
              </label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows="3"
                placeholder="e.g., Doctor prescribed 7 days rest due to fever"
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
              />
            </div>

            {/* Impact */}
            <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
              <h3 className="font-bold text-purple-800 mb-3">Impact:</h3>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <span className="text-green-600">✅</span>
                  <span>CL Availed: {clDaysAvailed} days ({new Date(leave.startDate).toLocaleDateString('hi-IN')} - {today.toLocaleDateString('hi-IN')})</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-red-600">❌</span>
                  <span>CL to Cancel: {clDaysCancelled} days</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-purple-600">🏥</span>
                  <span>Medical Rest: {medicalDays} days ({medicalStartDate.toLocaleDateString('hi-IN')} - {medicalEndDate.toLocaleDateString('hi-IN')})</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-green-600">📅</span>
                  <span>New Expected Arrival: <span className="font-bold">{newArrivalDate.toLocaleDateString('hi-IN')}</span></span>
                </div>
              </div>

              <div className="mt-3 p-3 bg-yellow-50 rounded border border-yellow-200">
                <p className="text-xs text-yellow-800">
                  <strong>Note:</strong> Remaining {clDaysCancelled} days CL will be cancelled when CRK approves and converts medical rest to EL/Medical Leave.
                </p>
              </div>
            </div>

            {/* Buttons */}
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
                className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-semibold disabled:bg-purple-400"
              >
                {loading ? 'Adding...' : 'Add Medical Rest'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
// Extend Medical Modal
const ExtendMedicalModal = ({ leave, onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [additionalDays, setAdditionalDays] = useState(3);
  const [reason, setReason] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await leavesAPI.extendMedical(leave._id, {
        additionalDays: parseInt(additionalDays),
        reason
      });
      alert('Medical rest successfully extended!');
      onSuccess();
    } catch (error) {
      console.error('Error:', error);
      alert('Error: ' + (error.response?.data?.message || 'Failed to extend medical rest'));
    } finally {
      setLoading(false);
    }
  };

  const newMedicalEndDate = new Date(leave.medicalRestEndDate);
  newMedicalEndDate.setDate(newMedicalEndDate.getDate() + parseInt(additionalDays || 0));

  const newArrivalDate = new Date(newMedicalEndDate);
  newArrivalDate.setDate(newArrivalDate.getDate() + 1);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl max-w-2xl w-full" onClick={(e) => e.stopPropagation()}>
        <div className="bg-gradient-to-r from-purple-600 to-purple-700 text-white p-6 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">Extend Medical Rest for {leave.employee.name}</h2>
            <button onClick={onClose} className="text-white hover:bg-purple-500 rounded-full p-2">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="p-4 bg-purple-50 rounded-lg">
            <h3 className="font-bold text-purple-800 mb-2">Current Medical Rest:</h3>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-gray-600">Duration</p>
                <p className="font-semibold">{new Date(leave.medicalRestStartDate).toLocaleDateString('hi-IN')} - {new Date(leave.medicalRestEndDate).toLocaleDateString('hi-IN')}</p>
              </div>
              <div>
                <p className="text-gray-600">Total Days</p>
                <p className="font-semibold">{leave.medicalRestDays} days</p>
              </div>
              <div>
                <p className="text-gray-600">Expected Arrival</p>
                <p className="font-semibold text-green-600">{new Date(leave.arrivalDate).toLocaleDateString('hi-IN')}</p>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Additional Days *
            </label>
            <input
              type="number"
              value={additionalDays}
              onChange={(e) => setAdditionalDays(e.target.value)}
              min="1"
              max="30"
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Doctor's Advice / Reason *
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows="3"
              placeholder="e.g., Doctor extended rest by 3 more days"
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
            />
          </div>

          <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
            <h3 className="font-bold text-purple-800 mb-2">After Extension:</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>New Medical End Date:</span>
                <span className="font-bold text-purple-600">{newMedicalEndDate.toLocaleDateString('hi-IN')}</span>
              </div>
              <div className="flex justify-between">
                <span>New Expected Arrival:</span>
                <span className="font-bold text-green-600">{newArrivalDate.toLocaleDateString('hi-IN')}</span>
              </div>
              <div className="flex justify-between">
                <span>Total Medical Days:</span>
                <span className="font-bold">{leave.medicalRestDays + parseInt(additionalDays || 0)} days</span>
              </div>
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
              className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-semibold disabled:bg-purple-400"
            >
              {loading ? 'Extending...' : 'Extend Medical Rest'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Approve Medical Modal (CRK)
const ApproveMedicalModal = ({ leave, onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [convertTo, setConvertTo] = useState('EL');
  const [remarks, setRemarks] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!window.confirm(`क्या आप ${leave.employee.name} की medical rest को ${convertTo} में convert करना चाहते हैं?\n\nCL: ${leave.clDaysCancelled} days cancelled\n${convertTo}: ${leave.medicalRestDays} days added`)) {
      return;
    }

    setLoading(true);

    try {
      await leavesAPI.approveMedical(leave._id, {
        convertTo,
        remarks
      });
      alert('Medical rest successfully approved!');
      onSuccess();
    } catch (error) {
      console.error('Error:', error);
      alert('Error: ' + (error.response?.data?.message || 'Failed to approve'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="bg-gradient-to-r from-purple-600 to-purple-700 text-white p-6 rounded-t-2xl sticky top-0">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">CRK Medical Approval</h2>
              <p className="text-purple-100 mt-1">{leave.employee.name} - {leave.employee.rank} - {leave.employee.pno}</p>
            </div>
            <button onClick={onClose} className="text-white hover:bg-purple-500 rounded-full p-2">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="border-2 border-purple-200 rounded-lg p-4">
            <h3 className="font-bold text-gray-800 mb-4 text-lg">Leave Summary</h3>
            
            <div className="space-y-3">
              <div className="p-3 bg-blue-50 rounded">
                <p className="text-sm font-semibold text-blue-800 mb-1">Original CL</p>
                <p className="text-sm">{leave.totalDays} days ({new Date(leave.startDate).toLocaleDateString('hi-IN')} - {new Date(leave.endDate).toLocaleDateString('hi-IN')})</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-green-50 rounded">
                  <p className="text-sm font-semibold text-green-800 mb-1">✅ CL Availed</p>
                  <p className="text-xl font-bold text-green-600">{leave.clDaysAvailed} days</p>
                  <p className="text-xs text-gray-600">{new Date(leave.startDate).toLocaleDateString('hi-IN')} - {new Date(leave.medicalRestStartDate).toLocaleDateString('hi-IN')}</p>
                </div>

                <div className="p-3 bg-red-50 rounded">
                  <p className="text-sm font-semibold text-red-800 mb-1">❌ CL to Cancel</p>
                  <p className="text-xl font-bold text-red-600">{leave.clDaysCancelled} days</p>
                  <p className="text-xs text-gray-600">Will be restored to balance</p>
                </div>
              </div>

              <div className="p-3 bg-purple-50 rounded">
                <p className="text-sm font-semibold text-purple-800 mb-1">🏥 Medical Rest</p>
                <p className="text-xl font-bold text-purple-600">{leave.medicalRestDays} days</p>
                <p className="text-xs text-gray-600">{new Date(leave.medicalRestStartDate).toLocaleDateString('hi-IN')} - {new Date(leave.medicalRestEndDate).toLocaleDateString('hi-IN')}</p>
                {leave.medicalRestReason && (
                  <p className="text-xs text-gray-700 mt-1"><strong>Reason:</strong> {leave.medicalRestReason}</p>
                )}
              </div>
            </div>
          </div>

          <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
            <h3 className="font-bold text-yellow-800 mb-3">Balance Impact:</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Current CL Used:</span>
                <span className="font-bold">{leave.totalDays} days</span>
              </div>
              <div className="flex justify-between text-red-600">
                <span>CL to Restore:</span>
                <span className="font-bold">-{leave.clDaysCancelled} days</span>
              </div>
              <div className="flex justify-between text-green-600">
                <span>Final CL Used:</span>
                <span className="font-bold">{leave.clDaysAvailed} days</span>
              </div>
              <hr className="my-2" />
              <div className="flex justify-between text-purple-600">
                <span>{convertTo} to Add:</span>
                <span className="font-bold">+{leave.medicalRestDays} days</span>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Convert Medical Rest To: *
            </label>
            <div className="grid grid-cols-2 gap-4">
              <label className={`p-4 border-2 rounded-lg cursor-pointer transition ${
                convertTo === 'EL' ? 'border-purple-600 bg-purple-50' : 'border-gray-300 hover:border-purple-300'
              }`}>
                <input
                  type="radio"
                  name="convertTo"
                  value="EL"
                  checked={convertTo === 'EL'}
                  onChange={(e) => setConvertTo(e.target.value)}
                  className="mr-3"
                />
                <span className="font-semibold">EL - Earned Leave</span>
                <p className="text-xs text-gray-600 mt-1 ml-6">Convert to Earned Leave</p>
              </label>

              <label className={`p-4 border-2 rounded-lg cursor-pointer transition ${
                convertTo === 'MEDICAL' ? 'border-purple-600 bg-purple-50' : 'border-gray-300 hover:border-purple-300'
              }`}>
                <input
                  type="radio"
                  name="convertTo"
                  value="MEDICAL"
                  checked={convertTo === 'MEDICAL'}
                  onChange={(e) => setConvertTo(e.target.value)}
                  className="mr-3"
                />
                <span className="font-semibold">Medical Leave</span>
                <p className="text-xs text-gray-600 mt-1 ml-6">Convert to Medical Leave</p>
              </label>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              CRK Remarks (Optional)
            </label>
            <textarea
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              rows="2"
              placeholder="Any remarks from CRK..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
            />
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
              className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-semibold disabled:bg-purple-400"
            >
              {loading ? 'Approving...' : `Approve & Convert to ${convertTo}`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LeaveDashboard;