import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  User, 
  Bell, 
  Palette, 
  Shield, 
  Crown,
  Save,
  Mail,
  Phone,
  Globe
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import toast from 'react-hot-toast';

export function Settings() {
  const { user } = useAuth();
  const [settings, setSettings] = useState({
    notifications: {
      taskReminders: true,
      moodReminders: true,
      dailySummary: true,
      emailNotifications: false,
    },
    privacy: {
      dataSharing: false,
      analytics: true,
      voiceRecordings: true,
    },
    preferences: {
      theme: 'light',
      language: 'en',
      voiceSpeed: 'normal',
      aiPersonality: 'supportive',
    },
    profile: {
      fullName: '',
      phone: '',
      timezone: 'UTC',
    },
  });

  const [activeTab, setActiveTab] = useState('profile');

  const handleSave = () => {
    // In a real app, this would save to the database
    toast.success('Settings saved successfully!');
  };

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'preferences', label: 'Preferences', icon: Palette },
    { id: 'privacy', label: 'Privacy', icon: Shield },
    { id: 'subscription', label: 'Subscription', icon: Crown },
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'profile':
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <div className="flex items-center space-x-3">
                <Mail className="h-5 w-5 text-gray-400" />
                <input
                  type="email"
                  value={user?.email || ''}
                  disabled
                  className="flex-1 border border-gray-300 rounded-lg px-3 py-2 bg-gray-50 text-gray-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Full Name
              </label>
              <input
                type="text"
                value={settings.profile.fullName}
                onChange={(e) => setSettings({
                  ...settings,
                  profile: { ...settings.profile, fullName: e.target.value }
                })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="Enter your full name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Phone Number
              </label>
              <div className="flex items-center space-x-3">
                <Phone className="h-5 w-5 text-gray-400" />
                <input
                  type="tel"
                  value={settings.profile.phone}
                  onChange={(e) => setSettings({
                    ...settings,
                    profile: { ...settings.profile, phone: e.target.value }
                  })}
                  className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="+1 (555) 123-4567"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Timezone
              </label>
              <div className="flex items-center space-x-3">
                <Globe className="h-5 w-5 text-gray-400" />
                <select
                  value={settings.profile.timezone}
                  onChange={(e) => setSettings({
                    ...settings,
                    profile: { ...settings.profile, timezone: e.target.value }
                  })}
                  className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="UTC">UTC</option>
                  <option value="America/New_York">Eastern Time</option>
                  <option value="America/Chicago">Central Time</option>
                  <option value="America/Denver">Mountain Time</option>
                  <option value="America/Los_Angeles">Pacific Time</option>
                </select>
              </div>
            </div>
          </div>
        );

      case 'notifications':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Push Notifications</h3>
              <div className="space-y-4">
                {Object.entries(settings.notifications).map(([key, value]) => (
                  <div key={key} className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900 capitalize">
                        {key.replace(/([A-Z])/g, ' $1').trim()}
                      </p>
                      <p className="text-sm text-gray-500">
                        {key === 'taskReminders' && 'Get reminded about your tasks and deadlines'}
                        {key === 'moodReminders' && 'Daily prompts to check in with your emotions'}
                        {key === 'dailySummary' && 'End-of-day summary of your activities'}
                        {key === 'emailNotifications' && 'Receive notifications via email'}
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={value}
                        onChange={(e) => setSettings({
                          ...settings,
                          notifications: { ...settings.notifications, [key]: e.target.checked }
                        })}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                    </label>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      case 'preferences':
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Theme
              </label>
              <select
                value={settings.preferences.theme}
                onChange={(e) => setSettings({
                  ...settings,
                  preferences: { ...settings.preferences, theme: e.target.value }
                })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="light">Light</option>
                <option value="dark">Dark</option>
                <option value="auto">Auto</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                AI Voice Speed
              </label>
              <select
                value={settings.preferences.voiceSpeed}
                onChange={(e) => setSettings({
                  ...settings,
                  preferences: { ...settings.preferences, voiceSpeed: e.target.value }
                })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="slow">Slow</option>
                <option value="normal">Normal</option>
                <option value="fast">Fast</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                AI Personality
              </label>
              <select
                value={settings.preferences.aiPersonality}
                onChange={(e) => setSettings({
                  ...settings,
                  preferences: { ...settings.preferences, aiPersonality: e.target.value }
                })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="supportive">Supportive & Caring</option>
                <option value="professional">Professional</option>
                <option value="friendly">Friendly & Casual</option>
                <option value="motivational">Motivational</option>
              </select>
            </div>
          </div>
        );

      case 'privacy':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Data & Privacy</h3>
              <div className="space-y-4">
                {Object.entries(settings.privacy).map(([key, value]) => (
                  <div key={key} className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900 capitalize">
                        {key.replace(/([A-Z])/g, ' $1').trim()}
                      </p>
                      <p className="text-sm text-gray-500">
                        {key === 'dataSharing' && 'Share anonymized data to improve the service'}
                        {key === 'analytics' && 'Help us understand how you use the app'}
                        {key === 'voiceRecordings' && 'Store voice recordings for better AI responses'}
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={value}
                        onChange={(e) => setSettings({
                          ...settings,
                          privacy: { ...settings.privacy, [key]: e.target.checked }
                        })}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                    </label>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      case 'subscription':
        return (
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl p-6 border border-purple-100">
              <div className="flex items-center space-x-3 mb-4">
                <Crown className="h-6 w-6 text-purple-600" />
                <h3 className="text-lg font-bold text-gray-900">MindPal Pro</h3>
              </div>
              <p className="text-gray-600 mb-4">
                Currently on the free plan. Upgrade to Pro for advanced features!
              </p>
              
              <div className="space-y-3 mb-6">
                <div className="flex items-center space-x-2 text-sm">
                  <div className="w-2 h-2 bg-purple-600 rounded-full"></div>
                  <span>Advanced AI personality customization</span>
                </div>
                <div className="flex items-center space-x-2 text-sm">
                  <div className="w-2 h-2 bg-purple-600 rounded-full"></div>
                  <span>Extended mood analytics and insights</span>
                </div>
                <div className="flex items-center space-x-2 text-sm">
                  <div className="w-2 h-2 bg-purple-600 rounded-full"></div>
                  <span>Priority support and early access to features</span>
                </div>
                <div className="flex items-center space-x-2 text-sm">
                  <div className="w-2 h-2 bg-purple-600 rounded-full"></div>
                  <span>Family sharing and parental reports</span>
                </div>
              </div>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white py-3 px-6 rounded-xl font-semibold hover:shadow-lg transition-all duration-200"
              >
                Upgrade to Pro - $9.99/month
              </motion.button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Settings</h1>
        <p className="text-gray-600">Customize your MindPal experience</p>
      </div>

      {/* Settings Container */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="flex">
          {/* Sidebar */}
          <div className="w-64 bg-gray-50 border-r border-gray-200">
            <nav className="p-4 space-y-2">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-all duration-200 ${
                      activeTab === tab.id
                        ? 'bg-purple-100 text-purple-700 font-medium'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Content */}
          <div className="flex-1 p-8">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3 }}
            >
              {renderTabContent()}

              {/* Save Button */}
              {activeTab !== 'subscription' && (
                <div className="mt-8 pt-6 border-t border-gray-200">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleSave}
                    className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6 py-3 rounded-xl font-semibold hover:shadow-lg transition-all duration-200 flex items-center space-x-2"
                  >
                    <Save className="h-4 w-4" />
                    <span>Save Changes</span>
                  </motion.button>
                </div>
              )}
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}