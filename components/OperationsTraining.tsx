
import React, { useState, useEffect } from 'react';
import { ArrowLeft, BookOpen, CheckCircle, AlertTriangle, Lock, PlayCircle, FileText, Award, XCircle, Clock, RefreshCw, Shield, Users, Globe, Briefcase, Gavel, Radio, Zap, Search, Filter, Download, Video, Info } from 'lucide-react';
import { PageView, TrainingModule, TrainingStatus } from '../types';
import { supabase } from '../services/supabase';
import { TrainingModuleViewer, TrainingSection } from './common/TrainingModuleViewer';

interface OperationsTrainingProps {
  onNavigate: (page: PageView) => void;
}

const OperationsTraining: React.FC<OperationsTrainingProps> = ({ onNavigate }) => {
  const [activeModuleId, setActiveModuleId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'modules' | 'resources' | 'history'>('modules');
  const [modules, setModules] = useState<TrainingModule[]>([]);
  const [dbDefinitions, setDbDefinitions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [appApproved, setAppApproved] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          setUserId(user.id);
          
          const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
          const { data: appData } = await supabase.from('applications').select('status').eq('user_id', user.id).eq('type', 'operations').single();

          const isApproved = (appData?.status === 'approved' || ['operations', 'owner'].includes(profile?.role));
          setAppApproved(isApproved);

          // Fetch Progress
          const { data: progressData } = await supabase.from('user_training_progress').select('*').eq('user_id', user.id);
          const progressMap: Record<string, any> = {};
          if (progressData) progressData.forEach((p: any) => progressMap[p.module_id] = p);

          // Fetch Definitions
          const { data: defs } = await supabase.from('training_definitions').select('*').eq('category', 'operations').eq('active', true);

          if (defs) {
              setDbDefinitions(defs);
              const mergedModules = defs.map((def: any) => {
                  const progress = progressMap[def.id];
                  return {
                      id: def.id,
                      title: def.title,
                      description: def.description,
                      duration: def.duration,
                      category: 'operations',
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

  const activeModule = modules.find(m => m.id === activeModuleId);
  const activeDef = dbDefinitions.find(d => d.id === activeModuleId);

  const getModuleSections = (def: any): TrainingSection[] => {
      if (!def) return [];
      return [{ title: "Module Content", hasAudio: true, content: <div dangerouslySetInnerHTML={{ __html: def.content }} className="prose prose-invert max-w-none text-gray-300" /> }];
  };

  if (loading) return <div className="min-h-screen bg-brand-black flex items-center justify-center text-gray-500">Loading Operations Training...</div>;

  if (!appApproved) {
      return (
          <div className="min-h-screen bg-brand-black py-24 px-4 flex items-center justify-center">
              <div className="bg-brand-ebony border border-brand-800 rounded-xl p-8 max-w-lg text-center shadow-2xl">
                  <Lock className="w-20 h-20 text-gray-600 mx-auto mb-6" />
                  <h2 className="text-2xl font-bold text-white mb-2">Access Restricted</h2>
                  <p className="text-gray-400 mb-6">Operations training is available to approved applicants only.</p>
                  <button onClick={() => onNavigate('home')} className="text-brand-sage hover:underline text-sm">Return to Dashboard</button>
              </div>
          </div>
      );
  }

  return (
    <div className="bg-brand-black min-h-screen py-24 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <button
          onClick={() => activeModuleId ? setActiveModuleId(null) : onNavigate('operations-application')}
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
                  <h1 className="text-2xl font-bold text-white">Operations Training Center</h1>
                  <p className="text-brand-silver text-sm">Mandatory certification for operations staff.</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in-up">
            {modules.map((module) => (
                <div 
                key={module.id}
                onClick={() => setActiveModuleId(module.id)}
                className={`relative bg-brand-ebony p-6 rounded-xl border transition-all cursor-pointer hover:border-brand-sage/50`}
                >
                <div className="flex justify-between items-start mb-4">
                    <div className="bg-brand-black w-12 h-12 rounded-lg flex items-center justify-center border border-brand-800">
                    <Zap className={`w-6 h-6 ${module.status === 'approved' ? 'text-green-500' : 'text-brand-silver'}`} />
                    </div>
                    {module.status === 'approved' && <CheckCircle className="text-green-500 w-5 h-5" />}
                </div>
                <h3 className="text-xl font-bold text-white mb-2">{module.title}</h3>
                <p className="text-gray-400 text-sm">{module.description}</p>
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

export default OperationsTraining;
