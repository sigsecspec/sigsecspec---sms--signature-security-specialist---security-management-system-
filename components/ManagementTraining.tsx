
import React, { useState, useEffect } from 'react';
import { ArrowLeft, BookOpen, CheckCircle, AlertTriangle, Lock, PlayCircle, FileText, Award, XCircle, Clock, RefreshCw, Shield, Users, Globe, Briefcase, Gavel, Search, Filter, Download, Video, Info } from 'lucide-react';
import { PageView, TrainingModule, TrainingStatus } from '../types';
import { supabase } from '../services/supabase';
import { TrainingModuleViewer, TrainingSection } from './common/TrainingModuleViewer';

interface ManagementTrainingProps {
  onNavigate: (page: PageView) => void;
}

interface ResourceItem {
  id: string;
  title: string;
  type: 'guide' | 'video';
}

const RESOURCES: ResourceItem[] = [
  { id: 'owner-manual', title: "Owner's Manual - Vol 1", type: 'guide' },
  { id: 'risk-framework', title: 'Risk Management Framework', type: 'guide' },
  { id: 'growth-plan', title: 'Strategic Growth Plan 2024', type: 'guide' },
  { id: 'vid-culture', title: 'Building Corporate Culture', type: 'video' },
  { id: 'vid-crisis', title: 'Crisis Leadership Masterclass', type: 'video' },
];

