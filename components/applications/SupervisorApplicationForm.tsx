
import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, Save, User, Shield, Briefcase, Clock, 
  MapPin, Users, CheckCircle, Send, ChevronRight, 
  Trash2, Plus, FileText, Star, AlertCircle, Info, Loader,
  ChevronDown, ChevronUp
} from 'lucide-react';
import { SectionTitle, InputLabel, InputField, FileUpload } from '../common/FormElements';
import { supabase } from '../../services/supabase';
import { CertificationType } from '../../types';

interface SupervisorFormProps {
  user: any;
  onSubmit: (data: any) => void;
}

const SECTIONS = [
  { id: 1, title: 'Personal Info', icon: User },
  { id: 2, title: 'Guard Experience', icon: Shield },
  { id: 3, title: 'Supervisory Exp', icon: Star },
  { id: 4, title: 'Availability', icon: Clock },
  { id: 5, title: 'Team Assignment', icon: MapPin },
  { id: 6, title: 'References', icon: Users },
  { id: 7, title: 'Consent', icon: FileText },
  { id: 8, title: 'Submit', icon: Send },
];

interface SelectedCert {
  cert_id: string;
  certification_number?: string;
  expiration_date?: string;
}

const SupervisorApplicationForm: React.FC<SupervisorFormProps> = ({ user, onSubmit }) => {
  const [activeSection, setActiveSection] = useState(1);
  const [certTypes, setCertTypes] = useState<CertificationType[]>([]);
  const [loadingCerts, setLoadingCerts] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState<string[]>([]);

  const [formData, setFormData] = useState<any>({
    // Section 1: Personal Info
    fullName: user.user_metadata?.full_name || '',
    dob: '',
    address: '',
    phone: '',
    email: user.email || '',
    driverLicense: '',
    securityLicense: '',
    selectedCerts: [] as SelectedCert[],

    // Section 2: Guard Experience
    currentGuardLevel: '',
    yearsExperience: '',
    missionTypes: '',
    trainingModules: '',
    prevLeadership: '',
    achievements: '',

    // Section 3: Supervisory Experience
    hasSupervised: 'no',
    supOrganization: '',
    supDuration: '',
    supResponsibilities: '',
    leadershipTraining: '',

    // Section 4: Availability
    prefDays: [],
    prefShifts: [],
    locationPref: '',
    maxTravelDist: '',

    // Section 5: Team
    teamCode: '',

    // Section 6: References
    references: [
      { name: '', phone: '', relationship: '' },
      { name: '', phone: '', relationship: '' }
    ],

    // Section 7: Consent
    agreeRules: false,
    ackTraining: false,
    digitalSig: '',
    sigDate: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    const fetchCerts = async () => {
      setLoadingCerts(true);
      const { data } = await supabase.from('certification_types').select('*').eq('is_active', true).order('sort_order');
      if (data) {
        setCertTypes(data as CertificationType[]);
        setExpandedCategories(['DEFENSIVE_TACTICAL', 'CORE_BSIS']); // Expand defaults relevant to supervisors
      }
      setLoadingCerts(false);
    };
    fetchCerts();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
        const checked = (e.target as HTMLInputElement).checked;
        if (Array.isArray(formData[name])) {
            setFormData((prev: any) => {
                const currentArr = prev[name];
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

  const handleArrayChange = (arrayName: string, index: number, field: string, value: string) => {
    setFormData((prev: any) => {
      const newArray = [...prev[arrayName]];
      newArray[index] = { ...newArray[index], [field]: value };
      return { ...prev, [arrayName]: newArray };
    });
  };

  const addItem = (arrayName: string, template: any) => {
    setFormData((prev: any) => ({ ...prev, [arrayName]: [...prev[arrayName], template] }));
  };

  const removeItem = (arrayName: string, index: number) => {
    setFormData((prev: any) => ({ ...prev, [arrayName]: prev[arrayName].filter((_: any, i: number) => i !== index) }));
  };

  // Cert Handlers
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

  const handleSubmit = async () => {
    const payload = {
        user_id: user.id,
        position_type: 'Supervisor',
        status: 'pending_review',
        years_security_exp: parseInt(formData.yearsExperience) || 0,
        years_management_exp: parseInt(formData.supDuration) || 0,
        highest_education: 'N/A', 
        
        // Mapping rich text fields
        prev_companies: formData.supOrganization,
        roles_held: formData.supResponsibilities,
        achievements: formData.achievements,
        
        // Store certs
        certifications: formData.selectedCerts,

        // Consent
        digital_signature: formData.digitalSig
    };

    // 1. Submit Application
    const { data: appData, error: appError } = await supabase.from('staff_applications').insert(payload).select().single();
    if (appError) {
        alert("Error submitting application: " + appError.message);
        return;
    }

    // 2. Submit References
    if (appData) {
        const refs = formData.references.map((r: any) => ({
            application_id: appData.id,
            application_type: 'staff',
            name: r.name,
            phone: r.phone,
            relationship: r.relationship
        }));
        await supabase.from('application_references').insert(refs);
    }

    onSubmit(formData);
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
      case 1: // Personal Info
        return (
          <div className="space-y-6 animate-fade-in-up">
            <div className="bg-brand-900/50 p-4 rounded-lg border border-brand-800 mb-6">
                <h4 className="text-brand-sage font-bold text-sm uppercase mb-2">Purpose</h4>
                <p className="text-gray-300 text-sm leading-relaxed">
                    This application is for active guards seeking promotion to Supervisor within Signature Security Specialist (SSS). Supervisors oversee guard operations, conduct spot checks, and assist in training management.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2"><InputLabel>Full Name</InputLabel><InputField name="fullName" value={formData.fullName} onChange={handleChange} required /></div>
              <div><InputLabel>Date of Birth</InputLabel><InputField name="dob" type="date" value={formData.dob} onChange={handleChange} required /></div>
              <div><InputLabel>Phone Number</InputLabel><InputField name="phone" type="tel" value={formData.phone} onChange={handleChange} required /></div>
              <div className="md:col-span-2"><InputLabel>Address</InputLabel><InputField name="address" value={formData.address} onChange={handleChange} required /></div>
              <div className="md:col-span-2"><InputLabel>Email Address</InputLabel><InputField name="email" value={formData.email} disabled className="bg-brand-900 text-gray-500" /></div>
              <div><InputLabel>Driver's License Number</InputLabel><InputField name="driverLicense" value={formData.driverLicense} onChange={handleChange} required /></div>
              <div><InputLabel>State Security License Number</InputLabel><InputField name="securityLicense" value={formData.securityLicense} onChange={handleChange} required /></div>
              <div className="md:col-span-2 bg-brand-800/20 p-4 rounded border border-brand-800">
                  <h4 className="text-white font-bold text-sm mb-3">Certifications</h4>
                  {loadingCerts ? <div className="text-gray-500 text-sm">Loading certifications...</div> : renderCertifications()}
              </div>
            </div>
          </div>
        );
      case 2: // Guard Experience
        return (
          <div className="space-y-6 animate-fade-in-up">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <InputLabel>Current Guard Level (1-5)</InputLabel>
                    <select name="currentGuardLevel" value={formData.currentGuardLevel} onChange={handleChange} className="w-full bg-brand-800 border border-brand-700 rounded p-3 text-white focus:border-brand-sage outline-none">
                        <option value="">Select Level</option>
                        <option value="1">Level 1 (Basic)</option>
                        <option value="2">Level 2 (Standard)</option>
                        <option value="3">Level 3 (Advanced)</option>
                        <option value="4">Level 4 (Specialized)</option>
                        <option value="5">Level 5 (Armed)</option>
                    </select>
                </div>
                <div><InputLabel>Years of Experience with SSS</InputLabel><InputField name="yearsExperience" type="number" value={formData.yearsExperience} onChange={handleChange} /></div>
                <div className="md:col-span-2"><InputLabel>Completed Mission Types</InputLabel><InputField name="missionTypes" value={formData.missionTypes} onChange={handleChange} placeholder="e.g. Event Security, Patrol, Retail" /></div>
                <div className="md:col-span-2"><InputLabel>Training Modules Completed</InputLabel><textarea name="trainingModules" value={formData.trainingModules} onChange={handleChange} className="w-full bg-brand-800 border border-brand-700 rounded p-3 text-white h-20" placeholder="List key modules completed" /></div>
                <div className="md:col-span-2"><InputLabel>Previous Leadership Roles (if any)</InputLabel><textarea name="prevLeadership" value={formData.prevLeadership} onChange={handleChange} className="w-full bg-brand-800 border border-brand-700 rounded p-3 text-white h-20" placeholder="e.g. Lead Guard for Event X" /></div>
                <div className="md:col-span-2"><InputLabel>Notable Mission Achievements</InputLabel><textarea name="achievements" value={formData.achievements} onChange={handleChange} className="w-full bg-brand-800 border border-brand-700 rounded p-3 text-white h-20" /></div>
             </div>
          </div>
        );
      case 3: // Supervisory Experience
        return (
          <div className="space-y-6 animate-fade-in-up">
             <div className="bg-brand-800/30 p-4 rounded border border-brand-700">
                <InputLabel>Have you supervised guards or teams before?</InputLabel>
                <div className="flex gap-4 mt-2">
                   <label className="flex items-center space-x-2 cursor-pointer"><input type="radio" name="hasSupervised" value="yes" checked={formData.hasSupervised === 'yes'} onChange={handleChange} className="text-brand-sage" /> <span>Yes</span></label>
                   <label className="flex items-center space-x-2 cursor-pointer"><input type="radio" name="hasSupervised" value="no" checked={formData.hasSupervised === 'no'} onChange={handleChange} className="text-brand-sage" /> <span>No</span></label>
                </div>
             </div>
             {formData.hasSupervised === 'yes' && (
                 <div className="space-y-4 pl-4 border-l-2 border-brand-sage">
                    <div><InputLabel>Organization/Company</InputLabel><InputField name="supOrganization" value={formData.supOrganization} onChange={handleChange} /></div>
                    <div><InputLabel>Duration</InputLabel><InputField name="supDuration" value={formData.supDuration} onChange={handleChange} placeholder="e.g. 2 years" /></div>
                    <div><InputLabel>Responsibilities</InputLabel><textarea name="supResponsibilities" value={formData.supResponsibilities} onChange={handleChange} className="w-full bg-brand-800 border border-brand-700 rounded p-3 text-white h-24" placeholder="Describe your duties..." /></div>
                 </div>
             )}
             <div>
                 <InputLabel>Leadership Certifications or Training Completed</InputLabel>
                 <textarea name="leadershipTraining" value={formData.leadershipTraining} onChange={handleChange} className="w-full bg-brand-800 border border-brand-700 rounded p-3 text-white h-20" placeholder="List any relevant certificates" />
             </div>
          </div>
        );
      case 4: // Availability
        return (
          <div className="space-y-6 animate-fade-in-up">
             <div>
                <InputLabel>Preferred Days to Work</InputLabel>
                <div className="flex flex-wrap gap-2 mt-2">
                   {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
                      <label key={day} className={`cursor-pointer px-4 py-2 rounded border transition-all ${formData.prefDays.includes(day) ? 'bg-brand-sage text-black border-brand-sage' : 'bg-brand-black border-brand-700 text-gray-400 hover:border-gray-500'}`}>
                         <input type="checkbox" name="prefDays" value={day} checked={formData.prefDays.includes(day)} onChange={handleChange} className="hidden" />
                         {day}
                      </label>
                   ))}
                </div>
             </div>
             <div>
                <InputLabel>Preferred Shifts</InputLabel>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-2">
                   {['Day', 'Night', 'Weekend'].map(shift => (
                      <label key={shift} className="flex items-center space-x-2 cursor-pointer bg-brand-800/30 p-3 rounded border border-brand-700">
                         <input type="checkbox" name="prefShifts" value={shift} checked={formData.prefShifts.includes(shift)} onChange={handleChange} className="text-brand-sage" />
                         <span className="text-sm text-gray-300">{shift}</span>
                      </label>
                   ))}
                </div>
             </div>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div><InputLabel>Location Preference</InputLabel><InputField name="locationPref" value={formData.locationPref} onChange={handleChange} placeholder="City or Region" /></div>
                <div><InputLabel>Maximum Travel Distance</InputLabel><InputField name="maxTravelDist" value={formData.maxTravelDist} onChange={handleChange} placeholder="e.g. 50 miles" /></div>
             </div>
          </div>
        );
      case 5: // Team
        return (
          <div className="space-y-6 animate-fade-in-up">
             <div className="bg-brand-black/30 p-6 rounded border border-brand-700 text-center">
                <MapPin className="w-12 h-12 text-brand-sage mx-auto mb-4" />
                <h4 className="text-xl font-bold text-white mb-2">Team Assignment</h4>
                <div className="max-w-xs mx-auto mb-4">
                   <InputLabel>Operations Team Code</InputLabel>
                   <InputField name="teamCode" value={formData.teamCode} onChange={handleChange} placeholder="Optional" className="text-center font-mono tracking-widest text-lg" />
                </div>
                <div className="text-xs text-gray-400 bg-brand-900/50 p-3 rounded flex items-start text-left">
                    <AlertCircle className="w-4 h-4 mr-2 flex-shrink-0 text-brand-sage" />
                    <span>If you have a team code from a business card or recruiter, enter it here. If no code is provided, owners will assign you to an operations team. If you're already a guard, you maintain your current assignment unless promoted to a new region.</span>
                </div>
             </div>
          </div>
        );
      case 6: // References
        return (
          <div className="space-y-6 animate-fade-in-up">
             <p className="text-sm text-gray-400">Please provide 2 professional references.</p>
             {formData.references.map((ref: any, idx: number) => (
                <div key={idx} className="bg-brand-800/30 p-4 rounded border border-brand-700 relative">
                   <h5 className="font-bold text-white mb-3">Reference {idx + 1}</h5>
                   {idx > 1 && <button type="button" onClick={() => removeItem('references', idx)} className="absolute top-4 right-4 text-red-400"><Trash2 size={16} /></button>}
                   <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div><InputLabel>Name</InputLabel><InputField value={ref.name} onChange={e => handleArrayChange('references', idx, 'name', e.target.value)} required /></div>
                      <div><InputLabel>Phone</InputLabel><InputField value={ref.phone} onChange={e => handleArrayChange('references', idx, 'phone', e.target.value)} required /></div>
                      <div><InputLabel>Relationship</InputLabel><InputField value={ref.relationship} onChange={e => handleArrayChange('references', idx, 'relationship', e.target.value)} required /></div>
                   </div>
                </div>
             ))}
             <button type="button" onClick={() => addItem('references', { name: '', phone: '', relationship: '' })} className="w-full py-2 border border-dashed border-brand-700 text-brand-sage hover:text-white rounded font-bold text-sm flex items-center justify-center"><Plus className="w-4 h-4 mr-2" /> Add Reference</button>
             <div className="mt-4">
                <InputLabel>Optional Reference Letter Upload</InputLabel>
                <FileUpload label="Reference Letter" />
             </div>
          </div>
        );
      case 7: // Consent
        return (
          <div className="space-y-6 animate-fade-in-up">
             <div className="bg-brand-800/30 p-6 rounded border border-brand-700 space-y-4">
                <label className="flex items-start space-x-3 cursor-pointer">
                   <input type="checkbox" name="agreeRules" checked={formData.agreeRules} onChange={handleChange} className="mt-1 text-brand-sage" required />
                   <span className="text-sm text-gray-300">I have read and agree to abide by all company rules, policies, and procedures. *</span>
                </label>
                <label className="flex items-start space-x-3 cursor-pointer">
                   <input type="checkbox" name="ackTraining" checked={formData.ackTraining} onChange={handleChange} className="mt-1 text-brand-sage" required />
                   <span className="text-sm text-gray-300">I acknowledge that additional training is required before supervisor account activation. *</span>
                </label>
             </div>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-brand-800">
                <div className="md:col-span-2"><InputLabel>Digital Signature (Full Name) *</InputLabel><InputField name="digitalSig" value={formData.digitalSig} onChange={handleChange} required placeholder="Type full name to sign" /></div>
                <div><InputLabel>Date *</InputLabel><InputField name="sigDate" type="date" value={formData.sigDate} onChange={handleChange} required /></div>
             </div>
          </div>
        );
      case 8: // Submit
        return (
          <div className="text-center space-y-8 animate-fade-in-up py-8">
             <div className="w-24 h-24 bg-brand-sage/20 rounded-full flex items-center justify-center mx-auto mb-4 border border-brand-sage/50">
                <CheckCircle className="w-12 h-12 text-brand-sage" />
             </div>
             <h3 className="text-2xl font-bold text-white">Application Ready</h3>
             <p className="text-gray-400 max-w-md mx-auto">Please review your information carefully. Supervisor roles require a thorough vetting process.</p>
             
             <div className="bg-brand-900/50 p-6 rounded-xl border border-brand-800 text-left max-w-lg mx-auto space-y-2">
                <div className="flex justify-between text-sm"><span className="text-gray-500">Applicant:</span> <span className="text-white">{formData.fullName}</span></div>
                <div className="flex justify-between text-sm"><span className="text-gray-500">Current Level:</span> <span className="text-white">Level {formData.currentGuardLevel || 'N/A'}</span></div>
                <div className="flex justify-between text-sm"><span className="text-gray-500">Exp:</span> <span className="text-white">{formData.yearsExperience || '0'} Years</span></div>
             </div>

             <div className="flex gap-4 justify-center">
                <button onClick={() => setActiveSection(1)} className="px-6 py-3 border border-brand-700 text-gray-300 rounded hover:bg-brand-800 transition-colors">Review</button>
                <button onClick={handleSubmit} className="px-8 py-3 bg-brand-sage text-black font-bold rounded hover:bg-brand-sage/90 shadow-lg transition-all transform hover:-translate-y-1">Submit Application</button>
             </div>
          </div>
        );
      default: return null;
    }
  };

  return (
    <div className="flex flex-col md:flex-row h-full min-h-[80vh] bg-brand-ebony rounded-xl border border-white/5 overflow-hidden shadow-2xl">
      
      {/* Sidebar */}
      <div className="w-full md:w-64 bg-brand-black border-r border-brand-800 flex flex-col">
         <div className="p-4 border-b border-brand-800 flex items-center">
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
                  {activeSection > section.id && <div className="w-2 h-2 bg-green-500 rounded-full"></div>}
               </button>
            ))}
         </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
         <div className="p-6 border-b border-brand-800 bg-brand-900/50 flex justify-between items-center sticky top-0 z-10 backdrop-blur-md">
            <div>
               <h3 className="text-xl font-bold text-white">{SECTIONS[activeSection - 1].title}</h3>
               <p className="text-xs text-gray-500">Step {activeSection} of {SECTIONS.length}</p>
            </div>
            <div className="flex gap-3">
               {activeSection > 1 && (
                  <button onClick={() => setActiveSection(activeSection - 1)} className="px-4 py-2 bg-brand-black border border-brand-700 text-white rounded text-sm hover:bg-brand-800">Back</button>
               )}
               {activeSection < 8 && (
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

export default SupervisorApplicationForm;
