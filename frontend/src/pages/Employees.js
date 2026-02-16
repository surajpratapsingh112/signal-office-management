import React, { useState, useEffect } from 'react';
import { employeesAPI, unitsAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import Layout from '../components/Layout';

const Employees = () => {
  const { user } = useAuth();
  const [employees, setEmployees] = useState([]);
  const [units, setUnits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUnit, setSelectedUnit] = useState('');
  const [selectedRank, setSelectedRank] = useState('');
  const [selectedGender, setSelectedGender] = useState('');
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [employeesRes, unitsRes] = await Promise.all([
        employeesAPI.getAll(),
        unitsAPI.getAll()
      ]);
      setEmployees(employeesRes.data.data);
      setUnits(unitsRes.data.data);
    } catch (error) {
      console.error('Error fetching data:', error);
      alert('Error loading data');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (employeeId, employeeName) => {
    if (!window.confirm(`क्या आप ${employeeName} को delete करना चाहते हैं?`)) {
      return;
    }

    try {
      await employeesAPI.delete(employeeId);
      alert('कर्मचारी successfully delete हो गया!');
      fetchData();
    } catch (error) {
      console.error('Error deleting employee:', error);
      alert('Error: ' + (error.response?.data?.message || 'Delete failed'));
    }
  };

  const handleEdit = (employee) => {
    setEditingEmployee(employee);
    setShowEditModal(true);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedUnit('');
    setSelectedRank('');
    setSelectedGender('');
  };

  // Get unique ranks
  const ranks = [...new Set(employees.map(emp => emp.rank))].sort();

  // Filter employees
  const filteredEmployees = employees.filter(emp => {
    const matchesSearch = emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         emp.pno.includes(searchTerm) ||
                         emp.mobile.includes(searchTerm);
    const matchesUnit = !selectedUnit || emp.currentUnit?._id === selectedUnit;
    const matchesRank = !selectedRank || emp.rank === selectedRank;
    const matchesGender = !selectedGender || emp.gender === selectedGender;
    return matchesSearch && matchesUnit && matchesRank && matchesGender;
  });

  // Statistics
  const stats = {
    total: employees.length,
    male: employees.filter(e => e.gender === 'MALE').length,
    female: employees.filter(e => e.gender === 'FEMALE').length,
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
            <h1 className="text-3xl font-bold text-gray-800">कर्मचारी प्रबंधन</h1>
            <p className="text-gray-600 mt-1">
              कुल {stats.total} कर्मचारी (पुरुष: {stats.male}, महिला: {stats.female})
            </p>
          </div>
          {user?.role === 'office_admin' && (
            <button
              onClick={() => setShowAddModal(true)}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center gap-2 font-semibold"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              नया कर्मचारी जोड़ें
            </button>
          )}
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {/* Search */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                खोजें (नाम, PNO, मोबाइल)
              </label>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="खोजें..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Unit Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                यूनिट
              </label>
              <select
                value={selectedUnit}
                onChange={(e) => setSelectedUnit(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">सभी यूनिट्स</option>
                {units.map(unit => (
                  <option key={unit._id} value={unit._id}>{unit.name}</option>
                ))}
              </select>
            </div>

            {/* Rank Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                पद
              </label>
              <select
                value={selectedRank}
                onChange={(e) => setSelectedRank(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">सभी पद</option>
                {ranks.map(rank => (
                  <option key={rank} value={rank}>{rank}</option>
                ))}
              </select>
            </div>

            {/* Gender Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                लिंग
              </label>
              <select
                value={selectedGender}
                onChange={(e) => setSelectedGender(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">सभी</option>
                <option value="MALE">पुरुष (MALE)</option>
                <option value="FEMALE">महिला (FEMALE)</option>
                <option value="OTHER">अन्य (OTHER)</option>
              </select>
            </div>
          </div>

          {/* Results Count & Clear Filters */}
          <div className="mt-4 flex items-center justify-between">
            <div className="text-sm text-gray-600">
             {employees.length}  में से {filteredEmployees.length} कर्मचारी दिख रहे हैं
            </div>
            {(searchTerm || selectedUnit || selectedRank || selectedGender) && (
              <button
                onClick={clearFilters}
                className="text-sm text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-1"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                सभी फ़िल्टर साफ़ करें
              </button>
            )}
          </div>
        </div>

        {/* Employees Table */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    क्रम
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    नाम
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    PNO
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    पद
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    यूनिट
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    मोबाइल
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ब्लड ग्रुप
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredEmployees.map((employee, index) => (
                  <tr key={employee._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {index + 1}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <div className="text-sm font-medium text-gray-900">{employee.name}</div>
                        {employee.gender === 'MALE' ? (
                          <svg className="w-4 h-4 text-blue-500" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M9 9c0-1.7 1.3-3 3-3s3 1.3 3 3-1.3 3-3 3-3-1.3-3-3zm3 11c-3.9 0-7-3.1-7-7s3.1-7 7-7 7 3.1 7 7-3.1 7-7 7z"/>
                          </svg>
                        ) : (
                          <svg className="w-4 h-4 text-pink-500" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 2C9.8 2 8 3.8 8 6s1.8 4 4 4 4-1.8 4-4-1.8-4-4-4zm0 10c-4.4 0-8 2.7-8 6v2h16v-2c0-3.3-3.6-6-8-6z"/>
                          </svg>
                        )}
                      </div>
                      <div className="text-xs text-gray-500">{employee.gender}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {employee.pno}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                          {employee.rank}
                        </span>
                        {employee.rankNumber && (
                          <span className="text-xs text-gray-500">#{employee.rankNumber}</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {employee.currentUnit?.name || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {employee.mobile}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                        {employee.bloodGroup}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                      <button
                        onClick={() => setSelectedEmployee(employee)}
                        className="text-blue-600 hover:text-blue-800 font-semibold"
                      >
                        View
                      </button>
                      {user?.role === 'office_admin' && (
                        <>
                          <button
                            onClick={() => handleEdit(employee)}
                            className="text-green-600 hover:text-green-800 font-semibold"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(employee._id, employee.name)}
                            className="text-red-600 hover:text-red-800 font-semibold"
                          >
                            Delete
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredEmployees.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              कोई कर्मचारी नहीं मिला
            </div>
          )}
        </div>

        {/* Modals */}
        {selectedEmployee && (
          <EmployeeDetailModal
            employee={selectedEmployee}
            onClose={() => setSelectedEmployee(null)}
          />
        )}

        {showAddModal && (
          <AddEditEmployeeModal
            units={units}
            onClose={() => setShowAddModal(false)}
            onSuccess={() => {
              setShowAddModal(false);
              fetchData();
            }}
          />
        )}

        {showEditModal && editingEmployee && (
          <AddEditEmployeeModal
            employee={editingEmployee}
            units={units}
            onClose={() => {
              setShowEditModal(false);
              setEditingEmployee(null);
            }}
            onSuccess={() => {
              setShowEditModal(false);
              setEditingEmployee(null);
              fetchData();
            }}
          />
        )}
      </div>
    </Layout>
  );
};

// Employee Detail Modal Component
const EmployeeDetailModal = ({ employee, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">{employee.name}</h2>
              <p className="text-blue-100 mt-1">
                {employee.rank}{employee.rankNumber && ` - ${employee.rankNumber}`}
              </p>
            </div>
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

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Basic Info */}
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-3">मूल जानकारी</h3>
            <div className="grid grid-cols-2 gap-4">
              <InfoItem label="PNO" value={employee.pno} />
              <InfoItem 
                label="पद" 
                value={employee.rankNumber ? `${employee.rank} - ${employee.rankNumber}` : employee.rank} 
              />
              <InfoItem label="मोबाइल" value={employee.mobile} />
              <InfoItem label="ब्लड ग्रुप" value={employee.bloodGroup} />
              <InfoItem label="लिंग" value={employee.gender} />
              <InfoItem label="वैवाहिक स्थिति" value={employee.maritalStatus} />
            </div>
          </div>

          {/* Fund Info */}
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-3">भविष्य निधि जानकारी</h3>
            <div className="grid grid-cols-2 gap-4">
              <InfoItem label="फंड प्रकार" value={employee.pensionType} />
              <InfoItem label="खाता संख्या" value={employee.pensionNumber} />
            </div>
          </div>

          {/* Posting Info */}
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-3">पोस्टिंग जानकारी</h3>
            <div className="grid grid-cols-2 gap-4">
              <InfoItem label="वर्तमान यूनिट" value={employee.currentUnit?.name} />
              <InfoItem 
                label="पोस्टिंग तिथि" 
                value={new Date(employee.postingDate).toLocaleDateString('hi-IN')} 
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Add/Edit Employee Modal Component
const AddEditEmployeeModal = ({ employee, units, onClose, onSuccess }) => {
  const isEdit = !!employee;
  const [formData, setFormData] = useState({
    name: employee?.name || '',
    pno: employee?.pno || '',
    rank: employee?.rank || '',
    rankNumber: employee?.rankNumber || '',
    mobile: employee?.mobile || '',
    bloodGroup: employee?.bloodGroup || '',
    gender: employee?.gender || '',
    maritalStatus: employee?.maritalStatus || 'MARRIED',
    pensionType: employee?.pensionType || '',
    pensionNumber: employee?.pensionNumber || '',
    currentUnit: employee?.currentUnit?._id || '',
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isEdit) {
        await employeesAPI.update(employee._id, formData);
        alert('कर्मचारी successfully update हो गया!');
      } else {
        await employeesAPI.create(formData);
        alert('नया कर्मचारी successfully add हो गया!');
      }
      onSuccess();
    } catch (error) {
      console.error('Error saving employee:', error);
      alert('Error: ' + (error.response?.data?.message || 'Save failed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">
              {isEdit ? 'कर्मचारी Edit करें' : 'नया कर्मचारी जोड़ें'}
            </h2>
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
          {/* Basic Information */}
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-4">मूल जानकारी</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  नाम *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  PNO *
                </label>
                <input
                  type="text"
                  name="pno"
                  value={formData.pno}
                  onChange={handleChange}
                  required
                  disabled={isEdit}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  पद *
                </label>
                <select
                  name="rank"
                  value={formData.rank}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select</option>
                  <option value="RI">RI (रेडियो निरीक्षक)</option>
                  <option value="RSI">RSI (रेडियो उप निरीक्षक)</option>
                  <option value="HO">HO (प्रधान परिचालक)</option>
                  <option value="HOM">HOM (प्रधान परिचालक यांत्रिक)</option>
                  <option value="AO">AO (सहायक परिचालक)</option>
                  <option value="WH">WH (कार्यशाला कर्मचारी)</option>
                  <option value="MESSANGER">MESSANGER (संदेशवाहक)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  पद संख्या (यदि हो)
                </label>
                <input
                  type="text"
                  name="rankNumber"
                  value={formData.rankNumber}
                  onChange={handleChange}
                  placeholder="4225, 1899, etc."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  मोबाइल *
                </label>
                <input
                  type="tel"
                  name="mobile"
                  value={formData.mobile}
                  onChange={handleChange}
                  required
                  pattern="[0-9]{10}"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ब्लड ग्रुप *
                </label>
                <select
                  name="bloodGroup"
                  value={formData.bloodGroup}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select</option>
                  <option value="A+">A+</option>
                  <option value="A-">A-</option>
                  <option value="B+">B+</option>
                  <option value="B-">B-</option>
                  <option value="AB+">AB+</option>
                  <option value="AB-">AB-</option>
                  <option value="O+">O+</option>
                  <option value="O-">O-</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  लिंग *
                </label>
                <select
                  name="gender"
                  value={formData.gender}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select</option>
                  <option value="MALE">पुरुष (MALE)</option>
                  <option value="FEMALE">महिला (FEMALE)</option>
                  <option value="OTHER">अन्य (OTHER)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  वैवाहिक स्थिति *
                </label>
                <select
                  name="maritalStatus"
                  value={formData.maritalStatus}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="MARRIED">MARRIED</option>
                  <option value="UNMARRIED">UNMARRIED</option>
                  <option value="WIDOW">WIDOW</option>
                  <option value="WIDOWER">WIDOWER</option>
                </select>
              </div>
            </div>
          </div>

          {/* Fund Information */}
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-4">भविष्य निधि जानकारी</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  फंड प्रकार *
                </label>
                <select
                  name="pensionType"
                  value={formData.pensionType}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select</option>
                  <option value="NPS">NPS (राष्ट्रीय पेंशन योजना)</option>
                  <option value="GPF">GPF (सामान्य भविष्य निधि)</option>
                  <option value="CPF">CPF (अंशदायी भविष्य निधि)</option>
                  <option value="EPF">EPF (कर्मचारी भविष्य निधि)</option>
                  <option value="UPTRON">UPTRON</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  खाता संख्या *
                </label>
                <input
                  type="text"
                  name="pensionNumber"
                  value={formData.pensionNumber}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Posting Information */}
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-4">पोस्टिंग जानकारी</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  वर्तमान यूनिट *
                </label>
                <select
                  name="currentUnit"
                  value={formData.currentUnit}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select Unit</option>
                  {units.map(unit => (
                    <option key={unit._id} value={unit._id}>{unit.name}</option>
                  ))}
                </select>
              </div>
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
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold disabled:bg-blue-400"
            >
              {loading ? 'Saving...' : isEdit ? 'Update करें' : 'Add करें'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const InfoItem = ({ label, value }) => (
  <div className="bg-gray-50 p-3 rounded-lg">
    <p className="text-xs text-gray-500 mb-1">{label}</p>
    <p className="text-sm font-semibold text-gray-800">{value || 'N/A'}</p>
  </div>
);

export default Employees;