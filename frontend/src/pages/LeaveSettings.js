import React, { useState, useEffect } from 'react';
import { leaveSettingsAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import Layout from '../components/Layout';

const LeaveSettings = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [currentYear] = useState(new Date().getFullYear());
  const [settings, setSettings] = useState({
    casualLeave: 30,
    permissions: 5,
    restrictedLeave: 2
  });
  const [originalSettings, setOriginalSettings] = useState(null);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await leaveSettingsAPI.get(currentYear);
      setSettings(response.data.data);
      setOriginalSettings(response.data.data);
    } catch (error) {
      console.error('Error fetching settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setSettings(prev => ({
      ...prev,
      [name]: parseInt(value) || 0
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!window.confirm('क्या आप leave settings को update करना चाहते हैं?\n\nNote: यह सभी नए employees और नए year के लिए apply होगा।')) {
      return;
    }

    setSaving(true);

    try {
      await leaveSettingsAPI.update(currentYear, settings);
      alert('Settings successfully updated!');
      fetchSettings();
    } catch (error) {
      console.error('Error updating settings:', error);
      alert('Error: ' + (error.response?.data?.message || 'Failed to update'));
    } finally {
      setSaving(false);
    }
  };

  const hasChanges = () => {
    if (!originalSettings) return false;
    return settings.casualLeave !== originalSettings.casualLeave ||
           settings.permissions !== originalSettings.permissions ||
           settings.restrictedLeave !== originalSettings.restrictedLeave;
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
      <div className="p-6 max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-800">Leave Settings</h1>
          <p className="text-gray-600 mt-1">Configure annual leave allocation for year {currentYear}</p>
        </div>

        {/* Info Box */}
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-start gap-3">
            <svg className="w-6 h-6 text-blue-600 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <h3 className="text-sm font-semibold text-blue-800 mb-1">Important Notes:</h3>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• ये settings सभी नए employees के लिए default values होंगी</li>
                <li>• पुलिस में कोई weekend नहीं होता, इसलिए 30 CL मिलती है</li>
                <li>• Permission केवल Saturday/Sunday/Gazetted Holiday पर ली जा सकती है</li>
                <li>• Permission CL से अलग count होती है</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Settings Form */}
        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-6">Annual Leave Allocation</h2>
          
          <div className="space-y-6">
            {/* Casual Leave */}
            <div className="p-4 bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="text-lg font-semibold text-blue-800">Casual Leave (CL)</h3>
                  <p className="text-sm text-blue-600">सामान्य छुट्टी - वार्षिक आवंटन</p>
                </div>
                <div className="text-3xl font-bold text-blue-600">
                  {settings.casualLeave}
                </div>
              </div>
              <div className="flex items-center gap-4">
                <label className="text-sm font-medium text-gray-700 min-w-[100px]">
                  Days per year:
                </label>
                <input
                  type="number"
                  name="casualLeave"
                  value={settings.casualLeave}
                  onChange={handleChange}
                  min="0"
                  max="365"
                  className="flex-1 px-4 py-2 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
                />
              </div>
              <p className="text-xs text-gray-600 mt-2">
                Standard: 30 days (क्योंकि police में 365 days working होते हैं)
              </p>
            </div>

            {/* Permissions */}
            <div className="p-4 bg-gradient-to-r from-orange-50 to-orange-100 rounded-lg">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="text-lg font-semibold text-orange-800">Permissions</h3>
                  <p className="text-sm text-orange-600">परमीशन - वार्षिक संख्या</p>
                </div>
                <div className="text-3xl font-bold text-orange-600">
                  {settings.permissions}
                </div>
              </div>
              <div className="flex items-center gap-4">
                <label className="text-sm font-medium text-gray-700 min-w-[100px]">
                  Count per year:
                </label>
                <input
                  type="number"
                  name="permissions"
                  value={settings.permissions}
                  onChange={handleChange}
                  min="0"
                  max="20"
                  className="flex-1 px-4 py-2 border border-orange-300 rounded-lg focus:ring-2 focus:ring-orange-500 bg-white"
                />
              </div>
              <p className="text-xs text-gray-600 mt-2">
                Standard: 5 permissions (केवल Saturday/Sunday/Gazetted Holiday पर)
              </p>
            </div>

            {/* Restricted Leave */}
            <div className="p-4 bg-gradient-to-r from-purple-50 to-purple-100 rounded-lg">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="text-lg font-semibold text-purple-800">Restricted Leave (RL)</h3>
                  <p className="text-sm text-purple-600">प्रतिबंधित छुट्टी - वार्षिक आवंटन</p>
                </div>
                <div className="text-3xl font-bold text-purple-600">
                  {settings.restrictedLeave}
                </div>
              </div>
              <div className="flex items-center gap-4">
                <label className="text-sm font-medium text-gray-700 min-w-[100px]">
                  Days per year:
                </label>
                <input
                  type="number"
                  name="restrictedLeave"
                  value={settings.restrictedLeave}
                  onChange={handleChange}
                  min="0"
                  max="10"
                  className="flex-1 px-4 py-2 border border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500 bg-white"
                />
              </div>
              <p className="text-xs text-gray-600 mt-2">
                Standard: 2 days (केवल Restricted Holiday list से)
              </p>
            </div>
          </div>

          {/* Summary */}
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="text-sm font-semibold text-gray-700 mb-2">Configuration Summary:</h3>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-xs text-gray-600">CL per year</p>
                <p className="text-2xl font-bold text-blue-600">{settings.casualLeave}</p>
              </div>
              <div>
                <p className="text-xs text-gray-600">Permissions per year</p>
                <p className="text-2xl font-bold text-orange-600">{settings.permissions}</p>
              </div>
              <div>
                <p className="text-xs text-gray-600">RL per year</p>
                <p className="text-2xl font-bold text-purple-600">{settings.restrictedLeave}</p>
              </div>
            </div>
          </div>

          {/* Buttons */}
          <div className="mt-6 flex gap-4 justify-end">
            <button
              type="button"
              onClick={fetchSettings}
              disabled={!hasChanges()}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-semibold disabled:opacity-50"
            >
              Reset
            </button>
            <button
              type="submit"
              disabled={saving || !hasChanges()}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold disabled:bg-blue-400"
            >
              {saving ? 'Saving...' : 'Save Settings'}
            </button>
          </div>

          {hasChanges() && (
            <p className="mt-3 text-sm text-yellow-600 text-center">
              ⚠️ You have unsaved changes
            </p>
          )}
        </form>

        {/* Year Info */}
        <div className="mt-6 p-4 bg-gray-100 rounded-lg text-center">
          <p className="text-sm text-gray-600">
            These settings apply to year <span className="font-bold text-gray-800">{currentYear}</span>
          </p>
          <p className="text-xs text-gray-500 mt-1">
            Settings are created automatically for each new year
          </p>
        </div>
      </div>
    </Layout>
  );
};

export default LeaveSettings;