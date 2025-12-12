
import React, { useState } from 'react';
import { 
  Server, Shield, Bell, DollarSign, Lock, AlertTriangle, 
  ToggleLeft, ToggleRight, Save, RefreshCw 
} from 'lucide-react';
import { InputLabel, InputField } from '../../common/FormElements';

const SystemSettings = () => {
  const [settings, setSettings] = useState({
    maintenanceMode: false,
    newRegistration: true,
    autoDispatch: true,
    systemAnnouncement: '',
    defaultPayRate: 25.00,
    maxOvertime: 10,
    lockdownMode: false
  });

  const toggle = (key: keyof typeof settings) => {
    setSettings(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSave = () => {
    // In real app, save to system_config table
    alert("System configuration updated.");
  };

  return (
    <div className="space-y-8 animate-fade-in-up pb-12">
      {/* Header */}
      <div className="border-b border-white/5 pb-6">
         <h2 className="text-3xl font-display font-bold text-white tracking-tight">System Configuration</h2>
         <p className="text-gray-400 text-sm mt-2">Global settings, feature toggles, and security protocols.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Operational Controls */}
          <div className="bg-brand-ebony rounded-xl border border-brand-800 p-6">
              <h3 className="text-xl font-bold text-white mb-6 flex items-center">
                  <Server className="w-5 h-5 mr-3 text-brand-sage" /> Operational Controls
              </h3>
              
              <div className="space-y-6">
                  <div className="flex items-center justify-between">
                      <div>
                          <p className="text-white font-bold">Maintenance Mode</p>
                          <p className="text-xs text-gray-500">Disables non-admin access.</p>
                      </div>
                      <button onClick={() => toggle('maintenanceMode')} className={`transition-colors ${settings.maintenanceMode ? 'text-brand-sage' : 'text-gray-600'}`}>
                          {settings.maintenanceMode ? <ToggleRight size={32} /> : <ToggleLeft size={32} />}
                      </button>
                  </div>

                  <div className="flex items-center justify-between">
                      <div>
                          <p className="text-white font-bold">New Registrations</p>
                          <p className="text-xs text-gray-500">Allow new user sign-ups.</p>
                      </div>
                      <button onClick={() => toggle('newRegistration')} className={`transition-colors ${settings.newRegistration ? 'text-brand-sage' : 'text-gray-600'}`}>
                          {settings.newRegistration ? <ToggleRight size={32} /> : <ToggleLeft size={32} />}
                      </button>
                  </div>

                  <div className="flex items-center justify-between">
                      <div>
                          <p className="text-white font-bold">Auto-Dispatch AI</p>
                          <p className="text-xs text-gray-500">Enable algorithmic matching.</p>
                      </div>
                      <button onClick={() => toggle('autoDispatch')} className={`transition-colors ${settings.autoDispatch ? 'text-brand-sage' : 'text-gray-600'}`}>
                          {settings.autoDispatch ? <ToggleRight size={32} /> : <ToggleLeft size={32} />}
                      </button>
                  </div>
              </div>
          </div>

          {/* Financial Defaults */}
          <div className="bg-brand-ebony rounded-xl border border-brand-800 p-6">
              <h3 className="text-xl font-bold text-white mb-6 flex items-center">
                  <DollarSign className="w-5 h-5 mr-3 text-green-500" /> Financial Defaults
              </h3>
              
              <div className="space-y-4">
                  <div>
                      <InputLabel>Default Guard Pay Rate ($/hr)</InputLabel>
                      <InputField 
                          type="number" 
                          value={settings.defaultPayRate} 
                          onChange={(e) => setSettings({...settings, defaultPayRate: parseFloat(e.target.value)})} 
                      />
                  </div>
                  <div>
                      <InputLabel>Max Weekly Overtime (Hrs)</InputLabel>
                      <InputField 
                          type="number" 
                          value={settings.maxOvertime} 
                          onChange={(e) => setSettings({...settings, maxOvertime: parseFloat(e.target.value)})} 
                      />
                  </div>
              </div>
          </div>

          {/* Security Protocols */}
          <div className="bg-brand-ebony rounded-xl border border-brand-800 p-6">
              <h3 className="text-xl font-bold text-white mb-6 flex items-center">
                  <Shield className="w-5 h-5 mr-3 text-red-500" /> Security Protocols
              </h3>
              
              <div className="space-y-4">
                  <div className="bg-red-900/10 border border-red-500/20 p-4 rounded-lg flex items-center justify-between">
                      <div>
                          <p className="text-red-400 font-bold flex items-center"><Lock className="w-4 h-4 mr-2" /> System Lockdown</p>
                          <p className="text-xs text-gray-500 mt-1">Forces logout for all non-owners.</p>
                      </div>
                      <button onClick={() => toggle('lockdownMode')} className={`transition-colors ${settings.lockdownMode ? 'text-red-500' : 'text-gray-600'}`}>
                          {settings.lockdownMode ? <ToggleRight size={32} /> : <ToggleLeft size={32} />}
                      </button>
                  </div>
              </div>
          </div>

          {/* Announcements */}
          <div className="bg-brand-ebony rounded-xl border border-brand-800 p-6">
              <h3 className="text-xl font-bold text-white mb-6 flex items-center">
                  <Bell className="w-5 h-5 mr-3 text-blue-400" /> Global Announcement
              </h3>
              
              <div className="space-y-4">
                  <InputLabel>Banner Message</InputLabel>
                  <textarea 
                      className="w-full bg-brand-black border border-brand-800 rounded p-3 text-white h-24 focus:border-brand-sage outline-none"
                      placeholder="Enter a message to display on all dashboards..."
                      value={settings.systemAnnouncement}
                      onChange={(e) => setSettings({...settings, systemAnnouncement: e.target.value})}
                  />
                  <div className="flex justify-end">
                      <button className="text-xs text-brand-sage hover:text-white">Clear</button>
                  </div>
              </div>
          </div>

      </div>

      <div className="flex justify-end pt-6 border-t border-white/5">
          <button onClick={handleSave} className="bg-brand-sage text-black font-bold px-8 py-3 rounded-lg hover:bg-brand-sage/90 flex items-center shadow-lg transition-transform hover:-translate-y-1">
              <Save className="w-5 h-5 mr-2" /> Save Configuration
          </button>
      </div>
    </div>
  );
};

export default SystemSettings;
