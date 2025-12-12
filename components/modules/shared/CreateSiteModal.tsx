
import React, { useState, useEffect } from 'react';
import { 
  MapPin, Building, Lock, FileText, CheckCircle, X, 
  ArrowRight, ArrowLeft, Save, Plus, Trash2, Shield, Settings,
  Users
} from 'lucide-react';
import { supabase } from '../../../services/supabase';
import { InputLabel, InputField } from '../../common/FormElements';

interface CreateSiteModalProps {
  onClose: () => void;
  onSuccess: () => void;
  currentUserRole: string;
  currentUserId: string;
  preSelectedClientId?: string;
}

const STEPS = [
  { id: 1, title: 'Basics', icon: Building },
  { id: 2, title: 'Location', icon: MapPin },
  { id: 3, title: 'Access & Info', icon: Lock },
  { id: 4, title: 'Posts', icon: Shield },
  { id: 5, title: 'Assignment', icon: Users },
  { id: 6, title: 'Review', icon: CheckCircle },
];

interface PostDraft {
  name: string;
  instructions: string;
  requiredLevel: string;
}

const CreateSiteModal: React.FC<CreateSiteModalProps> = ({ 
  onClose, 
  onSuccess, 
  currentUserRole, 
  currentUserId,
  preSelectedClientId 
}) => {
  const [activeStep, setActiveStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [clients, setClients] = useState<any[]>([]);
  const [teams, setTeams] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    // Basics
    name: '',
    clientId: preSelectedClientId || '',
    type: 'Office Building',
    description: '',
    
    // Location
    address: '',
    city: '',
    state: '',
    zip: '',
    country: 'United States',
    
    // Access
    accessInstructions: '',
    gateCodes: '',
    keyLocation: '',
    securityLevel: 'Medium',
    
    // Assignment
    teamId: '',
    status: 'active'
  });

  const [posts, setPosts] = useState<PostDraft[]>([]);

  // Permissions
  const isClient = currentUserRole === 'Client';
  const isOps = currentUserRole.includes('Operations');
  const isOwner = currentUserRole === 'Owner' || currentUserRole === 'Management';

  // Initialization
  useEffect(() => {
    const initData = async () => {
      // 1. Set Client Context
      if (isClient) {
        setFormData(prev => ({ ...prev, clientId: currentUserId }));
      } else if (!preSelectedClientId) {
        // Fetch clients for dropdown
        let query = supabase.from('clients').select('id, business_name');
        
        // If Ops, filter to clients in their team (assuming user profile has team_id)
        if (isOps) {
           const { data: profile } = await supabase.from('profiles').select('team_id').eq('id', currentUserId).single();
           if (profile?.team_id) {
               // First get clients associated with this team
               // Note: This assumes clients have a team_id. If linked via profile, we need a join.
               // Simplified: fetching all active clients for now, relying on backend RLS or filter logic in real app
               query = query.eq('status', 'active'); 
           }
        }
        
        const { data: clientData } = await query;
        setClients(clientData || []);
      }

      // 2. Set Team Context
      if (isClient) {
         // Auto-fetch client's assigned team
         const { data: profile } = await supabase.from('profiles').select('team_id').eq('id', currentUserId).single();
         if (profile?.team_id) setFormData(prev => ({ ...prev, teamId: profile.team_id }));
      } else if (isOps) {
         // Auto-set Ops user's team
         const { data: profile } = await supabase.from('profiles').select('team_id').eq('id', currentUserId).single();
         if (profile?.team_id) setFormData(prev => ({ ...prev, teamId: profile.team_id }));
      } else {
         // Owner/Mgmt fetch all teams
         const { data: teamData } = await supabase.from('teams').select('id, name, code');
         setTeams(teamData || []);
      }
    };
    initData();
  }, [currentUserRole, currentUserId, preSelectedClientId, isClient, isOps]);

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError(null);
  };

  // Post Management
  const addPost = () => {
    setPosts([...posts, { name: '', instructions: '', requiredLevel: '1' }]);
  };

  const removePost = (index: number) => {
    setPosts(posts.filter((_, i) => i !== index));
  };

  const updatePost = (index: number, field: keyof PostDraft, value: string) => {
    const newPosts = [...posts];
    newPosts[index] = { ...newPosts[index], [field]: value };
    setPosts(newPosts);
  };

  // Validation
  const validateStep = (step: number) => {
    setError(null);
    switch(step) {
      case 1: 
        if (!formData.name) { setError("Site Name is required."); return false; }
        if (!formData.clientId) { setError("Client must be selected."); return false; }
        return true;
      case 2:
        if (!formData.address || !formData.city || !formData.state || !formData.zip) {
            setError("Full address is required.");
            return false;
        }
        return true;
      case 5:
        if (!formData.teamId && !isClient) { setError("Team assignment is required."); return false; }
        return true;
      default: return true;
    }
  };

  const handleNext = () => {
    if (validateStep(activeStep)) {
      setActiveStep(prev => Math.min(prev + 1, 6));
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      // 1. Create Site
      const { data: siteData, error: siteError } = await supabase.from('sites').insert({
        client_id: formData.clientId,
        team_id: formData.teamId || null, // Handle null for clients without team yet
        name: formData.name,
        type: formData.type,
        status: formData.status,
        address: `${formData.address}, ${formData.city}, ${formData.state} ${formData.zip}`,
        access_info: [
            { id: '1', type: 'Procedure', label: 'Access Instructions', value: formData.accessInstructions || 'None', lastUpdated: new Date().toLocaleDateString() },
            { id: '2', type: 'Code', label: 'Gate Code', value: formData.gateCodes || 'N/A', lastUpdated: new Date().toLocaleDateString() },
            { id: '3', type: 'Key', label: 'Key Location', value: formData.keyLocation || 'N/A', lastUpdated: new Date().toLocaleDateString() }
        ],
        // Adding specific fields to metadata if column doesn't exist in base schema provided earlier
        // Ideally schema has these columns, using fallback for demo compatibility
      }).select().single();

      if (siteError) throw siteError;

      // 2. Create Posts
      if (posts.length > 0 && siteData) {
        const postsPayload = posts.map(p => ({
            site_id: siteData.id,
            name: p.name,
            instructions: p.instructions,
            required_level: parseInt(p.requiredLevel) || 1,
            status: 'active'
        }));
        
        const { error: postError } = await supabase.from('site_posts').insert(postsPayload);
        if (postError) throw postError;
      }

      // 3. Audit Log
      await supabase.from('profile_logs').insert({
        profile_id: currentUserId,
        action: 'CREATE_SITE',
        performed_by: currentUserRole,
        role: currentUserRole,
        note: `Created site: ${formData.name}`
      });

      alert("Site created successfully.");
      onSuccess();
      onClose();

    } catch (e: any) {
      console.error(e);
      alert("Error creating site: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  const renderStep = () => {
    switch(activeStep) {
      case 1: return (
        <div className="space-y-6 animate-fade-in-up">
          <h3 className="text-xl font-bold text-white mb-2">Site Basics</h3>
          
          <div><InputLabel>Site Name *</InputLabel><InputField value={formData.name} onChange={e => handleChange('name', e.target.value)} placeholder="e.g. Main HQ" /></div>
          
          {!isClient && !preSelectedClientId && (
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

          <div>
              <InputLabel>Site Type *</InputLabel>
              <select 
                className="w-full bg-brand-black border border-brand-800 rounded p-3 text-white focus:outline-none"
                value={formData.type}
                onChange={e => handleChange('type', e.target.value)}
              >
                  <option>Office Building</option><option>Warehouse</option><option>Retail Store</option><option>Residential</option><option>Industrial</option><option>Construction</option><option>Event Venue</option>
              </select>
          </div>

          <div><InputLabel>Description</InputLabel><textarea className="w-full bg-brand-black border border-brand-800 rounded p-3 text-white h-24 focus:border-brand-sage outline-none" value={formData.description} onChange={e => handleChange('description', e.target.value)} /></div>
        </div>
      );
      case 2: return (
        <div className="space-y-6 animate-fade-in-up">
          <h3 className="text-xl font-bold text-white mb-2">Location</h3>
          <div><InputLabel>Street Address *</InputLabel><InputField value={formData.address} onChange={e => handleChange('address', e.target.value)} /></div>
          <div className="grid grid-cols-2 gap-4">
             <div><InputLabel>City *</InputLabel><InputField value={formData.city} onChange={e => handleChange('city', e.target.value)} /></div>
             <div><InputLabel>State *</InputLabel><InputField value={formData.state} onChange={e => handleChange('state', e.target.value)} /></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
             <div><InputLabel>Zip Code *</InputLabel><InputField value={formData.zip} onChange={e => handleChange('zip', e.target.value)} /></div>
             <div><InputLabel>Country</InputLabel><InputField value={formData.country} disabled /></div>
          </div>
        </div>
      );
      case 3: return (
        <div className="space-y-6 animate-fade-in-up">
          <h3 className="text-xl font-bold text-white mb-2">Access & Security</h3>
          <div><InputLabel>Access Instructions</InputLabel><textarea className="w-full bg-brand-black border border-brand-800 rounded p-3 text-white h-24 focus:border-brand-sage outline-none" value={formData.accessInstructions} onChange={e => handleChange('accessInstructions', e.target.value)} placeholder="How do guards enter the site?" /></div>
          <div className="grid grid-cols-2 gap-4">
             <div><InputLabel>Gate/Alarm Codes</InputLabel><InputField type="text" value={formData.gateCodes} onChange={e => handleChange('gateCodes', e.target.value)} placeholder="Stored Securely" /></div>
             <div><InputLabel>Key Location</InputLabel><InputField type="text" value={formData.keyLocation} onChange={e => handleChange('keyLocation', e.target.value)} placeholder="e.g. Lockbox #1" /></div>
          </div>
          <div>
              <InputLabel>Security Level</InputLabel>
              <select className="w-full bg-brand-black border border-brand-800 rounded p-3 text-white focus:outline-none" value={formData.securityLevel} onChange={e => handleChange('securityLevel', e.target.value)}>
                  <option>Low</option><option>Medium</option><option>High</option><option>Maximum</option>
              </select>
          </div>
        </div>
      );
      case 4: return (
        <div className="space-y-6 animate-fade-in-up">
          <div className="flex justify-between items-center mb-2">
             <h3 className="text-xl font-bold text-white">Site Posts</h3>
             <button onClick={addPost} className="text-xs bg-brand-sage text-black px-3 py-1 rounded font-bold hover:bg-brand-sage/90 flex items-center"><Plus size={14} className="mr-1" /> Add Post</button>
          </div>
          
          {posts.length === 0 ? (
              <div className="p-8 text-center border-2 border-dashed border-brand-800 rounded-xl text-gray-500">
                  <Shield className="w-12 h-12 mx-auto mb-2 opacity-20" />
                  <p>No posts configured. Guards will report to general site.</p>
              </div>
          ) : (
              <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
                  {posts.map((post, idx) => (
                      <div key={idx} className="bg-brand-black border border-brand-800 p-4 rounded-lg relative group">
                          <button onClick={() => removePost(idx)} className="absolute top-2 right-2 text-gray-500 hover:text-red-400"><Trash2 size={16} /></button>
                          <div className="grid grid-cols-2 gap-4 mb-2">
                              <div><InputLabel>Post Name</InputLabel><input className="w-full bg-brand-ebony border border-brand-700 rounded p-2 text-white text-sm" value={post.name} onChange={e => updatePost(idx, 'name', e.target.value)} placeholder="e.g. Front Gate" /></div>
                              <div>
                                  <InputLabel>Min Level</InputLabel>
                                  <select className="w-full bg-brand-ebony border border-brand-700 rounded p-2 text-white text-sm" value={post.requiredLevel} onChange={e => updatePost(idx, 'requiredLevel', e.target.value)}>
                                      <option value="1">Level 1</option><option value="2">Level 2</option><option value="3">Level 3</option>
                                  </select>
                              </div>
                          </div>
                          <div><InputLabel>Instructions</InputLabel><input className="w-full bg-brand-ebony border border-brand-700 rounded p-2 text-white text-sm" value={post.instructions} onChange={e => updatePost(idx, 'instructions', e.target.value)} placeholder="Specific duties..." /></div>
                      </div>
                  ))}
              </div>
          )}
        </div>
      );
      case 5: return (
        <div className="space-y-6 animate-fade-in-up">
          <h3 className="text-xl font-bold text-white mb-2">Assignment & Status</h3>
          
          <div>
              <InputLabel>Responsible Team *</InputLabel>
              <select 
                className="w-full bg-brand-black border border-brand-800 rounded p-3 text-white focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                value={formData.teamId}
                onChange={e => handleChange('teamId', e.target.value)}
                disabled={isClient || isOps} // Locked for these roles as they can't cross-assign
              >
                  <option value="">Select Team</option>
                  {teams.map(t => <option key={t.id} value={t.id}>{t.name} ({t.code})</option>)}
              </select>
              {(isClient || isOps) && <p className="text-xs text-brand-sage mt-1">Automatically assigned to your team.</p>}
          </div>

          <div>
              <InputLabel>Initial Status</InputLabel>
              <select 
                className="w-full bg-brand-black border border-brand-800 rounded p-3 text-white focus:outline-none"
                value={formData.status}
                onChange={e => handleChange('status', e.target.value)}
              >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="under_construction">Under Construction</option>
              </select>
          </div>
        </div>
      );
      case 6: return (
        <div className="space-y-6 animate-fade-in-up">
          <h3 className="text-xl font-bold text-white mb-4">Review Site</h3>
          <div className="bg-brand-black/50 p-6 rounded-xl border border-brand-800 space-y-4">
              <div className="flex justify-between border-b border-brand-800 pb-2">
                  <span className="text-gray-400">Site Name</span>
                  <span className="text-white font-bold">{formData.name}</span>
              </div>
              <div className="flex justify-between border-b border-brand-800 pb-2">
                  <span className="text-gray-400">Location</span>
                  <span className="text-white text-right">{formData.address}<br/>{formData.city}, {formData.state}</span>
              </div>
              <div className="flex justify-between border-b border-brand-800 pb-2">
                  <span className="text-gray-400">Type</span>
                  <span className="text-white">{formData.type}</span>
              </div>
              <div className="flex justify-between border-b border-brand-800 pb-2">
                  <span className="text-gray-400">Posts</span>
                  <span className="text-brand-sage font-bold">{posts.length} Configured</span>
              </div>
              <div className="flex justify-between">
                  <span className="text-gray-400">Status</span>
                  <span className="text-white uppercase">{formData.status}</span>
              </div>
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
            <h2 className="text-xl font-display font-bold text-white mb-6">Create Site</h2>
            <div className="space-y-1 overflow-y-auto">
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
                
                {activeStep < 6 ? (
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
                        {loading ? 'Creating...' : <><Save size={16} className="mr-2" /> Create Site</>}
                    </button>
                )}
            </div>
        </div>

      </div>
    </div>
  );
};

export default CreateSiteModal;
