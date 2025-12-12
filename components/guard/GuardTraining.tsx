
import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, BookOpen, Award, Lock, Clock, FileText, Video, 
  Download, Shield, RefreshCw, XCircle, CheckCircle, Search, 
  Filter, Users, PlayCircle, MapPin, AlertTriangle, Calendar,
  Upload, X, Plus
} from 'lucide-react';
import { PageView, TrainingModule, TrainingStatus, UserCertification, Resource, CertificationType } from '../../types';
import { supabase } from '../../services/supabase';
import { TrainingModuleViewer, TrainingSection } from '../common/TrainingModuleViewer';
import { KPIMeter } from '../common/DashboardWidgets';
import { InputLabel, InputField, FileUpload } from '../common/FormElements';

interface GuardTrainingProps {
  onNavigate: (page: PageView) => void;
}

type TrainingCategory = 'standard' | 'lead';
type ViewMode = 'modules' | 'certifications' | 'resources' | 'history';

// Helper to convert DB format to component format
const mapDbModuleToTrainingModule = (dbModule: any, progressMap: Record<string, any>): TrainingModule => {
    const progress = progressMap[dbModule.id];
    return {
        id: dbModule.id,
        title: dbModule.title,
        description: dbModule.description,
        duration: dbModule.duration,
        category: dbModule.category as any,
        status: progress ? progress.status : 'not_started',
        score: progress ? progress.score : undefined,
        attempts: progress ? progress.attempts : 0,
        completedDate: progress && progress.completed_at ? new Date(progress.completed_at).toLocaleDateString() : undefined,
        progress: progress ? progress.metadata : undefined
    };
};

