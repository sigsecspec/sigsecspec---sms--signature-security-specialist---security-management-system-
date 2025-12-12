
import React, { useState, useEffect } from 'react';
import { 
  User, Shield, Mail, Phone, MapPin, Calendar, Clock, 
  Lock, Bell, Eye, EyeOff, FileText, Upload, Save, 
  History, CheckCircle, AlertTriangle, Briefcase, 
  Settings, CreditCard, Award, Activity, LogIn,
  Moon, Sun, Cloud, Layout, Check, X, Edit2, ArrowRight
} from 'lucide-react';
import { supabase } from '../../../services/supabase';
import { Profile, ProfileLog, Guard, Client } from '../../../types';
import { InputLabel, InputField, FileUpload } from '../../common/FormElements';
import { useTheme } from '../../../contexts/ThemeContext';

interface ProfileManagementProps {
  user: any; // Auth user object
}

type TabType = 'overview' | 'personal' | 'account' | 'role' | 'history' | 'documents';

const ProfileManagement: React.FC<ProfileManagementProps> = ({ user }) => {
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [guardDetails, setGuardDetails] = useState<Guard | null>(null);
  const [clientDetails, setClientDetails] = useState<Client | null>(null);
  const [logs, setLogs] = useState<ProfileLog[]>([]);
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [isEditing, setIsEditing] = useState(false);
  const { theme, setTheme } = useTheme();

  // Form State
  const [formData, setFormData] = useState<any>({});

  useEffect(() => {
    if (user?.id) {
        fetchFullProfile();
    }
  }, [user]);

  const fetchFullProfile = async () => {
      setLoading(true);
      try {
          // 1. Fetch Basic Profile
          const { data: profileData, error: profileError } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', user.id)
              .single();
          
          if (profileError) throw profileError;
          setProfile(profileData);
          setFormData(profileData); // Initialize form data

          // 2. Fetch Role Specifics
          if (profileData.role === 'guard' || profileData.role === 'supervisor' || ['operations', 'management', 'owner'].includes(profileData.role)) {
              const { data: guardData } = await supabase
                  .from('guards')
                  .select('*')
                  .eq('id', user.id)
                  .single();
              if (guardData) setGuardDetails({...profileData, ...guardData});
          }

          if (profileData.role === 'client') {
              const { data: clientData } = await supabase
                  .from('clients')
                  .select('*')
                  .eq('id', user.id)
                  .single();
              if (clientData) setClientDetails({...profileData, ...clientData});
          }

          // 3. Fetch Audit Logs
          const { data: logData } = await supabase
              .from('profile_logs')
              .select('*')
              .eq('profile_id', user.id)
              .order('created_at', { ascending: false });
          
          setLogs(logData || []);

      } catch (err) {
          console.error("Error loading profile:", err);
      } finally {
          setLoading(false);
      }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      const { name, value } = e.target;
      setFormData((prev: any) => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
      if (!profile) return;
      setLoading(true);
      try {
          const updates: any = {
              full_name: formData.full_name,
              phone_primary: formData.phone_primary,
              address_street: formData.address_street,
              address_city: formData.address_city,
              address_state: formData.address_state,
              address_zip: formData.address_zip,
              bio: formData.bio,
              updated_at: new Date().toISOString()
          };

          // 1. Update Profile
          const { error } = await supabase
              .from('profiles')
              .update(updates)
              .eq('id', profile.id);

          if (error) throw error;

          // 2. Create Audit Log Entry
          const changes: string[] = [];
          Object.keys(updates).forEach(key => {
              if (updates[key] !== (profile as any)[key]) {
                  changes.push(`${key}: ${(profile as any)[key]} -> ${updates[key]}`);
                  // Insert detailed log
                  supabase.from('profile_logs').insert({
                      profile_id: profile.id,
                      action: 'UPDATE',
                      performed_by: user.id, // ID of user making change
                      role: profile.role,
                      note: 'User updated profile information',
                      field_changed: key,
                      old_value: String((profile as any)[key]),
                      new_value: String(updates[key])
                  });
              }
          });

          if (changes.length > 0) {
              setProfile({ ...profile, ...updates });
              setIsEditing(false);
              fetchFullProfile(); // Refresh logs
              alert("Profile updated successfully.");
          } else {
              setIsEditing(false);
          }

      } catch (err: any) {
          alert("Error updating profile: " + err.message);
      } finally {
          setLoading(false);
      }
  };

  const getStatusColor = (status: string) => {
      switch (status) {
          case 'active': return 'bg-green-500/20 text-green-400 border-green-500/50';
          case 'pending': return 'bg-orange-500/20 text-orange-400 border-orange-500/50';
          case 'suspended': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50';
          case 'terminated': return 'bg-red-500/20 text-red-400 border-red-500/50';
          default: return 'bg-gray-800 text-gray-400 border-gray-600';
      }
  };

  // --- SUB-COMPONENTS ---

  const ProfileHeader = () => (
      <div className="bg-brand-ebony rounded-xl border border-brand-800 p-6 flex flex-col md:flex-row items-center md:items-start gap-6 relative overflow-hidden mb-6">
          {/* Background decoration */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-brand-sage/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none"></div>

          <div className="relative group">
              <div className="w-32 h-32 rounded-full bg-brand-black border-4 border-brand-800 flex items-center justify-center overflow-hidden shadow-2xl">
                  {profile?.avatar_url ? (
                      <img src={profile.avatar_url} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                      <span className="text-4xl font-bold text-brand-silver">{profile?.full_name?.charAt(0)}</span>
                  )}
              </div>
              <button className="absolute bottom-0 right-0 bg-brand-sage text-black p-2 rounded-full shadow-lg hover:bg-white transition-colors">
                  <Upload size={16} />
              </button>
          </div>

          <div className="flex-1 text-center md:text-left">
              <div className="flex flex-col md:flex-row items-center gap-4 mb-2">
                  <h2 className="text-3xl font-display font-bold text-white">{profile?.full_name}</h2>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase border ${getStatusColor(profile?.status || 'pending')}`}>
                      {profile?.status}
                  </span>
              </div>
              
              <div className="flex flex-col md:flex-row items-center gap-6 text-sm text-gray-400 mb-4">
                  <span className="flex items-center capitalize"><Shield size={14} className="mr-2 text-brand-sage" /> {profile?.role}</span>
                  {guardDetails?.rank && <span className="flex items-center font-mono"><Award size={14} className="mr-2 text-yellow-500" /> Rank: {guardDetails.rank}</span>}
                  <span className="flex items-center"><Calendar size={14} className="mr-2 text-blue-400" /> Joined {new Date(profile?.created_at || Date.now()).toLocaleDateString()}</span>
              </div>

              {/* Completion Bar */}
              <div className="max-w-md">
                  <div className="flex justify-between text-xs text-gray-500 mb-1">
                      <span>Profile Completion</span>
                      <span>85%</span>
                  </div>
                  <div className="w-full h-2 bg-brand-900 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-brand-sage to-green-500 w-[85%]"></div>
                  </div>
              </div>
          </div>

          <div className="flex flex-col gap-3 min-w-[140px]">
              {isEditing ? (
                  <>
                      <button onClick={handleSave} className="bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded-lg font-bold shadow-lg flex items-center justify-center transition-all">
                          <Check size={18} className="mr-2" /> Save
                      </button>
                      <button onClick={() => { setIsEditing(false); setFormData(profile); }} className="bg-brand-black border border-brand-700 text-gray-300 hover:text-white px-4 py-2 rounded-lg font-bold flex items-center justify-center transition-all">
                          <X size={18} className="mr-2" /> Cancel
                      </button>
                  </>
              ) : (
                  <button onClick={() => setIsEditing(true)} className="bg-brand-sage text-black px-4 py-2 rounded-lg font-bold hover:bg-brand-sage/90 shadow-lg flex items-center justify-center transition-all">
                      <Edit2 size={18} className="mr-2" /> Edit Profile
                  </button>
              )}
          </div>
      </div>
  );

  const OverviewTab = () => (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in-up">
          <div className="bg-brand-ebony p-6 rounded-xl border border-brand-800">
              <h3 className="text-white font-bold mb-4 flex items-center"><User size={18} className="mr-2 text-brand-sage" /> Personal Details</h3>
              <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-4 border-b border-brand-800/50 pb-3">
                      <span className="text-gray-500 text-sm">Full Name</span>
                      <span className="text-white col-span-2 font-medium">{profile?.full_name}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-4 border-b border-brand-800/50 pb-3">
                      <span className="text-gray-500 text-sm">Email</span>
                      <span className="text-white col-span-2">{profile?.email}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-4 border-b border-brand-800/50 pb-3">
                      <span className="text-gray-500 text-sm">Phone</span>
                      <span className="text-white col-span-2">{profile?.phone_primary || 'Not Set'}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                      <span className="text-gray-500 text-sm">Location</span>
                      <span className="text-white col-span-2">{profile?.address_city ? `${profile.address_city}, ${profile.address_state}` : 'Not Set'}</span>
                  </div>
              </div>
          </div>

          <div className="bg-brand-ebony p-6 rounded-xl border border-brand-800">
              <h3 className="text-white font-bold mb-4 flex items-center"><Activity size={18} className="mr-2 text-blue-400" /> Recent Activity</h3>
              <div className="space-y-4">
                  {logs.slice(0, 3).map((log, i) => (
                      <div key={i} className="flex items-start pb-3 border-b border-brand-800/50 last:border-0">
                          <div className="w-2 h-2 rounded-full bg-brand-sage mt-1.5 mr-3 shrink-0"></div>
                          <div>
                              <p className="text-sm text-gray-300">{log.action}: {log.note || 'Updated profile'}</p>
                              <p className="text-xs text-gray-500 mt-1">{new Date(log.created_at).toLocaleString()}</p>
                          </div>
                      </div>
                  ))}
                  {logs.length === 0 && <p className="text-gray-500 italic text-sm">No recent activity.</p>}
                  <button onClick={() => setActiveTab('history')} className="text-brand-sage text-xs font-bold hover:underline mt-2">View Full History</button>
              </div>
          </div>

          {(guardDetails || clientDetails) && (
              <div className="bg-brand-ebony p-6 rounded-xl border border-brand-800 md:col-span-2">
                  <h3 className="text-white font-bold mb-4 flex items-center"><Briefcase size={18} className="mr-2 text-purple-400" /> {profile?.role === 'client' ? 'Business Details' : 'Service Details'}</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      {profile?.role === 'client' ? (
                          <>
                              <div className="bg-brand-black/30 p-4 rounded border border-brand-800">
                                  <p className="text-xs text-gray-500 uppercase">Business Name</p>
                                  <p className="text-lg text-white font-bold">{clientDetails?.businessName}</p>
                              </div>
                              <div className="bg-brand-black/30 p-4 rounded border border-brand-800">
                                  <p className="text-xs text-gray-500 uppercase">Type</p>
                                  <p className="text-lg text-white font-bold">{clientDetails?.type}</p>
                              </div>
                              <div className="bg-brand-black/30 p-4 rounded border border-brand-800">
                                  <p className="text-xs text-gray-500 uppercase">Active Contracts</p>
                                  <p className="text-lg text-brand-sage font-bold">{clientDetails?.contracts?.length || 0}</p>
                              </div>
                          </>
                      ) : (
                          <>
                              <div className="bg-brand-black/30 p-4 rounded border border-brand-800">
                                  <p className="text-xs text-gray-500 uppercase">Rank / Level</p>
                                  <p className="text-lg text-white font-bold">{guardDetails?.rank} / {guardDetails?.level}</p>
                              </div>
                              <div className="bg-brand-black/30 p-4 rounded border border-brand-800">
                                  <p className="text-xs text-gray-500 uppercase">Badge Number</p>
                                  <p className="text-lg text-white font-bold font-mono">{guardDetails?.badgeNumber}</p>
                              </div>
                              <div className="bg-brand-black/30 p-4 rounded border border-brand-800">
                                  <p className="text-xs text-gray-500 uppercase">Performance</p>
                                  <p className="text-lg text-brand-sage font-bold">{guardDetails?.performanceRating}/5.0</p>
                              </div>
                          </>
                      )}
                  </div>
              </div>
          )}
      </div>
  );

  const PersonalTab = () => (
      <div className="space-y-6 animate-fade-in-up">
          <div className="bg-brand-ebony p-6 rounded-xl border border-brand-800">
              <h3 className="text-white font-bold mb-6">Contact Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div><InputLabel>Full Name</InputLabel><InputField name="full_name" value={formData.full_name} onChange={handleInputChange} disabled={!isEditing} /></div>
                  <div><InputLabel>Date of Birth</InputLabel><InputField name="date_of_birth" type="date" value={formData.date_of_birth || ''} onChange={handleInputChange} disabled={!isEditing} /></div>
                  <div><InputLabel>Primary Phone</InputLabel><InputField name="phone_primary" value={formData.phone_primary || ''} onChange={handleInputChange} disabled={!isEditing} /></div>
                  <div><InputLabel>Secondary Phone</InputLabel><InputField name="phone_secondary" value={formData.phone_secondary || ''} onChange={handleInputChange} disabled={!isEditing} /></div>
                  <div className="md:col-span-2"><InputLabel>Email Address</InputLabel><div className="relative"><Mail className="absolute left-3 top-3 text-gray-500" size={16} /><input className="w-full bg-brand-900 border border-brand-800 rounded p-3 pl-10 text-gray-400 cursor-not-allowed" value={formData.email} disabled /></div><p className="text-xs text-gray-500 mt-1 flex items-center"><Lock size={12} className="mr-1" /> Contact support to change email.</p></div>
              </div>
          </div>

          <div className="bg-brand-ebony p-6 rounded-xl border border-brand-800">
              <h3 className="text-white font-bold mb-6">Address</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="md:col-span-2"><InputLabel>Street Address</InputLabel><InputField name="address_street" value={formData.address_street || ''} onChange={handleInputChange} disabled={!isEditing} /></div>
                  <div><InputLabel>City</InputLabel><InputField name="address_city" value={formData.address_city || ''} onChange={handleInputChange} disabled={!isEditing} /></div>
                  <div className="grid grid-cols-2 gap-4">
                      <div><InputLabel>State</InputLabel><InputField name="address_state" value={formData.address_state || ''} onChange={handleInputChange} disabled={!isEditing} /></div>
                      <div><InputLabel>ZIP Code</InputLabel><InputField name="address_zip" value={formData.address_zip || ''} onChange={handleInputChange} disabled={!isEditing} /></div>
                  </div>
              </div>
          </div>

          <div className="bg-brand-ebony p-6 rounded-xl border border-brand-800">
              <h3 className="text-white font-bold mb-6">Emergency Contact</h3>
              <div className="p-4 bg-brand-900/30 rounded border border-brand-800 text-center text-gray-500">
                  <AlertTriangle className="mx-auto mb-2 opacity-50" />
                  <p>Emergency contact details are managed securely by HR.</p>
              </div>
          </div>
      </div>
  );

  const AccountTab = () => (
      <div className="space-y-6 animate-fade-in-up">
          <div className="bg-brand-ebony p-6 rounded-xl border border-brand-800">
              <h3 className="text-white font-bold mb-6 flex items-center"><Layout className="w-5 h-5 mr-2 text-brand-sage" /> Theme & Display</h3>
              <div className="grid grid-cols-3 gap-4">
                  {['light', 'shade', 'dark'].map((t) => (
                      <button 
                          key={t}
                          onClick={() => setTheme(t as any)}
                          className={`p-4 rounded-xl border-2 flex flex-col items-center justify-center transition-all ${
                              theme === t 
                              ? 'border-brand-sage bg-brand-sage/10 text-white' 
                              : 'border-brand-800 bg-brand-black/30 text-gray-400 hover:border-gray-600'
                          }`}
                      >
                          {t === 'light' ? <Sun size={24} className="mb-2" /> : t === 'shade' ? <Cloud size={24} className="mb-2" /> : <Moon size={24} className="mb-2" />}
                          <span className="capitalize text-sm font-bold">{t} Mode</span>
                      </button>
                  ))}
              </div>
          </div>

          <div className="bg-brand-ebony p-6 rounded-xl border border-brand-800">
              <h3 className="text-white font-bold mb-6 flex items-center"><Lock className="w-5 h-5 mr-2 text-blue-400" /> Security</h3>
              <div className="space-y-6">
                  <div className="flex justify-between items-center pb-4 border-b border-brand-800">
                      <div>
                          <p className="text-white font-bold">Password</p>
                          <p className="text-xs text-gray-500">Last changed 3 months ago</p>
                      </div>
                      <button className="px-4 py-2 border border-brand-700 text-gray-300 rounded hover:text-white hover:border-brand-sage transition-colors text-sm">Update Password</button>
                  </div>
                  <div className="flex justify-between items-center">
                      <div>
                          <p className="text-white font-bold">Two-Factor Authentication (2FA)</p>
                          <p className="text-xs text-gray-500">Secure your account with an authenticator app.</p>
                      </div>
                      <div className="flex items-center">
                          <span className="text-green-500 text-xs font-bold mr-3 uppercase">Enabled</span>
                          <button className="px-4 py-2 border border-brand-700 text-gray-300 rounded hover:text-white hover:border-brand-sage transition-colors text-sm">Configure</button>
                      </div>
                  </div>
              </div>
          </div>

          <div className="bg-brand-ebony p-6 rounded-xl border border-brand-800">
              <h3 className="text-white font-bold mb-6 flex items-center"><Bell className="w-5 h-5 mr-2 text-orange-400" /> Notifications</h3>
              <div className="space-y-3">
                  {['Email Notifications', 'SMS Alerts', 'Push Notifications', 'Mission Updates'].map((setting, i) => (
                      <label key={i} className="flex items-center justify-between p-3 rounded bg-brand-black/30 border border-brand-800 cursor-pointer hover:border-brand-600 transition-colors">
                          <span className="text-gray-300 text-sm">{setting}</span>
                          <div className="relative inline-block w-10 mr-2 align-middle select-none transition duration-200 ease-in">
                              <input type="checkbox" name={`toggle-${i}`} className="toggle-checkbox absolute block w-5 h-5 rounded-full bg-white border-4 appearance-none cursor-pointer checked:right-0 checked:border-brand-sage"/>
                              <label className="toggle-label block overflow-hidden h-5 rounded-full bg-gray-700 cursor-pointer checked:bg-brand-sage"></label>
                          </div>
                      </label>
                  ))}
              </div>
          </div>
      </div>
  );

  const RoleTab = () => (
      <div className="space-y-6 animate-fade-in-up">
          {profile?.role === 'guard' && guardDetails && (
              <div className="bg-brand-ebony p-6 rounded-xl border border-brand-800">
                  <h3 className="text-white font-bold mb-6 flex items-center"><Shield className="w-5 h-5 mr-2 text-brand-sage" /> Guard Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div><InputLabel>Rank</InputLabel><div className="p-3 bg-brand-black border border-brand-800 rounded text-white font-mono">{guardDetails.rank}</div></div>
                      <div><InputLabel>Badge Number</InputLabel><div className="p-3 bg-brand-black border border-brand-800 rounded text-white font-mono">{guardDetails.badgeNumber}</div></div>
                      <div><InputLabel>Level</InputLabel><div className="p-3 bg-brand-black border border-brand-800 rounded text-white">{guardDetails.level}</div></div>
                      <div><InputLabel>Status</InputLabel><div className="p-3 bg-brand-black border border-brand-800 rounded text-white uppercase">{guardDetails.status}</div></div>
                  </div>
                  <div className="mt-6 pt-6 border-t border-brand-800">
                      <h4 className="text-gray-400 text-sm font-bold uppercase mb-4">Availability</h4>
                      <div className="flex flex-wrap gap-2">
                          {['Mon', 'Tue', 'Wed', 'Thu', 'Fri'].map(d => (
                              <span key={d} className="px-3 py-1 bg-green-900/30 text-green-400 border border-green-500/30 rounded text-xs font-bold">{d}</span>
                          ))}
                      </div>
                  </div>
              </div>
          )}
          {/* Add Client/Ops/Mgmt Specific views here if needed */}
      </div>
  );

  const HistoryTab = () => (
      <div className="space-y-6 animate-fade-in-up">
          <div className="bg-brand-ebony p-6 rounded-xl border border-brand-800">
              <h3 className="text-white font-bold mb-6 flex items-center"><History className="w-5 h-5 mr-2 text-brand-sage" /> Audit Trail</h3>
              <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                      <thead className="bg-brand-900 border-b border-brand-800">
                          <tr>
                              <th className="p-4 text-xs font-bold text-gray-500 uppercase">Timestamp</th>
                              <th className="p-4 text-xs font-bold text-gray-500 uppercase">Action</th>
                              <th className="p-4 text-xs font-bold text-gray-500 uppercase">Field</th>
                              <th className="p-4 text-xs font-bold text-gray-500 uppercase">Change</th>
                              <th className="p-4 text-xs font-bold text-gray-500 uppercase">Performed By</th>
                          </tr>
                      </thead>
                      <tbody className="divide-y divide-brand-800">
                          {logs.length === 0 ? (
                              <tr><td colSpan={5} className="p-8 text-center text-gray-500">No history available.</td></tr>
                          ) : (
                              logs.map(log => (
                                  <tr key={log.id} className="hover:bg-brand-800/20">
                                      <td className="p-4 text-xs text-gray-400 font-mono">{new Date(log.created_at).toLocaleString()}</td>
                                      <td className="p-4 text-sm text-white font-bold">{log.action}</td>
                                      <td className="p-4 text-sm text-gray-300">{log.field_changed || '-'}</td>
                                      <td className="p-4 text-xs text-gray-400">
                                          {log.old_value && log.new_value ? (
                                              <span className="flex items-center">
                                                  <span className="text-red-400 mr-2 line-through">{log.old_value}</span>
                                                  <ArrowRight size={12} className="mr-2" />
                                                  <span className="text-green-400">{log.new_value}</span>
                                              </span>
                                          ) : (
                                              <span>{log.note}</span>
                                          )}
                                      </td>
                                      <td className="p-4 text-xs text-brand-sage">{log.role}</td>
                                  </tr>
                              ))
                          )}
                      </tbody>
                  </table>
              </div>
          </div>
      </div>
  );

  const DocumentsTab = () => (
      <div className="space-y-6 animate-fade-in-up">
          <div className="bg-brand-ebony p-6 rounded-xl border border-brand-800">
              <h3 className="text-white font-bold mb-6 flex items-center"><FileText className="w-5 h-5 mr-2 text-brand-sage" /> My Documents</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {['ID Card', 'Guard License', 'W-4 Form', 'Resume'].map((doc, i) => (
                      <div key={i} className="flex justify-between items-center p-4 bg-brand-black/30 rounded border border-brand-800 hover:border-brand-600 transition-colors">
                          <div className="flex items-center">
                              <FileText className="w-8 h-8 text-brand-silver mr-3 opacity-50" />
                              <div>
                                  <p className="text-white font-bold text-sm">{doc}</p>
                                  <p className="text-xs text-gray-500">Uploaded Jan 10, 2024</p>
                              </div>
                          </div>
                          <div className="flex gap-2">
                              <button className="text-xs text-brand-sage hover:underline">View</button>
                              <button className="text-xs text-red-400 hover:underline">Delete</button>
                          </div>
                      </div>
                  ))}
                  <div className="md:col-span-2 border-2 border-dashed border-brand-700 rounded-lg p-8 flex flex-col items-center justify-center text-gray-500 hover:border-brand-sage hover:text-brand-sage transition-all cursor-pointer">
                      <Upload className="w-10 h-10 mb-2" />
                      <span className="text-sm font-bold">Upload New Document</span>
                      <span className="text-xs opacity-70">PDF, JPG, PNG up to 10MB</span>
                  </div>
              </div>
          </div>
      </div>
  );

  if (loading && !profile) return <div className="p-12 text-center text-gray-500">Loading Profile...</div>;

  return (
    <div className="min-h-screen bg-brand-black text-gray-200">
      <div className="max-w-7xl mx-auto p-4 md:p-8">
          
          <ProfileHeader />

          {/* Tab Navigation */}
          <div className="flex overflow-x-auto border-b border-brand-800 mb-6 scrollbar-hide">
              {[
                  { id: 'overview', label: 'Overview', icon: <User size={16} /> },
                  { id: 'personal', label: 'Personal Info', icon: <FileText size={16} /> },
                  { id: 'account', label: 'Account Settings', icon: <Settings size={16} /> },
                  { id: 'role', label: 'Role Specific', icon: <Shield size={16} />, hidden: !['guard','client'].includes(profile?.role || '') },
                  { id: 'history', label: 'Activity & History', icon: <History size={16} /> },
                  { id: 'documents', label: 'Documents', icon: <FileText size={16} /> },
              ].map(tab => {
                  if (tab.hidden) return null;
                  return (
                      <button
                          key={tab.id}
                          onClick={() => setActiveTab(tab.id as TabType)}
                          className={`flex items-center px-6 py-4 border-b-2 font-medium text-sm whitespace-nowrap transition-colors ${
                              activeTab === tab.id 
                              ? 'border-brand-sage text-brand-sage bg-brand-sage/5' 
                              : 'border-transparent text-gray-400 hover:text-white hover:bg-brand-ebony'
                          }`}
                      >
                          <span className="mr-2">{tab.icon}</span>
                          {tab.label}
                      </button>
                  );
              })}
          </div>

          {/* Tab Content */}
          <div className="min-h-[400px]">
              {activeTab === 'overview' && <OverviewTab />}
              {activeTab === 'personal' && <PersonalTab />}
              {activeTab === 'account' && <AccountTab />}
              {activeTab === 'role' && <RoleTab />}
              {activeTab === 'history' && <HistoryTab />}
              {activeTab === 'documents' && <DocumentsTab />}
          </div>

      </div>
    </div>
  );
};

export default ProfileManagement;
