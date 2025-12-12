
import React, { useState, useEffect } from 'react';
import { 
  User, Bell, Shield, Eye, Lock, Globe, Sun, Moon, Cloud, 
  CheckCircle, ChevronRight, Save, LogOut, Smartphone, Mail, AlertTriangle, Monitor 
} from 'lucide-react';
import PortalHeader from './PortalHeader';
import { PageView } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { supabase } from '../services/supabase';
import { InputLabel, InputField } from './common/FormElements';

interface SettingsProps {
  onNavigate: (page: PageView) => void;
  user: any;
}

type SettingsTab = 'account' | 'notifications' | 'privacy' | 'security' | 'display';

const Settings: React.FC<SettingsProps> = ({ onNavigate, user }) => {
  const { signOut } = useAuth();
  const { theme, setTheme } = useTheme();
  const [activeTab, setActiveTab] = useState<SettingsTab>('account');
  const [formData, setFormData] = useState({
    fullName: user?.full_name || '',
    email: user?.email || '',
    phone: user?.phone_primary || '',
    bio: user?.bio || '',
  });
  const [loading, setLoading] = useState(false);

  // Mock Security Data
  const loginHistory = [
    { date: 'Oct 24, 2024 14:30', device: 'Chrome / Windows', ip: '192.168.1.1', status: 'Success' },
    { date: 'Oct 23, 2024 09:15', device: 'Safari / iPhone', ip: '10.0.0.5', status: 'Success' },
    { date: 'Oct 20, 2024 18:45', device: 'Firefox / Mac', ip: '172.16.0.2', status: 'Failed' },
  ];

  const handleSaveProfile = async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const { error } = await supabase.from('profiles').update({
        full_name: formData.fullName,
        phone_primary: formData.phone,
        bio: formData.bio,
        updated_at: new Date()
      }).eq('id', user.id);

      if (error) throw error;
      alert("Profile updated successfully.");
    } catch (e: any) {
      alert("Error updating profile: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await signOut();
    onNavigate('login');
  };

  // --- Sub-Components ---

  const ThemeSelection = () => (
    <div className="space-y-6">
        <div>
            <h3 className="text-lg font-bold text-theme-text-primary mb-1">Theme Selection</h3>
            <p className="text-theme-text-secondary text-sm">Choose how the application looks to you.</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Light Mode */}
            <div 
                onClick={() => setTheme('light')}
                className={`cursor-pointer rounded-xl border-2 transition-all overflow-hidden group ${theme === 'light' ? 'border-brand-sage ring-2 ring-brand-sage/20 scale-[1.02]' : 'border-theme-border hover:border-theme-text-muted hover:scale-[1.01]'}`}
            >
                <div className="h-32 bg-gray-100 relative p-4 flex flex-col gap-2 border-b border-gray-200">
                    <div className="w-3/4 h-2 bg-white rounded shadow-sm"></div>
                    <div className="w-1/2 h-2 bg-white rounded shadow-sm"></div>
                    <div className="mt-auto self-end w-8 h-8 bg-brand-sage rounded-full shadow-md flex items-center justify-center">
                        {theme === 'light' && <CheckCircle size={16} className="text-white" />}
                    </div>
                </div>
                <div className="p-4 bg-white">
                    <div className="flex items-center justify-between mb-2">
                        <span className="font-bold text-gray-900 flex items-center"><Sun size={16} className="mr-2 text-yellow-500" /> Light Mode</span>
                    </div>
                    <p className="text-xs text-gray-500">High contrast, bright interface ideal for daytime use.</p>
                </div>
            </div>

            {/* Shade Mode */}
            <div 
                onClick={() => setTheme('shade')}
                className={`cursor-pointer rounded-xl border-2 transition-all overflow-hidden group ${theme === 'shade' ? 'border-brand-sage ring-2 ring-brand-sage/20 scale-[1.02]' : 'border-theme-border hover:border-theme-text-muted hover:scale-[1.01]'}`}
            >
                <div className="h-32 bg-slate-700 relative p-4 flex flex-col gap-2 border-b border-slate-600">
                    <div className="w-3/4 h-2 bg-slate-600 rounded"></div>
                    <div className="w-1/2 h-2 bg-slate-600 rounded"></div>
                    <div className="mt-auto self-end w-8 h-8 bg-brand-sage rounded-full shadow-md flex items-center justify-center">
                        {theme === 'shade' && <CheckCircle size={16} className="text-white" />}
                    </div>
                </div>
                <div className="p-4 bg-slate-800">
                    <div className="flex items-center justify-between mb-2">
                        <span className="font-bold text-white flex items-center"><Cloud size={16} className="mr-2 text-blue-300" /> Shade Mode</span>
                    </div>
                    <p className="text-xs text-slate-400">Balanced blue-gray tones for reduced eye strain.</p>
                </div>
            </div>

            {/* Dark Mode */}
            <div 
                onClick={() => setTheme('dark')}
                className={`cursor-pointer rounded-xl border-2 transition-all overflow-hidden group ${theme === 'dark' ? 'border-brand-sage ring-2 ring-brand-sage/20 scale-[1.02]' : 'border-theme-border hover:border-theme-text-muted hover:scale-[1.01]'}`}
            >
                <div className="h-32 bg-black relative p-4 flex flex-col gap-2 border-b border-gray-800">
                    <div className="w-3/4 h-2 bg-gray-900 rounded border border-gray-800"></div>
                    <div className="w-1/2 h-2 bg-gray-900 rounded border border-gray-800"></div>
                    <div className="mt-auto self-end w-8 h-8 bg-brand-sage rounded-full shadow-md flex items-center justify-center">
                        {theme === 'dark' && <CheckCircle size={16} className="text-white" />}
                    </div>
                </div>
                <div className="p-4 bg-[#111]">
                    <div className="flex items-center justify-between mb-2">
                        <span className="font-bold text-white flex items-center"><Moon size={16} className="mr-2 text-brand-sage" /> Dark Mode</span>
                    </div>
                    <p className="text-xs text-gray-400">Low light, high contrast for night operations.</p>
                </div>
            </div>
        </div>

        {/* System Preference Option */}
        <div className="mt-4 p-4 rounded-lg border border-theme-border bg-theme-bg-secondary flex items-center justify-between">
             <div className="flex items-center">
                 <Monitor className="text-theme-text-muted mr-3" />
                 <div>
                     <p className="text-sm font-bold text-theme-text-primary">System Preference</p>
                     <p className="text-xs text-theme-text-secondary">Match your device's theme settings automatically.</p>
                 </div>
             </div>
             <button 
                onClick={() => {
                    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                    setTheme(prefersDark ? 'dark' : 'light');
                }}
                className="text-xs bg-theme-bg-primary border border-theme-border px-3 py-2 rounded font-bold text-theme-text-primary hover:border-brand-sage hover:text-brand-sage transition-all"
             >
                 Apply System Theme
             </button>
        </div>
    </div>
  );

  const ProfileSection = () => (
      <div className="space-y-6 animate-fade-in-up">
          <div className="flex items-center space-x-4 mb-6">
              <div className="w-20 h-20 bg-brand-sage rounded-full flex items-center justify-center text-3xl font-bold text-brand-black shadow-lg">
                  {formData.fullName.charAt(0) || 'U'}
              </div>
              <div>
                  <button className="text-sm bg-theme-bg-secondary border border-theme-border text-theme-text-primary px-3 py-1.5 rounded hover:bg-theme-bg-tertiary transition-colors">
                      Change Avatar
                  </button>
                  <p className="text-xs text-theme-text-muted mt-2">JPG, PNG up to 5MB</p>
              </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div><InputLabel>Full Name</InputLabel><InputField value={formData.fullName} onChange={(e) => setFormData({...formData, fullName: e.target.value})} /></div>
              <div><InputLabel>Email (Read Only)</InputLabel><input value={formData.email} disabled className="w-full bg-theme-bg-tertiary border border-theme-border rounded p-3 text-theme-text-muted cursor-not-allowed" /></div>
              <div><InputLabel>Phone Number</InputLabel><InputField value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} /></div>
              <div className="md:col-span-2">
                  <InputLabel>Bio / About</InputLabel>
                  <textarea 
                      className="w-full bg-theme-bg-secondary border border-theme-border rounded p-3 text-theme-text-primary focus:border-brand-sage outline-none min-h-[100px]" 
                      value={formData.bio} 
                      onChange={(e) => setFormData({...formData, bio: e.target.value})}
                  />
              </div>
          </div>

          <div className="pt-6 border-t border-theme-border flex justify-end">
              <button 
                  onClick={handleSaveProfile}
                  disabled={loading}
                  className="bg-brand-sage text-black px-6 py-2 rounded font-bold hover:bg-brand-sage/90 disabled:opacity-50 flex items-center shadow-lg"
              >
                  {loading ? 'Saving...' : <><Save size={18} className="mr-2" /> Save Changes</>}
              </button>
          </div>
      </div>
  );

  const SecuritySection = () => (
      <div className="space-y-8 animate-fade-in-up">
          <div className="bg-theme-bg-secondary p-6 rounded-xl border border-theme-border">
              <h3 className="text-lg font-bold text-theme-text-primary mb-4 flex items-center"><Lock size={18} className="mr-2 text-brand-sage" /> Password & Authentication</h3>
              <div className="space-y-4">
                  <div className="flex justify-between items-center pb-4 border-b border-theme-border">
                      <div>
                          <p className="text-sm font-medium text-theme-text-primary">Change Password</p>
                          <p className="text-xs text-theme-text-muted">Last changed 3 months ago</p>
                      </div>
                      <button className="px-4 py-2 border border-theme-border rounded text-xs font-bold text-theme-text-primary hover:bg-theme-bg-tertiary transition-colors">Update</button>
                  </div>
                  <div className="flex justify-between items-center">
                      <div>
                          <p className="text-sm font-medium text-theme-text-primary">Two-Factor Authentication (2FA)</p>
                          <p className="text-xs text-theme-text-muted">Add an extra layer of security</p>
                      </div>
                      <div className="flex items-center">
                          <span className="text-green-500 text-xs font-bold mr-3 uppercase">Enabled</span>
                          <button className="px-4 py-2 border border-theme-border text-theme-text-secondary rounded hover:text-theme-text-primary hover:border-brand-sage transition-colors text-sm">Configure</button>
                      </div>
                  </div>
              </div>
          </div>

          <div className="bg-theme-bg-secondary p-6 rounded-xl border border-theme-border">
              <h3 className="text-lg font-bold text-theme-text-primary mb-4 flex items-center"><Shield size={18} className="mr-2 text-brand-sage" /> Recent Login Activity</h3>
              <div className="overflow-x-auto">
                  <table className="w-full text-left">
                      <thead>
                          <tr className="text-xs text-theme-text-muted border-b border-theme-border">
                              <th className="pb-2">Date & Time</th>
                              <th className="pb-2">Device</th>
                              <th className="pb-2">IP Address</th>
                              <th className="pb-2 text-right">Status</th>
                          </tr>
                      </thead>
                      <tbody className="text-sm">
                          {loginHistory.map((log, i) => (
                              <tr key={i} className="border-b border-theme-border/50 last:border-0">
                                  <td className="py-3 text-theme-text-primary">{log.date}</td>
                                  <td className="py-3 text-theme-text-secondary">{log.device}</td>
                                  <td className="py-3 text-theme-text-muted font-mono text-xs">{log.ip}</td>
                                  <td className="py-3 text-right">
                                      <span className={`text-xs px-2 py-1 rounded font-bold uppercase ${log.status === 'Success' ? 'bg-green-900/20 text-green-500' : 'bg-red-900/20 text-red-500'}`}>{log.status}</span>
                                  </td>
                              </tr>
                          ))}
                      </tbody>
                  </table>
              </div>
          </div>
      </div>
  );

  const NotificationSection = () => (
      <div className="space-y-6 animate-fade-in-up">
          {['Email Notifications', 'Push Notifications', 'SMS Notifications'].map((type, i) => (
              <div key={i} className="bg-theme-bg-secondary p-4 rounded-xl border border-theme-border">
                  <h3 className="text-sm font-bold text-theme-text-primary mb-3 flex items-center">
                      {i === 0 ? <Mail size={16} className="mr-2" /> : i === 1 ? <Bell size={16} className="mr-2" /> : <Smartphone size={16} className="mr-2" />}
                      {type}
                  </h3>
                  <div className="space-y-3 pl-6">
                      {['Mission Updates', 'Security Alerts', 'Marketing & News'].map((opt, idx) => (
                          <label key={idx} className="flex items-center space-x-3 cursor-pointer">
                              <input type="checkbox" defaultChecked className="form-checkbox text-brand-sage rounded bg-theme-bg-primary border-theme-border focus:ring-brand-sage" />
                              <span className="text-sm text-theme-text-secondary">{opt}</span>
                          </label>
                      ))}
                  </div>
              </div>
          ))}
      </div>
  );

  return (
    <div className="min-h-screen bg-theme-bg-primary flex flex-col text-theme-text-primary">
      <PortalHeader 
        user={{ name: user?.full_name || 'User', role: user?.role || 'Member' }}
        title="SETTINGS"
        subtitle="Configuration"
        onLogout={handleLogout}
        onNavigate={onNavigate}
        hideMenuButton={false}
      />

      <div className="flex-1 flex flex-col md:flex-row overflow-hidden max-w-7xl mx-auto w-full p-4 md:p-8 gap-8">
          
          {/* Sidebar */}
          <div className="w-full md:w-64 flex-shrink-0 space-y-2">
              <h2 className="text-xl font-display font-bold text-theme-text-primary mb-6 pl-2">Preferences</h2>
              {[
                  { id: 'account', label: 'Account & Theme', icon: <User size={18} /> },
                  { id: 'notifications', label: 'Notifications', icon: <Bell size={18} /> },
                  { id: 'security', label: 'Security', icon: <Shield size={18} /> },
                  { id: 'privacy', label: 'Privacy', icon: <Eye size={18} /> },
              ].map((tab) => (
                  <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as SettingsTab)}
                      className={`w-full flex items-center px-4 py-3 rounded-lg text-sm font-bold transition-all ${
                          activeTab === tab.id 
                          ? 'bg-brand-sage text-black shadow-lg' 
                          : 'text-theme-text-secondary hover:bg-theme-bg-secondary hover:text-theme-text-primary'
                      }`}
                  >
                      <span className="mr-3">{tab.icon}</span>
                      {tab.label}
                  </button>
              ))}
              
              <div className="pt-8 border-t border-theme-border mt-8">
                  <button onClick={handleLogout} className="w-full flex items-center px-4 py-3 text-red-400 hover:bg-red-900/10 rounded-lg text-sm font-bold transition-colors">
                      <LogOut size={18} className="mr-3" /> Sign Out
                  </button>
              </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 overflow-y-auto">
              {activeTab === 'account' && (
                  <div className="space-y-8">
                      <ThemeSelection />
                      <div className="border-t border-theme-border my-8"></div>
                      <ProfileSection />
                  </div>
              )}
              {activeTab === 'security' && <SecuritySection />}
              {activeTab === 'notifications' && <NotificationSection />}
              {activeTab === 'privacy' && (
                  <div className="bg-theme-bg-secondary p-8 rounded-xl border border-theme-border text-center">
                      <Globe size={48} className="mx-auto text-theme-text-muted mb-4 opacity-50" />
                      <h3 className="text-xl font-bold text-theme-text-primary">Privacy Settings</h3>
                      <p className="text-theme-text-secondary mt-2">Manage your data visibility and public profile settings here.</p>
                      <p className="text-xs text-theme-text-muted mt-4">Module currently in development.</p>
                  </div>
              )}
          </div>

      </div>
    </div>
  );
};

export default Settings;
