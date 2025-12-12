
import React, { useState, useEffect } from 'react';
import { ArrowLeft, BookOpen, CheckCircle, AlertTriangle, Lock, PlayCircle, FileText, Award, XCircle, Clock, RefreshCw, Shield, Users, Briefcase, ClipboardCheck, MessageSquare, Activity, UserCheck, Search, Filter, Download, Video, Info, HelpCircle, MapPin, Gavel, Ban } from 'lucide-react';
import { PageView, TrainingModule, TrainingStatus } from '../types';
import { supabase } from '../services/supabase';
import { TrainingModuleViewer, TrainingSection } from './common/TrainingModuleViewer';

interface SupervisorTrainingProps {
  onNavigate: (page: PageView) => void;
}

const SupervisorTraining: React.FC<SupervisorTrainingProps> = ({ onNavigate }) => {
  const [activeModuleId, setActiveModuleId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'modules' | 'resources' | 'history'>('modules');
  const [modules, setModules] = useState<TrainingModule[]>([]);
  const [dbDefinitions, setDbDefinitions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [accessGranted, setAccessGranted] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          setUserId(user.id);
          const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
          const { data: appData } = await supabase.from('applications').select('status').eq('user_id', user.id).eq('type', 'supervisor').single();

          if ((profile?.role === 'supervisor' || profile?.role === 'owner') || appData?.status === 'approved') {
              setAccessGranted(true);
              const { data: progressData } = await supabase.from('user_training_progress').select('*').eq('user_id', user.id);
              const progressMap: Record<string, any> = {};
              if (progressData) progressData.forEach((p: any) => progressMap[p.module_id] = p);

              const { data: defs } = await supabase.from('training_definitions').select('*').eq('category', 'supervisor').eq('active', true);
              if (defs) {
                  setDbDefinitions(defs);
                  const mergedModules = defs.map((def: any) => {
                      const progress = progressMap[def.id];
                      return {
                          id: def.id,
                          title: def.title,
                          description: def.description,
                          duration: def.duration,
                          category: 'supervisor',
                          status: progress ? progress.status : 'not_started',
                          score: progress ? progress.score : undefined,
                          attempts: progress ? progress.attempts : 0,
                          completedDate: progress && progress.completed_at ? new Date(progress.completed_at).toLocaleDateString() : undefined,
                          progress: progress ? progress.metadata : undefined
                      } as any;
                  });
                  setModules(mergedModules);
              }
          }
        }
      } catch (e) { console.error(e); } finally { setLoading(false); }
    };
    loadData();
  }, []);

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

  const getStatusBadge = (status: TrainingStatus) => {
    switch (status) {
      case 'in_progress': return <span className="flex items-center text-blue-400 text-xs font-bold uppercase border border-blue-500/30 bg-blue-500/10 px-2 py-1 rounded"><PlayCircle className="w-3 h-3 mr-1" /> In Progress</span>;
      case 'approved': return <span className="flex items-center text-green-400 text-xs font-bold uppercase border border-green-500/30 bg-green-500/10 px-2 py-1 rounded"><CheckCircle className="w-3 h-3 mr-1" /> Approved</span>;
      default: return <span className="flex items-center text-gray-500 text-xs font-bold uppercase border border-gray-700 bg-gray-800 px-2 py-1 rounded">Start</span>;
    }
  };

  const activeModule = modules.find(m => m.id === activeModuleId);
  const activeDef = dbDefinitions.find(d => d.id === activeModuleId);

  const getModuleSections = (def: any): TrainingSection[] => {
      if (!def) return [];
      return [{ title: "Module Content", hasAudio: true, content: <div dangerouslySetInnerHTML={{ __html: def.content }} className="prose prose-invert max-w-none text-gray-300" /> }];
  };

  if (loading) return <div className="min-h-screen bg-brand-black flex items-center justify-center text-gray-500">Loading...</div>;
  if (!accessGranted) return <div className="min-h-screen bg-brand-black flex items-center justify-center text-white">Access Restricted</div>;

  return (
    <div className="bg-brand-black min-h-screen py-24 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <button onClick={() => activeModuleId ? setActiveModuleId(null) : onNavigate('supervisor-application')} className="flex items-center text-brand-silver hover:text-brand-sage mb-8 transition-colors group"><ArrowLeft className="w-4 h-4 mr-2" /> Back</button>

        {!activeModuleId ? (
          <>
            <div className="bg-brand-ebony border border-brand-800 rounded-xl p-6 mb-8 flex flex-col md:flex-row items-center justify-between shadow-xl">
              <div className="flex items-center mb-4 md:mb-0">
                <div className="w-16 h-16 bg-brand-sage/20 rounded-full flex items-center justify-center mr-4"><Users className="w-8 h-8 text-brand-sage" /></div>
                <div><h1 className="text-2xl font-bold text-white">Supervisor Training Center</h1><p className="text-brand-silver text-sm">Leadership development and QA certification.</p></div>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6 animate-fade-in-up">
            {modules.map((module) => (
                <div key={module.id} onClick={() => setActiveModuleId(module.id)} className="relative bg-brand-ebony p-6 rounded-xl border border-brand-800 hover:border-brand-sage/50 cursor-pointer">
                    <div className="flex justify-between items-start mb-4">
                        <div className="bg-brand-black w-12 h-12 rounded-lg flex items-center justify-center border border-brand-800"><Briefcase className="w-6 h-6 text-brand-silver" /></div>
                        {getStatusBadge(module.status)}
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">{module.title}</h3>
                    <p className="text-gray-400 text-sm mb-6 flex-grow">{module.description}</p>
                </div>
            ))}
            </div>
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

export default SupervisorTraining;
