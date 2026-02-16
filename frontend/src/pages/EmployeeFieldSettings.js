import React, { useState, useEffect } from 'react';
import { employeeFieldSettingsAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import Layout from '../components/Layout';

const EmployeeFieldSettings = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [fields, setFields] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingField, setEditingField] = useState(null);
  const [formData, setFormData] = useState({
    fieldName: '',
    fieldLabel: '',
    fieldType: 'text',
    required: false,
    enabled: true,
    showInTable: false,
    options: [],
    placeholder: '',
    validationPattern: ''
  });

  useEffect(() => {
    fetchFields();
  }, []);

  const fetchFields = async () => {
    try {
      const response = await employeeFieldSettingsAPI.getAll();
      setFields(response.data.data);
    } catch (error) {
      console.error('Error fetching fields:', error);
      alert('Error loading field settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      if (editingField) {
        await employeeFieldSettingsAPI.update(editingField._id, formData);
        alert('Field updated successfully!');
      } else {
        await employeeFieldSettingsAPI.create(formData);
        alert('Field created successfully!');
      }
      
      setShowModal(false);
      setEditingField(null);
      resetForm();
      fetchFields();
    } catch (error) {
      console.error('Error:', error);
      alert('Error: ' + (error.response?.data?.message || 'Failed to save field'));
    }
  };

  const handleEdit = (field) => {
    setEditingField(field);
    setFormData({
      fieldName: field.fieldName,
      fieldLabel: field.fieldLabel,
      fieldType: field.fieldType,
      required: field.required,
      enabled: field.enabled,
      showInTable: field.showInTable,
      options: field.options || [],
      placeholder: field.placeholder || '',
      validationPattern: field.validationPattern || ''
    });
    setShowModal(true);
  };

  const handleDelete = async (id, fieldLabel) => {
    if (!window.confirm(`क्या आप "${fieldLabel}" field को delete करना चाहते हैं?\n\nNote: Existing data will remain in database.`)) {
      return;
    }

    try {
      await employeeFieldSettingsAPI.delete(id);
      alert('Field deleted successfully!');
      fetchFields();
    } catch (error) {
      console.error('Error:', error);
      alert('Error: ' + (error.response?.data?.message || 'Failed to delete field'));
    }
  };

  const handleToggleEnabled = async (field) => {
    try {
      await employeeFieldSettingsAPI.update(field._id, { enabled: !field.enabled });
      fetchFields();
    } catch (error) {
      console.error('Error:', error);
      alert('Error toggling field status');
    }
  };

  const resetForm = () => {
    setFormData({
      fieldName: '',
      fieldLabel: '',
      fieldType: 'text',
      required: false,
      enabled: true,
      showInTable: false,
      options: [],
      placeholder: '',
      validationPattern: ''
    });
  };

  const handleAddOption = () => {
    setFormData({
      ...formData,
      options: [...formData.options, '']
    });
  };

  const handleRemoveOption = (index) => {
    const newOptions = formData.options.filter((_, i) => i !== index);
    setFormData({ ...formData, options: newOptions });
  };

  const handleOptionChange = (index, value) => {
    const newOptions = [...formData.options];
    newOptions[index] = value;
    setFormData({ ...formData, options: newOptions });
  };

  const generateFieldName = (label) => {
    return label
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .replace(/\s+/g, '_')
      .trim();
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
            <h1 className="text-3xl font-bold text-gray-800">Employee Custom Fields</h1>
            <p className="text-gray-600 mt-1">Manage additional employee information fields</p>
          </div>
          <button
            onClick={() => {
              setEditingField(null);
              resetForm();
              setShowModal(true);
            }}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center gap-2 font-semibold"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Custom Field
          </button>
        </div>

        {/* Info Box */}
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-start gap-3">
            <svg className="w-6 h-6 text-blue-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            <div>
              <h3 className="font-semibold text-blue-800">About Custom Fields</h3>
              <p className="text-sm text-blue-700 mt-1">
                Add custom fields like Father's Name, Date of Birth, Address, Blood Group, Aadhar Number, etc. 
                These fields will automatically appear in employee forms.
              </p>
            </div>
          </div>
        </div>

        {/* Fields Table */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="p-6 border-b">
            <h2 className="text-xl font-bold text-gray-800">Custom Fields ({fields.length})</h2>
          </div>

          {fields.length === 0 ? (
            <div className="p-12 text-center text-gray-500">
              <svg className="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <h3 className="text-lg font-semibold text-gray-700 mb-2">No Custom Fields</h3>
              <p className="text-gray-500">Click "Add Custom Field" to create your first field</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Field Label</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Field Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Required</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Show in Table</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {fields.map((field) => (
                    <tr key={field._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{field.fieldLabel}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-600 font-mono">{field.fieldName}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                          {field.fieldType.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {field.required ? (
                          <span className="text-red-600 font-semibold">Yes</span>
                        ) : (
                          <span className="text-gray-500">No</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {field.showInTable ? (
                          <span className="text-green-600 font-semibold">Yes</span>
                        ) : (
                          <span className="text-gray-500">No</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={() => handleToggleEnabled(field)}
                          className={`px-3 py-1 text-xs font-semibold rounded-full ${
                            field.enabled
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {field.enabled ? 'Enabled' : 'Disabled'}
                        </button>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEdit(field)}
                            className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded hover:bg-indigo-200 font-semibold"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(field._id, field.fieldLabel)}
                            className="px-3 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200 font-semibold"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Add/Edit Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={() => setShowModal(false)}>
            <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6 rounded-t-2xl sticky top-0">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold">
                    {editingField ? 'Edit Custom Field' : 'Add Custom Field'}
                  </h2>
                  <button
                    onClick={() => setShowModal(false)}
                    className="text-white hover:bg-blue-500 rounded-full p-2"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-6">
                {/* Field Label */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Field Label * (जैसे: Father's Name, पिता का नाम)
                  </label>
                  <input
                    type="text"
                    value={formData.fieldLabel}
                    onChange={(e) => {
                      const label = e.target.value;
                      setFormData({
                        ...formData,
                        fieldLabel: label,
                        fieldName: editingField ? formData.fieldName : generateFieldName(label)
                      });
                    }}
                    required
                    placeholder="e.g., Father's Name"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Field Name (Auto-generated) */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Field Name (Database Key)
                  </label>
                  <input
                    type="text"
                    value={formData.fieldName}
                    readOnly={!!editingField}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 font-mono text-sm"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {editingField ? 'Field name cannot be changed after creation' : 'Auto-generated from label'}
                  </p>
                </div>

                {/* Field Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Field Type *
                  </label>
                  <select
                    value={formData.fieldType}
                    onChange={(e) => setFormData({ ...formData, fieldType: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="text">Text</option>
                    <option value="textarea">Textarea (Long Text)</option>
                    <option value="number">Number</option>
                    <option value="date">Date</option>
                    <option value="email">Email</option>
                    <option value="phone">Phone</option>
                    <option value="dropdown">Dropdown</option>
                  </select>
                </div>

                {/* Dropdown Options */}
                {formData.fieldType === 'dropdown' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Dropdown Options
                    </label>
                    {formData.options.map((option, index) => (
                      <div key={index} className="flex gap-2 mb-2">
                        <input
                          type="text"
                          value={option}
                          onChange={(e) => handleOptionChange(index, e.target.value)}
                          placeholder={`Option ${index + 1}`}
                          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveOption(index)}
                          className="px-3 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={handleAddOption}
                      className="px-4 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 font-semibold"
                    >
                      + Add Option
                    </button>
                  </div>
                )}

                {/* Placeholder */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Placeholder (Optional)
                  </label>
                  <input
                    type="text"
                    value={formData.placeholder}
                    onChange={(e) => setFormData({ ...formData, placeholder: e.target.value })}
                    placeholder="e.g., Enter father's name"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Checkboxes */}
                <div className="space-y-3">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.required}
                      onChange={(e) => setFormData({ ...formData, required: e.target.checked })}
                      className="w-4 h-4 text-blue-600 focus:ring-blue-500 rounded"
                    />
                    <span className="text-sm font-medium text-gray-700">Required Field</span>
                  </label>

                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.enabled}
                      onChange={(e) => setFormData({ ...formData, enabled: e.target.checked })}
                      className="w-4 h-4 text-blue-600 focus:ring-blue-500 rounded"
                    />
                    <span className="text-sm font-medium text-gray-700">Enabled (Show in forms)</span>
                  </label>

                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.showInTable}
                      onChange={(e) => setFormData({ ...formData, showInTable: e.target.checked })}
                      className="w-4 h-4 text-blue-600 focus:ring-blue-500 rounded"
                    />
                    <span className="text-sm font-medium text-gray-700">Show in Employee Table</span>
                  </label>
                </div>

                {/* Submit Buttons */}
                <div className="flex gap-4 justify-end pt-4 border-t">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold"
                  >
                    {editingField ? 'Update Field' : 'Create Field'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default EmployeeFieldSettings;