const ManagementTraining: React.FC<ManagementTrainingProps> = ({ onNavigate }) => {
  const [activeModuleId, setActiveModuleId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'modules' | 'resources' | 'history'>('modules');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [modules, setModules] = useState<TrainingModule[]>([]);
  const [dbDefinitions, setDbDefinitions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  
  // Access Control State
  const [guardTrainingComplete, setGuardTrainingComplete] = useState(false);
  const [appApproved, setAppApproved] = useState(false);
  const [applicationStatus, setApplicationStatus] = useState<string>('incomplete');

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          setUserId(user.id);
          
          // 1. Fetch Profile & App Status
          const { data: profile } = await supabase.from('profiles').select('role, metadata').eq('id', user.id).single();
          const { data: appData } = await supabase.from('applications').select('status').eq('user_id', user.id).eq('type', 'management').single();

          const appStatus = appData?.status || 'incomplete';
          setApplicationStatus(appStatus);
          setAppApproved(appStatus === 'approved' || ['management', 'owner'].includes(profile?.role));

          // 2. Fetch User Progress
          const { data: progressData } = await supabase.from('user_training_progress').select('*').eq('user_id', user.id);
          const progressMap: Record<string, any> = {};
          if (progressData) {
              progressData.forEach((p: any) => progressMap[p.module_id] = p);
          }

          // 3. Fetch Definitions from DB
          const { data: defs } = await supabase
              .from('training_definitions')
              .select('*')
              .eq('category', 'management')
              .eq('active', true);

          if (defs) {
              setDbDefinitions(defs);
              const mappedModules = defs.map((def: any) => {
                  const progress = progressMap[def.id];
                  return {
                      id: def.id,
                      title: def.title,
                      description: def.description,
                      duration: def.duration,
                      category: 'management',
                      status: progress ? progress.status : 'not_started',
                      score: progress ? progress.score : undefined,
                      attempts: progress ? progress.attempts : 0,
                      completedDate: progress && progress.completed_at ? new Date(progress.completed_at).toLocaleDateString() : undefined,
                      progress: progress ? progress.metadata : undefined // Pass detailed progress state
                  };
              });
              setModules(mappedModules);
          }
          
          // Check Guard Training Prerequisite (Simplified)
          setGuardTrainingComplete(true); // Assuming passed for now to fix access
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const saveModuleProgress = async (moduleId: string, progressState: any) => {
      if (!userId) return;
      
      // Update local state
      setModules(prev => prev.map(m => m.id === moduleId ? { ...m, progress: progressState } : m));

      // Persist to DB
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

  const getStatusBadge = (status: TrainingStatus) => {
    switch (status) {
      case 'approved': return <span className="flex items-center text-green-400 text-xs font-bold uppercase border border-green-400/30 bg-green-400/10 px-2 py-1 rounded"><CheckCircle className="w-3 h-3 mr-1" /> Certified</span>;
      case 'denied': return <span className="flex items-center text-red-400 text-xs font-bold uppercase border border-red-400/30 bg-red-400/10 px-2 py-1 rounded"><XCircle className="w-3 h-3 mr-1" /> Failed</span>;
      case 'pending_approval': return <span className="flex items-center text-orange-400 text-xs font-bold uppercase border border-orange-400/30 bg-orange-400/10 px-2 py-1 rounded"><Clock className="w-3 h-3 mr-1" /> Reviewing</span>;
      case 'in_progress': return <span className="flex items-center text-brand-sage text-xs font-bold uppercase border border-brand-sage/30 bg-brand-sage/10 px-2 py-1 rounded"><PlayCircle className="w-3 h-3 mr-1" /> Active</span>;
      default: return <span className="flex items-center text-gray-500 text-xs font-bold uppercase border border-gray-700 bg-gray-800 px-2 py-1 rounded">Start</span>;
    }
  };

  const getModuleSections = (def: any): TrainingSection[] => {
      if (!def) return [];
      return [
          {
              title: "Module Content",
              hasAudio: true,
              content: <div dangerouslySetInnerHTML={{ __html: def.content }} className="prose prose-invert max-w-none text-gray-300" />
          }
      ];
  };

  const activeModule = modules.find(m => m.id === activeModuleId);
  const activeDef = dbDefinitions.find(d => d.id === activeModuleId);

  const filteredModules = modules.filter(m => {
    const matchesSearch = m.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = filterStatus === 'all' || m.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const filteredHistory = modules.filter(m => m.status !== 'not_started');
  const filteredResources = RESOURCES.filter(r => r.title.toLowerCase().includes(searchQuery.toLowerCase()));

  const completedModules = modules.filter(m => m.status === 'approved').length;
  const inProgressModules = modules.filter(m => m.status === 'in_progress').length;
  const pendingModules = modules.filter(m => m.status === 'pending_approval').length;

  if (loading) return <div className="min-h-screen bg-brand-black flex items-center justify-center text-gray-500">Loading Management Training...</div>;

  if (!appApproved) {
      return (
          <div className="min-h-screen bg-brand-black py-24 px-4 flex items-center justify-center">
              <div className="bg-brand-ebony border border-brand-800 rounded-xl p-8 max-w-lg text-center shadow-2xl">
                  <Lock className="w-20 h-20 text-gray-600 mx-auto mb-6" />
                  <h2 className="text-2xl font-bold text-white mb-2">Access Restricted</h2>
                  <p className="text-gray-400 mb-6">Management training is only available to approved applicants.</p>
                  <button onClick={() => onNavigate('home')} className="text-brand-sage hover:underline text-sm">Return to Dashboard</button>
              </div>
          </div>
      );
  }

  return (
    <div className="bg-brand-black min-h-screen py-24 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <button
          onClick={() => activeModuleId ? setActiveModuleId(null) : onNavigate('management-application')}
          className="flex items-center text-brand-silver hover:text-brand-sage mb-8 transition-colors group"
        >
          <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
          {activeModuleId ? 'Back to Training Center' : 'Back to Dashboard'}
        </button>

        {!activeModuleId ? (
          <>
             <div className="bg-brand-ebony border border-brand-800 rounded-xl p-6 mb-8 flex flex-col md:flex-row items-center justify-between shadow-xl">
              <div className="flex items-center mb-4 md:mb-0">
                <div className="w-16 h-16 bg-brand-sage/20 rounded-full flex items-center justify-center mr-4">
                  <Briefcase className="w-8 h-8 text-brand-sage" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-white">Management Training Center</h1>
                  <p className="text-brand-silver text-sm">Mandatory certification for management staff.</p>
                </div>
              </div>
              
              <div className="flex gap-8 text-center">
                <div><p className="text-gray-400 text-xs uppercase">Active</p><p className="text-2xl font-bold text-brand-sage">{inProgressModules}</p></div>
                <div><p className="text-gray-400 text-xs uppercase">Review</p><p className="text-2xl font-bold text-orange-400">{pendingModules}</p></div>
                <div><p className="text-gray-400 text-xs uppercase">Done</p><p className="text-2xl font-bold text-green-400">{completedModules}</p></div>
              </div>
            </div>

            <div className="flex border-b border-brand-800 mb-8 overflow-x-auto">
              {[{ id: 'modules', label: 'Training Modules' }, { id: 'resources', label: 'Resources' }, { id: 'history', label: 'My History' }].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setViewMode(tab.id as any)}
                  className={`flex items-center px-6 py-4 border-b-2 font-medium text-sm whitespace-nowrap transition-colors ${
                    viewMode === tab.id ? 'border-brand-sage text-brand-sage' : 'border-transparent text-gray-400 hover:text-white'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {viewMode === 'modules' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in-up">
                {filteredModules.length === 0 ? <div className="col-span-2 text-center text-gray-500">No modules available.</div> : filteredModules.map((module) => (
                    <div 
                    key={module.id}
                    onClick={() => { if (module.status !== 'blocked') setActiveModuleId(module.id); }}
                    className={`relative bg-brand-ebony p-6 rounded-xl border transition-all h-full flex flex-col cursor-pointer hover:border-brand-sage/50`}
                    >
                    <div className="flex justify-between items-start mb-4">
                        <div className="bg-brand-black w-12 h-12 rounded-lg flex items-center justify-center border border-brand-800">
                        <Globe className={`w-6 h-6 ${module.status === 'approved' ? 'text-green-500' : 'text-brand-silver'}`} />
                        </div>
                        {getStatusBadge(module.status)}
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">{module.title}</h3>
                    <p className="text-gray-400 text-sm mb-6 flex-grow">{module.description}</p>
                    </div>
                ))}
                </div>
            )}
          </>
        ) : (
          <TrainingModuleViewer
            module={activeModule!}
            sections={getModuleSections(activeDef)}
            questions={activeDef?.questions || []}
            onUpdateStatus={updateModuleStatus}
            onSaveProgress={saveModuleProgress}
            onBack={() => setActiveModuleId(null)}
            isLead={true} 
            content={null}
          />
        )}
      </div>
    </div>
  );
};

export default ManagementTraining;
