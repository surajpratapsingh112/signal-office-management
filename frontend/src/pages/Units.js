import React, { useState, useEffect } from 'react';
import { unitsAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import Layout from '../components/Layout';

const Units = () => {
  const { user } = useAuth();
  const [units, setUnits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingUnit, setEditingUnit] = useState(null);

  useEffect(() => {
    fetchUnits();
  }, []);

  const fetchUnits = async () => {
    try {
      const response = await unitsAPI.getAll();
      setUnits(response.data.data);
    } catch (error) {
      console.error('Error fetching units:', error);
      alert('Error loading units');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (unit) => {
    setEditingUnit(unit);
    setShowEditModal(true);
  };

  const handleDelete = async (unitId, unitName) => {
    if (!window.confirm(`क्या आप ${unitName} को delete करना चाहते हैं?`)) {
      return;
    }

    try {
      await unitsAPI.delete(unitId);
      alert('Unit successfully deleted!');
      fetchUnits();
    } catch (error) {
      console.error('Error deleting unit:', error);
      alert('Error: ' + (error.response?.data?.message || 'Delete failed. Unit may have employees.'));
    }
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
            <h1 className="text-3xl font-bold text-gray-800">यूनिट प्रबंधन</h1>
            <p className="text-gray-600 mt-1">कुल {units.length} यूनिट्स</p>
          </div>
          {user?.role === 'office_admin' && (
            <button
              onClick={() => setShowAddModal(true)}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center gap-2 font-semibold"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              नया यूनिट जोड़ें
            </button>
          )}
        </div>

        {/* Units Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {units.map((unit) => (
            <div key={unit._id} className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-gray-800">{unit.name}</h3>
                  <p className="text-sm text-gray-500 mt-1">Code: {unit.code}</p>
                </div>
                <div className={`px-3 py-1 rounded-full text-xs font-semibold ${
                  unit.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                }`}>
                  {unit.isActive ? 'Active' : 'Inactive'}
                </div>
              </div>

              {unit.description && (
                <p className="text-sm text-gray-600 mb-4">{unit.description}</p>
              )}

              {unit.inchargeId && (
                <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                  <p className="text-xs text-blue-600 font-semibold mb-1">प्रभारी</p>
                  <p className="text-sm text-gray-800">{unit.inchargeId.name}</p>
                  <p className="text-xs text-gray-500">@{unit.inchargeId.username}</p>
                </div>
              )}

              <div className="text-xs text-gray-500 mb-4">
                Created: {new Date(unit.createdAt).toLocaleDateString('hi-IN')}
              </div>

              {user?.role === 'office_admin' && (
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEdit(unit)}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm font-semibold"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(unit._id, unit.name)}
                    className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition text-sm font-semibold"
                  >
                    Delete
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Modals */}
        {showAddModal && (
          <AddEditUnitModal
            onClose={() => setShowAddModal(false)}
            onSuccess={() => {
              setShowAddModal(false);
              fetchUnits();
            }}
          />
        )}

        {showEditModal && editingUnit && (
          <AddEditUnitModal
            unit={editingUnit}
            onClose={() => {
              setShowEditModal(false);
              setEditingUnit(null);
            }}
            onSuccess={() => {
              setShowEditModal(false);
              setEditingUnit(null);
              fetchUnits();
            }}
          />
        )}
      </div>
    </Layout>
  );
};

// Add/Edit Unit Modal
const AddEditUnitModal = ({ unit, onClose, onSuccess }) => {
  const isEdit = !!unit;
  const [formData, setFormData] = useState({
    name: unit?.name || '',
    code: unit?.code || '',
    description: unit?.description || '',
    isActive: unit?.isActive !== undefined ? unit.isActive : true,
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setFormData({ ...formData, [e.target.name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isEdit) {
        await unitsAPI.update(unit._id, formData);
        alert('Unit successfully updated!');
      } else {
        await unitsAPI.create(formData);
        alert('नया unit successfully add हो गया!');
      }
      onSuccess();
    } catch (error) {
      console.error('Error saving unit:', error);
      alert('Error: ' + (error.response?.data?.message || 'Save failed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">
              {isEdit ? 'यूनिट Edit करें' : 'नया यूनिट जोड़ें'}
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
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              यूनिट का नाम (हिंदी में) *
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              placeholder="जैसे: सीआरयू, पोलनेट"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Code (English में) *
            </label>
            <input
              type="text"
              name="code"
              value={formData.code}
              onChange={handleChange}
              required
              disabled={isEdit}
              placeholder="जैसे: CRU, POLNET"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 uppercase"
            />
            {isEdit && (
              <p className="text-xs text-gray-500 mt-1">Code को edit नहीं किया जा सकता</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              विवरण (Optional)
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows="3"
              placeholder="यूनिट के बारे में जानकारी..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              name="isActive"
              checked={formData.isActive}
              onChange={handleChange}
              className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
            />
            <label className="ml-2 text-sm font-medium text-gray-700">
              यूनिट Active है
            </label>
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

export default Units;