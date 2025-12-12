
import React, { useState } from 'react';
import { 
  ArrowLeft, Building, FileText, Shield, BarChart2, 
  Send, ChevronRight
} from 'lucide-react';
import { InputLabel, InputField } from '../common/FormElements';
import { supabase } from '../../services/supabase';

interface ClientFormProps {
  data: any;
  onSave: (data: any) => void;
  onSubmit: (data: any) => void;
  onBack: () => void;
}

const SECTIONS = [
  { id: 1, title: 'Business Info', icon: Building },
  { id: 2, title: 'Insurance', icon: Shield },
  { id: 3, title: 'Details', icon: BarChart2 },
  { id: 4, title: 'Contract', icon: FileText },
  { id: 5, title: 'Submit', icon: Send },
];

const ClientApplicationForm: React.FC<ClientFormProps> = ({ data, onSave, onSubmit, onBack }) => {
  const [activeSection, setActiveSection] = useState(1);
  const [formData, setFormData] = useState(data || {
    businessName: '',
    dbaName: '',
    address: '',
    city: '',
    state: '',
    zip: '',
    businessPhone: '',
    businessEmail: '',
    businessWebsite: '',
    insuranceProvider: '',
    policyNumber: '',
    coverageAmount: '',
    industryType: '',
    yearsInBusiness: '',
    estimatedBudget: '',
    requiredGuards: '',
    serviceStartDate: '',
    securityConcerns: '',
    agreedToTerms: false,
    digitalSignature: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
        const checked = (e.target as HTMLInputElement).checked;
        setFormData((prev: any) => ({ ...prev, [name]: checked }));
    } else {
        setFormData((prev: any) => ({ ...prev, [name]: value }));
    }
  };

  const handleStrictSubmit = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const payload = {
          user_id: user.id,
          status: 'pending_review',
          submitted_at: new Date().toISOString(),
          business_name: formData.businessName,
          dba_name: formData.dbaName,
          address_street: formData.address,
          address_city: formData.city,
          address_state: formData.state,
          address_zip: formData.zip,
          business_website: formData.businessWebsite,
          industry_type: formData.industryType,
          years_in_business: parseInt(formData.yearsInBusiness) || 0,
          insurance_provider: formData.insuranceProvider,
          policy_number: formData.policyNumber,
          coverage_amount: parseFloat(formData.coverageAmount) || 0,
          estimated_budget_monthly: parseFloat(formData.estimatedBudget) || 0,
          required_guards_count: parseInt(formData.requiredGuards) || 0,
          service_start_date: formData.serviceStartDate || null,
          security_concerns: formData.securityConcerns,
          agreed_to_terms: formData.agreedToTerms,
          digital_signature: formData.digitalSignature
      };

      onSubmit(payload);
      
      const { error } = await supabase.from('client_applications').insert(payload);
      if (error) {
          console.error("Submission Error:", error);
          alert("Error submitting to database: " + error.message);
      }
  };

  const renderSection = () => {
    switch (activeSection) {
      case 1: 
        return (
          <div className="space-y-6 animate-fade-in-up">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2"><InputLabel>Legal Business Name *</InputLabel><InputField name="businessName" value={formData.businessName} onChange={handleChange} required /></div>
              <div className="md:col-span-2"><InputLabel>DBA (Doing Business As)</InputLabel><InputField name="dbaName" value={formData.dbaName} onChange={handleChange} /></div>
              <div className="md:col-span-2"><InputLabel>Business Address *</InputLabel><InputField name="address" value={formData.address} onChange={handleChange} required /></div>
              <div><InputLabel>City *</InputLabel><InputField name="city" value={formData.city} onChange={handleChange} required /></div>
              <div className="grid grid-cols-2 gap-4">
                 <div><InputLabel>State *</InputLabel><InputField name="state" value={formData.state} onChange={handleChange} required /></div>
                 <div><InputLabel>ZIP *</InputLabel><InputField name="zip" value={formData.zip} onChange={handleChange} required /></div>
              </div>
              <div><InputLabel>Business Phone *</InputLabel><InputField name="businessPhone" value={formData.businessPhone} onChange={handleChange} required /></div>
              <div><InputLabel>Business Email *</InputLabel><InputField name="businessEmail" value={formData.businessEmail} onChange={handleChange} required type="email" /></div>
              <div className="md:col-span-2"><InputLabel>Website URL</InputLabel><InputField name="businessWebsite" value={formData.businessWebsite} onChange={handleChange} /></div>
            </div>
          </div>
        );
      case 2: 
        return (
          <div className="space-y-6 animate-fade-in-up">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div><InputLabel>Insurance Provider *</InputLabel><InputField name="insuranceProvider" value={formData.insuranceProvider} onChange={handleChange} required /></div>
                <div><InputLabel>Policy Number *</InputLabel><InputField name="policyNumber" value={formData.policyNumber} onChange={handleChange} required /></div>
                <div><InputLabel>Coverage Amount ($)</InputLabel><InputField name="coverageAmount" type="number" value={formData.coverageAmount} onChange={handleChange} /></div>
              </div>
          </div>
        );
      case 3: 
        return (
          <div className="space-y-6 animate-fade-in-up">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               <div>
                  <InputLabel>Industry Type</InputLabel>
                  <select name="industryType" value={formData.industryType} onChange={handleChange} className="w-full bg-brand-800 border border-brand-700 rounded p-3 text-white">
                      <option value="">Select...</option>
                      <option value="Retail">Retail</option>
                      <option value="Corporate">Corporate</option>
                      <option value="Event">Event</option>
                      <option value="Residential">Residential</option>
                  </select>
               </div>
               <div><InputLabel>Years in Business</InputLabel><InputField name="yearsInBusiness" type="number" value={formData.yearsInBusiness} onChange={handleChange} /></div>
            </div>
          </div>
        );
      case 4: 
        return (
          <div className="space-y-6 animate-fade-in-up">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div><InputLabel>Est. Monthly Budget ($)</InputLabel><InputField name="estimatedBudget" type="number" value={formData.estimatedBudget} onChange={handleChange} /></div>
                <div><InputLabel>Guards Needed</InputLabel><InputField name="requiredGuards" type="number" value={formData.requiredGuards} onChange={handleChange} /></div>
                <div><InputLabel>Desired Start Date</InputLabel><InputField name="serviceStartDate" type="date" value={formData.serviceStartDate} onChange={handleChange} /></div>
                <div className="md:col-span-2">
                    <InputLabel>Security Concerns / Notes</InputLabel>
                    <textarea name="securityConcerns" value={formData.securityConcerns} onChange={handleChange} className="w-full bg-brand-800 border border-brand-700 rounded p-3 text-white h-24" />
                </div>
             </div>
          </div>
        );
      case 5: 
        return (
          <div className="space-y-6 animate-fade-in-up">
             <div className="bg-brand-800/30 p-6 rounded border border-brand-700">
                <label className="flex items-start space-x-3 cursor-pointer">
                   <input type="checkbox" name="agreedToTerms" checked={formData.agreedToTerms} onChange={handleChange} className="mt-1" required />
                   <span className="text-sm text-gray-300">I agree to the Terms and Conditions of Service. *</span>
                </label>
             </div>
             <div>
                <InputLabel>Digital Signature (Full Name) *</InputLabel>
                <InputField name="digitalSignature" value={formData.digitalSignature} onChange={handleChange} required />
             </div>
             
             <div className="flex gap-4 justify-center mt-8">
                <button onClick={() => setActiveSection(1)} className="px-6 py-3 border border-brand-700 text-gray-300 rounded hover:bg-brand-800 transition-colors">Review</button>
                <button onClick={handleStrictSubmit} className="px-8 py-3 bg-brand-sage text-black font-bold rounded hover:bg-brand-sage/90 shadow-lg transition-all">Submit Application</button>
             </div>
          </div>
        );
      default: return null;
    }
  };

  return (
    <div className="flex flex-col md:flex-row h-full min-h-[80vh] bg-brand-ebony rounded-xl border border-white/5 overflow-hidden">
      <div className="w-full md:w-64 bg-brand-black border-r border-brand-800 flex flex-col">
         <div className="p-4 border-b border-brand-800 flex items-center">
            <button onClick={onBack} className="text-gray-400 hover:text-white mr-3 md:hidden"><ArrowLeft size={20} /></button>
            <h2 className="font-bold text-white text-sm uppercase tracking-wider">Application Steps</h2>
         </div>
         <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {SECTIONS.map((section) => (
               <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className={`w-full flex items-center px-3 py-2.5 rounded-lg text-sm transition-colors ${
                     activeSection === section.id 
                     ? 'bg-brand-sage text-black font-bold' 
                     : 'text-gray-400 hover:bg-brand-800 hover:text-white'
                  }`}
               >
                  <section.icon size={16} className={`mr-3 ${activeSection === section.id ? 'text-black' : 'text-gray-500'}`} />
                  <span className="flex-1 text-left">{section.title}</span>
               </button>
            ))}
         </div>
      </div>

      <div className="flex-1 flex flex-col h-full overflow-hidden">
         <div className="p-6 border-b border-brand-800 bg-brand-900/50 flex justify-between items-center">
            <h3 className="text-xl font-bold text-white">{SECTIONS[activeSection - 1].title}</h3>
            <div className="flex gap-3">
               {activeSection > 1 && (
                  <button onClick={() => setActiveSection(activeSection - 1)} className="px-4 py-2 bg-brand-black border border-brand-700 text-white rounded text-sm hover:bg-brand-800">Back</button>
               )}
               {activeSection < 5 && (
                  <button onClick={() => setActiveSection(activeSection + 1)} className="px-4 py-2 bg-brand-sage text-black font-bold rounded text-sm hover:bg-brand-sage/90 flex items-center">
                     Next <ChevronRight size={16} className="ml-1" />
                  </button>
               )}
            </div>
         </div>

         <div className="flex-1 overflow-y-auto p-6 md:p-8 relative">
            {renderSection()}
         </div>
      </div>
    </div>
  );
};

export default ClientApplicationForm;
