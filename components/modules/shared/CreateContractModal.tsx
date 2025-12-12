
import React, { useState, useEffect } from 'react';
import { 
  X, ChevronRight, ChevronLeft, Save, User, FileText, 
  Calendar, DollarSign, List, CreditCard, Users, CheckCircle,
  Building, MapPin, AlertCircle
} from 'lucide-react';
import { supabase } from '../../../services/supabase';
import { InputLabel, InputField } from '../../common/FormElements';

interface CreateContractModalProps {
  onClose: () => void;
  onSuccess: () => void;
  currentUserRole: string;
  currentUserId: string;
  preSelectedClientId?: string; // If opened from Client Detail
}

const STEPS = [
  { id: 1, title: 'Client', icon: User },
  { id: 2, title: 'Basics', icon: FileText },
  { id: 3, title: 'Terms', icon: Calendar },
  { id: 4, title: 'Pricing', icon: DollarSign },
  { id: 5, title: 'Details', icon: List },
  { id: 6, title: 'Payment', icon: CreditCard },
  { id: 7, title: 'Assign', icon: Users },
  { id: 8, title: 'Review', icon: CheckCircle },
];

const CreateContractModal: React.FC<CreateContractModalProps> = ({ 
  onClose, 
  onSuccess, 
  currentUserRole, 
  currentUserId,
  preSelectedClientId 
}) => {
  const [activeStep, setActiveStep] = useState(1);
  const [loading, setLoading] = useState(false);
  
  // Data Lists
  const [clients, setClients] = useState<any[]>([]);
  const [teams, setTeams] = useState<any[]>([]);
  const [clientSites, setClientSites] = useState<any[]>([]);

  // Form State
  const [formData, setFormData] = useState({
    clientId: preSelectedClientId || '',
    contractName: '',
    contractType: 'Hourly', // Hourly, Retainer, Project
    contractNumber: `CTR-${Date.now().toString().slice(-6)}`,
    
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
    autoRenewal: false,
    renewalPeriod: '1 year',

    budgetTotal: '',
    totalHours: '',
    hourlyRate: '',
    
    description: '',
    terms: '',
    
    paymentTerms: 'Net 30',
    billingFreq: 'Monthly',
    paymentMethod: 'ACH',
    depositRequired: false,
    depositAmount: '',

    teamId: '',
    siteIds: [] as string[]
  });

  // Fetch Initial Data
  useEffect(() => {
    const initData = async () => {
      // 1. Fetch Clients (if not pre-selected)
      if (!preSelectedClientId) {
        const { data: clientsData } = await supabase
          .from('clients')
          .select('id, business_name, primary_contact_name, status')
          .neq('status', 'terminated'); // Only active/pending
        setClients(clientsData || []);
      }

      // 2. Fetch Teams
      const { data: teamsData } = await supabase.from('teams').select('id, name, code');
      setTeams(teamsData || []);

      // 3. Auto-select team for Ops
      if (currentUserRole.includes('Operations')) {
         const { data: profile } = await supabase.from('profiles').select('team_id').eq('id', currentUserId).single();
         if (profile?.team_id) {
             setFormData(prev => ({ ...prev, teamId: profile.team_id }));
         }
      }
    };
    initData();
  }, []);

  // Fetch sites when client changes
  useEffect(() => {
    if (formData.clientId) {
      const fetchSites = async () => {
        const { data } = await supabase.from('sites').select('id, name').eq('client_id', formData.clientId);
        setClientSites(data || []);
      };
      fetchSites();
    }
  }, [formData.clientId]);

  // Auto-calc logic
  useEffect(() => {
    if (formData.contractType === 'Hourly' && formData.totalHours && formData.hourlyRate) {
        const calculated = parseFloat(formData.totalHours) * parseFloat(formData.hourlyRate);
        setFormData(prev => ({ ...prev, budgetTotal: calculated.toString() }));
    }
  }, [formData.totalHours, formData.hourlyRate]);

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const validateStep = (step: number) => {
    switch(step) {
      case 1: return !!formData.clientId;
      case 2: return !!formData.contractName && !!formData.contractType;
      case 3: return !!formData.startDate;
      case 4: return !!formData.budgetTotal; // Allow manual override even if calc is auto
      case 7: return currentUserRole.includes('Operations') ? !!formData.teamId : true; 
      default: return true;
    }
  };

  const handleNext = () => {
    if (validateStep(activeStep)) {
      setActiveStep(prev => Math.min(prev + 1, 8));
    } else {
      alert("Please fill in required fields.");
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      // 1. Insert Contract
      const { data: contract, error } = await supabase.from('contracts').insert({
        client_id: formData.clientId,
        type: formData.contractType,
        status: 'active', // Default to active for simplicity in this flow
        start_date: formData.startDate,
        end_date: formData.endDate || null,
        budget_total: parseFloat(formData.budgetTotal) || 0,
        budget_used: 0,
        team_id: formData.teamId || null,
        // In a real schema, we'd add the other fields to a metadata JSON or specific columns
      }).select().single();

      if (error) throw error;

      // 2. Link Sites (Mock logic since schema might not have join table yet)
      // await supabase.from('contract_sites').insert(...)

      // 3. Log
      await supabase.from('profile_logs').insert({
        profile_id: currentUserId,
        action: 'CREATE_CONTRACT',
        performed_by: currentUserRole,
        role: currentUserRole,
        note: `Created contract ${formData.contractNumber} for client ${formData.clientId}`
      });

      // 4. Update Client Status if needed
      await supabase.from('clients').update({ status: 'active' }).eq('id', formData.clientId);
      await supabase.from('profiles').update({ status: 'active' }).eq('id', formData.clientId);

      alert("Contract created successfully.");
      onSuccess();
      onClose();

    } catch (e: any) {
      console.error(e);
      alert("Error creating contract: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  const renderStepContent = () => {
    switch(activeStep) {
      case 1: // Client
        return (
          <div className="space-y-6 animate-fade-in-up">
            <h3 className="text-xl font-bold text-white mb-2">Select Client</h3>
            {preSelectedClientId ? (
               <div className="bg-brand-900/30 p-4 rounded border border-brand-800 flex items-center text-gray-300">
                  <CheckCircle className="w-5 h-5 mr-3 text-brand-sage" />
                  Client pre-selected from context.
               </div>
            ) : (
               <div>
                  <InputLabel>Client Account</InputLabel>
                  <select 
                    className="w-full bg-brand-black border border-brand-800 rounded p-3 text-white focus:outline-none focus:border-brand-sage"
                    value={formData.clientId}
                    onChange={e => handleChange('clientId', e.target.value)}
                  >
                    <option value="">-- Select Client --</option>
                    {clients.map(c => (
                      <option key={c.id} value={c.id}>{c.business_name} ({c.primary_contact_name})</option>
                    ))}
                  </select>
               </div>
            )}
          </div>
        );
      case 2: // Basics
        return (
          <div className="space-y-6 animate-fade-in-up">
            <h3 className="text-xl font-bold text-white mb-2">Contract Basics</h3>
            <div><InputLabel>Contract Name *</InputLabel><InputField value={formData.contractName} onChange={e => handleChange('contractName', e.target.value)} placeholder="e.g. 2024 Security Services" /></div>
            <div className="grid grid-cols-2 gap-4">
               <div>
                  <InputLabel>Contract Type *</InputLabel>
                  <select className="w-full bg-brand-black border border-brand-800 rounded p-3 text-white" value={formData.contractType} onChange={e => handleChange('contractType', e.target.value)}>
                     <option>Hourly</option><option>Monthly Retainer</option><option>Project-Based</option><option>Event</option>
                  </select>
               </div>
               <div><InputLabel>Contract Number</InputLabel><InputField value={formData.contractNumber} onChange={e => handleChange('contractNumber', e.target.value)} /></div>
            </div>
          </div>
        );
      case 3: // Terms
        return (
          <div className="space-y-6 animate-fade-in-up">
            <h3 className="text-xl font-bold text-white mb-2">Duration & Terms</h3>
            <div className="grid grid-cols-2 gap-4">
               <div><InputLabel>Start Date *</InputLabel><InputField type="date" value={formData.startDate} onChange={e => handleChange('startDate', e.target.value)} /></div>
               <div><InputLabel>End Date</InputLabel><InputField type="date" value={formData.endDate} onChange={e => handleChange('endDate', e.target.value)} /></div>
            </div>
            <div className="bg-brand-black p-4 rounded border border-brand-800">
               <label className="flex items-center space-x-3 cursor-pointer">
                  <input type="checkbox" checked={formData.autoRenewal} onChange={e => handleChange('autoRenewal', e.target.checked)} className="accent-brand-sage" />
                  <span className="text-white">Auto-Renewal</span>
               </label>
               {formData.autoRenewal && (
                  <div className="mt-4">
                     <InputLabel>Renewal Period</InputLabel>
                     <select className="w-full bg-brand-ebony border border-brand-700 rounded p-2 text-white" value={formData.renewalPeriod} onChange={e => handleChange('renewalPeriod', e.target.value)}>
                        <option>1 Month</option><option>6 Months</option><option>1 Year</option>
                     </select>
                  </div>
               )}
            </div>
          </div>
        );
      case 4: // Pricing
        return (
          <div className="space-y-6 animate-fade-in-up">
            <h3 className="text-xl font-bold text-white mb-2">Budget & Pricing</h3>
            {formData.contractType === 'Hourly' && (
                <div className="grid grid-cols-2 gap-4">
                   <div><InputLabel>Total Hours</InputLabel><InputField type="number" value={formData.totalHours} onChange={e => handleChange('totalHours', e.target.value)} /></div>
                   <div><InputLabel>Hourly Rate ($)</InputLabel><InputField type="number" value={formData.hourlyRate} onChange={e => handleChange('hourlyRate', e.target.value)} /></div>
                </div>
            )}
            <div><InputLabel>Total Contract Value ($) *</InputLabel><InputField type="number" value={formData.budgetTotal} onChange={e => handleChange('budgetTotal', e.target.value)} /></div>
            <p className="text-xs text-gray-500">Note: For hourly contracts, budget is calculated automatically but can be overridden.</p>
          </div>
        );
      case 5: // Details
        return (
          <div className="space-y-6 animate-fade-in-up">
            <h3 className="text-xl font-bold text-white mb-2">Contract Details</h3>
            <div><InputLabel>Scope of Work / Description</InputLabel><textarea className="w-full bg-brand-black border border-brand-800 rounded p-3 text-white h-24 focus:border-brand-sage outline-none" value={formData.description} onChange={e => handleChange('description', e.target.value)} /></div>
            <div><InputLabel>Terms & Conditions (Internal Note)</InputLabel><textarea className="w-full bg-brand-black border border-brand-800 rounded p-3 text-white h-24 focus:border-brand-sage outline-none" value={formData.terms} onChange={e => handleChange('terms', e.target.value)} /></div>
          </div>
        );
      case 6: // Payment
        return (
          <div className="space-y-6 animate-fade-in-up">
            <h3 className="text-xl font-bold text-white mb-2">Payment Configuration</h3>
            <div className="grid grid-cols-2 gap-4">
               <div>
                  <InputLabel>Payment Terms</InputLabel>
                  <select className="w-full bg-brand-black border border-brand-800 rounded p-3 text-white" value={formData.paymentTerms} onChange={e => handleChange('paymentTerms', e.target.value)}>
                     <option>Net 15</option><option>Net 30</option><option>Net 60</option><option>Prepaid</option>
                  </select>
               </div>
               <div>
                  <InputLabel>Billing Frequency</InputLabel>
                  <select className="w-full bg-brand-black border border-brand-800 rounded p-3 text-white" value={formData.billingFreq} onChange={e => handleChange('billingFreq', e.target.value)}>
                     <option>Weekly</option><option>Bi-Weekly</option><option>Monthly</option><option>One-Time</option>
                  </select>
               </div>
            </div>
            <div className="bg-brand-black p-4 rounded border border-brand-800 mt-4">
               <label className="flex items-center space-x-3 cursor-pointer">
                  <input type="checkbox" checked={formData.depositRequired} onChange={e => handleChange('depositRequired', e.target.checked)} className="accent-brand-sage" />
                  <span className="text-white">Require Deposit</span>
               </label>
               {formData.depositRequired && (
                  <div className="mt-4">
                     <InputLabel>Deposit Amount ($)</InputLabel>
                     <InputField type="number" value={formData.depositAmount} onChange={e => handleChange('depositAmount', e.target.value)} />
                  </div>
               )}
            </div>
          </div>
        );
      case 7: // Assign
        return (
          <div className="space-y-6 animate-fade-in-up">
            <h3 className="text-xl font-bold text-white mb-2">Operational Assignments</h3>
            <div>
               <InputLabel>Assign Team</InputLabel>
               <select 
                 className="w-full bg-brand-black border border-brand-800 rounded p-3 text-white disabled:opacity-50"
                 value={formData.teamId} 
                 onChange={e => handleChange('teamId', e.target.value)}
                 disabled={currentUserRole.includes('Operations')}
               >
                  <option value="">Select Team</option>
                  {teams.map(t => (
                      <option key={t.id} value={t.id}>{t.name} ({t.code})</option>
                  ))}
               </select>
            </div>
            <div>
               <InputLabel>Covered Sites (Optional)</InputLabel>
               {clientSites.length === 0 ? <p className="text-gray-500 text-sm">No sites found for this client.</p> : (
                   <div className="grid grid-cols-2 gap-2 mt-2">
                       {clientSites.map(s => (
                           <label key={s.id} className="flex items-center space-x-2 bg-brand-black p-2 rounded border border-brand-800">
                               <input 
                                 type="checkbox" 
                                 checked={formData.siteIds.includes(s.id)}
                                 onChange={e => {
                                     const newSites = e.target.checked 
                                        ? [...formData.siteIds, s.id]
                                        : formData.siteIds.filter(id => id !== s.id);
                                     handleChange('siteIds', newSites);
                                 }}
                                 className="accent-brand-sage"
                               />
                               <span className="text-sm text-gray-300">{s.name}</span>
                           </label>
                       ))}
                   </div>
               )}
            </div>
          </div>
        );
      case 8: // Review
        return (
          <div className="space-y-6 animate-fade-in-up">
            <h3 className="text-xl font-bold text-white mb-4">Review Contract</h3>
            <div className="bg-brand-black/50 p-6 rounded-xl border border-brand-800 space-y-4">
                <div className="flex justify-between border-b border-brand-800 pb-2">
                    <span className="text-gray-400">Contract</span>
                    <span className="text-white font-bold">{formData.contractName} ({formData.contractType})</span>
                </div>
                <div className="flex justify-between border-b border-brand-800 pb-2">
                    <span className="text-gray-400">Duration</span>
                    <span className="text-white">{formData.startDate} to {formData.endDate || 'Ongoing'}</span>
                </div>
                <div className="flex justify-between border-b border-brand-800 pb-2">
                    <span className="text-gray-400">Value</span>
                    <span className="text-brand-sage font-mono font-bold text-lg">${Number(formData.budgetTotal).toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                    <span className="text-gray-400">Terms</span>
                    <span className="text-white">{formData.paymentTerms} / {formData.billingFreq}</span>
                </div>
            </div>
            <div className="flex items-start bg-blue-900/20 p-4 rounded border border-blue-500/30">
                <AlertCircle className="w-5 h-5 text-blue-400 mr-3 mt-0.5" />
                <p className="text-sm text-blue-200">
                    Creating this contract will activate billing cycles and allow mission creation for the specified budget. 
                    {formData.depositRequired ? ` A deposit of $${formData.depositAmount} is required before activation.` : ''}
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
        <div className="w-full md:w-64 bg-brand-black border-b md:border-b-0 md:border-r border-brand-800 p-6 flex flex-col overflow-y-auto">
            <h2 className="text-xl font-display font-bold text-white mb-6">New Contract</h2>
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
                {renderStepContent()}
            </div>

            <div className="p-6 border-t border-brand-800 bg-brand-ebony flex justify-between">
                <button 
                    onClick={() => setActiveStep(prev => Math.max(1, prev - 1))}
                    disabled={activeStep === 1}
                    className="px-6 py-2 text-gray-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed font-medium flex items-center"
                >
                    <ChevronLeft size={16} className="mr-2" /> Back
                </button>
                
                {activeStep < 8 ? (
                    <button 
                        onClick={handleNext}
                        className="bg-brand-black border border-brand-700 text-white px-6 py-2 rounded font-bold hover:bg-brand-800 flex items-center"
                    >
                        Next <ChevronRight size={16} className="ml-2" />
                    </button>
                ) : (
                    <button 
                        onClick={handleSubmit}
                        disabled={loading}
                        className="bg-brand-sage text-black px-8 py-2 rounded font-bold hover:bg-brand-sage/90 flex items-center shadow-lg"
                    >
                        {loading ? 'Creating...' : <><Save size={16} className="mr-2" /> Create Contract</>}
                    </button>
                )}
            </div>
        </div>

      </div>
    </div>
  );
};

export default CreateContractModal;
