
import React, { useState, useEffect } from 'react';
import { 
  Bell, Users, FileText, Send, Calendar, CheckCircle, 
  X, ArrowRight, ArrowLeft, Mail, Smartphone, Radio, Eye
} from 'lucide-react';
import { supabase } from '../../../services/supabase';
import { InputLabel, InputField } from '../../common/FormElements';

interface CreateNotificationModalProps {
  onClose: () => void;
  onSuccess: () => void;
  currentUserRole: string;
  currentUserId: string;
  preSelectedTeamId?: string;
}

const STEPS = [
  { id: 1, title: 'Type', icon: Bell },
  { id: 2, title: 'Audience', icon: Users },
  { id: 3, title: 'Content', icon: FileText },
  { id: 4, title: 'Delivery', icon: Send },
  { id: 5, title: 'Review', icon: CheckCircle },
];

const CreateNotificationModal: React.FC<CreateNotificationModalProps> = ({ 
  onClose, 
  onSuccess, 
  currentUserRole,
  currentUserId,
  preSelectedTeamId
}) => {
  const [activeStep, setActiveStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [teams, setTeams] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  
  // Form State
  const [formData, setFormData] = useState({
    type: 'Message',
    priority: 'Normal',
    
    targetType: 'All Users', // All Users, Role, Team, Specific
    targetRoles: [] as string[],
    targetTeamId: preSelectedTeamId || '',
    specificUserIds: [] as string[],
    
    subject: '',
    message: '',
    
    channels: {
        in_app: true,
        email: false,
        sms: false,
        push: false
    },
    
    scheduledTime: '',
    isScheduled: false
  });

  // Fetch Data
  useEffect(() => {
    const fetchData = async () => {
        // Teams
        const { data: teamData } = await supabase.from('teams').select('id, name');
        setTeams(teamData || []);

        // Users (for specific selection)
        // Only fetch if needed to save bandwidth/performance in real app
        // For Ops Directors, filter to their team
        let userQuery = supabase.from('profiles').select('id, full_name, role');
        
        if (currentUserRole.includes('Operations') || preSelectedTeamId) {
             const teamId = preSelectedTeamId; // Logic to get ops team id would go here if not pre-passed
             if (teamId) userQuery = userQuery.eq('team_id', teamId);
        }
        
        const { data: userData } = await userQuery;
        setUsers(userData || []);
    };
    fetchData();
  }, [currentUserRole, preSelectedTeamId]);

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const toggleArrayItem = (field: string, value: string) => {
      setFormData(prev => {
          const arr = (prev as any)[field] as string[];
          if (arr.includes(value)) return { ...prev, [field]: arr.filter(i => i !== value) };
          return { ...prev, [field]: [...arr, value] };
      });
  };

  const validateStep = (step: number) => {
    switch(step) {
      case 1: return !!formData.type && !!formData.priority;
      case 2: 
        if (formData.targetType === 'Specific') return formData.specificUserIds.length > 0;
        if (formData.targetType === 'Team') return !!formData.targetTeamId;
        if (formData.targetType === 'Role') return formData.targetRoles.length > 0;
        return true;
      case 3: return !!formData.subject && formData.message.length >= 10;
      case 4: return Object.values(formData.channels).some(Boolean);
      default: return true;
    }
  };

  const handleNext = () => {
    if (validateStep(activeStep)) {
      setActiveStep(prev => Math.min(prev + 1, 5));
    } else {
      alert("Please complete required fields.");
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      // In a real implementation, we would insert into a notifications table
      // and potentially trigger a cloud function to dispatch emails/SMS.
      
      // Mock Insert
      console.log("Creating notification:", formData);
      
      // Log
      await supabase.from('profile_logs').insert({
        profile_id: currentUserId,
        action: 'SEND_NOTIFICATION',
        performed_by: currentUserRole,
        role: currentUserRole,
        note: `Sent ${formData.type} notification: ${formData.subject}`
      });

      alert(`Notification ${formData.isScheduled ? 'scheduled' : 'sent'} successfully.`);
      onSuccess();
      onClose();

    } catch (e: any) {
      console.error(e);
      alert("Error sending notification: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  const renderStep = () => {
    switch(activeStep) {
      case 1: return (
        <div className="space-y-6 animate-fade-in-up">
          <h3 className="text-xl font-bold text-white mb-2">Notification Type</h3>
          
          <div>
              <InputLabel>Type *</InputLabel>
              <select 
                className="w-full bg-brand-black border border-brand-800 rounded p-3 text-white focus:outline-none"
                value={formData.type}
                onChange={e => handleChange('type', e.target.value)}
              >
                  <option>Message</option><option>Alert</option><option>Mission</option><option>System</option><option>Training</option><option>Emergency</option>
              </select>
          </div>

          <div>
              <InputLabel>Priority *</InputLabel>
              <div className="grid grid-cols-3 gap-3 mt-2">
                  {['Low', 'Normal', 'High', 'Urgent', 'Emergency'].map(p => (
                      <button
                        key={p}
                        onClick={() => handleChange('priority', p)}
                        className={`py-2 px-3 rounded text-sm font-bold border transition-all ${
                            formData.priority === p 
                            ? p === 'Emergency' || p === 'Urgent' ? 'bg-red-600 text-white border-red-600' : 'bg-brand-sage text-black border-brand-sage'
                            : 'bg-brand-black border-brand-800 text-gray-400 hover:text-white'
                        }`}
                      >
                          {p}
                      </button>
                  ))}
              </div>
          </div>
        </div>
      );
      case 2: return (
        <div className="space-y-6 animate-fade-in-up">
          <h3 className="text-xl font-bold text-white mb-2">Target Audience</h3>
          
          <div>
              <InputLabel>Send To *</InputLabel>
              <select 
                className="w-full bg-brand-black border border-brand-800 rounded p-3 text-white focus:outline-none"
                value={formData.targetType}
                onChange={e => handleChange('targetType', e.target.value)}
              >
                  <option value="All Users">All Users</option>
                  <option value="Role">Select by Role</option>
                  <option value="Team">Select by Team</option>
                  <option value="Specific">Specific Users</option>
              </select>
          </div>

          {formData.targetType === 'Role' && (
              <div className="bg-brand-black/50 p-4 rounded border border-brand-800">
                  <InputLabel>Roles</InputLabel>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                      {['Guard', 'Supervisor', 'Client', 'Operations', 'Management'].map(role => (
                          <label key={role} className="flex items-center space-x-2 text-white">
                              <input 
                                type="checkbox" 
                                checked={formData.targetRoles.includes(role)} 
                                onChange={() => toggleArrayItem('targetRoles', role)}
                                className="accent-brand-sage"
                              />
                              <span>{role}</span>
                          </label>
                      ))}
                  </div>
              </div>
          )}

          {formData.targetType === 'Team' && (
              <div>
                  <InputLabel>Select Team</InputLabel>
                  <select 
                    className="w-full bg-brand-black border border-brand-800 rounded p-3 text-white focus:outline-none"
                    value={formData.targetTeamId}
                    onChange={e => handleChange('targetTeamId', e.target.value)}
                  >
                      <option value="">-- Choose Team --</option>
                      {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </select>
              </div>
          )}

          {formData.targetType === 'Specific' && (
              <div className="max-h-60 overflow-y-auto bg-brand-black/50 p-2 rounded border border-brand-800">
                  {users.map(u => (
                      <label key={u.id} className="flex items-center space-x-3 p-2 hover:bg-brand-800/50 rounded cursor-pointer">
                          <input 
                            type="checkbox" 
                            checked={formData.specificUserIds.includes(u.id)}
                            onChange={() => toggleArrayItem('specificUserIds', u.id)}
                            className="accent-brand-sage"
                          />
                          <div>
                              <p className="text-white text-sm font-bold">{u.full_name}</p>
                              <p className="text-xs text-gray-500">{u.role}</p>
                          </div>
                      </label>
                  ))}
              </div>
          )}
        </div>
      );
      case 3: return (
        <div className="space-y-6 animate-fade-in-up">
          <h3 className="text-xl font-bold text-white mb-2">Message Content</h3>
          <div><InputLabel>Subject *</InputLabel><InputField value={formData.subject} onChange={e => handleChange('subject', e.target.value)} placeholder="e.g. Urgent Update" /></div>
          <div>
              <InputLabel>Message Body *</InputLabel>
              <textarea 
                  className="w-full bg-brand-black border border-brand-800 rounded p-3 text-white h-48 focus:outline-none focus:border-brand-sage"
                  value={formData.message}
                  onChange={e => handleChange('message', e.target.value)}
                  placeholder="Type your message here..."
              />
              <div className="text-right text-xs text-gray-500 mt-1">{formData.message.length} chars</div>
          </div>
        </div>
      );
      case 4: return (
        <div className="space-y-6 animate-fade-in-up">
          <h3 className="text-xl font-bold text-white mb-2">Delivery Options</h3>
          
          <div className="bg-brand-black/50 p-4 rounded border border-brand-800 space-y-4">
              <label className="flex items-center justify-between cursor-pointer">
                  <div className="flex items-center"><Bell className="w-5 h-5 mr-3 text-brand-sage" /> In-App Notification</div>
                  <input type="checkbox" checked={formData.channels.in_app} onChange={e => setFormData(prev => ({...prev, channels: {...prev.channels, in_app: e.target.checked}}))} className="accent-brand-sage w-5 h-5" />
              </label>
              <label className="flex items-center justify-between cursor-pointer">
                  <div className="flex items-center"><Mail className="w-5 h-5 mr-3 text-blue-400" /> Email</div>
                  <input type="checkbox" checked={formData.channels.email} onChange={e => setFormData(prev => ({...prev, channels: {...prev.channels, email: e.target.checked}}))} className="accent-brand-sage w-5 h-5" />
              </label>
              <label className="flex items-center justify-between cursor-pointer">
                  <div className="flex items-center"><Smartphone className="w-5 h-5 mr-3 text-green-400" /> SMS Text</div>
                  <input type="checkbox" checked={formData.channels.sms} onChange={e => setFormData(prev => ({...prev, channels: {...prev.channels, sms: e.target.checked}}))} className="accent-brand-sage w-5 h-5" />
              </label>
              <label className="flex items-center justify-between cursor-pointer">
                  <div className="flex items-center"><Radio className="w-5 h-5 mr-3 text-purple-400" /> Push Notification</div>
                  <input type="checkbox" checked={formData.channels.push} onChange={e => setFormData(prev => ({...prev, channels: {...prev.channels, push: e.target.checked}}))} className="accent-brand-sage w-5 h-5" />
              </label>
          </div>

          <div className="pt-4 border-t border-brand-800">
              <div className="flex items-center gap-4 mb-4">
                  <label className="flex items-center space-x-2 cursor-pointer">
                      <input type="radio" name="schedule" checked={!formData.isScheduled} onChange={() => handleChange('isScheduled', false)} className="accent-brand-sage" />
                      <span className="text-white">Send Immediately</span>
                  </label>
                  <label className="flex items-center space-x-2 cursor-pointer">
                      <input type="radio" name="schedule" checked={formData.isScheduled} onChange={() => handleChange('isScheduled', true)} className="accent-brand-sage" />
                      <span className="text-white">Schedule for Later</span>
                  </label>
              </div>
              {formData.isScheduled && (
                  <InputField type="datetime-local" value={formData.scheduledTime} onChange={e => handleChange('scheduledTime', e.target.value)} />
              )}
          </div>
        </div>
      );
      case 5: return (
        <div className="space-y-6 animate-fade-in-up">
          <h3 className="text-xl font-bold text-white mb-4">Review & Send</h3>
          
          <div className="bg-brand-black/50 p-6 rounded-xl border border-brand-800 space-y-4 text-sm">
              <div className="flex justify-between border-b border-brand-800 pb-2">
                  <span className="text-gray-400">Type</span>
                  <span className="text-white font-bold">{formData.type} ({formData.priority})</span>
              </div>
              <div className="flex justify-between border-b border-brand-800 pb-2">
                  <span className="text-gray-400">Audience</span>
                  <span className="text-white text-right max-w-[50%]">{formData.targetType}</span>
              </div>
              <div className="flex justify-between border-b border-brand-800 pb-2">
                  <span className="text-gray-400">Channels</span>
                  <div className="flex gap-2">
                      {Object.entries(formData.channels).filter(([,v]) => v).map(([k]) => (
                          <span key={k} className="bg-brand-800 px-2 py-0.5 rounded text-xs uppercase">{k.replace('_', '-')}</span>
                      ))}
                  </div>
              </div>
              <div className="mt-4">
                  <span className="text-gray-400 block mb-1">Subject</span>
                  <p className="text-white font-bold">{formData.subject}</p>
              </div>
              <div className="mt-2 bg-brand-900/30 p-3 rounded border border-brand-800">
                  <p className="text-gray-300 italic">"{formData.message}"</p>
              </div>
          </div>
        </div>
      );
      default: return null;
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 p-4 backdrop-blur-sm">
      <div className="bg-brand-ebony border border-brand-700 rounded-xl w-full max-w-4xl shadow-2xl flex flex-col md:flex-row overflow-hidden max-h-[90vh]">
        
        {/* Sidebar */}
        <div className="w-full md:w-64 bg-brand-black border-b md:border-b-0 md:border-r border-brand-800 p-6 flex flex-col">
            <h2 className="text-xl font-display font-bold text-white mb-6">Notification</h2>
            <div className="space-y-1">
                {STEPS.map((s) => (
                    <button 
                        key={s.id}
                        onClick={() => { if(s.id < activeStep) setActiveStep(s.id); }}
                        className={`w-full flex items-center p-3 rounded-lg transition-colors text-left ${
                            activeStep === s.id ? 'bg-brand-sage text-black font-bold' : 
                            activeStep > s.id ? 'text-green-500 hover:bg-brand-900' : 'text-gray-500 cursor-default'
                        }`}
                    >
                        <div className="mr-3">{activeStep > s.id ? <CheckCircle size={18} /> : <s.icon size={18} />}</div>
                        <span className="text-sm">{s.title}</span>
                    </button>
                ))}
            </div>
        </div>

        {/* Content */}
        <div className="flex-1 flex flex-col min-h-0">
            <div className="p-6 border-b border-brand-800 bg-brand-900/50 flex justify-between items-center">
                <h3 className="font-bold text-white">Step {activeStep}: {STEPS[activeStep - 1].title}</h3>
                <button onClick={onClose} className="text-gray-500 hover:text-white"><X size={20} /></button>
            </div>
            
            <div className="flex-1 p-8 overflow-y-auto">
                {renderStep()}
            </div>

            <div className="p-6 border-t border-brand-800 bg-brand-ebony flex justify-between">
                <button 
                    onClick={() => setActiveStep(prev => Math.max(1, prev - 1))}
                    disabled={activeStep === 1}
                    className="px-6 py-2 text-gray-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed font-medium flex items-center"
                >
                    <ArrowLeft size={16} className="mr-2" /> Back
                </button>
                
                {activeStep < 5 ? (
                    <button 
                        onClick={handleNext}
                        className="bg-brand-black border border-brand-700 text-white px-6 py-2 rounded font-bold hover:bg-brand-800 flex items-center"
                    >
                        Next <ArrowRight size={16} className="ml-2" />
                    </button>
                ) : (
                    <button 
                        onClick={handleSubmit}
                        disabled={loading}
                        className="bg-brand-sage text-black px-8 py-2 rounded font-bold hover:bg-brand-sage/90 flex items-center shadow-lg"
                    >
                        {loading ? 'Sending...' : <><Send size={16} className="mr-2" /> Send Notification</>}
                    </button>
                )}
            </div>
        </div>

      </div>
    </div>
  );
};

export default CreateNotificationModal;
