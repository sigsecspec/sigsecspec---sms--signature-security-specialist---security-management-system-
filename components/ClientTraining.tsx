
import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, CheckCircle, HelpCircle, BookOpen, Clock, 
  PlayCircle, RefreshCw, MapPin, XCircle
} from 'lucide-react';
import { PageView, TrainingModule, TrainingStatus } from '../types';
import { supabase } from '../services/supabase';
import { TrainingModuleViewer, TrainingSection } from './common/TrainingModuleViewer';
import { KPIMeter } from './common/DashboardWidgets';

interface ClientTrainingProps {
  onNavigate: (page: PageView) => void;
}

const ClientTraining: React.FC<ClientTrainingProps> = ({ onNavigate }) => {
  const [activeModuleId, setActiveModuleId] = useState<string | null>(null);
  const [modules, setModules] = useState<TrainingModule[]>([]);
  const [dbDefinitions, setDbDefinitions] = useState<any[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
      const loadData = async () => {
          setLoading(true);
          try {
              const { data: { user } } = await supabase.auth.getUser();
              if (user) {
                  setUserId(user.id);

                  // 1. Fetch User Progress
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

                  // 2. Fetch Training Definitions (Client Category)
                  const { data: defs } = await supabase
                      .from('training_definitions')
                      .select('*')
                      .eq('category', 'client')
                      .eq('active', true);
                  
                  if (defs) {
                      setDbDefinitions(defs);
                      const mapped: TrainingModule[] = defs.map((d: any) => {
                          const progress = progressMap[d.id];
                          return {
                              id: d.id,
                              title: d.title,
                              description: d.description,
                              duration: d.duration,
                              category: 'client',
                              status: progress ? progress.status : 'not_started',
                              score: progress ? progress.score : undefined,
                              attempts: progress ? progress.attempts : 0,
                              completedDate: progress && progress.completed_at ? new Date(progress.completed_at).toLocaleDateString() : undefined,
                              progress: progress ? progress.metadata : undefined
                          };
                      });
                      setModules(mapped);
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

    // Optimistic Update
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

  const getTrainingSections = (dbContent?: string): TrainingSection[] => {
      if (dbContent) {
          return [{
              title: "Module Content",
              hasAudio: true,
              content: <div dangerouslySetInnerHTML={{ __html: dbContent }} className="prose prose-invert max-w-none text-gray-300" />
          }];
      }
      return [{ title: "Overview", content: <p>Content unavailable.</p> }];
  };

  const activeModule = modules.find(m => m.id === activeModuleId);
  const activeDef = dbDefinitions.find(d => d.id === activeModuleId);

  const completedCount = modules.filter(m => m.status === 'approved').length;
  const inProgressCount = modules.filter(m => m.status === 'in_progress').length;

  if (loading) return <div className="min-h-screen bg-brand-black flex items-center justify-center text-gray-500">Loading Training Center...</div>;

  return (
    <div className="bg-brand-black min-h-screen py-24 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <button
          onClick={() => activeModuleId ? setActiveModuleId(null) : onNavigate('client-application')}
          className="flex items-center text-brand-silver hover:text-brand-sage mb-8 transition-colors group"
        >
          <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
          {activeModuleId ? 'Back to Training Center' : 'Back to Dashboard'}
        </button>

        {!activeModuleId ? (
          <>
            <div className="text-center mb-12">
                <h1 className="text-3xl md:text-4xl font-display font-bold text-white mb-4">
                Client Training Center
                </h1>
                <p className="text-brand-silver max-w-2xl mx-auto text-lg">
                Resources and guides to help you maximize the value of the Signature Security platform.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
                <KPIMeter label="Modules Completed" value={completedCount.toString()} trend="up" trendValue="Total" color="green" icon={<CheckCircle />} />
                <KPIMeter label="In Progress" value={inProgressCount.toString()} trend="up" trendValue="Active" color="blue" icon={<PlayCircle />} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {modules.length === 0 ? <p className="col-span-3 text-center text-gray-500">No training modules available.</p> : modules.map((module) => (
                <div 
                    key={module.id}
                    onClick={() => setActiveModuleId(module.id)}
                    className="bg-brand-ebony p-6 rounded-xl border border-brand-800 hover:border-brand-sage/50 hover:bg-brand-800/50 transition-all flex flex-col h-full shadow-lg group relative cursor-pointer"
                >
                    <div className="flex justify-between items-start mb-4">
                        <div className="bg-brand-black w-14 h-14 rounded-lg flex items-center justify-center border border-brand-800 group-hover:border-brand-sage/30 transition-colors">
                            <BookOpen className="w-6 h-6 text-brand-sage" />
                        </div>
                        {getStatusBadge(module.status)}
                    </div>
                    
                    <h3 className="text-lg font-bold text-white mb-2 group-hover:text-brand-sage transition-colors">{module.title}</h3>
                    <p className="text-gray-400 text-sm mb-6 flex-grow leading-relaxed">{module.description}</p>
                    
                    <div className="border-t border-brand-800 pt-4 mt-auto">
                        <div className="flex justify-between items-center text-xs text-gray-500">
                            <span className="flex items-center"><Clock className="w-3 h-3 mr-1" /> {module.duration}</span>
                            {module.score !== undefined && (
                                <span className={`font-mono font-bold ${module.score >= 80 ? 'text-green-500' : 'text-red-500'}`}>Score: {module.score}%</span>
                            )}
                        </div>
                    </div>
                </div>
                ))}
            </div>
          </>
        ) : (
          <TrainingModuleViewer
            module={activeModule!}
            content={null}
            sections={getTrainingSections(activeDef?.content)}
            questions={activeDef?.questions || []}
            onUpdateStatus={updateModuleStatus}
            onSaveProgress={saveModuleProgress}
            onBack={() => setActiveModuleId(null)}
            isLead={false}
          />
        )}
      </div>
    </div>
  );
};

export default ClientTraining;
