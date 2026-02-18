import React, { useState, useEffect } from 'react';
import { employeesAPI, leavesAPI, unitsAPI, outDutyAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import Layout from '../components/Layout';

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalEmployees: 0,
    onLeave: 0,
    onOutDuty: 0,
    onTraining: 0,
    storeItems: 0,
    units: 0
  });
  const [outDutyEmployees, setOutDutyEmployees] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const [employeesRes, leavesRes, unitsRes, outDutyRes] = await Promise.all([
        employeesAPI.getAll(),
        leavesAPI.getCurrentlyOnLeave(),
        unitsAPI.getAll(),
        outDutyAPI.getAll({ status: 'ONGOING' })
      ]);

      const outDuties = outDutyRes.data.data;
      const onOutDuty = outDuties.filter(d => 
        d.dutyType === 'OUT_DUTY' || 
        d.dutyType === 'DEPUTATION' || 
        d.dutyType === 'OFFICIAL_TOUR'
      );
      const onTraining = outDuties.filter(d => d.dutyType.includes('TRAINING'));

      setStats({
        totalEmployees: employeesRes.data.data.length,
        onLeave: leavesRes.data.count || 0,
        onOutDuty: onOutDuty.length,
        onTraining: onTraining.length,
        storeItems: 0,
        units: unitsRes.data.data.length
      });

      setOutDutyEmployees(outDuties);
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
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

  const formatDate = (date) => {
    if (!date) return 'TBD';
    return new Date(date).toLocaleDateString('en-IN');
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
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-800">डैशबोर्ड</h1>
          <p className="text-gray-600 mt-2">Welcome, {user?.name}</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Total Employees */}
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white shadow-lg transform hover:scale-105 transition">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm mb-2">कुल कर्मचारी</p>
                <p className="text-4xl font-bold">{stats.totalEmployees}</p>
              </div>
              <div className="bg-blue-400 bg-opacity-30 rounded-full p-4">
                <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                </svg>
              </div>
            </div>
          </div>

          {/* On Leave */}
          <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white shadow-lg transform hover:scale-105 transition">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm mb-2">छुट्टी पर</p>
                <p className="text-4xl font-bold">{stats.onLeave}</p>
              </div>
              <div className="bg-green-400 bg-opacity-30 rounded-full p-4">
                <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
          </div>

          {/* On Out Duty */}
          <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-6 text-white shadow-lg transform hover:scale-105 transition">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-100 text-sm mb-2">आउट ड्यूटी पर</p>
                <p className="text-4xl font-bold">{stats.onOutDuty}</p>
              </div>
              <div className="bg-orange-400 bg-opacity-30 rounded-full p-4">
                <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
          </div>

          {/* On Training */}
          <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 text-white shadow-lg transform hover:scale-105 transition">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-sm mb-2">ट्रेनिंग पर</p>
                <p className="text-4xl font-bold">{stats.onTraining}</p>
              </div>
              <div className="bg-purple-400 bg-opacity-30 rounded-full p-4">
                <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3zM3.31 9.397L5 10.12v4.102a8.969 8.969 0 00-1.05-.174 1 1 0 01-.89-.89 11.115 11.115 0 01.25-3.762zM9.3 16.573A9.026 9.026 0 007 14.935v-3.957l1.818.78a3 3 0 002.364 0l5.508-2.361a11.026 11.026 0 01.25 3.762 1 1 0 01-.89.89 8.968 8.968 0 00-5.35 2.524 1 1 0 01-1.4 0zM6 18a1 1 0 001-1v-2.065a8.935 8.935 0 00-2-.712V17a1 1 0 001 1z"/>
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Out Duty/Training List */}
        {outDutyEmployees.length > 0 && (
          <div className="bg-white rounded-xl shadow-md mb-8">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                <svg className="w-6 h-6 text-orange-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd"/>
                </svg>
                Currently Out ({outDutyEmployees.length})
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Employee</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Location</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Since</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Expected Return</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {outDutyEmployees.map((duty) => (
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
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-purple-100 text-purple-800">
                          {getDutyTypeLabel(duty.dutyType)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">{duty.location}</td>
                      <td className="px-6 py-4 text-sm text-gray-900">{formatDate(duty.startDate)}</td>
                      <td className="px-6 py-4 text-sm text-gray-900">{formatDate(duty.returnDate)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Welcome Section */}
        <div className="bg-white rounded-xl shadow-md p-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">स्वागत है! 🎉</h2>
          <p className="text-gray-600 text-lg mb-4">
            आपका Signal Office Management System तैयार है। आप सभी features access कर सकते हैं।
          </p>

          <div className="mt-6 p-6 bg-blue-50 rounded-lg border border-blue-200">
            <h3 className="font-bold text-blue-800 mb-3">Available features:</h3>
            <ul className="space-y-2 text-gray-700">
              <li className="flex items-center gap-2">
                <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>Employee Management</span>
              </li>
              <li className="flex items-center gap-2">
                <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>Leave Management with CRK Approval</span>
              </li>
              <li className="flex items-center gap-2">
                <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>Out Duty & Training Management</span>
              </li>
              <li className="flex items-center gap-2">
                <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>Gate Duty Management</span>
              </li>
              <li className="flex items-center gap-2">
                <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>Unit Management</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Dashboard;