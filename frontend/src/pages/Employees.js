import React, { useState, useEffect } from 'react';
import { employeesAPI, unitsAPI, employeeFieldSettingsAPI, outDutyAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import Layout from '../components/Layout';

const Employees = () => {
  const { user } = useAuth();
  const [employees, setEmployees] = useState([]);
  const [units, setUnits] = useState([]);
  const [outDutyData, setOutDutyData] = useState([]);
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
    const [employeesRes, unitsRes, outDutyRes] = await Promise.all([
      employeesAPI.getAll(),
      unitsAPI.getAll(),
      outDutyAPI.getAll({ status: 'ONGOING' })
    ]);
    setEmployees(employeesRes.data.data);
    setUnits(unitsRes.data.data);
    setOutDutyData(outDutyRes.data.data);
  } catch (error) {
    console.error('Error fetching data:', error);
    alert('Error loading data');
  } finally {
    setLoading(false);
  }
};

// Check if employee is on out duty
const getEmployeeOutDuty = (employeeId) => {
  return outDutyData.find(d => d.employee._id === employeeId);
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
              नया कर्मचारी
            </button>
          )}
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                खोजें (नाम, PNO, Mobile)
              </label>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                यूनिट
              </label>
              <select
                value={selectedUnit}
                onChange={(e) => setSelectedUnit(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">सभी यूनिट्स</option>
                {units.map(unit => (
                  <option key={unit._id} value={unit._id}>{unit.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                पद
              </label>
              <select
                value={selectedRank}
                onChange={(e) => setSelectedRank(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">सभी पद</option>
                {ranks.map(rank => (
                  <option key={rank} value={rank}>{rank}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                लिंग
              </label>
              <select
                value={selectedGender}
                onChange={(e) => setSelectedGender(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">सभी</option>
                <option value="MALE">MALE</option>
                <option value="FEMALE">FEMALE</option>
              </select>
            </div>
          </div>

          <div className="mt-4 flex justify-end">
            <button
              onClick={clearFilters}
              className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 font-semibold"
            >
              Clear Filters
            </button>
          </div>
        </div>

        {/* Employees Table */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">S.No</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">नाम</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">PNO</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">पद</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">यूनिट</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">मोबाइल</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ब्लड ग्रुप</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredEmployees.map((employee, index) => (
                  <tr key={employee._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{index + 1}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{employee.name}</div>
                      <div className="text-sm text-gray-500">{employee.gender}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{employee.pno}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{employee.rank}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{employee.currentUnit?.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{employee.mobile}</td>
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

// Employee Detail Modal
const EmployeeDetailModal = ({ employee, onClose }) => {
  const InfoItem = ({ label, value }) => (
    <div>
      <p className="text-sm text-gray-600 font-medium">{label}</p>
      <p className="text-base text-gray-900 mt-1">{value || 'N/A'}</p>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">{employee.name}</h2>
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

        <div className="p-6 space-y-6">
          {/* Basic Info */}
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-3">मूल जानकारी</h3>
            <div className="grid grid-cols-2 gap-4">
              <InfoItem label="नाम" value={employee.name} />
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

          {/* Custom Fields */}
          {employee.customFields && Object.keys(employee.customFields).length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-3">अतिरिक्त जानकारी</h3>
              <div className="grid grid-cols-2 gap-4">
                {Object.entries(employee.customFields).map(([key, value]) => (
                  <InfoItem 
                    key={key} 
                    label={key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())} 
                    value={value?.toString()} 
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Add/Edit Employee Modal Component WITH CUSTOM FIELDS INTEGRATION
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
    customFields: employee?.customFields || {}
  });
  const [loading, setLoading] = useState(false);
  const [customFieldSettings, setCustomFieldSettings] = useState([]);
  const [loadingFields, setLoadingFields] = useState(true);

  // Fetch enabled custom fields on component mount
  useEffect(() => {
    fetchCustomFields();
  }, []);

  const fetchCustomFields = async () => {
    try {
      const response = await employeeFieldSettingsAPI.getEnabled();
      setCustomFieldSettings(response.data.data || []);
    } catch (error) {
      console.error('Error fetching custom fields:', error);
    } finally {
      setLoadingFields(false);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleCustomFieldChange = (fieldName, value) => {
    setFormData({
      ...formData,
      customFields: {
        ...formData.customFields,
        [fieldName]: value
      }
    });
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

  const renderCustomField = (field) => {
    const value = formData.customFields[field.fieldName] || '';

    switch (field.fieldType) {
      case 'text':
      case 'email':
      case 'phone':
        return (
          <input
            type={field.fieldType}
            value={value}
            onChange={(e) => handleCustomFieldChange(field.fieldName, e.target.value)}
            required={field.required}
            placeholder={field.placeholder || ''}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        );

      case 'number':
        return (
          <input
            type="number"
            value={value}
            onChange={(e) => handleCustomFieldChange(field.fieldName, e.target.value)}
            required={field.required}
            placeholder={field.placeholder || ''}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        );

      case 'date':
        return (
          <input
            type="date"
            value={value}
            onChange={(e) => handleCustomFieldChange(field.fieldName, e.target.value)}
            required={field.required}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        );

      case 'dropdown':
        return (
          <select
            value={value}
            onChange={(e) => handleCustomFieldChange(field.fieldName, e.target.value)}
            required={field.required}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select...</option>
            {field.options?.map((option, idx) => (
              <option key={idx} value={option}>{option}</option>
            ))}
          </select>
        );

      case 'textarea':
        return (
          <textarea
            value={value}
            onChange={(e) => handleCustomFieldChange(field.fieldName, e.target.value)}
            required={field.required}
            placeholder={field.placeholder || ''}
            rows={3}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        );

      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-4xl w-full my-8">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6 rounded-t-2xl sticky top-0 z-10">
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
        <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[calc(90vh-120px)] overflow-y-auto">
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
  <option value="">Select Rank</option>
  <option value="RI">RI - रेडियो निरीक्षक (Radio Inspector)</option>
  <option value="RSI">RSI - रेडियो उप निरीक्षक (Radio Sub Inspector)</option>
  <option value="HO">HO - प्रधान परिचालक (Head Operator)</option>
  <option value="HOM">HOM - प्रधान परिचालक(यांत्रिक) (Head Operator Maintenance)</option>
  <option value="AO">AO - सहायक परिचालक (Assistant Operator)</option>
  <option value="WH">WH - कर्मशाला कर्मचारी (Workshop Hand)</option>
  <option value="MESSENGER">MESSENGER - संदेश वाहक (Messenger)</option>
  <option value="DR">DR - डाक रनर (Dak Runner)</option>
</select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Rank Number
                </label>
                <input
                  type="text"
                  name="rankNumber"
                  value={formData.rankNumber}
                  onChange={handleChange}
                  placeholder="e.g., 3879"
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
                  <option value="MALE">MALE</option>
                  <option value="FEMALE">FEMALE</option>
                  <option value="OTHER">OTHER</option>
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
                  <option value="NPS">NPS (National Pension System)</option>
                  <option value="GPF">GPF (General Provident Fund)</option>
                  <option value="CPF">CPF (Contributory Provident Fund)</option>
                  <option value="EPF">EPF (Employees Provident Fund)</option>
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

          {/* CUSTOM FIELDS SECTION */}
          {!loadingFields && customFieldSettings.length > 0 && (
            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                </svg>
                अतिरिक्त जानकारी (Custom Fields)
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {customFieldSettings.map(field => (
                  <div key={field._id}>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {field.fieldLabel} {field.required && '*'}
                    </label>
                    {renderCustomField(field)}
                  </div>
                ))}
              </div>
            </div>
          )}

          {loadingFields && (
            <div className="text-center py-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-sm text-gray-500 mt-2">Loading custom fields...</p>
            </div>
          )}

          {/* Submit Buttons */}
          <div className="flex gap-4 justify-end pt-4 border-t sticky bottom-0 bg-white">
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
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold disabled:bg-blue-300 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {loading && (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              )}
              {isEdit ? 'Update कर्मचारी' : 'Add कर्मचारी'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Employees;
