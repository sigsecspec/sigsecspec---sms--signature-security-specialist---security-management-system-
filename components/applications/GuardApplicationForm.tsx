
import React, { useState, useEffect } from 'react';
import { 
  User, Shield, Briefcase, Clock, Send, Info, ChevronDown, ChevronUp
} from 'lucide-react';
import { InputLabel, InputField } from '../common/FormElements';
import { supabase } from '../../services/supabase';
import { CertificationType } from '../../types';

interface GuardFormProps {
  data: any;
  onSave: (data: any) => void;
  onSubmit: (data: any) => void;
  onBack: () => void;
}

const SECTIONS = [
  { id: 1, title: 'Personal Info', icon: User },
  { id: 2, title: 'Licensing & Certs', icon: Shield },
  { id: 3, title: 'Experience', icon: Briefcase },
  { id: 4, title: 'Availability', icon: Clock },
  { id: 5, title: 'Submit', icon: Send },
];

interface SelectedCert {
  cert_id: string;
  certification_number?: string;
  expiration_date?: string;
}

const GuardApplicationForm: React.FC<GuardFormProps> = ({ data, onSave, onSubmit, onBack }) => {
  const [activeSection, setActiveSection] = useState(1);
  const [certTypes, setCertTypes] = useState<CertificationType[]>([]);
  const [loadingCerts, setLoadingCerts] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState<string[]>([]);
  
  const [formData, setFormData] = useState(data || {
    firstName: '', lastName: '', dob: '',
    address: '', city: '', state: '', zip: '',
    primaryPhone: '', email: '',
    dlNumber: '', dlState: '', dlExp: '',
    ssn: '', 
    // Certs are now handled via the selectedCerts array, but keeping legacy fields for DB compatibility if needed
    guardCardNum: '', guardCardState: '', guardCardExp: '',
    
    yearsExperience: 0,
    isVeteran: false,
    militaryBranch: '',
    daysAvailable: [],
    shiftsPreferred: [],
    willingTravel: false,
    digitalSig: '',
    selectedCerts: [] as SelectedCert[]
  });

  useEffect(() => {
    const fetchCerts = async () => {
      setLoadingCerts(true);
      const { data } = await supabase.from('certification_types').select('*').eq('is_active', true).order('sort_order');
      if (data) {
        setCertTypes(data as CertificationType[]);
        // Auto expand 'CORE_BSIS' by default
        setExpandedCategories(['CORE_BSIS']);
      }
      setLoadingCerts(false);
    };
    fetchCerts();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      if (Array.isArray((formData as any)[name])) {
        setFormData((prev: any) => {
          const currentArr = prev[name] || [];
          if (checked) return { ...prev, [name]: [...currentArr, value] };
          return { ...prev, [name]: currentArr.filter((item: string) => item !== value) };
        });
      } else {
        setFormData((prev: any) => ({ ...prev, [name]: checked }));
      }
    } else {
      setFormData((prev: any) => ({ ...prev, [name]: value }));
    }
  };

  const handleCertToggle = (cert: CertificationType) => {
    setFormData((prev: any) => {
      const exists = prev.selectedCerts.find((c: SelectedCert) => c.cert_id === cert.cert_id);
      if (exists) {
        return { ...prev, selectedCerts: prev.selectedCerts.filter((c: SelectedCert) => c.cert_id !== cert.cert_id) };
      } else {
        return { ...prev, selectedCerts: [...prev.selectedCerts, { cert_id: cert.cert_id }] };
      }
    });
  };

  const handleCertUpdate = (certId: string, field: keyof SelectedCert, value: string) => {
    setFormData((prev: any) => ({
      ...prev,
      selectedCerts: prev.selectedCerts.map((c: SelectedCert) => 
        c.cert_id === certId ? { ...c, [field]: value } : c
      )
    }));
  };

  const toggleCategory = (category: string) => {
    setExpandedCategories(prev => 
      prev.includes(category) ? prev.filter(c => c !== category) : [...prev, category]
    );
  };

  const handleStrictSubmit = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Extract guard card specific info if entered in the generic inputs, or find it in selectedCerts
      const guardCardCert = formData.selectedCerts.find((c: any) => c.cert_id === 'guard_card');
      const finalGuardCardNum = guardCardCert?.certification_number || formData.guardCardNum;
      const finalGuardCardExp = guardCardCert?.expiration_date || formData.guardCardExp;

      const payload = {
          user_id: user.id,
          status: 'pending_review',
          
          address_street: formData.address,
          address_city: formData.city,
          address_state: formData.state,
          address_zip: formData.zip,

          dl_number: formData.dlNumber,
          dl_state: formData.dlState,
          dl_exp_date: formData.dlExp || null,
          ssn_encrypted: formData.ssn, 
          
          guard_card_number: finalGuardCardNum,
          guard_card_state: formData.guardCardState, // Or assume 'CA' if not explicitly in dynamic list
          guard_card_exp_date: finalGuardCardExp || null,
          
          // Store full structured certs
          certifications: formData.selectedCerts,
          
          years_experience: parseInt(formData.yearsExperience) || 0,
          is_military_veteran: formData.isVeteran,
          military_branch: formData.militaryBranch,
          
          willing_to_travel: formData.willingTravel,
          days_available: formData.daysAvailable,
          shifts_preferred: formData.shiftsPreferred
      };

      onSubmit(payload);
      
      const { error } = await supabase.from('guard_applications').insert(payload);
      if (error) {
          console.error("Submission Error:", error);
          alert("Error submitting: " + error.message);
      }
  };

  const renderCertifications = () => {
    const categories = Array.from(new Set(certTypes.map(c => c.category))) as string[];
    
    return (
      <div className="space-y-4">
        {categories.map(cat => {
          const catCerts = certTypes.filter(c => c.category === cat);
          const isExpanded = expandedCategories.includes(cat);
          
          return (
            <div key={cat} className="border border-brand-800 rounded-lg overflow-hidden bg-brand-900/30">
              <button 
                type="button"
                onClick={() => toggleCategory(cat)}
                className="w-full flex items-center justify-between p-4 text-left hover:bg-brand-800/50 transition-colors"
              >
                <span className="font-bold text-brand-sage uppercase text-xs tracking-wider">{cat.replace(/_/g, ' ')}</span>
                {isExpanded ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
              </button>
              
              {isExpanded && (
                <div className="p-4 space-y-4 border-t border-brand-800 bg-brand-black/20">
                  {catCerts.map(cert => {
                    const isSelected = formData.selectedCerts.some((c: any) => c.cert_id === cert.cert_id);
                    const selectedData = formData.selectedCerts.find((c: any) => c.cert_id === cert.cert_id) || {};

                    return (
                      <div key={cert.id} className="bg-brand-black border border-brand-800 p-3 rounded">
                        <label className="flex items-start space-x-3 cursor-pointer">
                          <input 
                            type="checkbox" 
                            checked={isSelected} 
                            onChange={() => handleCertToggle(cert)} 
                            className="mt-1 text-brand-sage focus:ring-brand-sage rounded bg-brand-800 border-brand-700"
                          />
                          <div className="flex-1">
                            <span className="text-white text-sm font-medium">{cert.name}</span>
                            {cert.description && <p className="text-xs text-gray-500 mt-0.5">{cert.description}</p>}
                          </div>
                        </label>
                        
                        {isSelected && (cert.requires_number || cert.requires_expiration) && (
                          <div className="mt-3 pl-7 grid grid-cols-1 md:grid-cols-2 gap-3 animate-fade-in-down">
                            {cert.requires_number && (
                              <div>
                                <label className="block text-[10px] uppercase text-gray-500 font-bold mb-1">License / Cert #</label>
                                <input 
                                  type="text" 
                                  className="w-full bg-brand-800 border border-brand-700 rounded p-2 text-xs text-white" 
                                  placeholder="Enter number"
                                  value={selectedData.certification_number || ''}
                                  onChange={(e) => handleCertUpdate(cert.cert_id, 'certification_number', e.target.value)}
                                />
                              </div>
                            )}
                            {cert.requires_expiration && (
                              <div>
                                <label className="block text-[10px] uppercase text-gray-500 font-bold mb-1">Expiration Date</label>
                                <input 
                                  type="date" 
                                  className="w-full bg-brand-800 border border-brand-700 rounded p-2 text-xs text-white" 
                                  value={selectedData.expiration_date || ''}
                                  onChange={(e) => handleCertUpdate(cert.cert_id, 'expiration_date', e.target.value)}
                                />
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  const renderSection = () => {
    switch (activeSection) {
      case 1: 
        return (
          <div className="space-y-6 animate-fade-in-up">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div><InputLabel>First Name</InputLabel><InputField name="firstName" value={formData.firstName} onChange={handleChange} required /></div>
              <div><InputLabel>Last Name</InputLabel><InputField name="lastName" value={formData.lastName} onChange={handleChange} required /></div>
              <div><InputLabel>Date of Birth</InputLabel><InputField name="dob" type="date" value={formData.dob} onChange={handleChange} required /></div>
              <div className="md:col-span-2"><InputLabel>Address</InputLabel><InputField name="address" value={formData.address} onChange={handleChange} required /></div>
              <div><InputLabel>City</InputLabel><InputField name="city" value={formData.city} onChange={handleChange} required /></div>
              <div className="grid grid-cols-2 gap-4">
                 <div><InputLabel>State</InputLabel><InputField name="state" value={formData.state} onChange={handleChange} required /></div>
                 <div><InputLabel>Zip</InputLabel><InputField name="zip" value={formData.zip} onChange={handleChange} required /></div>
              </div>
              <div><InputLabel>Phone</InputLabel><InputField name="primaryPhone" value={formData.primaryPhone} onChange={handleChange} required /></div>
              <div><InputLabel>Driver's License</InputLabel><InputField name="dlNumber" value={formData.dlNumber} onChange={handleChange} required /></div>
              <div><InputLabel>SSN</InputLabel><InputField name="ssn" type="password" value={formData.ssn} onChange={handleChange} required /></div>
            </div>
          </div>
        );
      case 2: 
        return (
          <div className="space-y-6 animate-fade-in-up">
             <div className="bg-brand-800/30 p-4 rounded border border-brand-700 mb-6">
               <h4 className="text-white font-bold mb-2 text-sm">Select Your Qualifications</h4>
               <p className="text-gray-400 text-xs">Please select all certifications you currently hold. You will be required to upload proof later.</p>
             </div>
             
             {loadingCerts ? <div className="text-center p-8 text-gray-500">Loading certifications...</div> : renderCertifications()}
          </div>
        );
      case 3:
        return (
          <div className="space-y-6 animate-fade-in-up">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div><InputLabel>Years Experience</InputLabel><InputField name="yearsExperience" type="number" value={formData.yearsExperience} onChange={handleChange} /></div>
                <div className="md:col-span-2">
                    <label className="flex items-center space-x-2">
                        <input type="checkbox" name="isVeteran" checked={formData.isVeteran} onChange={handleChange} />
                        <span className="text-white">Military Veteran</span>
                    </label>
                </div>
                {formData.isVeteran && (
                    <div><InputLabel>Branch</InputLabel><InputField name="militaryBranch" value={formData.militaryBranch} onChange={handleChange} /></div>
                )}
             </div>
          </div>
        );
      case 4:
        return (
          <div className="space-y-6 animate-fade-in-up">
             <div>
                <InputLabel>Days Available</InputLabel>
                <div className="flex flex-wrap gap-2 mt-2">
                   {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
                      <label key={day} className="cursor-pointer px-4 py-2 rounded border border-brand-700 bg-brand-black text-gray-300">
                         <input type="checkbox" name="daysAvailable" value={day} checked={formData.daysAvailable?.includes(day)} onChange={handleChange} className="mr-2" />
                         {day}
                      </label>
                   ))}
                </div>
             </div>
             <div>
                <InputLabel>Shifts</InputLabel>
                <div className="flex flex-wrap gap-2 mt-2">
                   {['Day', 'Night', 'Swing'].map(s => (
                      <label key={s} className="cursor-pointer px-4 py-2 rounded border border-brand-700 bg-brand-black text-gray-300">
                         <input type="checkbox" name="shiftsPreferred" value={s} checked={formData.shiftsPreferred?.includes(s)} onChange={handleChange} className="mr-2" />
                         {s}
                      </label>
                   ))}
                </div>
             </div>
          </div>
        );
      case 5:
        return (
          <div className="text-center space-y-8 animate-fade-in-up py-8">
             <h3 className="text-2xl font-bold text-white">Submit Application</h3>
             <div className="flex gap-4 justify-center">
                <button onClick={handleStrictSubmit} className="px-8 py-3 bg-brand-sage text-black font-bold rounded hover:bg-brand-sage/90 shadow-lg">Submit</button>
             </div>
          </div>
        );
      default: return null;
    }
  };

  return (
    <div className="flex flex-col md:flex-row h-full min-h-[80vh] bg-brand-ebony rounded-xl border border-white/5 overflow-hidden shadow-2xl">
      <div className="w-full md:w-64 bg-brand-black border-r border-brand-800 flex flex-col p-4">
         {SECTIONS.map(s => (
             <button key={s.id} onClick={() => setActiveSection(s.id)} className={`text-left p-2 rounded mb-2 flex items-center ${activeSection === s.id ? 'bg-brand-sage text-black font-bold' : 'text-gray-400'}`}>
                 <s.icon className="w-4 h-4 mr-2" />
                 {s.title}
             </button>
         ))}
      </div>
      <div className="flex-1 overflow-y-auto p-6 md:p-8 relative">
         {renderSection()}
         <div className="mt-8 flex justify-between">
            {activeSection > 1 && <button onClick={() => setActiveSection(activeSection - 1)} className="text-gray-400 hover:text-white">Back</button>}
            {activeSection < 5 && <button onClick={() => setActiveSection(activeSection + 1)} className="bg-brand-sage text-black px-4 py-2 rounded font-bold hover:bg-brand-sage/90">Next</button>}
         </div>
      </div>
    </div>
  );
};

export default GuardApplicationForm;
