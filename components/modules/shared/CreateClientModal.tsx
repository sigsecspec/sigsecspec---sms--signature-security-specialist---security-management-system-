
import React, { useState, useEffect } from 'react';
import { 
  User, Building, MapPin, Settings, CheckCircle, X, 
  ArrowRight, ArrowLeft, Save, Briefcase, Lock
} from 'lucide-react';
import { supabase } from '../../../services/supabase';
import { InputLabel, InputField } from '../../common/FormElements';

interface CreateClientModalProps {
  onClose: () => void;
  onSuccess: () => void;
  currentUserRole: string;
  currentUserId: string;
}

const STEPS = [
  { id: 1, title: 'Profile Info', icon: User },
  { id: 2, title: 'Company Details', icon: Building },
  { id: 3, title: 'Address', icon: MapPin },
  { id: 4, title: 'Configuration', icon: Settings },
];

const CreateClientModal: React.FC<CreateClientModalProps> = ({ onClose, onSuccess, currentUserRole, currentUserId }) => {
  const [activeStep, setActiveStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [teams, setTeams] = useState<{id: string, name: string, code: string}[]>([]);
  
  // Form State
  const [formData, setFormData] = useState({
    // Profile
    fullName: '',
    email: '',
    phone: '',
    position: '',
    password: '', // In a real app, we'd trigger an invite email instead
    
    // Company
    companyName: '',
    companyType: 'Corporation',
    industry: 'Corporate',
    website: '',
    
    // Address
    address: '',
    city: '',
    state: '',
    zip: '',
    
    // Config
    teamId: '',
    status: 'active',
    accountType: 'Standard',
    paymentTerms: 'Net 30'
  });

  useEffect(() => {
    fetchTeams();
  }, []);

  const fetchTeams = async () => {
    // If Operations, we might need to find THEIR team to pre-fill
    // For Owners, fetch all
    const { data } = await supabase.from('teams').select('id, name, code, director_id');
    if (data) {
      setTeams(data);
      
      // Auto-select team for Operations roles if they are restricted
      // (Mock logic: Assuming we match the current user's team_id from profile if implemented)
      if (currentUserRole.includes('Operations')) {
         const { data: profile } = await supabase.from('profiles').select('team_id').eq('id', currentUserId).single();
         if (profile?.team_id) {
             setFormData(prev => ({ ...prev, teamId: profile.team_id }));
         }
      }
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const validateStep = (step: number) => {
    switch(step) {
      case 1: return formData.fullName && formData.email && formData.password;
      case 2: return formData.companyName;
      case 3: return formData.address && formData.city && formData.state;
      case 4: return currentUserRole.includes('Owner') || currentUserRole === 'Management' ? formData.teamId : true; // Ops auto-assigned or validated
      default: return true;
    }
  };

  const handleNext = () => {
    if (validateStep(activeStep)) {
      setActiveStep(prev => Math.min(prev + 1, 4));
    } else {
      alert("Please fill in all required fields.");
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      // 1. Create Mock Auth ID (In production, use admin.createUser)
      // We generate a random UUID to simulate a new user without logging out the admin
      const newUserId = crypto.randomUUID();

      // 2. Create Profile
      const { error: profileError } = await supabase.from('profiles').insert({
        id: newUserId,
        email: formData.email,
        full_name: formData.fullName,
        phone_primary: formData.phone,
        role: 'client',
        status: formData.status,
        address_street: formData.address,
        address_city: formData.city,
        address_state: formData.state,
        address_zip: formData.zip,
        team_id: formData.teamId || null,
        metadata: {
            created_by: currentUserId,
            creation_method: 'manual_console'
        }
      });

      if (profileError) throw profileError;

      // 3. Create Client Record
      const { error: clientError } = await supabase.from('clients').insert({
        id: newUserId,
        business_name: formData.companyName,
        primary_contact_name: formData.fullName,
        business_email: formData.email,
        business_phone: formData.phone,
        industry_type: formData.industry,
        business_address: `${formData.address}, ${formData.city}, ${formData.state} ${formData.zip}`,
        account_type: formData.accountType,
        payment_terms: formData.paymentTerms
      });

      if (clientError) throw clientError;

      // 4. Audit Log
      await supabase.from('profile_logs').insert({
        profile_id: newUserId,
        action: 'ACCOUNT_CREATED',
        performed_by: currentUserRole,
        role: currentUserRole,
        note: `Manual account creation for ${formData.companyName}`
      });

      alert("Client account created successfully.");
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
          <h3 className="text-xl font-bold text-white mb-4">Profile Information</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2"><InputLabel>Full Name *</InputLabel><InputField value={formData.fullName} onChange={e => handleChange('fullName', e.target.value)} placeholder="John Doe" /></div>
            <div className="col-span-2"><InputLabel>Email Address *</InputLabel><InputField type="email" value={formData.email} onChange={e => handleChange('email', e.target.value)} placeholder="client@company.com" /></div>
            <div><InputLabel>Phone Number</InputLabel><InputField type="tel" value={formData.phone} onChange={e => handleChange('phone', e.target.value)} placeholder="(555) 123-4567" /></div>
            <div><InputLabel>Title/Position</InputLabel><InputField value={formData.position} onChange={e => handleChange('position', e.target.value)} placeholder="Manager" /></div>
            <div className="col-span-2">
                <InputLabel>Temporary Password *</InputLabel>
                <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 w-4 h-4" />
                    <input 
                        type="text" 
                        value={formData.password} 
                        onChange={e => handleChange('password', e.target.value)}
                        className="w-full bg-brand-black border border-brand-800 rounded p-3 pl-10 text-white focus:outline-none focus:border-brand-sage"
                        placeholder="Set initial password" 
                    />
                </div>
                <p className="text-xs text-gray-500 mt-1">Client can change this after first login.</p>
            </div>
          </div>
        </div>
      );
      case 2: return (
        <div className="space-y-4 animate-fade-in-up">
          <h3 className="text-xl font-bold text-white mb-4">Company Information</h3>
          <div><InputLabel>Company Legal Name *</InputLabel><InputField value={formData.companyName} onChange={e => handleChange('companyName', e.target.value)} placeholder="Acme Corp" /></div>
          <div className="grid grid-cols-2 gap-4">
             <div>
                 <InputLabel>Company Type</InputLabel>
                 <select className="w-full bg-brand-black border border-brand-800 rounded p-3 text-white focus:outline-none" value={formData.companyType} onChange={e => handleChange('companyType', e.target.value)}>
                     <option>Corporation</option><option>LLC</option><option>Partnership</option><option>Sole Proprietorship</option><option>Non-Profit</option>
                 </select>
             </div>
             <div>
                 <InputLabel>Industry</InputLabel>
                 <select className="w-full bg-brand-black border border-brand-800 rounded p-3 text-white focus:outline-none" value={formData.industry} onChange={e => handleChange('industry', e.target.value)}>
                     <option>Corporate</option><option>Retail</option><option>Construction</option><option>Event</option><option>Healthcare</option><option>Residential</option>
                 </select>
             </div>
          </div>
          <div><InputLabel>Website</InputLabel><InputField value={formData.website} onChange={e => handleChange('website', e.target.value)} placeholder="https://" /></div>
        </div>
      );
      case 3: return (
        <div className="space-y-4 animate-fade-in-up">
          <h3 className="text-xl font-bold text-white mb-4">Billing Address</h3>
          <div><InputLabel>Street Address *</InputLabel><InputField value={formData.address} onChange={e => handleChange('address', e.target.value)} /></div>
          <div className="grid grid-cols-2 gap-4">
             <div><InputLabel>City *</InputLabel><InputField value={formData.city} onChange={e => handleChange('city', e.target.value)} /></div>
             <div><InputLabel>State/Province *</InputLabel><InputField value={formData.state} onChange={e => handleChange('state', e.target.value)} /></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
             <div><InputLabel>ZIP / Postal Code *</InputLabel><InputField value={formData.zip} onChange={e => handleChange('zip', e.target.value)} /></div>
             <div><InputLabel>Country</InputLabel><InputField value="United States" disabled /></div>
          </div>
        </div>
      );
      case 4: return (
        <div className="space-y-4 animate-fade-in-up">
          <h3 className="text-xl font-bold text-white mb-4">Account Configuration</h3>
          
          <div>
              <InputLabel>Assigned Team *</InputLabel>
              <select 
                className="w-full bg-brand-black border border-brand-800 rounded p-3 text-white focus:outline-none disabled:opacity-50" 
                value={formData.teamId} 
                onChange={e => handleChange('teamId', e.target.value)}
                disabled={currentUserRole.includes('Operations')} // Locked for Ops to their own team (mock logic in fetchTeams)
              >
                  <option value="">Select Operations Team</option>
                  {teams.map(t => (
                      <option key={t.id} value={t.id}>{t.name} ({t.code})</option>
                  ))}
              </select>
              {currentUserRole.includes('Operations') && <p className="text-xs text-brand-sage mt-1">Locked to your assigned team.</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
             <div>
                 <InputLabel>Account Status</InputLabel>
                 <select className="w-full bg-brand-black border border-brand-800 rounded p-3 text-white focus:outline-none" value={formData.status} onChange={e => handleChange('status', e.target.value)}>
                     <option value="active">Active</option><option value="pending">Pending</option><option value="on_hold">On Hold</option>
                 </select>
             </div>
             <div>
                 <InputLabel>Account Package</InputLabel>
                 <select className="w-full bg-brand-black border border-brand-800 rounded p-3 text-white focus:outline-none" value={formData.accountType} onChange={e => handleChange('accountType', e.target.value)}>
                     <option>Standard</option><option>Premium</option><option>Enterprise</option>
                 </select>
             </div>
          </div>

          <div>
              <InputLabel>Payment Terms</InputLabel>
              <select className="w-full bg-brand-black border border-brand-800 rounded p-3 text-white focus:outline-none" value={formData.paymentTerms} onChange={e => handleChange('paymentTerms', e.target.value)}>
                  <option>Net 15</option><option>Net 30</option><option>Net 45</option><option>Prepaid</option>
              </select>
          </div>
        </div>
      );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 backdrop-blur-sm">
      <div className="bg-brand-ebony border border-brand-700 rounded-xl w-full max-w-4xl shadow-2xl flex flex-col md:flex-row overflow-hidden max-h-[90vh]">
        
        {/* Sidebar */}
        <div className="w-full md:w-64 bg-brand-black border-b md:border-b-0 md:border-r border-brand-800 p-6 flex flex-col">
            <h2 className="text-xl font-display font-bold text-white mb-6">Create Account</h2>
            <div className="space-y-2 flex-1">
                {STEPS.map((s) => (
                    <div 
                        key={s.id}
                        className={`flex items-center p-3 rounded-lg transition-colors ${
                            activeStep === s.id ? 'bg-brand-sage text-black font-bold' : 
                            activeStep > s.id ? 'text-green-500' : 'text-gray-500'
                        }`}
                    >
                        <div className="mr-3">{activeStep > s.id ? <CheckCircle size={18} /> : <s.icon size={18} />}</div>
                        <span className="text-sm">{s.title}</span>
                    </div>
                ))}
            </div>
        </div>

        {/* Content */}
        <div className="flex-1 flex flex-col">
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
                        {loading ? 'Creating...' : <><Save size={16} className="mr-2" /> Create Account</>}
                    </button>
                )}
            </div>
        </div>

      </div>
    </div>
  );
};

export default CreateClientModal;
