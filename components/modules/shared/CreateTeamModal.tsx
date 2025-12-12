
import React, { useState, useEffect } from 'react';
import { 
  Users, Hash, Settings, CheckCircle, X, 
  ArrowRight, ArrowLeft, Save, Shield, Star, 
  RefreshCw, AlertCircle
} from 'lucide-react';
import { supabase } from '../../../services/supabase';
import { InputLabel, InputField } from '../../common/FormElements';

interface CreateTeamModalProps {
  onClose: () => void;
  onSuccess: () => void;
  currentUserRole: string;
  currentUserId: string;
}

const STEPS = [
  { id: 1, title: 'Basic Info', icon: Hash },
  { id: 2, title: 'Leadership', icon: Shield },
  { id: 3, title: 'Configuration', icon: Settings },
  { id: 4, title: 'Review', icon: CheckCircle },
];

const CreateTeamModal: React.FC<CreateTeamModalProps> = ({ 
  onClose, 
  onSuccess, 
  currentUserRole,
  currentUserId 
}) => {
  const [activeStep, setActiveStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Data
  const [directors, setDirectors] = useState<any[]>([]);
  const [managers, setManagers] = useState<any[]>([]);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
    
    directorId: '', // CAP
    managerId: '',  // LT
    
    capacity: '50',
    status: 'pending_setup',
    type: 'Operations',
    
    allowGuardApps: true,
    allowMissionCreation: true
  });

  // Fetch Potential Leaders
  useEffect(() => {
    const fetchLeaders = async () => {
      setLoadingData(true);
      try {
        // Fetch Profiles who are Operations role and NOT assigned to a team yet
        // In a real scenario, we might want to allow re-assignment, but for creation we look for free agents
        
        // 1. Fetch Directors (Rank CAP or Role Operations)
        const { data: directorData } = await supabase
          .from('guards')
          .select(`
            id, 
            rank,
            profile:profiles!guards_id_fkey(id, full_name, email, team_id, role)
          `)
          .eq('rank', 'CAP');
          
        // 2. Fetch Managers (Rank LT)
        const { data: managerData } = await supabase
          .from('guards')
          .select(`
            id, 
            rank,
            profile:profiles!guards_id_fkey(id, full_name, email, team_id, role)
          `)
          .eq('rank', 'LT');

        if (directorData) {
            // Filter those not assigned to a team (team_id is null)
            const available = directorData
                .filter((d: any) => !d.profile.team_id)
                .map((d: any) => ({
                    id: d.profile.id,
                    name: d.profile.full_name,
                    email: d.profile.email,
                    rank: d.rank
                }));
            setDirectors(available);
        }

        if (managerData) {
            const available = managerData
                .filter((m: any) => !m.profile.team_id)
                .map((m: any) => ({
                    id: m.profile.id,
                    name: m.profile.full_name,
                    email: m.profile.email,
                    rank: m.rank
                }));
            setManagers(available);
        }

      } catch (err) {
        console.error("Error fetching leaders", err);
      } finally {
        setLoadingData(false);
      }
    };
    fetchLeaders();
  }, []);

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError(null);
  };

  const generateCode = () => {
    const prefix = formData.name ? formData.name.substring(0, 3).toUpperCase() : 'OPS';
    const random = Math.floor(1000 + Math.random() * 9000);
    handleChange('code', `${prefix}-${random}`);
  };

  const validateStep = (step: number) => {
    setError(null);
    switch(step) {
      case 1: 
        if (!formData.name || formData.name.length < 3) {
            setError("Team Name must be at least 3 characters.");
            return false;
        }
        if (!formData.code) {
            setError("Team Code is required.");
            return false;
        }
        return true;
      case 2:
        if (!formData.directorId) {
            setError("An Operations Director (Captain) is required to lead the team.");
            return false;
        }
        return true;
      default: return true;
    }
  };

  const handleNext = () => {
    if (validateStep(activeStep)) {
      setActiveStep(prev => Math.min(prev + 1, 4));
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      // 1. Check for duplicate code
      const { data: existing } = await supabase.from('teams').select('id').eq('code', formData.code).single();
      if (existing) throw new Error("Team code already exists. Please generate a new one.");

      // 2. Create Team
      const { data: team, error: teamError } = await supabase.from('teams').insert({
        name: formData.name,
        code: formData.code,
        director_id: formData.directorId,
        manager_id: formData.managerId || null,
        status: formData.status,
        // In a real schema, metadata/config columns would store the extra fields
      }).select().single();

      if (teamError) throw teamError;

      // 3. Update Leaders' Profiles with new Team ID
      if (team) {
          const updates = [];
          updates.push(supabase.from('profiles').update({ team_id: team.id }).eq('id', formData.directorId));
          
          if (formData.managerId) {
              updates.push(supabase.from('profiles').update({ team_id: team.id }).eq('id', formData.managerId));
          }
          
          await Promise.all(updates);
      }

      // 4. Audit Log
      await supabase.from('profile_logs').insert({
        profile_id: currentUserId,
        action: 'CREATE_TEAM',
        performed_by: currentUserRole,
        role: currentUserRole,
        note: `Created team: ${formData.name} (${formData.code})`
      });

      alert(`Team ${formData.name} created successfully.`);
      onSuccess();
      onClose();

    } catch (e: any) {
      console.error(e);
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const renderStep = () => {
    switch(activeStep) {
      case 1: return (
        <div className="space-y-6 animate-fade-in-up">
          <h3 className="text-xl font-bold text-white mb-2">Basic Information</h3>
          
          <div><InputLabel>Team Name *</InputLabel><InputField value={formData.name} onChange={e => handleChange('name', e.target.value)} placeholder="e.g. Alpha Operations Group" /></div>
          
          <div>
              <InputLabel>Team Code *</InputLabel>
              <div className="flex gap-2">
                  <InputField value={formData.code} onChange={e => handleChange('code', e.target.value.toUpperCase())} placeholder="ABC-1234" />
                  <button onClick={generateCode} className="bg-brand-black border border-brand-700 text-gray-300 hover:text-white px-3 rounded flex items-center justify-center transition-colors" title="Auto Generate">
                      <RefreshCw size={18} />
                  </button>
              </div>
              <p className="text-xs text-gray-500 mt-1">Unique identifier used for applications and system reference.</p>
          </div>

          <div><InputLabel>Description</InputLabel><textarea className="w-full bg-brand-black border border-brand-800 rounded p-3 text-white h-24 focus:border-brand-sage outline-none" value={formData.description} onChange={e => handleChange('description', e.target.value)} placeholder="Operational scope and region..." /></div>
        </div>
      );
      case 2: return (
        <div className="space-y-6 animate-fade-in-up">
          <h3 className="text-xl font-bold text-white mb-2">Leadership Assignment</h3>
          
          {loadingData ? <div className="text-center py-8 text-gray-500">Loading available personnel...</div> : (
              <>
                <div>
                    <InputLabel>Operations Director (Lead) *</InputLabel>
                    <select 
                        className="w-full bg-brand-black border border-brand-800 rounded p-3 text-white focus:outline-none"
                        value={formData.directorId}
                        onChange={e => handleChange('directorId', e.target.value)}
                    >
                        <option value="">-- Select Director (CAP) --</option>
                        {directors.map(d => <option key={d.id} value={d.id}>{d.name} ({d.email})</option>)}
                    </select>
                    {directors.length === 0 && <p className="text-xs text-yellow-500 mt-1 flex items-center"><AlertCircle size={12} className="mr-1"/> No unassigned Directors found.</p>}
                </div>

                <div>
                    <InputLabel>Operations Manager (Optional)</InputLabel>
                    <select 
                        className="w-full bg-brand-black border border-brand-800 rounded p-3 text-white focus:outline-none"
                        value={formData.managerId}
                        onChange={e => handleChange('managerId', e.target.value)}
                    >
                        <option value="">-- Select Manager (LT) --</option>
                        {managers.map(m => <option key={m.id} value={m.id}>{m.name} ({m.email})</option>)}
                    </select>
                </div>
              </>
          )}
          
          <div className="bg-brand-900/30 p-4 rounded border border-brand-800 text-xs text-gray-400">
              <p>Only personnel with the correct rank (Captain for Director, Lieutenant for Manager) who are not currently assigned to a team will appear here.</p>
          </div>
        </div>
      );
      case 3: return (
        <div className="space-y-6 animate-fade-in-up">
          <h3 className="text-xl font-bold text-white mb-2">Configuration</h3>
          
          <div className="grid grid-cols-2 gap-4">
              <div>
                  <InputLabel>Max Capacity</InputLabel>
                  <InputField type="number" value={formData.capacity} onChange={e => handleChange('capacity', e.target.value)} />
              </div>
              <div>
                  <InputLabel>Initial Status</InputLabel>
                  <select 
                    className="w-full bg-brand-black border border-brand-800 rounded p-3 text-white focus:outline-none"
                    value={formData.status}
                    onChange={e => handleChange('status', e.target.value)}
                  >
                      <option value="active">Active</option>
                      <option value="pending_setup">Pending Setup</option>
                      <option value="inactive">Inactive</option>
                  </select>
              </div>
          </div>

          <div>
              <InputLabel>Team Type</InputLabel>
              <select 
                className="w-full bg-brand-black border border-brand-800 rounded p-3 text-white focus:outline-none"
                value={formData.type}
                onChange={e => handleChange('type', e.target.value)}
              >
                  <option>Operations</option>
                  <option>Specialized</option>
                  <option>Event Security</option>
                  <option>Training Unit</option>
              </select>
          </div>

          <div className="pt-4 border-t border-brand-800 space-y-3">
              <label className="flex items-center space-x-3 cursor-pointer">
                  <input type="checkbox" checked={formData.allowGuardApps} onChange={e => handleChange('allowGuardApps', e.target.checked)} className="accent-brand-sage" />
                  <span className="text-white text-sm">Accept Guard Applications</span>
              </label>
              <label className="flex items-center space-x-3 cursor-pointer">
                  <input type="checkbox" checked={formData.allowMissionCreation} onChange={e => handleChange('allowMissionCreation', e.target.checked)} className="accent-brand-sage" />
                  <span className="text-white text-sm">Allow Mission Creation</span>
              </label>
          </div>
        </div>
      );
      case 4: return (
        <div className="space-y-6 animate-fade-in-up">
          <h3 className="text-xl font-bold text-white mb-4">Review Team</h3>
          
          <div className="bg-brand-black/50 p-6 rounded-xl border border-brand-800 space-y-4 text-sm">
              <div className="flex justify-between border-b border-brand-800 pb-2">
                  <span className="text-gray-400">Team Name</span>
                  <span className="text-white font-bold">{formData.name}</span>
              </div>
              <div className="flex justify-between border-b border-brand-800 pb-2">
                  <span className="text-gray-400">Code</span>
                  <span className="text-brand-sage font-mono">{formData.code}</span>
              </div>
              <div className="flex justify-between border-b border-brand-800 pb-2">
                  <span className="text-gray-400">Director</span>
                  <span className="text-white">{directors.find(d => d.id === formData.directorId)?.name || 'Pending'}</span>
              </div>
              <div className="flex justify-between border-b border-brand-800 pb-2">
                  <span className="text-gray-400">Manager</span>
                  <span className="text-white">{managers.find(m => m.id === formData.managerId)?.name || 'None'}</span>
              </div>
              <div className="flex justify-between">
                  <span className="text-gray-400">Status</span>
                  <span className="text-white uppercase">{formData.status.replace('_', ' ')}</span>
              </div>
          </div>
          
          <div className="p-4 bg-blue-900/20 rounded border border-blue-500/30 flex items-start">
              <Users className="w-5 h-5 text-blue-400 mr-3 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-blue-200">
                  Creating this team will immediately assign the selected leadership. They will receive a notification and their dashboard context will update upon next login.
              </p>
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
            <h2 className="text-xl font-display font-bold text-white mb-6">Create Team</h2>
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
                {error && <div className="bg-red-900/20 text-red-400 p-3 rounded mb-4 border border-red-500/30 text-sm">{error}</div>}
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
                
                {activeStep < 4 ? (
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
                        {loading ? 'Creating...' : <><Save size={16} className="mr-2" /> Create Team</>}
                    </button>
                )}
            </div>
        </div>

      </div>
    </div>
  );
};

export default CreateTeamModal;
