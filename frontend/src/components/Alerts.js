import React, { useState, useEffect } from 'react';
import { getAlertSettings, createAlertSetting } from '../services/api';

function Alerts({ userId, categories }) {
  const [settings, setSettings] = useState([]);
  const [formData, setFormData] = useState({
    category: '',
    threshold_percentage: 90,
    email_enabled: true
  });

  useEffect(() => {
    if (categories.length > 0 && !formData.category) {
      setFormData(prev => ({ ...prev, category: categories[0] }));
    }
  }, [categories]);

  useEffect(() => {
    loadSettings();
  }, [userId]);

  const loadSettings = async () => {
    try {
      const response = await getAlertSettings(userId);
      setSettings(response.data);
    } catch (error) {
      console.error('Error loading alert settings:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await createAlertSetting({ ...formData, user_id: userId });
      loadSettings();
      window.alert('Alert setting saved!');
    } catch (error) {
      window.alert('Error saving alert setting: ' + error.message);
    }
  };

  const settingsByCategory = settings.reduce((acc, setting) => {
    acc[setting.category] = setting;
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold text-gray-800">Alert Settings</h2>
      <p className="text-gray-600">Set custom alert thresholds for each category. You'll be notified when your spending reaches the threshold.</p>

      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
            <select value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" required>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Alert Threshold (%)</label>
            <input type="number" min="1" max="100" value={formData.threshold_percentage} onChange={(e) => setFormData({ ...formData, threshold_percentage: parseInt(e.target.value) })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" required />
            <p className="text-sm text-gray-500 mt-1">Alert when {formData.threshold_percentage}% of budget is used</p>
          </div>
          <div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={formData.email_enabled} onChange={(e) => setFormData({ ...formData, email_enabled: e.target.checked })} className="w-4 h-4 text-blue-500 border-gray-300 rounded focus:ring-blue-500" />
              <span className="text-gray-700">Enable Email Notifications</span>
            </label>
          </div>
          <button type="submit" className="w-full bg-blue-500 text-white py-3 rounded-lg font-semibold hover:bg-blue-600 transition">
            Save Alert Setting
          </button>
        </form>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h3 className="text-xl font-bold text-gray-800 mb-4">Current Alert Settings</h3>
        <div className="space-y-3">
          {categories.map(category => {
            const setting = settingsByCategory[category];
            return (
              <div key={category} className="p-4 bg-gray-50 rounded-lg">
                <p className="font-semibold text-gray-800">{category}</p>
                {setting ? (
                  <p className="text-sm text-gray-600 mt-1">
                    Alert at {setting.threshold_percentage}% • Email: {setting.email_enabled ? 'Enabled' : 'Disabled'}
                  </p>
                ) : (
                  <p className="text-sm text-gray-400 mt-1">Default (90%)</p>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default Alerts;