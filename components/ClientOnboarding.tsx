
import React, { useState } from 'react';
import { 
  CheckCircle, ArrowRight, BookOpen, PlayCircle, PauseCircle, 
  Building, MapPin, FileText, Users, Phone, CreditCard, 
  Upload, Plus, Trash2, DollarSign, Shield, AlertCircle
} from 'lucide-react';
import { InputLabel, InputField, FileUpload } from './common/FormElements';
import { supabase } from '../services/supabase';

interface ClientOnboardingProps {
  onComplete: () => void;
  onNavigateToTraining: () => void;
}

const ClientOnboarding: React.FC<ClientOnboardingProps> = ({ onComplete, onNavigateToTraining }) => {
  const [step, setStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [agreedToRules, setAgreedToRules] = useState(false);
  
  // Form State
  const [businessInfo, setBusinessInfo] = useState({ companySize: '', industry: 'Corporate', taxId: '' });
  const [sites, setSites] = useState([{ name: 'Main HQ', address: '', type: 'Office' }]);
  const [contractPrefs, setContractPrefs] = useState({ duration: '12m', guards: 1, days: 5, hours: 8, level: 'Level 2' });
  const [guardPrefs, setGuardPrefs] = useState({ levels: ['Level 2'], leadReq: false });
  const [contacts, setContacts] = useState([{ name: '', role: 'Emergency', phone: '' }]);
  const [billing, setBilling] = useState({ method: 'invoice', email: '' });

  // Budget Calculator Logic
  const calculateBudget = () => {
    const rates: Record<string, number> = { 'Level 1': 25, 'Level 2': 30, 'Level 3': 40, 'Level 4': 55, 'Level 5': 70 };
    const baseRate = rates[contractPrefs.level] || 30;
    const weeklyHours = contractPrefs.guards * contractPrefs.days * contractPrefs.hours;
    const monthlyCost = weeklyHours * baseRate * 4;
    return monthlyCost;
  };

  const steps = [
    { id: 'rules', title: 'Rules & Policies', icon: <BookOpen /> },
    { id: 'business', title: 'Business Info', icon: <Building /> },
    { id: 'sites', title: 'Site Mgmt', icon: <MapPin /> },
    { id: 'contract', title: 'Contract Prefs', icon: <FileText /> },
    { id: 'guards', title: 'Guard Prefs', icon: <Shield /> },
    { id: 'contacts', title: 'Contacts', icon: <Phone /> },
    { id: 'billing', title: 'Billing & Tax', icon: <CreditCard /> },
  ];

  const handleNext = () => {
    if (step < steps.length - 1) setStep(step + 1);
    else onComplete();
  };

  const handleBack = () => {
    if (step > 0) setStep(step - 1);
  };

  // --- Step Renderers ---

  const renderRules = () => (
    <div className="space-y-6 animate-fade-in-up">
      <div className="bg-brand-black p-6 rounded-xl border border-brand-800">
        <h3 className="text-xl font-bold text-white mb-4">Company Standards & Procedures</h3>
        
        {/* Audio Player Mock */}
        <div className="bg-brand-ebony p-4 rounded-lg border border-brand-700 flex items-center mb-6">
          <button 
            onClick={() => setIsPlaying(!isPlaying)}
            className="w-12 h-12 flex items-center justify-center bg-brand-sage rounded-full text-black hover:bg-white transition-colors mr-4"
          >
            {isPlaying ? <PauseCircle size={24} /> : <PlayCircle size={24} />}
          </button>
          <div className="flex-1">
            <p className="text-sm font-bold text-white">Welcome & Policy Overview</p>
            <p className="text-xs text-brand-silver">02:14 / 05:00</p>
            <div className="w-full bg-brand-900 h-1 mt-2 rounded-full overflow-hidden">
              <div className="h-full bg-brand-sage w-1/3 animate-pulse"></div>
            </div>
          </div>
        </div>

        <div className="h-64 overflow-y-auto pr-2 text-sm text-gray-300 space-y-4 border-b border-brand-800 pb-4 mb-4">
          <p><strong>1. Professionalism:</strong> All interactions must remain professional. Our guards are trained to de-escalate.</p>
          <p><strong>2. Billing Cycle:</strong> Invoices are generated on the 1st of each month with Net 30 terms.</p>
          <p><strong>3. Emergency Protocol:</strong> In life-threatening situations, call 911 first, then our Ops Center.</p>
          <p><strong>4. Scheduling:</strong> Mission requests should be submitted 48 hours in advance for guaranteed coverage.</p>
          <p><strong>5. Incident Reporting:</strong> All incidents are logged digitally and available in your dashboard within 1 hour.</p>
        </div>

        <label className="flex items-center space-x-3 cursor-pointer p-2 hover:bg-brand-800 rounded transition-colors">
          <input 
            type="checkbox" 
            checked={agreedToRules} 
            onChange={(e) => setAgreedToRules(e.target.checked)} 
            className="w-5 h-5 rounded border-brand-600 text-brand-sage focus:ring-brand-sage bg-brand-900"
          />
          <span className="text-white text-sm">I have read, listened to, and agree to the Company Rules & Policies.</span>
        </label>
      </div>
    </div>
  );

  const renderContract = () => (
    <div className="space-y-6 animate-fade-in-up">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div>
          <h3 className="text-lg font-bold text-white mb-4">Preferences</h3>
          <div className="space-y-4">
            <div>
              <InputLabel>Contract Duration</InputLabel>
              <div className="grid grid-cols-3 gap-2">
                {['6m', '12m', '24m'].map(d => (
                  <button 
                    key={d}
                    onClick={() => setContractPrefs({...contractPrefs, duration: d})}
                    className={`py-2 px-3 rounded text-sm border ${contractPrefs.duration === d ? 'bg-brand-sage text-black border-brand-sage' : 'bg-brand-black border-brand-700 text-gray-400'}`}
                  >
                    {d === '6m' ? '6 Months' : d === '12m' ? '1 Year' : '2 Years'}
                  </button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
               <div><InputLabel>Guards</InputLabel><input type="number" className="w-full bg-brand-black border border-brand-700 rounded p-2 text-white" value={contractPrefs.guards} onChange={e => setContractPrefs({...contractPrefs, guards: parseInt(e.target.value) || 0})} /></div>
               <div><InputLabel>Hours/Day</InputLabel><input type="number" className="w-full bg-brand-black border border-brand-700 rounded p-2 text-white" value={contractPrefs.hours} onChange={e => setContractPrefs({...contractPrefs, hours: parseInt(e.target.value) || 0})} /></div>
            </div>
            <div>
               <InputLabel>Days Per Week</InputLabel>
               <input type="range" min="1" max="7" value={contractPrefs.days} onChange={e => setContractPrefs({...contractPrefs, days: parseInt(e.target.value)})} className="w-full accent-brand-sage" />
               <div className="flex justify-between text-xs text-gray-500 mt-1"><span>1 Day</span><span>{contractPrefs.days} Days</span><span>7 Days</span></div>
            </div>
            <div>
               <InputLabel>Guard Level</InputLabel>
               <select value={contractPrefs.level} onChange={e => setContractPrefs({...contractPrefs, level: e.target.value})} className="w-full bg-brand-black border border-brand-700 rounded p-2 text-white">
                  <option>Level 1</option><option>Level 2</option><option>Level 3</option><option>Level 4</option><option>Level 5</option>
               </select>
            </div>
          </div>
        </div>

        <div className="bg-brand-black p-6 rounded-xl border border-brand-800 flex flex-col justify-center">
           <h4 className="text-brand-sage text-sm font-bold uppercase tracking-wider mb-6 flex items-center"><DollarSign className="w-4 h-4 mr-2" /> Estimated Cost</h4>
           <div className="space-y-4 mb-8">
              <div className="flex justify-between text-gray-400 text-sm">
                 <span>Total Hours / Week</span>
                 <span>{contractPrefs.guards * contractPrefs.days * contractPrefs.hours} hrs</span>
              </div>
              <div className="flex justify-between text-gray-400 text-sm">
                 <span>Rate ({contractPrefs.level})</span>
                 <span>Market Rate</span>
              </div>
              <div className="border-t border-brand-800 pt-4 flex justify-between items-end">
                 <span className="text-white font-bold">Est. Monthly</span>
                 <span className="text-3xl font-mono text-brand-sage font-bold">${calculateBudget().toLocaleString()}</span>
              </div>
           </div>
           <p className="text-xs text-gray-500 text-center">
             * This is an estimate. Final pricing is subject to contract approval.
           </p>
        </div>
      </div>
    </div>
  );

  const renderTax = () => (
    <div className="space-y-6 animate-fade-in-up">
       <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
             <InputLabel>Tax ID / EIN</InputLabel>
             <InputField value={businessInfo.taxId} onChange={(e) => setBusinessInfo({...businessInfo, taxId: e.target.value})} placeholder="XX-XXXXXXX" />
          </div>
          <div>
             <InputLabel>Billing Email</InputLabel>
             <InputField value={billing.email} onChange={(e) => setBilling({...billing, email: e.target.value})} type="email" placeholder="billing@company.com" />
          </div>
       </div>
       
       <div className="bg-brand-black p-6 rounded-xl border border-brand-800 text-center">
          <FileText className="w-12 h-12 text-brand-silver mx-auto mb-4" />
          <h4 className="text-white font-bold mb-2">W-9 Form Required</h4>
          <p className="text-gray-400 text-sm mb-6 max-w-md mx-auto">Please upload a completed W-9 form for tax purposes. This is required before we can activate your contract features.</p>
          
          <div className="flex justify-center gap-4">
             <button className="px-4 py-2 border border-brand-700 text-gray-300 rounded hover:text-white hover:bg-brand-800 text-sm">Download Template</button>
             <button className="px-4 py-2 bg-brand-sage text-black font-bold rounded hover:bg-brand-sage/90 text-sm flex items-center">
                <Upload className="w-4 h-4 mr-2" /> Upload Signed W-9
             </button>
          </div>
       </div>
    </div>
  );

  const renderContent = () => {
    switch (step) {
      case 0: return renderRules();
      case 1: return (
        <div className="space-y-4 animate-fade-in-up">
           <InputLabel>Company Size</InputLabel>
           <InputField value={businessInfo.companySize} onChange={e => setBusinessInfo({...businessInfo, companySize: e.target.value})} placeholder="e.g. 50-100 employees" />
           <InputLabel>Industry</InputLabel>
           <select className="w-full bg-brand-800 border border-brand-700 rounded p-3 text-white" value={businessInfo.industry} onChange={e => setBusinessInfo({...businessInfo, industry: e.target.value})}>
              <option>Corporate</option><option>Retail</option><option>Industrial</option><option>Event</option>
           </select>
        </div>
      );
      case 2: return (
        <div className="space-y-4 animate-fade-in-up">
           {sites.map((s, i) => (
             <div key={i} className="bg-brand-black p-4 rounded border border-brand-800 flex justify-between items-center">
               <div><p className="text-white font-bold">{s.name}</p><p className="text-xs text-gray-500">{s.type}</p></div>
               <button onClick={() => setSites(sites.filter((_, idx) => idx !== i))}><Trash2 className="w-4 h-4 text-red-500" /></button>
             </div>
           ))}
           <button onClick={() => setSites([...sites, { name: 'New Site', address: '', type: 'Office' }])} className="w-full py-3 border border-dashed border-brand-700 text-brand-sage rounded flex items-center justify-center hover:bg-brand-800 transition-colors">
             <Plus className="w-4 h-4 mr-2" /> Add Site
           </button>
        </div>
      );
      case 3: return renderContract();
      case 4: return (
        <div className="space-y-4 animate-fade-in-up">
           <div className="bg-brand-black p-4 rounded border border-brand-800">
              <label className="flex items-center space-x-3">
                 <input type="checkbox" checked={guardPrefs.leadReq} onChange={e => setGuardPrefs({...guardPrefs, leadReq: e.target.checked})} className="bg-brand-900 border-brand-600 text-brand-sage focus:ring-brand-sage" />
                 <span className="text-white">Require Lead Guard (Supervisor on site)</span>
              </label>
           </div>
           <p className="text-gray-400 text-sm">Whitelist/Blacklist preferences can be managed from the Dashboard after activation.</p>
        </div>
      );
      case 5: return (
        <div className="space-y-4 animate-fade-in-up">
           {contacts.map((c, i) => (
             <div key={i} className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-brand-black p-4 rounded border border-brand-800">
               <InputField placeholder="Name" value={c.name} onChange={e => {const n = [...contacts]; n[i].name = e.target.value; setContacts(n);}} />
               <InputField placeholder="Role" value={c.role} onChange={e => {const n = [...contacts]; n[i].role = e.target.value; setContacts(n);}} />
               <InputField placeholder="Phone" value={c.phone} onChange={e => {const n = [...contacts]; n[i].phone = e.target.value; setContacts(n);}} />
             </div>
           ))}
           <button onClick={() => setContacts([...contacts, { name: '', role: '', phone: '' }])} className="text-brand-sage text-sm hover:underline">+ Add Another Contact</button>
        </div>
      );
      case 6: return renderTax();
      default: return null;
    }
  };

  return (
    <div className="flex flex-col md:flex-row h-screen bg-brand-black overflow-hidden">
      {/* Sidebar Progress */}
      <div className="w-full md:w-64 bg-brand-ebony border-r border-brand-800 p-6 flex flex-col shrink-0">
        <h2 className="text-xl font-display font-bold text-white mb-8">Onboarding</h2>
        <div className="space-y-2 flex-1">
          {steps.map((s, idx) => (
            <div 
              key={s.id} 
              className={`flex items-center p-3 rounded-lg transition-colors ${
                step === idx ? 'bg-brand-sage text-black font-bold' : 
                step > idx ? 'text-green-500' : 'text-gray-500'
              }`}
            >
              <div className="mr-3">{step > idx ? <CheckCircle size={18} /> : s.icon}</div>
              <span className="text-sm">{s.title}</span>
            </div>
          ))}
        </div>
        
        {/* Training Link in Sidebar */}
        <div className="mt-8 border-t border-brand-800 pt-6">
           <div className="bg-brand-900/50 p-4 rounded-xl border border-brand-800">
              <h4 className="text-white font-bold text-sm mb-2">Need Help?</h4>
              <p className="text-xs text-gray-400 mb-4">Review our training materials for a guide on how to use the system.</p>
              <button 
                onClick={onNavigateToTraining}
                className="w-full py-2 bg-brand-black border border-brand-700 text-brand-sage rounded text-xs font-bold hover:bg-brand-800 hover:text-white transition-colors"
              >
                View Training
              </button>
           </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Top Bar */}
        <div className="h-16 border-b border-brand-800 bg-brand-ebony/50 flex items-center px-8 justify-between">
           <h3 className="text-lg font-bold text-white">{steps[step].title}</h3>
           <span className="text-sm text-gray-500">Step {step + 1} of {steps.length}</span>
        </div>

        {/* Form Area */}
        <div className="flex-1 overflow-y-auto p-8">
           <div className="max-w-3xl mx-auto">
              {renderContent()}
           </div>
        </div>

        {/* Footer Actions */}
        <div className="h-20 border-t border-brand-800 bg-brand-ebony p-4 flex justify-between items-center px-8">
           <button 
             onClick={handleBack}
             disabled={step === 0}
             className="px-6 py-2 text-gray-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed font-medium transition-colors"
           >
             Back
           </button>
           
           <button 
             onClick={handleNext}
             disabled={step === 0 && !agreedToRules}
             className="bg-brand-sage text-black px-8 py-3 rounded font-bold hover:bg-brand-sage/90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center shadow-lg transition-all transform hover:-translate-y-1"
           >
             {step === steps.length - 1 ? 'Complete Onboarding' : 'Continue'}
             {step < steps.length - 1 && <ArrowRight className="w-4 h-4 ml-2" />}
           </button>
        </div>
      </div>
    </div>
  );
};

export default ClientOnboarding;
