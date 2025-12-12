
import React, { useState, useEffect } from 'react';
import { 
  User, Shield, MapPin, Settings, CheckCircle, X, 
  ArrowRight, ArrowLeft, Save, Briefcase, Lock, Phone, 
  Calendar, FileText, AlertCircle
} from 'lucide-react';
import { supabase } from '../../../services/supabase';
import { InputLabel, InputField } from '../../common/FormElements';

interface CreateGuardModalProps {
  onClose: () => void;
  onSuccess: () => void;
  currentUserRole: string;
  currentUserId: string;
}

const STEPS = [
  { id: 1, title: 'Personal Info', icon: User },
  { id: 2, title: 'Account', icon: Lock },
  { id: 3, title: 'Role & Rank', icon: Shield },
  { id: 4, title: 'Team Assignment', icon: MapPin },
  { id: 5, title: 'Employment', icon: Briefcase },
  { id: 6, title: 'Address', icon: MapPin },
  { id: 7, title: 'Review', icon: CheckCircle },
];

const CreateGuardModal: React.FC<CreateGuardModalProps> = ({ onClose, onSuccess, currentUserRole, currentUserId }) => {
  const [activeStep, setActiveStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [teams, setTeams] = useState<{id: string, name: string, code: string}[]>([]);
  const [error, setError] = useState<string | null>(null);
  
  // Form State
  const [formData, setFormData] = useState({
    // Step 1: Personal
    fullName: '',
    email: '',
    phone: '',
    dob: '',
    
    // Step 2: Account
    password: '',
    confirmPassword: '',
    sendWelcomeEmail: true,
    
    // Step 3: Role & Rank
    role: 'guard',
    rank: 'OFC',
    guardLevel: '1',
    guardType: 'Base',
    
    // Step 4: Team
    teamId: '',
    
    // Step 5: Employment
    hireDate: new Date().toISOString().split('T')[0],
    employeeNumber: '',
    status: 'pending',
    employmentType: 'Part-Time',
    
    // Step 6: Address
    address: '',
    city: '',
    state: '',
    zip: '',
    emergencyName: '',
    emergencyPhone: '',
    emergencyRel: ''
  });

  const isOps = currentUserRole.includes('Operations');
  // Check if creating a Director who gets a team auto-created
  const isCreatingDirector = formData.rank === 'CAP';

  useEffect(() => {
    fetchTeams();
  }, []);

  const fetchTeams = async () => {
    const { data } = await supabase.from('teams').select('id, name, code, director_id');
    if (data) {
      setTeams(data);
      
      // Auto-select team for Operations roles if they are restricted
      if (isOps) {
         const { data: profile } = await supabase.from('profiles').select('team_id').eq('id', currentUserId).single();
         if (profile?.team_id) {
             setFormData(prev => ({ ...prev, teamId: profile.team_id }));
         }
      }
    }
  };

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError(null);
    
    // Auto-update rank based on role changes for better UX
    if (field === 'role') {
        let defaultRank = 'OFC';
        if (value === 'supervisor') defaultRank = 'SGT';
        if (value === 'operations') defaultRank = 'LT';
        if (value === 'management') defaultRank = 'CMD';
        setFormData(prev => ({ ...prev, role: value, rank: defaultRank }));
    }
  };

  const calculateAge = (dob: string) => {
    const birthday = new Date(dob);
    const ageDifMs = Date.now() - birthday.getTime();
    const ageDate = new Date(ageDifMs);
    return Math.abs(ageDate.getUTCFullYear() - 1970);
  };

  const validateStep = (step: number) => {
    setError(null);
    switch(step) {
      case 1: 
        if (!formData.fullName || !formData.email || !formData.phone || !formData.dob) return false;
        if (calculateAge(formData.dob) < 18) {
            setError("Guard must be at least 18 years old.");
            return false;
        }
        return true;
      case 2: 
        if (!formData.password || formData.password.length < 8) {
            setError("Password must be at least 8 characters.");
            return false;
        }
        if (formData.password !== formData.confirmPassword) {
            setError("Passwords do not match.");
            return false;
        }
        return true;
      case 3: return !!formData.role && !!formData.rank;
      case 4: 
        // If Operations or creating a Director, team selection is handled/disabled
        if (isOps || isCreatingDirector) return true;
        // Otherwise require team ID
        if (!formData.teamId) {
            setError("Please select a team assignment.");
            return false;
        }
        return true;
      case 6: return !!formData.address && !!formData.city && !!formData.state && !!formData.zip;
      default: return true;
    }
  };

  const handleNext = () => {
    if (validateStep(activeStep)) {
      setActiveStep(prev => Math.min(prev + 1, 7));
    } else {
      if (!error) setError("Please fill in all required fields.");
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      // 1. Create Mock Auth ID (In production, use admin.createUser)
      const newUserId = crypto.randomUUID();

      // 2. Create Profile
      const { error: profileError } = await supabase.from('profiles').insert({
        id: newUserId,
        email: formData.email,
        full_name: formData.fullName,
        phone_primary: formData.phone,
        role: formData.role,
        status: formData.status,
        address_street: formData.address,
        address_city: formData.city,
        address_state: formData.state,
        address_zip: formData.zip,
        team_id: formData.teamId || null,
        metadata: {
            created_by: currentUserId,
            creation_method: 'manual_console',
            dob: formData.dob,
            emergency_contact: {
                name: formData.emergencyName,
                phone: formData.emergencyPhone,
                relation: formData.emergencyRel
            }
        }
      });

      if (profileError) throw profileError;

      // 3. Create Guard Record
      const { error: guardError } = await supabase.from('guards').insert({
        id: newUserId,
        rank: formData.rank,
        guard_level: parseInt(formData.guardLevel),
        badge_number: formData.employeeNumber || `BADGE-${Date.now().toString().slice(-4)}`,
        hire_date: formData.hireDate,
        guard_type: formData.guardType
      });

      if (guardError) throw guardError;

      // 4. If creating a Director (CAP), create a Team
      if (formData.rank === 'CAP') {
          const teamName = `TEAM ${formData.fullName.split(' ').pop()?.toUpperCase()}`;
          const teamCode = `TM-${Date.now().toString().slice(-4)}`;
          
          const { data: newTeam, error: teamError } = await supabase.from('teams').insert({
              name: teamName,
              code: teamCode,
              director_id: newUserId,
              status: 'pending_setup'
          }).select().single();

          if (!teamError && newTeam) {
              // Update profile with new team ID
              await supabase.from('profiles').update({ team_id: newTeam.id }).eq('id', newUserId);
          }
      }

      // 5. Audit Log
      await supabase.from('profile_logs').insert({
        profile_id: newUserId,
        action: 'ACCOUNT_CREATED',
        performed_by: currentUserRole,
        role: currentUserRole,
        note: `Manual guard account creation for ${formData.fullName} as ${formData.role}`
      });

      alert("Guard account created successfully.");
      onSuccess();
      onClose();

    } catch (e: any) {
      console.error(e);
      alert("Error creating account: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  const renderStep = () => {
    switch(activeStep) {
      case 1: return (
        <div className="space-y-4 animate-fade-in-up">
          <h3 className="text-xl font-bold text-white mb-4">Personal Information</h3>
          <div><InputLabel>Full Name *</InputLabel><InputField value={formData.fullName} onChange={e => handleChange('fullName', e.target.value)} placeholder="First Last" /></div>
          <div><InputLabel>Email Address *</InputLabel><InputField type="email" value={formData.email} onChange={e => handleChange('email', e.target.value)} placeholder="guard@company.com" /></div>
          <div className="grid grid-cols-2 gap-4">
             <div><InputLabel>Phone Number *</InputLabel><InputField type="tel" value={formData.phone} onChange={e => handleChange('phone', e.target.value)} placeholder="(555) 123-4567" /></div>
             <div><InputLabel>Date of Birth *</InputLabel><InputField type="date" value={formData.dob} onChange={e => handleChange('dob', e.target.value)} /></div>
          </div>
        </div>
      );
      case 2: return (
        <div className="space-y-4 animate-fade-in-up">
          <h3 className="text-xl font-bold text-white mb-4">Account Security</h3>
          <div>
              <InputLabel>Password *</InputLabel>
              <InputField type="password" value={formData.password} onChange={e => handleChange('password', e.target.value)} placeholder="Minimum 8 characters" />
              <p className="text-xs text-gray-500 mt-1">Must contain letters and numbers.</p>
          </div>
          <div>
              <InputLabel>Confirm Password *</InputLabel>
              <InputField type="password" value={formData.confirmPassword} onChange={e => handleChange('confirmPassword', e.target.value)} />
          </div>
          <div className="bg-brand-black p-4 rounded border border-brand-800">
             <label className="flex items-center space-x-3 cursor-pointer">
                <input type="checkbox" checked={formData.sendWelcomeEmail} onChange={e => handleChange('sendWelcomeEmail', e.target.checked)} className="accent-brand-sage" />
                <span className="text-white text-sm">Send welcome email with login instructions</span>
             </label>
          </div>
        </div>
      );
      case 3: return (
        <div className="space-y-4 animate-fade-in-up">
          <h3 className="text-xl font-bold text-white mb-4">Role & Rank</h3>
          <div>
              <InputLabel>System Role *</InputLabel>
              <select className="w-full bg-brand-black border border-brand-800 rounded p-3 text-white focus:outline-none" value={formData.role} onChange={e => handleChange('role', e.target.value)}>
                  <option value="guard">Guard</option>
                  <option value="supervisor">Supervisor</option>
                  {!isOps && <option value="operations">Operations (Manager/Director)</option>}
                  {!isOps && <option value="dispatch">Dispatch</option>}
              </select>
              {isOps && <p className="text-xs text-gray-500 mt-1">Operations staff cannot create other Operations accounts.</p>}
          </div>
          <div className="grid grid-cols-2 gap-4">
             <div>
                 <InputLabel>Rank *</InputLabel>
                 <select className="w-full bg-brand-black border border-brand-800 rounded p-3 text-white focus:outline-none" value={formData.rank} onChange={e => handleChange('rank', e.target.value)}>
                     <option value="OFC">Officer (OFC)</option>
                     <option value="PVT">Private (PVT)</option>
                     <option value="CPL">Corporal (CPL)</option>
                     <option value="SGT">Sergeant (SGT)</option>
                     <option value="LT">Lieutenant (LT)</option>
                     {!isOps && <option value="CAP">Captain (CAP)</option>}
                 </select>
             </div>
             <div>
                 <InputLabel>Guard Level</InputLabel>
                 <select className="w-full bg-brand-black border border-brand-800 rounded p-3 text-white focus:outline-none" value={formData.guardLevel} onChange={e => handleChange('guardLevel', e.target.value)}>
                     <option value="1">Level 1</option>
                     <option value="2">Level 2</option>
                     <option value="3">Level 3</option>
                     <option value="4">Level 4</option>
                     <option value="5">Level 5</option>
                 </select>
             </div>
          </div>
          <div>
              <InputLabel>Guard Type</InputLabel>
              <select className="w-full bg-brand-black border border-brand-800 rounded p-3 text-white focus:outline-none" value={formData.guardType} onChange={e => handleChange('guardType', e.target.value)}>
                  <option>Base</option>
                  <option>Flex</option>
                  <option>Seasonal</option>
              </select>
          </div>
        </div>
      );
      case 4: return (
        <div className="space-y-4 animate-fade-in-up">
          <h3 className="text-xl font-bold text-white mb-4">Team Assignment</h3>
          {isCreatingDirector ? (
              <div className="bg-blue-900/20 border border-blue-500/30 p-4 rounded-lg flex items-start">
                  <AlertCircle className="w-5 h-5 text-blue-400 mr-3 flex-shrink-0 mt-0.5" />
                  <div>
                      <p className="text-blue-100 font-bold text-sm">Automatic Team Creation</p>
                      <p className="text-gray-400 text-xs mt-1">
                          You are creating an Operations Director (CAP). A new team "TEAM {formData.fullName.split(' ').pop()?.toUpperCase()}" will be automatically created and assigned to them.
                      </p>
                  </div>
              </div>
          ) : (
              <div>
                  <InputLabel>Assign Team *</InputLabel>
                  <select 
                    className="w-full bg-brand-black border border-brand-800 rounded p-3 text-white focus:outline-none disabled:opacity-50" 
                    value={formData.teamId} 
                    onChange={e => handleChange('teamId', e.target.value)}
                    disabled={isOps}
                  >
                      <option value="">Select Team</option>
                      {teams.map(t => (
                          <option key={t.id} value={t.id}>{t.name} ({t.code})</option>
                      ))}
                  </select>
                  {isOps && <p className="text-xs text-brand-sage mt-1">Locked to your assigned team.</p>}
              </div>
          )}
        </div>
      );
      case 5: return (
        <div className="space-y-4 animate-fade-in-up">
          <h3 className="text-xl font-bold text-white mb-4">Employment Details</h3>
          <div className="grid grid-cols-2 gap-4">
             <div><InputLabel>Hire Date</InputLabel><InputField type="date" value={formData.hireDate} onChange={e => handleChange('hireDate', e.target.value)} /></div>
             <div><InputLabel>Employee #</InputLabel><InputField value={formData.employeeNumber} onChange={e => handleChange('employeeNumber', e.target.value)} placeholder="Auto-generated if blank" /></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
             <div>
                 <InputLabel>Status</InputLabel>
                 <select className="w-full bg-brand-black border border-brand-800 rounded p-3 text-white focus:outline-none" value={formData.status} onChange={e => handleChange('status', e.target.value)}>
                     <option value="pending">Pending</option>
                     <option value="active">Active</option>
                     <option value="on_leave">On Leave</option>
                 </select>
             </div>
             <div>
                 <InputLabel>Employment Type</InputLabel>
                 <select className="w-full bg-brand-black border border-brand-800 rounded p-3 text-white focus:outline-none" value={formData.employmentType} onChange={e => handleChange('employmentType', e.target.value)}>
                     <option>Full-Time</option>
                     <option>Part-Time</option>
                     <option>Contract</option>
                     <option>Temporary</option>
                 </select>
             </div>
          </div>
        </div>
      );
      case 6: return (
        <div className="space-y-4 animate-fade-in-up">
          <h3 className="text-xl font-bold text-white mb-4">Contact & Address</h3>
          <div><InputLabel>Street Address *</InputLabel><InputField value={formData.address} onChange={e => handleChange('address', e.target.value)} /></div>
          <div className="grid grid-cols-3 gap-4">
             <div><InputLabel>City *</InputLabel><InputField value={formData.city} onChange={e => handleChange('city', e.target.value)} /></div>
             <div><InputLabel>State *</InputLabel><InputField value={formData.state} onChange={e => handleChange('state', e.target.value)} /></div>
             <div><InputLabel>Zip *</InputLabel><InputField value={formData.zip} onChange={e => handleChange('zip', e.target.value)} /></div>
          </div>
          <div className="pt-4 border-t border-brand-800 mt-4">
             <h4 className="text-sm font-bold text-gray-400 uppercase mb-3">Emergency Contact</h4>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <div className="col-span-2"><InputLabel>Contact Name</InputLabel><InputField value={formData.emergencyName} onChange={e => handleChange('emergencyName', e.target.value)} /></div>
                 <div><InputLabel>Phone</InputLabel><InputField value={formData.emergencyPhone} onChange={e => handleChange('emergencyPhone', e.target.value)} /></div>
                 <div><InputLabel>Relationship</InputLabel><InputField value={formData.emergencyRel} onChange={e => handleChange('emergencyRel', e.target.value)} /></div>
             </div>
          </div>
        </div>
      );
      case 7: return (
        <div className="space-y-6 animate-fade-in-up">
          <h3 className="text-xl font-bold text-white mb-4">Review Account</h3>
          <div className="bg-brand-black/50 p-6 rounded-xl border border-brand-800 space-y-4 text-sm">
              <div className="flex justify-between border-b border-brand-800 pb-2">
                  <span className="text-gray-400">Name</span>
                  <span className="text-white font-bold">{formData.fullName}</span>
              </div>
              <div className="flex justify-between border-b border-brand-800 pb-2">
                  <span className="text-gray-400">Role / Rank</span>
                  <span className="text-white">{formData.role} / {formData.rank}</span>
              </div>
              <div className="flex justify-between border-b border-brand-800 pb-2">
                  <span className="text-gray-400">Team</span>
                  <span className="text-brand-sage">
                      {isCreatingDirector 
                        ? 'Auto-Generated' 
                        : teams.find(t => t.id === formData.teamId)?.name || 'Pending'}
                  </span>
              </div>
              <div className="flex justify-between">
                  <span className="text-gray-400">Initial Status</span>
                  <span className="text-white uppercase">{formData.status}</span>
              </div>
          </div>
          <div className="p-4 bg-brand-900/30 rounded border border-brand-800 text-xs text-gray-400">
              <p>By creating this account, you confirm that all information is accurate. The guard will receive an email to access their portal if selected.</p>
          </div>
        </div>
      );
      default: return null;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 backdrop-blur-sm">
      <div className="bg-brand-ebony border border-brand-700 rounded-xl w-full max-w-4xl shadow-2xl flex flex-col md:flex-row overflow-hidden max-h-[90vh]">
        
        {/* Sidebar */}
        <div className="w-full md:w-64 bg-brand-black border-b md:border-b-0 md:border-r border-brand-800 p-6 flex flex-col overflow-y-auto">
            <h2 className="text-xl font-display font-bold text-white mb-6">New Account</h2>
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
                {error && (
                    <div className="bg-red-900/20 border border-red-500/50 p-4 rounded mb-6 flex items-center text-red-400">
                        <AlertCircle className="w-5 h-5 mr-2" />
                        {error}
                    </div>
                )}
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
                
                {activeStep < 7 ? (
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
                        {loading ? 'Creating...' : <><Save size={16} className="mr-2" /> Create Account</>}
                    </button>
                )}
            </div>
        </div>

      </div>
    </div>
  );
};

export default CreateGuardModal;
