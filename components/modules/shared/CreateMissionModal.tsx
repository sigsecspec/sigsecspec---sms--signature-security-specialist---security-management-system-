
import React, { useState, useEffect } from 'react';
import { 
  Target, MapPin, Calendar, Users, DollarSign, CheckCircle, 
  X, ArrowRight, ArrowLeft, Save, Briefcase, FileText
} from 'lucide-react';
import { supabase } from '../../../services/supabase';
import { InputLabel, InputField } from '../../common/FormElements';

interface CreateMissionModalProps {
  onClose: () => void;
  onSuccess: () => void;
  currentUserRole: string;
  currentUserId: string;
  preSelectedClientId?: string;
}

const STEPS = [
  { id: 1, title: 'Basics', icon: Target },
  { id: 2, title: 'Location', icon: MapPin },
  { id: 3, title: 'Schedule', icon: Calendar },
  { id: 4, title: 'Requirements', icon: Users },
  { id: 5, title: 'Review', icon: CheckCircle },
];

const CreateMissionModal: React.FC<CreateMissionModalProps> = ({ 
  onClose, 
  onSuccess, 
  currentUserRole, 
  currentUserId,
  preSelectedClientId
}) => {
  const [activeStep, setActiveStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [clients, setClients] = useState<any[]>([]);
  const [contracts, setContracts] = useState<any[]>([]);
  const [sites, setSites] = useState<any[]>([]);
  
  // Form State
  const [formData, setFormData] = useState({
    title: '',
    clientId: preSelectedClientId || '',
    contractId: '',
    type: 'Security',
    priority: 'Normal',
    
    siteId: '',
    locationName: '', // Fallback or display
    address: '',
    
    startDate: new Date().toISOString().split('T')[0],
    startTime: '08:00',
    endDate: new Date().toISOString().split('T')[0],
    endTime: '17:00',
    
    guardCount: 1,
    guardLevel: '1',
    requirements: '',
    instructions: '',
    
    estimatedCost: 0
  });

  // Fetch Clients
  useEffect(() => {
    const fetchClients = async () => {
      // If client is logged in, their ID is fixed
      if (currentUserRole === 'Client') {
        setFormData(prev => ({ ...prev, clientId: currentUserId }));
      } else if (!preSelectedClientId) {
        // Ops/Owner fetch active clients
        const { data } = await supabase
          .from('clients')
          .select('id, business_name, status')
          .eq('status', 'active');
        setClients(data || []);
      }
    };
    fetchClients();
  }, [currentUserRole, currentUserId, preSelectedClientId]);

  // Fetch Contracts & Sites when Client changes
  useEffect(() => {
    if (formData.clientId) {
      const fetchData = async () => {
        // Contracts
        const { data: conData } = await supabase
          .from('contracts')
          .select('id, type, budget_total, budget_used, status')
          .eq('client_id', formData.clientId)
          .eq('status', 'active');
        setContracts(conData || []);

        // Sites
        const { data: siteData } = await supabase
          .from('sites')
          .select('id, name, address')
          .eq('client_id', formData.clientId);
        setSites(siteData || []);
      };
      fetchData();
    } else {
        setContracts([]);
        setSites([]);
    }
  }, [formData.clientId]);

  // Auto-fill address on site select
  useEffect(() => {
      if (formData.siteId) {
          const site = sites.find(s => s.id === formData.siteId);
          if (site) {
              setFormData(prev => ({ ...prev, locationName: site.name, address: site.address }));
          }
      }
  }, [formData.siteId, sites]);

  // Calc Estimated Cost
  useEffect(() => {
      if (formData.startDate && formData.startTime && formData.endDate && formData.endTime) {
          const start = new Date(`${formData.startDate}T${formData.startTime}`);
          const end = new Date(`${formData.endDate}T${formData.endTime}`);
          const diffMs = end.getTime() - start.getTime();
          const diffHrs = Math.max(0, diffMs / (1000 * 60 * 60));
          
          // Mock rates based on level
          const rates: any = { '1': 30, '2': 40, '3': 55, '4': 70, '5': 90 };
          const rate = rates[formData.guardLevel] || 30;
          
          const total = diffHrs * formData.guardCount * rate;
          setFormData(prev => ({ ...prev, estimatedCost: Math.round(total) }));
      }
  }, [formData.startDate, formData.startTime, formData.endDate, formData.endTime, formData.guardCount, formData.guardLevel]);

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const validateStep = (step: number) => {
    switch(step) {
      case 1: return !!formData.title && !!formData.clientId && !!formData.contractId;
      case 2: return !!formData.siteId;
      case 3: return !!formData.startDate && !!formData.startTime && !!formData.endDate && !!formData.endTime;
      case 4: return formData.guardCount > 0;
      default: return true;
    }
  };

  const handleNext = () => {
    if (validateStep(activeStep)) {
      setActiveStep(prev => Math.min(prev + 1, 5));
    } else {
      alert("Please fill in all required fields.");
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const startDateTime = new Date(`${formData.startDate}T${formData.startTime}`).toISOString();
      const endDateTime = new Date(`${formData.endDate}T${formData.endTime}`).toISOString();

      const { error } = await supabase.from('missions').insert({
        client_id: formData.clientId,
        site_id: formData.siteId,
        type: formData.type,
        status: 'pending',
        start_time: startDateTime,
        end_time: endDateTime,
        required_guards: formData.guardCount,
        notes: `${formData.requirements}\n\nINSTRUCTIONS: ${formData.instructions}\n\nESTIMATED BUDGET: $${formData.estimatedCost}`
      });

      if (error) throw error;

      // Log
      await supabase.from('profile_logs').insert({
        profile_id: currentUserId,
        action: 'CREATE_MISSION',
        performed_by: currentUserRole,
        role: currentUserRole,
        note: `Created mission: ${formData.title} for client ${formData.clientId}`
      });

      alert("Mission created successfully.");
      onSuccess();
      onClose();

    } catch (e: any) {
      console.error(e);
      alert("Error creating mission: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  const renderStep = () => {
    switch(activeStep) {
      case 1: return (
        <div className="space-y-6 animate-fade-in-up">
          <h3 className="text-xl font-bold text-white mb-2">Mission Basics</h3>
          
          <div><InputLabel>Mission Title *</InputLabel><InputField value={formData.title} onChange={e => handleChange('title', e.target.value)} placeholder="e.g. Weekend Event Security" /></div>
          
          {currentUserRole !== 'Client' && !preSelectedClientId && (
              <div>
                  <InputLabel>Client *</InputLabel>
                  <select 
                    className="w-full bg-brand-black border border-brand-800 rounded p-3 text-white focus:outline-none"
                    value={formData.clientId}
                    onChange={e => handleChange('clientId', e.target.value)}
                  >
                      <option value="">Select Client</option>
                      {clients.map(c => <option key={c.id} value={c.id}>{c.business_name}</option>)}
                  </select>
              </div>
          )}

          <div className="grid grid-cols-2 gap-4">
              <div>
                  <InputLabel>Contract *</InputLabel>
                  <select 
                    className="w-full bg-brand-black border border-brand-800 rounded p-3 text-white focus:outline-none"
                    value={formData.contractId}
                    onChange={e => handleChange('contractId', e.target.value)}
                    disabled={!formData.clientId}
                  >
                      <option value="">Select Contract</option>
                      {contracts.map(c => <option key={c.id} value={c.id}>{c.type} - ${c.budget_total}</option>)}
                  </select>
                  {formData.clientId && contracts.length === 0 && <p className="text-xs text-red-400 mt-1">No active contracts found.</p>}
              </div>
              <div>
                  <InputLabel>Priority</InputLabel>
                  <select 
                    className="w-full bg-brand-black border border-brand-800 rounded p-3 text-white focus:outline-none"
                    value={formData.priority}
                    onChange={e => handleChange('priority', e.target.value)}
                  >
                      <option>Low</option><option>Normal</option><option>High</option><option>Urgent</option>
                  </select>
              </div>
          </div>

          <div>
              <InputLabel>Mission Type</InputLabel>
              <select 
                className="w-full bg-brand-black border border-brand-800 rounded p-3 text-white focus:outline-none"
                value={formData.type}
                onChange={e => handleChange('type', e.target.value)}
              >
                  <option>Security</option><option>Patrol</option><option>Event</option><option>Executive Protection</option><option>Traffic Control</option>
              </select>
          </div>
        </div>
      );
      case 2: return (
        <div className="space-y-6 animate-fade-in-up">
          <h3 className="text-xl font-bold text-white mb-2">Location</h3>
          
          <div>
              <InputLabel>Site *</InputLabel>
              <select 
                className="w-full bg-brand-black border border-brand-800 rounded p-3 text-white focus:outline-none"
                value={formData.siteId}
                onChange={e => handleChange('siteId', e.target.value)}
              >
                  <option value="">Select Site</option>
                  {sites.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
          </div>

          <div>
              <InputLabel>Address (Auto-filled)</InputLabel>
              <InputField value={formData.address} disabled />
          </div>
        </div>
      );
      case 3: return (
        <div className="space-y-6 animate-fade-in-up">
          <h3 className="text-xl font-bold text-white mb-2">Schedule</h3>
          
          <div className="grid grid-cols-2 gap-4">
              <div><InputLabel>Start Date *</InputLabel><InputField type="date" value={formData.startDate} onChange={e => handleChange('startDate', e.target.value)} /></div>
              <div><InputLabel>Start Time *</InputLabel><InputField type="time" value={formData.startTime} onChange={e => handleChange('startTime', e.target.value)} /></div>
          </div>

          <div className="grid grid-cols-2 gap-4">
              <div><InputLabel>End Date *</InputLabel><InputField type="date" value={formData.endDate} onChange={e => handleChange('endDate', e.target.value)} /></div>
              <div><InputLabel>End Time *</InputLabel><InputField type="time" value={formData.endTime} onChange={e => handleChange('endTime', e.target.value)} /></div>
          </div>
        </div>
      );
      case 4: return (
        <div className="space-y-6 animate-fade-in-up">
          <h3 className="text-xl font-bold text-white mb-2">Guard Requirements</h3>
          
          <div className="grid grid-cols-2 gap-4">
              <div><InputLabel>Number of Guards *</InputLabel><InputField type="number" min="1" value={formData.guardCount} onChange={e => handleChange('guardCount', parseInt(e.target.value))} /></div>
              <div>
                  <InputLabel>Minimum Level</InputLabel>
                  <select 
                    className="w-full bg-brand-black border border-brand-800 rounded p-3 text-white focus:outline-none"
                    value={formData.guardLevel}
                    onChange={e => handleChange('guardLevel', e.target.value)}
                  >
                      <option value="1">Level 1</option><option value="2">Level 2</option><option value="3">Level 3</option><option value="4">Level 4</option><option value="5">Level 5</option>
                  </select>
              </div>
          </div>

          <div><InputLabel>Special Requirements</InputLabel><InputField value={formData.requirements} onChange={e => handleChange('requirements', e.target.value)} placeholder="e.g. Armed, First Aid Certified" /></div>
          
          <div>
              <InputLabel>Post Instructions</InputLabel>
              <textarea 
                  className="w-full bg-brand-black border border-brand-800 rounded p-3 text-white h-24 focus:outline-none focus:border-brand-sage"
                  value={formData.instructions}
                  onChange={e => handleChange('instructions', e.target.value)}
                  placeholder="Specific duties for the guards..."
              />
          </div>
        </div>
      );
      case 5: return (
        <div className="space-y-6 animate-fade-in-up">
          <h3 className="text-xl font-bold text-white mb-4">Review Mission</h3>
          
          <div className="bg-brand-black/50 p-6 rounded-xl border border-brand-800 space-y-4">
              <div className="flex justify-between border-b border-brand-800 pb-2">
                  <span className="text-gray-400">Mission</span>
                  <span className="text-white font-bold">{formData.title}</span>
              </div>
              <div className="flex justify-between border-b border-brand-800 pb-2">
                  <span className="text-gray-400">Location</span>
                  <span className="text-white">{formData.locationName}</span>
              </div>
              <div className="flex justify-between border-b border-brand-800 pb-2">
                  <span className="text-gray-400">Time</span>
                  <span className="text-white text-right">{formData.startDate} {formData.startTime}<br/>to {formData.endDate} {formData.endTime}</span>
              </div>
              <div className="flex justify-between border-b border-brand-800 pb-2">
                  <span className="text-gray-400">Personnel</span>
                  <span className="text-white">{formData.guardCount} x Level {formData.guardLevel}</span>
              </div>
              <div className="flex justify-between pt-2">
                  <span className="text-gray-400 font-bold">Est. Cost</span>
                  <span className="text-brand-sage font-mono font-bold text-xl">${formData.estimatedCost.toLocaleString()}</span>
              </div>
          </div>
          
          <p className="text-xs text-gray-500 text-center">
              By creating this mission, you agree to the deduction of estimated hours from the selected contract.
          </p>
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
            <h2 className="text-xl font-display font-bold text-white mb-6">Create Mission</h2>
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
                        {loading ? 'Creating...' : <><Save size={16} className="mr-2" /> Create Mission</>}
                    </button>
                )}
            </div>
        </div>

      </div>
    </div>
  );
};

export default CreateMissionModal;
