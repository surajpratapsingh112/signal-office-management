import React, { useState, useEffect } from 'react';
import { holidaysAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import Layout from '../components/Layout';

const Holidays = () => {
  const { user } = useAuth();
  const [holidays, setHolidays] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingHoliday, setEditingHoliday] = useState(null);

  useEffect(() => {
    fetchHolidays();
  }, [selectedYear]);

  const fetchHolidays = async () => {
    try {
      const response = await holidaysAPI.getAll({ year: selectedYear });
      setHolidays(response.data.data);
    } catch (error) {
      console.error('Error fetching holidays:', error);
      alert('Error loading holidays');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (holiday) => {
    setEditingHoliday(holiday);
    setShowEditModal(true);
  };

  const handleDelete = async (holidayId, holidayName) => {
    if (!window.confirm(`क्या आप ${holidayName} को delete करना चाहते हैं?`)) {
      return;
    }

    try {
      await holidaysAPI.delete(holidayId);
      alert('Holiday successfully deleted!');
      fetchHolidays();
    } catch (error) {
      console.error('Error deleting holiday:', error);
      alert('Error: ' + (error.response?.data?.message || 'Delete failed'));
    }
  };

  // Group holidays by month
  const groupedHolidays = holidays.reduce((acc, holiday) => {
    const month = new Date(holiday.date).toLocaleString('hi-IN', { month: 'long' });
    if (!acc[month]) acc[month] = [];
    acc[month].push(holiday);
    return acc;
  }, {});

  // Generate year options (current year ± 5)
  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: 11 }, (_, i) => currentYear - 5 + i);

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
            <h1 className="text-3xl font-bold text-gray-800">Holiday Management</h1>
            <p className="text-gray-600 mt-1">कुल {holidays.length} holidays in {selectedYear}</p>
          </div>
          <div className="flex gap-4">
            {/* Year Selector */}
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              {yearOptions.map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>

            {user?.role === 'office_admin' && (
              <button
                onClick={() => setShowAddModal(true)}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center gap-2 font-semibold"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add Holiday
              </button>
            )}
          </div>
        </div>

        {/* Holidays by Month */}
        {Object.keys(groupedHolidays).length === 0 ? (
          <div className="bg-white rounded-xl shadow-md p-12 text-center text-gray-500">
            {selectedYear} में कोई holidays नहीं हैं। Add करें!
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(groupedHolidays).map(([month, monthHolidays]) => (
              <div key={month} className="bg-white rounded-xl shadow-md p-6">
                <h2 className="text-xl font-bold text-gray-800 mb-4">{month}</h2>
                <div className="space-y-3">
                  {monthHolidays.map((holiday) => (
                    <div
                      key={holiday._id}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition"
                    >
                      <div className="flex items-center gap-4 flex-1">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-blue-600">
                            {new Date(holiday.date).getDate()}
                          </div>
                          <div className="text-xs text-gray-500">
                            {new Date(holiday.date).toLocaleDateString('en-US', { weekday: 'short' })}
                          </div>
                        </div>
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-gray-800">{holiday.name}</h3>
                          {holiday.nameEnglish && (
                            <p className="text-sm text-gray-500">{holiday.nameEnglish}</p>
                          )}
                        </div>
                        <div>
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            holiday.type === 'GAZETTED' 
                              ? 'bg-blue-100 text-blue-800' 
                              : 'bg-orange-100 text-orange-800'
                          }`}>
                            {holiday.type}
                          </span>
                        </div>
                      </div>

                      {user?.role === 'office_admin' && (
                        <div className="flex gap-2 ml-4">
                          <button
                            onClick={() => handleEdit(holiday)}
                            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition text-sm font-semibold"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(holiday._id, holiday.name)}
                            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition text-sm font-semibold"
                          >
                            Delete
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Modals */}
        {showAddModal && (
          <AddEditHolidayModal
            year={selectedYear}
            onClose={() => setShowAddModal(false)}
            onSuccess={() => {
              setShowAddModal(false);
              fetchHolidays();
            }}
          />
        )}

        {showEditModal && editingHoliday && (
          <AddEditHolidayModal
            holiday={editingHoliday}
            year={selectedYear}
            onClose={() => {
              setShowEditModal(false);
              setEditingHoliday(null);
            }}
            onSuccess={() => {
              setShowEditModal(false);
              setEditingHoliday(null);
              fetchHolidays();
            }}
          />
        )}
      </div>
    </Layout>
  );
};

// Add/Edit Holiday Modal
const AddEditHolidayModal = ({ holiday, year, onClose, onSuccess }) => {
  const isEdit = !!holiday;
  const [formData, setFormData] = useState({
    date: holiday?.date ? new Date(holiday.date).toISOString().split('T')[0] : '',
    name: holiday?.name || '',
    nameEnglish: holiday?.nameEnglish || '',
    type: holiday?.type || 'GAZETTED',
    year: holiday?.year || year,
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
        await holidaysAPI.update(holiday._id, formData);
        alert('Holiday successfully updated!');
      } else {
        await holidaysAPI.create(formData);
        alert('Holiday successfully added!');
      }
      onSuccess();
    } catch (error) {
      console.error('Error saving holiday:', error);
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
              {isEdit ? 'Edit Holiday' : 'Add Holiday'}
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date *
              </label>
              <input
                type="date"
                name="date"
                value={formData.date}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Name (Hindi) *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                placeholder="जैसे: होली, गणतंत्र दिवस"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Name (English)
              </label>
              <input
                type="text"
                name="nameEnglish"
                value={formData.nameEnglish}
                onChange={handleChange}
                placeholder="e.g., Holi, Republic Day"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Type *
              </label>
              <select
                name="type"
                value={formData.type}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="GAZETTED">Gazetted Holiday</option>
                <option value="RESTRICTED">Restricted Holiday</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Year *
              </label>
              <input
                type="number"
                name="year"
                value={formData.year}
                onChange={handleChange}
                required
                readOnly
                className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100"
              />
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
              {loading ? 'Saving...' : isEdit ? 'Update' : 'Add'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Holidays;