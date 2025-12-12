
import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, Save, User, Briefcase, GraduationCap, Star, 
  Building, Clock, Users, FileText, Search, CheckCircle, 
  Send, ChevronRight, Trash2, Plus, Info, Upload, Check
} from 'lucide-react';
import { SectionTitle, InputLabel, InputField, FileUpload } from '../common/FormElements';
import { supabase } from '../../services/supabase';

interface ManagementFormProps {
  user: any;
  onSubmit: (data: any) => void;
}

const SECTIONS = [
  { id: 1, title: 'Personal Info', icon: User },
  { id: 2, title: 'Experience', icon: Briefcase },
  { id: 3, title: 'Education', icon: GraduationCap },
  { id: 4, title: 'Skills', icon: Star },
  { id: 5, title: 'Company Fit', icon: Building },
  { id: 6, title: 'Availability', icon: Clock },
  { id: 7, title: 'References', icon: Users },
  { id: 8, title: 'Documents', icon: FileText },
  { id: 9, title: 'Background', icon: Search },
  { id: 10, title: 'Consent', icon: CheckCircle },
  { id: 11, title: 'Submit', icon: Send },
];

const ManagementApplicationForm: React.FC<ManagementFormProps> = ({ user, onSubmit }) => {
  const [activeSection, setActiveSection] = useState(1);
  const [formData, setFormData] = useState<any>({
    // 1. Personal Info
    fullName: user.user_metadata?.full_name || '',
    dob: '',
    address: '',
    phone: '',
    email: user.email || '',
    driverLicense: '',
    securityLicense: '',

    // 2. Professional Experience
    secExpYears: '',
    prevCompanies: '',
    rolesHeld: '',
    mgmtExpYears: '',
    adminExpDesc: '',
    
    adminMgmtExp: '',
    sysMgmtExp: '',
    officeMgmtExp: '',
    staffCoordExp: '',
    policyEnforceExp: '',

    leadershipRoles: '',
    leadershipTraining: '',
    mgmtCerts: '',
    achievements: '',

    // 3. Education
    highestEdu: '',
    degrees: '',
    profCerts: '',
    secCerts: '',
    adminTrainings: '',

    // 4. Skills
    skill_adminProc: '',
    skill_sysMgmt: '',
    skill_officeMgmt: '',
    skill_policy: '',
    skill_staff: '',
    skill_techSys: '',
    skill_data: '',
    skill_reporting: '',
    skill_techProf: '',
    skill_db: '',
    skill_comm: '',
    skill_problem: '',
    skill_decision: '',
    skill_leadership: '',
    skill_org: '',

    // 5. Company Understanding
    whyMgmt: '',
    ownershipUnderstanding: '',
    valueAlignment: '',
    contribution: '',
    companyKnowledge: '',
    modelUnderstanding: '',
    similarExp: '',

    // 6. Availability
    availType: 'Full-Time',
    willingMissions: 'Yes',
    commitmentLevel: '',
    geoLoc: '',
    travelWillingness: 'No',

    // 7. References
    references: [
      { name: '', phone: '', relationship: '' },
      { name: '', phone: '', relationship: '' },
      { name: '', phone: '', relationship: '' }
    ],

    // 9. Background
    criminalHistory: 'no',
    criminalExplanation: '',
    drugFreeAgree: false,
    bgCheckConsent: false,
    refCheckConsent: false,

    // 10. Acknowledgement
    ackOwnership: false,
    ackGuardTraining: false,
    ackMgmtTraining: false,
    ackRules: false,
    ackExpectations: false,
    digitalSig: '',
    sigDate: new Date().toISOString().split('T')[0]
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

  const handleArrayChange = (arrayName: string, index: number, field: string, value: string) => {
    setFormData((prev: any) => {
      const newArray = [...prev[arrayName]];
      newArray[index] = { ...newArray[index], [field]: value };
      return { ...prev, [arrayName]: newArray };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const payload = {
        user_id: user.id,
        position_type: 'Management',
        status: 'pending_review',
        years_security_exp: parseInt(formData.secExpYears) || 0,
        years_management_exp: parseInt(formData.mgmtExpYears) || 0,
        highest_education: formData.highestEdu,
        
        prev_companies: formData.prevCompanies,
        roles_held: formData.rolesHeld,
        achievements: formData.achievements,
        why_interested: formData.whyMgmt,
        
        skill_leadership: formData.skill_leadership,
        skill_communication: formData.skill_comm,
        skill_operations: formData.skill_sysMgmt,
        skill_technology: formData.skill_techProf,
        
        digital_signature: formData.digitalSig
    };

    const { data: appData, error: appError } = await supabase.from('staff_applications').insert(payload).select().single();
    if (appError) {
        alert("Error submitting application: " + appError.message);
        return;
    }

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

  const renderSkillRating = (label: string, name: string) => (
    <div className="mb-4 bg-brand-800/20 p-3 rounded border border-brand-800">
      <label className="block text-sm font-medium text-gray-300 mb-2">{label}</label>
      <div className="flex gap-4">
        {['Excellent', 'Good', 'Basic'].map((opt) => (
          <label key={opt} className="flex items-center space-x-2 cursor-pointer">
            <input 
              type="radio" 
              name={name} 
              value={opt} 
              checked={formData[name] === opt} 
              onChange={handleChange} 
              className="text-brand-sage focus:ring-brand-sage"
            />
            <span className="text-xs text-gray-400 uppercase font-bold">{opt}</span>
          </label>
        ))}
      </div>
    </div>
  );

  const renderSection = () => {
    switch (activeSection) {
      case 1: // Personal Info
        return (
          <div className="space-y-6 animate-fade-in-up">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2"><InputLabel>Full Legal Name</InputLabel><InputField name="fullName" value={formData.fullName} onChange={handleChange} required /></div>
              <div><InputLabel>Date of Birth</InputLabel><InputField name="dob" type="date" value={formData.dob} onChange={handleChange} required /></div>
              <div><InputLabel>Phone Number</InputLabel><InputField name="phone" type="tel" value={formData.phone} onChange={handleChange} required /></div>
              <div className="md:col-span-2"><InputLabel>Address</InputLabel><InputField name="address" value={formData.address} onChange={handleChange} required /></div>
              <div className="md:col-span-2"><InputLabel>Email Address</InputLabel><InputField name="email" value={formData.email} disabled className="bg-brand-900 text-gray-500" /></div>
              <div><InputLabel>Driver's License #</InputLabel><InputField name="driverLicense" value={formData.driverLicense} onChange={handleChange} required /></div>
              <div><InputLabel>State Security License # (If applicable)</InputLabel><InputField name="securityLicense" value={formData.securityLicense} onChange={handleChange} /></div>
            </div>
          </div>
        );
      case 2: // Experience
        return (
          <div className="space-y-8 animate-fade-in-up">
             <div>
                <h4 className="text-brand-sage font-bold uppercase text-sm border-b border-brand-800 pb-2 mb-4">Security Industry Experience</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div><InputLabel>Years in Security Industry</InputLabel><InputField name="secExpYears" type="number" value={formData.secExpYears} onChange={handleChange} /></div>
                    <div><InputLabel>Years in Mgmt/Admin Roles</InputLabel><InputField name="mgmtExpYears" type="number" value={formData.mgmtExpYears} onChange={handleChange} /></div>
                    <div className="md:col-span-2"><InputLabel>Previous Security Companies</InputLabel><textarea name="prevCompanies" value={formData.prevCompanies} onChange={handleChange} className="w-full bg-brand-800 border border-brand-700 rounded p-3 text-white h-20" /></div>
                    <div className="md:col-span-2"><InputLabel>Roles Held</InputLabel><InputField name="rolesHeld" value={formData.rolesHeld} onChange={handleChange} /></div>
                </div>
             </div>
          </div>
        );
      case 3: // Education
        return (
          <div className="space-y-6 animate-fade-in-up">
             <div><InputLabel>Highest Level of Education</InputLabel><select name="highestEdu" value={formData.highestEdu} onChange={handleChange} className="w-full bg-brand-800 border border-brand-700 rounded p-3 text-white"><option value="">Select</option><option>High School</option><option>Associate Degree</option><option>Bachelor's Degree</option><option>Master's Degree</option><option>Doctorate</option></select></div>
             <div><InputLabel>Professional Certifications</InputLabel><textarea name="profCerts" value={formData.profCerts} onChange={handleChange} className="w-full bg-brand-800 border border-brand-700 rounded p-3 text-white h-24" placeholder="e.g. PMP, CPP, etc." /></div>
          </div>
        );
      case 4: // Skills
        return (
          <div className="space-y-8 animate-fade-in-up">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6">
                {renderSkillRating('System Management', 'skill_sysMgmt')}
                {renderSkillRating('Communication', 'skill_comm')}
                {renderSkillRating('Leadership', 'skill_leadership')}
                {renderSkillRating('Technology Proficiency', 'skill_techProf')}
             </div>
          </div>
        );
      case 5: // Company Fit
        return (
          <div className="space-y-6 animate-fade-in-up">
             <div><InputLabel>Why are you interested in a Management position? *</InputLabel><textarea name="whyMgmt" value={formData.whyMgmt} onChange={handleChange} className="w-full bg-brand-800 border border-brand-700 rounded p-3 text-white h-32" required /></div>
          </div>
        );
      case 6: // Availability
        return (
          <div className="space-y-6 animate-fade-in-up">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <InputLabel>Availability *</InputLabel>
                    <div className="flex gap-4 mt-2">
                        <label className="flex items-center space-x-2"><input type="radio" name="availType" value="Full-Time" checked={formData.availType === 'Full-Time'} onChange={handleChange} /> <span>Full-Time</span></label>
                        <label className="flex items-center space-x-2"><input type="radio" name="availType" value="Part-Time" checked={formData.availType === 'Part-Time'} onChange={handleChange} /> <span>Part-Time</span></label>
                    </div>
                </div>
             </div>
          </div>
        );
      case 7: // References
        return (
          <div className="space-y-6 animate-fade-in-up">
             <p className="text-sm text-gray-400 mb-4">Please provide 3 professional references.</p>
             {formData.references.map((ref: any, idx: number) => (
                <div key={idx} className="bg-brand-800/30 p-4 rounded border border-brand-700 relative">
                   <h5 className="font-bold text-white mb-3">Reference {idx + 1}</h5>
                   <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div><InputLabel>Name</InputLabel><InputField value={ref.name} onChange={e => handleArrayChange('references', idx, 'name', e.target.value)} required /></div>
                      <div><InputLabel>Phone</InputLabel><InputField value={ref.phone} onChange={e => handleArrayChange('references', idx, 'phone', e.target.value)} required /></div>
                      <div><InputLabel>Relationship</InputLabel><InputField value={ref.relationship} onChange={e => handleArrayChange('references', idx, 'relationship', e.target.value)} required /></div>
                   </div>
                </div>
             ))}
          </div>
        );
      case 8: // Documents
        return (
          <div className="space-y-6 animate-fade-in-up">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <div><InputLabel>Resume / CV *</InputLabel><FileUpload label="Resume" /></div>
                 <div><InputLabel>Cover Letter</InputLabel><FileUpload label="Cover Letter" /></div>
             </div>
          </div>
        );
      case 9: // Background
        return (
          <div className="space-y-6 animate-fade-in-up">
             <div className="space-y-4">
                <label className="flex items-center space-x-3 bg-brand-800/20 p-3 rounded border border-brand-800 cursor-pointer">
                    <input type="checkbox" name="bgCheckConsent" checked={formData.bgCheckConsent} onChange={handleChange} className="text-brand-sage" required />
                    <span className="text-sm text-gray-300">I authorize Signature Security Specialist to perform a background check. *</span>
                </label>
             </div>
          </div>
        );
      case 10: // Consent
        return (
          <div className="space-y-6 animate-fade-in-up">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-brand-800">
                <div className="md:col-span-2"><InputLabel>Digital Signature (Full Name) *</InputLabel><InputField name="digitalSig" value={formData.digitalSig} onChange={handleChange} required placeholder="Type full name to sign" /></div>
                <div><InputLabel>Date *</InputLabel><InputField name="sigDate" type="date" value={formData.sigDate} onChange={handleChange} required /></div>
             </div>
          </div>
        );
      case 11: // Submit
        return (
          <div className="text-center space-y-8 animate-fade-in-up py-8">
             <h3 className="text-2xl font-bold text-white">Application Ready</h3>
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
               </button>
            ))}
         </div>
      </div>
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
               {activeSection < 11 && (
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

export default ManagementApplicationForm;