const GuardTraining: React.FC<GuardTrainingProps> = ({ onNavigate }) => {
  const [activeModuleId, setActiveModuleId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('modules');
  const [moduleCategory, setModuleCategory] = useState<TrainingCategory>('standard');
  const [searchQuery, setSearchQuery] = useState('');
  
  const [isLeadRequested, setIsLeadRequested] = useState(false);
  const [acceptedLeadRequests, setAcceptedLeadRequests] = useState<any[]>([]);
  const [modules, setModules] = useState<TrainingModule[]>([]);
  const [dbDefinitions, setDbDefinitions] = useState<any[]>([]);
  
  // New State for DB Data
  const [certifications, setCertifications] = useState<UserCertification[]>([]);
  const [resources, setResources] = useState<Resource[]>([]);
  const [certTypes, setCertTypes] = useState<CertificationType[]>([]);
  
  // Cert Modal State
  const [isCertModalOpen, setIsCertModalOpen] = useState(false);
  const [newCertData, setNewCertData] = useState({
      typeId: '',
      number: '',
      expiry: '',
      notes: ''
  });
  
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
        setLoading(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                setUserId(user.id);
                
                // 1. Fetch User Profile (Lead Requests)
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('metadata')
                    .eq('id', user.id)
                    .single();
                
                const requests = profile?.metadata?.lead_guard_requests || [];
                const accepted = requests.filter((r: any) => r.status === 'accepted' || r.status === 'active');
                if (accepted.length > 0) {
                    setIsLeadRequested(true);
                    setAcceptedLeadRequests(accepted);
                }

                // 2. Fetch User Progress from new table
                const { data: progressData } = await supabase
                    .from('user_training_progress')
                    .select('*')
                    .eq('user_id', user.id);
                
                const progressMap: Record<string, any> = {};
                if (progressData) {
                    progressData.forEach((p: any) => {
                        progressMap[p.module_id] = p;
                    });
                }

                // 3. Fetch Training Definitions (Modules)
                const { data: defs } = await supabase
                    .from('training_definitions')
                    .select('*')
                    .eq('active', true)
                    .in('category', ['standard', 'lead']);

                if (defs) {
                    setDbDefinitions(defs);
                    const mergedModules = defs.map(def => mapDbModuleToTrainingModule(def, progressMap));
                    setModules(mergedModules);
                }

                // 4. Fetch Certifications
                const { data: certs } = await supabase
                    .from('user_certifications')
                    .select(`
                        *,
                        type:certification_types(name, category)
                    `)
                    .eq('user_id', user.id);
                
                if (certs) {
                    setCertifications(certs.map((c: any) => ({
                        id: c.id,
                        name: c.type?.name || c.name || 'Unknown',
                        issuer: 'Signature Security',
                        issueDate: c.issue_date,
                        expiryDate: c.expiry_date,
                        status: c.status,
                        docUrl: c.doc_url
                    })));
                }

                // 5. Fetch Resources
                const { data: res } = await supabase
                    .from('resources')
                    .select('*')
                    .or('category.eq.guard,category.eq.all');
                
                if (res) {
                    setResources(res.map((r: any) => ({
                        id: r.id,
                        title: r.title,
                        type: r.type,
                        size: r.size,
                        duration: r.duration,
                        url: r.url
                    })));
                }

                // 6. Fetch Cert Types for dropdown
                const { data: types } = await supabase.from('certification_types').select('*').eq('is_active', true);
                setCertTypes(types as any || []);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };
    loadData();
  }, [isCertModalOpen]);

  const saveModuleProgress = async (moduleId: string, progressState: any) => {
      if (!userId) return;
      setModules(prev => prev.map(m => m.id === moduleId ? { ...m, progress: progressState } : m));
      await supabase.from('user_training_progress').upsert({
          user_id: userId,
          module_id: moduleId,
          metadata: progressState,
          updated_at: new Date().toISOString()
      }, { onConflict: 'user_id, module_id' });
  };

  const updateModuleStatus = async (id: string, status: TrainingStatus, score?: number) => {
    if (!userId) return;

    const updated = modules.map(m => {
        if (m.id === id) {
            return { 
                ...m, 
                status, 
                score: score !== undefined ? score : m.score,
                attempts: (status === 'approved' || status === 'denied' || status === 'pending_approval') ? m.attempts + 1 : m.attempts,
                completedDate: (status === 'approved') ? new Date().toLocaleDateString() : m.completedDate
            };
        }
        return m;
    });
    setModules(updated);

    const currentModule = updated.find(m => m.id === id);
    if (currentModule) {
        await supabase.from('user_training_progress').upsert({
            user_id: userId,
            module_id: id,
            status: status,
            score: score,
            attempts: currentModule.attempts,
            completed_at: status === 'approved' ? new Date().toISOString() : null,
            updated_at: new Date().toISOString()
        }, { onConflict: 'user_id, module_id' });
    }
  };

  const handleUploadCert = async () => {
      if (!userId || !newCertData.typeId) {
          alert("Please select a certification type.");
          return;
      }

      try {
          // Upload logic for file would go here (storage bucket), getting public URL
          const mockDocUrl = "https://example.com/cert.pdf"; 

          await supabase.from('user_certifications').insert({
              user_id: userId,
              cert_type_id: newCertData.typeId,
              status: 'pending_verification',
              issue_date: new Date().toISOString(),
              expiry_date: newCertData.expiry || null,
              certification_number: newCertData.number,
              doc_url: mockDocUrl,
              notes: newCertData.notes
          });

          alert("Certification submitted for verification.");
          setIsCertModalOpen(false);
          setNewCertData({ typeId: '', number: '', expiry: '', notes: '' });
          // Reload triggered by effect dependency
      } catch (e: any) {
          alert("Error uploading certification: " + e.message);
      }
  };

  // Helper to generate structured content from DB text
  // NOTE: In a real production app, the DB would store this structure as JSON. 
  // Here we mock splitting the text content to demonstrate the multi-page viewer.
  const getTrainingSections = (moduleTitle: string, dbContent?: string): TrainingSection[] => {
      if (!dbContent) {
          return [
              {
                  title: "Overview",
                  hasAudio: true,
                  content: <p>Content is loading or unavailable. Please contact your training officer.</p>,
                  minTimeSeconds: 5
              }
          ];
      }

      // If content is short, just one section
      if (dbContent.length < 500) {
          return [{
              title: "Module Content",
              hasAudio: true,
              content: <div dangerouslySetInnerHTML={{ __html: dbContent }} className="prose prose-invert max-w-none text-gray-300" />,
              minTimeSeconds: 10
          }];
      }

      // Mock splitting for demo purposes to show multi-page capability
      return [
          {
              title: "Introduction",
              hasAudio: true,
              minTimeSeconds: 5,
              content: (
                  <div>
                      <h3>Welcome to {moduleTitle}</h3>
                      <p>This module covers essential protocols and procedures required for your role. Please read each section carefully. A timer will enforce minimum reading time.</p>
                      <div className="bg-brand-900/30 p-4 border-l-4 border-brand-sage my-4">
                          <p className="text-sm">Objective: Understand the core principles of {moduleTitle} and how to apply them in the field.</p>
                      </div>
                  </div>
              )
          },
          {
              title: "Core Material",
              hasAudio: true,
              minTimeSeconds: 10,
              content: <div dangerouslySetInnerHTML={{ __html: dbContent }} className="prose prose-invert max-w-none text-gray-300" />
          },
          {
              title: "Summary & Review",
              hasAudio: false,
              minTimeSeconds: 5,
              content: (
                  <div>
                      <h3>Key Takeaways</h3>
                      <ul className="list-disc pl-5 space-y-2">
                          <li>Review all safety protocols before shift start.</li>
                          <li>Report any incidents immediately via the app.</li>
                          <li>Maintain professional conduct at all times.</li>
                      </ul>
                      <p className="mt-4">You are now ready to take the final assessment. Good luck.</p>
                  </div>
              )
          }
      ];
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved': case 'valid': case 'verified': return <span className="flex items-center text-green-400 text-xs font-bold uppercase border border-green-400/30 bg-green-400/10 px-2 py-1 rounded"><CheckCircle className="w-3 h-3 mr-1" /> Valid</span>;
      case 'denied': case 'rejected': return <span className="flex items-center text-red-400 text-xs font-bold uppercase border border-red-400/30 bg-red-400/10 px-2 py-1 rounded"><XCircle className="w-3 h-3 mr-1" /> Denied</span>;
      case 'pending_approval': case 'pending_verification': return <span className="flex items-center text-orange-400 text-xs font-bold uppercase border border-orange-400/30 bg-orange-400/10 px-2 py-1 rounded"><Clock className="w-3 h-3 mr-1" /> Reviewing</span>;
      case 'retake_requested': return <span className="flex items-center text-yellow-400 text-xs font-bold uppercase border border-yellow-400/30 bg-yellow-400/10 px-2 py-1 rounded"><RefreshCw className="w-3 h-3 mr-1" /> Retake Req</span>;
      case 'in_progress': return <span className="flex items-center text-brand-sage text-xs font-bold uppercase border border-brand-sage/30 bg-brand-sage/10 px-2 py-1 rounded"><PlayCircle className="w-3 h-3 mr-1" /> Active</span>;
      case 'field_training_requested': return <span className="flex items-center text-blue-400 text-xs font-bold uppercase border border-blue-400/30 bg-blue-400/10 px-2 py-1 rounded"><MapPin className="w-3 h-3 mr-1" /> Field Req</span>;
      case 'expired': return <span className="flex items-center text-red-400 text-xs font-bold uppercase border border-red-400/30 bg-red-400/10 px-2 py-1 rounded"><AlertTriangle className="w-3 h-3 mr-1" /> Expired</span>;
      default: return <span className="flex items-center text-gray-500 text-xs font-bold uppercase border border-gray-700 bg-gray-800 px-2 py-1 rounded">Start</span>;
    }
  };

  const activeModule = modules.find(m => m.id === activeModuleId);
  const activeDef = dbDefinitions.find(d => d.id === activeModuleId);
  
  const filteredModules = modules.filter(m => {
      const matchesCategory = m.category === moduleCategory;
      const matchesSearch = m.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            m.description.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
  });

  const filteredHistory = modules.filter(m => m.status !== 'not_started');
  const filteredResources = resources.filter(r => r.title.toLowerCase().includes(searchQuery.toLowerCase()));

  const completedCount = modules.filter(m => m.status === 'approved').length;
  const inProgressCount = modules.filter(m => m.status === 'in_progress').length;
  const validCerts = certifications.filter(c => c.status === 'valid' || c.status === 'verified').length;

  if (loading) return <div className="min-h-screen bg-brand-black flex items-center justify-center text-gray-500">Loading Training Center...</div>;

  return (
    <div className="bg-brand-black min-h-screen py-24 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <button
          onClick={() => activeModuleId ? setActiveModuleId(null) : onNavigate('guard-application')}
          className="flex items-center text-brand-silver hover:text-brand-sage mb-8 transition-colors group"
        >
          <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
          {activeModuleId ? 'Back to Training Center' : 'Back to Dashboard'}
        </button>

        {!activeModuleId ? (
          <>
            {/* Dashboard Header & KPIs */}
            <div className="space-y-6 mb-8 animate-fade-in-up">
                <div className="flex flex-col md:flex-row justify-between items-end gap-4 border-b border-brand-800 pb-6">
                    <div>
                        <h1 className="text-3xl font-display font-bold text-white mb-2">Training Center</h1>
                        <p className="text-brand-silver text-sm">Professional development, certifications, and resources.</p>
                    </div>
                    {isLeadRequested && (
                        <div className="px-4 py-2 bg-blue-900/20 border border-blue-500/50 rounded-lg flex items-center">
                            <BookOpen className="w-5 h-5 text-blue-400 mr-3" />
                            <div>
                                <p className="text-xs text-blue-200 font-bold uppercase">Lead Guard Access</p>
                                <p className="text-white font-bold text-sm">Granted</p>
                            </div>
                        </div>
                    )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <KPIMeter label="Modules Completed" value={completedCount.toString()} trend="up" trendValue="Total" color="green" icon={<CheckCircle />} />
                    <KPIMeter label="Training Score" value="92%" trend="up" trendValue="Avg" color="blue" icon={<Award />} />
                    <KPIMeter label="Certifications" value={`${validCerts}/${certifications.length || 0}`} trend="down" trendValue="Expiring" color="orange" icon={<Shield />} />
                    <KPIMeter label="In Progress" value={inProgressCount.toString()} trend="up" trendValue="Active" color="purple" icon={<PlayCircle />} />
                </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex border-b border-brand-800 mb-8 overflow-x-auto scrollbar-hide bg-brand-ebony/50 px-2 rounded-t-lg">
              {[{ id: 'modules', label: 'Training Modules' }, { id: 'certifications', label: 'Certifications' }, { id: 'resources', label: 'Resources' }, { id: 'history', label: 'My History' }].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setViewMode(tab.id as ViewMode)}
                  className={`flex items-center px-6 py-4 border-b-2 font-medium text-sm whitespace-nowrap transition-colors ${
                    viewMode === tab.id 
                      ? 'border-brand-sage text-brand-sage' 
                      : 'border-transparent text-gray-400 hover:text-white'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* MODULES VIEW */}
            {viewMode === 'modules' && (
                <div className="space-y-6 animate-fade-in-up">
                    <div className="flex gap-4 mb-6">
                        <button onClick={() => setModuleCategory('standard')} className={`px-4 py-2 rounded-full text-xs font-bold uppercase border ${moduleCategory === 'standard' ? 'bg-brand-sage text-black border-brand-sage' : 'bg-transparent text-gray-500 border-gray-700'}`}>Standard</button>
                        <button onClick={() => setModuleCategory('lead')} className={`px-4 py-2 rounded-full text-xs font-bold uppercase border ${moduleCategory === 'lead' ? 'bg-blue-500 text-white border-blue-500' : 'bg-transparent text-gray-500 border-gray-700'}`}>Lead Guard</button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredModules.map((module) => (
                            <div 
                                key={module.id}
                                onClick={() => { if (module.status !== 'blocked') setActiveModuleId(module.id); }}
                                className={`relative bg-brand-ebony p-6 rounded-xl border transition-all h-full flex flex-col group ${
                                    module.status === 'blocked' ? 'border-red-900/30 opacity-75' : 'border-brand-800 hover:border-brand-sage/50'
                                }`}
                            >
                                <div className="flex justify-between items-start mb-4">
                                    <div className="p-2 bg-brand-black rounded border border-brand-800">
                                        <BookOpen className={`w-5 h-5 ${module.category === 'lead' ? 'text-blue-400' : 'text-brand-silver'}`} />
                                    </div>
                                    {getStatusBadge(module.status)}
                                </div>
                                <h3 className="text-lg font-bold text-white mb-2">{module.title}</h3>
                                <p className="text-gray-400 text-xs mb-6 flex-grow">{module.description}</p>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* CERTIFICATIONS VIEW */}
            {viewMode === 'certifications' && (
                <div className="space-y-6 animate-fade-in-up">
                    <div className="flex justify-between items-center mb-6">
                        <div>
                            <h3 className="text-xl font-bold text-white">My Certifications</h3>
                            <p className="text-sm text-gray-400">Manage and upload your licenses and permits.</p>
                        </div>
                        <button onClick={() => setIsCertModalOpen(true)} className="bg-brand-sage text-black px-4 py-2 rounded font-bold text-sm hover:bg-brand-sage/90 flex items-center shadow-lg">
                            <Plus className="w-4 h-4 mr-2" /> Upload Certification
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {certifications.length === 0 ? (
                            <div className="col-span-3 text-center p-12 text-gray-500 bg-brand-ebony border border-brand-800 rounded-xl">
                                No certifications found. Upload your Guard Card or other licenses.
                            </div>
                        ) : certifications.map((cert) => (
                            <div key={cert.id} className="bg-brand-ebony border border-brand-800 p-6 rounded-xl relative hover:border-brand-sage/30 transition-all group">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="p-3 bg-brand-black rounded-lg border border-brand-700">
                                        <Shield className="w-6 h-6 text-brand-silver" />
                                    </div>
                                    {getStatusBadge(cert.status)}
                                </div>
                                <h4 className="text-white font-bold text-lg mb-1">{cert.name}</h4>
                                <p className="text-xs text-gray-500 mb-4">{cert.issuer}</p>
                                
                                <div className="space-y-2 text-sm border-t border-brand-800 pt-3">
                                    <div className="flex justify-between text-gray-400">
                                        <span>Expires:</span>
                                        <span className={cert.expiryDate && new Date(cert.expiryDate) < new Date() ? 'text-red-400 font-bold' : 'text-white'}>
                                            {cert.expiryDate ? new Date(cert.expiryDate).toLocaleDateString() : 'N/A'}
                                        </span>
                                    </div>
                                    {cert.docUrl && (
                                        <button className="text-brand-sage hover:underline text-xs flex items-center mt-2">
                                            <Download className="w-3 h-3 mr-1" /> Download Copy
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
          </>
        ) : (
          <TrainingModuleViewer
            module={activeModule!}
            content={null} 
            sections={getTrainingSections(activeModule!.title, activeDef?.content)}
            questions={activeDef?.questions || []}
            onUpdateStatus={updateModuleStatus}
            onSaveProgress={saveModuleProgress}
            onBack={() => setActiveModuleId(null)}
            isLead={activeModule!.category === 'lead'}
          />
        )}
      </div>

      {/* Upload Cert Modal */}
      {isCertModalOpen && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 p-4 backdrop-blur-sm">
              <div className="bg-brand-ebony border border-brand-700 rounded-xl w-full max-w-md shadow-2xl animate-fade-in-up">
                  <div className="p-6 border-b border-brand-800 bg-brand-900/50 flex justify-between items-center rounded-t-xl">
                      <h3 className="text-xl font-bold text-white">Upload Certification</h3>
                      <button onClick={() => setIsCertModalOpen(false)} className="text-gray-400 hover:text-white"><X size={20} /></button>
                  </div>
                  <div className="p-6 space-y-4">
                      <div>
                          <InputLabel>Certification Type</InputLabel>
                          <select 
                              className="w-full bg-brand-black border border-brand-800 rounded p-3 text-white focus:border-brand-sage outline-none"
                              value={newCertData.typeId}
                              onChange={(e) => setNewCertData({...newCertData, typeId: e.target.value})}
                          >
                              <option value="">Select Type...</option>
                              {certTypes.map(t => (
                                  <option key={t.id} value={t.id}>{t.name}</option>
                              ))}
                          </select>
                      </div>
                      <div>
                          <InputLabel>License / Certificate Number</InputLabel>
                          <InputField 
                              value={newCertData.number} 
                              onChange={(e) => setNewCertData({...newCertData, number: e.target.value})} 
                              placeholder="e.g. G-123456"
                          />
                      </div>
                      <div>
                          <InputLabel>Expiration Date</InputLabel>
                          <InputField 
                              type="date" 
                              value={newCertData.expiry} 
                              onChange={(e) => setNewCertData({...newCertData, expiry: e.target.value})} 
                          />
                      </div>
                      <div>
                          <InputLabel>Upload Document</InputLabel>
                          <FileUpload label="Certificate" />
                      </div>
                      <div>
                          <InputLabel>Notes</InputLabel>
                          <textarea 
                              className="w-full bg-brand-black border border-brand-800 rounded p-3 text-white h-20 focus:border-brand-sage outline-none"
                              placeholder="Any additional info..."
                              value={newCertData.notes}
                              onChange={(e) => setNewCertData({...newCertData, notes: e.target.value})}
                          />
                      </div>
                      <div className="flex justify-end gap-3 mt-4">
                          <button onClick={() => setIsCertModalOpen(false)} className="px-4 py-2 text-gray-400 hover:text-white">Cancel</button>
                          <button onClick={handleUploadCert} className="px-6 py-2 bg-brand-sage text-black font-bold rounded shadow-lg hover:bg-brand-sage/90">Submit for Verification</button>
                      </div>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default GuardTraining;
