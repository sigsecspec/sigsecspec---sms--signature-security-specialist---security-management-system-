
import React, { useState, useEffect } from 'react';
import { 
  Search, Filter, CheckCircle, XCircle, AlertTriangle, 
  Clock, BookOpen, Edit3, Plus, Trash2, Save,
  HelpCircle, Layout, RefreshCw, ChevronRight, X, UserPlus,
  MoreVertical, RotateCcw, Shield
} from 'lucide-react';
import { supabase } from '../../../services/supabase';
import { InputLabel } from '../../common/FormElements';

interface TrainingManagementProps {
  currentUserRole?: string;
}

type TabType = 'modules' | 'logs';

interface Question {
  q: string;
  options: string[];
  correct: number;
}

interface TrainingDefinition {
  id?: string;
  title: string;
  description: string;
  category: 'standard' | 'lead' | 'supervisor' | 'operations' | 'management' | 'client';
  duration: string;
  content: string;
  questions: Question[];
  active: boolean;
}

const TrainingManagement: React.FC<TrainingManagementProps> = ({ currentUserRole = 'Owner' }) => {
  const [activeTab, setActiveTab] = useState<TabType>('logs');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [dbError, setDbError] = useState<string | null>(null);

  // Module Editor State
  const [trainingModules, setTrainingModules] = useState<TrainingDefinition[]>([]);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingModule, setEditingModule] = useState<TrainingDefinition>({
      title: '',
      description: '',
      category: 'standard',
      duration: '30m',
      content: '',
      questions: [],
      active: true
  });

  // Assign Training State
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [guards, setGuards] = useState<any[]>([]);
  const [assignGuardId, setAssignGuardId] = useState('');
  const [assignModuleId, setAssignModuleId] = useState('');

  // Logs State
  const [trainingLogs, setTrainingLogs] = useState<any[]>([]);

  const canManageContent = ['Owner', 'Management', 'Operations', 'Training Officer'].includes(currentUserRole);

  useEffect(() => {
    if (activeTab === 'modules') {
        fetchTrainingDefinitions();
    } else {
        fetchTrainingLogs();
    }
  }, [activeTab]);

  const fetchTrainingDefinitions = async () => {
      setLoading(true);
      setDbError(null);
      try {
          const { data, error } = await supabase.from('training_definitions').select('*').order('title', { ascending: true });
          if (error) throw error;
          if (data) setTrainingModules(data as any);
      } catch (e: any) {
          setDbError(e.message);
      } finally {
          setLoading(false);
      }
  };

  const fetchTrainingLogs = async () => {
      setLoading(true);
      try {
          const { data: trainingData } = await supabase
              .from('user_training_progress')
              .select(`
                  id, user_id, module_id, status, score, updated_at, completed_at,
                  user:profiles!user_training_progress_user_id_fkey ( full_name, email ),
                  module:training_definitions ( title, category )
              `)
              .order('updated_at', { ascending: false });

          if (trainingData) {
               setTrainingLogs(trainingData);
          }
      } catch (e) {
          console.error(e);
      } finally {
          setLoading(false);
      }
  };

  // --- Assign Training Handlers ---
  useEffect(() => {
      if (isAssignModalOpen) {
          const fetchGuards = async () => {
              const { data } = await supabase
                  .from('profiles')
                  .select('id, full_name, email, role')
                  .in('role', ['guard', 'supervisor', 'operations'])
                  .eq('status', 'active')
                  .order('full_name');
              setGuards(data || []);
              
              // Ensure modules are loaded for selection
              if (trainingModules.length === 0) fetchTrainingDefinitions();
          };
          fetchGuards();
      }
  }, [isAssignModalOpen]);

  const handleAssignTraining = async () => {
      if (!assignGuardId || !assignModuleId) {
          alert("Please select both a guard and a module.");
          return;
      }
      try {
          const { error } = await supabase.from('user_training_progress').upsert({
              user_id: assignGuardId,
              module_id: assignModuleId,
              status: 'in_progress', // Set to in_progress so it appears on their dashboard immediately
              score: 0,
              attempts: 0,
              updated_at: new Date()
          }, { onConflict: 'user_id, module_id' });

          if (error) throw error;
          
          alert("Training assigned successfully.");
          setIsAssignModalOpen(false);
          setAssignGuardId('');
          setAssignModuleId('');
          fetchTrainingLogs(); // Refresh logs if open
      } catch (e: any) {
          alert("Error assigning training: " + e.message);
      }
  };

  const handleLogAction = async (logId: string, action: 'approve' | 'retake' | 'reset') => {
      let updates: any = { updated_at: new Date().toISOString() };
      
      if (action === 'approve') {
          if (!confirm("Are you sure you want to force approve this training?")) return;
          updates.status = 'approved';
          updates.completed_at = new Date().toISOString();
          updates.score = 100; // Manual approval implies pass
      } else if (action === 'retake') {
          if (!confirm("This will require the user to take the module again. Continue?")) return;
          updates.status = 'retake_requested';
      } else if (action === 'reset') {
          if (!confirm("This will completely wipe progress for this module. Continue?")) return;
          updates.status = 'not_started';
          updates.score = null;
          updates.metadata = {};
          updates.completed_at = null;
          updates.attempts = 0;
      }

      try {
          const { error } = await supabase.from('user_training_progress').update(updates).eq('id', logId);
          if (error) throw error;
          fetchTrainingLogs();
      } catch (e: any) {
          alert("Error: " + e.message);
      }
  };

  // --- Module Editor Handlers ---

  const handleSaveModule = async () => {
      if (!editingModule.title || !editingModule.content) {
          alert("Title and Content are required.");
          return;
      }
      const payload = {
          title: editingModule.title,
          description: editingModule.description,
          category: editingModule.category,
          duration: editingModule.duration,
          content: editingModule.content,
          questions: editingModule.questions,
          active: editingModule.active
      };
      try {
          if (editingModule.id) {
              const { error } = await supabase.from('training_definitions').update(payload).eq('id', editingModule.id);
              if (error) throw error;
          } else {
              const { error } = await supabase.from('training_definitions').insert(payload);
              if (error) throw error;
          }
          setIsEditorOpen(false);
          fetchTrainingDefinitions();
      } catch (e: any) {
          alert("Error saving module: " + e.message);
      }
  };

  const handleDeleteModule = async (id: string) => {
      if (!confirm("Are you sure you want to delete this module?")) return;
      const { error } = await supabase.from('training_definitions').delete().eq('id', id);
      if (error) alert("Error: " + error.message);
      else fetchTrainingDefinitions();
  };

  const addQuestion = () => setEditingModule(prev => ({ ...prev, questions: [...prev.questions, { q: 'New Question', options: ['A', 'B'], correct: 0 }] }));
  const updateQuestion = (idx: number, field: keyof Question, value: any) => { const n = [...editingModule.questions]; n[idx] = { ...n[idx], [field]: value }; setEditingModule(prev => ({ ...prev, questions: n })); };
  const addOption = (qIdx: number) => { setEditingModule(prev => { const n = prev.questions.map((q, i) => i === qIdx ? { ...q, options: [...q.options, 'New Option'] } : q); return { ...prev, questions: n }; }); };
  const updateOption = (qIdx: number, oIdx: number, value: string) => { setEditingModule(prev => { const n = prev.questions.map((q, i) => i === qIdx ? { ...q, options: q.options.map((o, oi) => oi === oIdx ? value : o) } : q); return { ...prev, questions: n }; }); };
  const removeQuestion = (idx: number) => setEditingModule(prev => ({ ...prev, questions: prev.questions.filter((_, i) => i !== idx) }));
  const openEditor = (module?: TrainingDefinition) => { setEditingModule(module || { title: '', description: '', category: 'standard', duration: '30m', content: '', questions: [], active: true }); setIsEditorOpen(true); };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-600 text-white';
      case 'denied': return 'bg-red-600 text-white';
      case 'pending_approval': return 'bg-orange-600 text-white';
      case 'in_progress': return 'bg-blue-600 text-white';
      case 'retake_requested': return 'bg-yellow-500 text-black';
      default: return 'bg-gray-700 text-white';
    }
  };

  const RenderModuleEditor = () => (
      <div className="bg-brand-ebony rounded-xl border border-brand-800 overflow-hidden shadow-xl animate-fade-in-up flex flex-col h-[75vh]">
          <div className="p-6 border-b border-brand-800 flex justify-between items-center bg-brand-900/50 shrink-0">
              <h3 className="font-bold text-white flex items-center"><BookOpen className="w-5 h-5 mr-2 text-brand-sage" /> Training Curriculum</h3>
              {canManageContent && (
                  <button onClick={() => openEditor()} className="bg-brand-sage text-black px-4 py-2 rounded font-bold text-xs hover:bg-brand-sage/90 transition-colors flex items-center">
                      <Plus className="w-4 h-4 mr-2" /> Create Module
                  </button>
              )}
          </div>
          {dbError && <div className="p-4 bg-red-900/20 text-red-400 border-b border-red-500/30 text-sm shrink-0">{dbError}</div>}
          <div className="divide-y divide-brand-800 overflow-y-auto flex-1 min-h-0">
              {trainingModules.map(m => (
                  <div key={m.id} className="p-4 flex flex-col md:flex-row justify-between items-center hover:bg-brand-800/30 transition-colors gap-4">
                      <div className="flex-1">
                          <h4 className="text-white font-bold text-sm flex items-center">{m.title} {!m.active && <span className="ml-2 px-2 py-0.5 bg-red-900/30 text-red-400 text-[10px] rounded uppercase">Inactive</span>}</h4>
                          <p className="text-xs text-gray-500 mt-1 line-clamp-1">{m.description}</p>
                          <div className="flex items-center gap-4 mt-2">
                              <span className="text-[10px] bg-brand-black px-2 py-0.5 rounded border border-brand-700 text-brand-silver uppercase">{m.category}</span>
                              <span className="text-xs text-gray-400 flex items-center"><Clock className="w-3 h-3 mr-1" /> {m.duration}</span>
                          </div>
                      </div>
                      {canManageContent && (
                          <div className="flex gap-2">
                              <button onClick={() => openEditor(m)} className="p-2 text-gray-400 hover:text-white bg-brand-black rounded border border-brand-700 hover:border-brand-sage transition-colors"><Edit3 size={16} /></button>
                              <button onClick={() => m.id && handleDeleteModule(m.id)} className="p-2 text-gray-400 hover:text-red-400 bg-brand-black rounded border border-brand-700 hover:border-red-500 transition-colors"><Trash2 size={16} /></button>
                          </div>
                      )}
                  </div>
              ))}
          </div>
      </div>
  );

  const EditorModal = () => (
      <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 p-4 backdrop-blur-sm">
          <div className="bg-brand-ebony border border-brand-700 rounded-xl w-full max-w-4xl h-[90vh] flex flex-col shadow-2xl animate-fade-in-up">
              <div className="p-6 border-b border-brand-800 flex justify-between items-center bg-brand-900/50 rounded-t-xl shrink-0">
                  <h3 className="text-xl font-bold text-white">{editingModule.id ? 'Edit Module' : 'New Training Module'}</h3>
                  <button onClick={() => setIsEditorOpen(false)} className="text-gray-400 hover:text-white"><X size={24} /></button>
              </div>
              <div className="flex-1 overflow-y-auto p-6 space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="md:col-span-2"><label className="block text-sm font-bold text-gray-400 mb-1">Module Title</label><input className="w-full bg-brand-black border border-brand-800 rounded p-3 text-white focus:border-brand-sage outline-none" value={editingModule.title} onChange={e => setEditingModule({...editingModule, title: e.target.value})} /></div>
                      <div>
                          <label className="block text-sm font-bold text-gray-400 mb-1">Category</label>
                          <select className="w-full bg-brand-black border border-brand-800 rounded p-3 text-white focus:border-brand-sage outline-none" value={editingModule.category} onChange={e => setEditingModule({...editingModule, category: e.target.value as any})}>
                              <option value="standard">Standard Guard</option><option value="lead">Lead Guard</option><option value="supervisor">Supervisor</option><option value="operations">Operations</option><option value="management">Management</option><option value="client">Client</option>
                          </select>
                      </div>
                      <div><label className="block text-sm font-bold text-gray-400 mb-1">Duration</label><input className="w-full bg-brand-black border border-brand-800 rounded p-3 text-white focus:border-brand-sage outline-none" value={editingModule.duration} onChange={e => setEditingModule({...editingModule, duration: e.target.value})} /></div>
                      <div className="md:col-span-2"><label className="block text-sm font-bold text-gray-400 mb-1">Short Description</label><textarea className="w-full bg-brand-black border border-brand-800 rounded p-3 text-white focus:border-brand-sage outline-none h-20" value={editingModule.description} onChange={e => setEditingModule({...editingModule, description: e.target.value})} /></div>
                  </div>
                  <div><h4 className="text-brand-sage font-bold uppercase text-sm border-b border-brand-800 pb-2 mb-4 flex items-center"><Layout className="w-4 h-4 mr-2" /> Training Content (HTML Supported)</h4><textarea className="w-full bg-brand-black border border-brand-800 rounded p-4 text-white font-mono text-sm h-64 focus:border-brand-sage outline-none leading-relaxed" value={editingModule.content} onChange={e => setEditingModule({...editingModule, content: e.target.value})} /></div>
                  <div>
                      <div className="flex justify-between items-center border-b border-brand-800 pb-2 mb-4"><h4 className="text-brand-sage font-bold uppercase text-sm flex items-center"><HelpCircle className="w-4 h-4 mr-2" /> Quiz Questions</h4><button onClick={addQuestion} className="text-xs bg-brand-800 hover:bg-brand-700 text-white px-3 py-1 rounded flex items-center"><Plus className="w-3 h-3 mr-1" /> Add</button></div>
                      <div className="space-y-6">{editingModule.questions.map((q, qIdx) => (<div key={qIdx} className="bg-brand-900/30 border border-brand-800 p-4 rounded-lg relative"><button onClick={() => removeQuestion(qIdx)} className="absolute top-4 right-4 text-gray-500 hover:text-red-400"><Trash2 size={16} /></button><div className="mb-4 pr-8"><label className="block text-xs font-bold text-gray-500 uppercase mb-1">Question {qIdx + 1}</label><input className="w-full bg-brand-black border border-brand-800 rounded p-2 text-white text-sm" value={q.q} onChange={e => updateQuestion(qIdx, 'q', e.target.value)} /></div><div className="space-y-2">{q.options.map((opt, oIdx) => (<div key={oIdx} className="flex items-center gap-2"><input type="radio" name={`correct-${qIdx}`} checked={q.correct === oIdx} onChange={() => updateQuestion(qIdx, 'correct', oIdx)} className="accent-brand-sage" /><input className="flex-1 bg-brand-black border border-brand-800 rounded p-2 text-white text-xs" value={opt} onChange={e => updateOption(qIdx, oIdx, e.target.value)} /></div>))}<button onClick={() => addOption(qIdx)} className="text-xs text-brand-sage hover:underline ml-6">+ Add Option</button></div></div>))}</div>
                  </div>
                  <div className="flex items-center gap-2"><input type="checkbox" checked={editingModule.active} onChange={e => setEditingModule({...editingModule, active: e.target.checked})} className="accent-brand-sage w-4 h-4" /><span className="text-white text-sm">Module is Active</span></div>
              </div>
              <div className="p-6 border-t border-brand-800 bg-brand-ebony rounded-b-xl flex justify-end gap-3 shrink-0"><button onClick={() => setIsEditorOpen(false)} className="px-6 py-3 rounded text-gray-400 hover:text-white hover:bg-brand-800 transition-colors">Cancel</button><button onClick={handleSaveModule} className="px-8 py-3 bg-brand-sage text-black font-bold rounded shadow-lg hover:bg-brand-sage/90 flex items-center transition-transform hover:-translate-y-1"><Save className="w-4 h-4 mr-2" /> Save Module</button></div>
          </div>
      </div>
  );

  const RenderLogs = () => {
      const filteredLogs = trainingLogs.filter(l => 
          l.user?.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
          l.module?.title?.toLowerCase().includes(searchQuery.toLowerCase())
      );

      return (
        <div className="bg-brand-ebony rounded-xl border border-brand-800 overflow-hidden shadow-xl animate-fade-in-up flex flex-col h-[75vh]">
            <div className="overflow-auto flex-1 min-h-0">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-brand-900 border-b border-brand-800 sticky top-0 z-10">
                        <tr>
                            <th className="p-4 text-xs font-bold text-gray-500 uppercase bg-brand-900">User</th>
                            <th className="p-4 text-xs font-bold text-gray-500 uppercase bg-brand-900">Module</th>
                            <th className="p-4 text-xs font-bold text-gray-500 uppercase bg-brand-900">Last Updated</th>
                            <th className="p-4 text-xs font-bold text-gray-500 uppercase bg-brand-900">Score</th>
                            <th className="p-4 text-xs font-bold text-gray-500 uppercase bg-brand-900">Status</th>
                            <th className="p-4 text-xs font-bold text-gray-500 uppercase bg-brand-900 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-brand-800">
                        {filteredLogs.length === 0 ? (
                            <tr><td colSpan={6} className="p-8 text-center text-gray-500">No training records found.</td></tr>
                        ) : filteredLogs.map(log => (
                            <tr key={log.id} className="hover:bg-brand-800/40 group">
                                <td className="p-4">
                                    <div className="font-bold text-white text-sm">{log.user?.full_name || 'Unknown'}</div>
                                    <div className="text-xs text-gray-500">{log.user?.email}</div>
                                </td>
                                <td className="p-4">
                                    <div className="text-sm text-gray-300">{log.module?.title}</div>
                                    <div className="text-xs text-gray-500">{log.module?.category}</div>
                                </td>
                                <td className="p-4 text-xs text-gray-400">{new Date(log.updated_at).toLocaleString()}</td>
                                <td className="p-4 font-mono font-bold text-white">{log.score !== undefined && log.score !== null ? `${log.score}%` : '-'}</td>
                                <td className="p-4">
                                    <span className={`inline-flex items-center px-2.5 py-1 rounded text-[10px] font-bold uppercase tracking-wide ${getStatusStyle(log.status)}`}>
                                        {log.status.replace('_', ' ')}
                                    </span>
                                </td>
                                <td className="p-4 text-right">
                                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button 
                                            onClick={() => handleLogAction(log.id, 'approve')}
                                            className="p-1.5 text-green-400 hover:text-green-300 hover:bg-green-900/30 rounded"
                                            title="Force Approve"
                                        >
                                            <CheckCircle size={16} />
                                        </button>
                                        <button 
                                            onClick={() => handleLogAction(log.id, 'retake')}
                                            className="p-1.5 text-yellow-400 hover:text-yellow-300 hover:bg-yellow-900/30 rounded"
                                            title="Request Retake"
                                        >
                                            <RotateCcw size={16} />
                                        </button>
                                        <button 
                                            onClick={() => handleLogAction(log.id, 'reset')}
                                            className="p-1.5 text-red-400 hover:text-red-300 hover:bg-red-900/30 rounded"
                                            title="Reset Progress"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
      );
  };

  return (
    <div className="flex flex-col bg-brand-black text-gray-200 animate-fade-in-up w-full h-full">
      {/* Header */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-display font-bold text-white flex items-center">
            <BookOpen className="w-6 h-6 mr-3 text-brand-sage" />
            Training Management
          </h2>
          <p className="text-sm text-gray-500 mt-1 ml-9">Manage curriculum content and monitor global training progress.</p>
        </div>
        
        <div className="flex gap-3">
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input 
                    type="text" 
                    placeholder="Search modules or users..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-brand-ebony border border-brand-800 rounded pl-10 pr-4 py-2 text-sm text-white focus:border-brand-sage outline-none" 
                />
            </div>
            {canManageContent && (
                 <button onClick={() => setIsAssignModalOpen(true)} className="bg-brand-sage text-black px-4 py-2 rounded font-bold text-xs hover:bg-brand-sage/90 transition-colors flex items-center">
                     <UserPlus className="w-4 h-4 mr-2" /> Assign Training
                 </button>
            )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex overflow-x-auto border-b border-brand-800 mb-6 scrollbar-hide">
        <button
            onClick={() => setActiveTab('logs')}
            className={`flex items-center px-6 py-4 border-b-2 font-medium text-sm whitespace-nowrap transition-colors ${
            activeTab === 'logs' 
                ? 'border-brand-sage text-brand-sage bg-brand-sage/5' 
                : 'border-transparent text-gray-400 hover:text-white hover:bg-brand-ebony'
            }`}
        >
            <Clock size={16} className="mr-2" /> Training Logs
        </button>
        <button
            onClick={() => setActiveTab('modules')}
            className={`flex items-center px-6 py-4 border-b-2 font-medium text-sm whitespace-nowrap transition-colors ${
            activeTab === 'modules' 
                ? 'border-brand-sage text-brand-sage bg-brand-sage/5' 
                : 'border-transparent text-gray-400 hover:text-white hover:bg-brand-ebony'
            }`}
        >
            <BookOpen size={16} className="mr-2" /> Curriculum (Modules)
        </button>
      </div>

      {loading ? (
          <div className="p-12 text-center text-gray-500">Loading Data...</div>
      ) : (
          <>
            {activeTab === 'logs' && <RenderLogs />}
            {activeTab === 'modules' && <RenderModuleEditor />}
          </>
      )}

      {isEditorOpen && <EditorModal />}

      {/* Assign Training Modal */}
      {isAssignModalOpen && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 p-4 backdrop-blur-sm">
              <div className="bg-brand-ebony border border-brand-700 rounded-xl w-full max-w-lg shadow-2xl animate-fade-in-up">
                  <div className="p-6 border-b border-brand-800 flex justify-between items-center bg-brand-900/50 rounded-t-xl">
                      <h3 className="text-xl font-bold text-white">Assign Training Module</h3>
                      <button onClick={() => setIsAssignModalOpen(false)} className="text-gray-400 hover:text-white"><X size={24} /></button>
                  </div>
                  <div className="p-6 space-y-6">
                      <div>
                          <InputLabel>Select Guard</InputLabel>
                          <select 
                              className="w-full bg-brand-black border border-brand-800 rounded p-3 text-white focus:border-brand-sage outline-none"
                              value={assignGuardId}
                              onChange={(e) => setAssignGuardId(e.target.value)}
                          >
                              <option value="">-- Select Guard --</option>
                              {guards.map(g => (
                                  <option key={g.id} value={g.id}>{g.full_name} ({g.role})</option>
                              ))}
                          </select>
                      </div>
                      <div>
                          <InputLabel>Select Module</InputLabel>
                          <select 
                              className="w-full bg-brand-black border border-brand-800 rounded p-3 text-white focus:border-brand-sage outline-none"
                              value={assignModuleId}
                              onChange={(e) => setAssignModuleId(e.target.value)}
                          >
                              <option value="">-- Select Module --</option>
                              {trainingModules.filter(m => m.active).map(m => (
                                  <option key={m.id} value={m.id}>{m.title} ({m.category})</option>
                              ))}
                          </select>
                      </div>
                      
                      <div className="flex justify-end gap-3 pt-4">
                          <button onClick={() => setIsAssignModalOpen(false)} className="px-4 py-2 text-gray-400 hover:text-white">Cancel</button>
                          <button onClick={handleAssignTraining} className="px-6 py-2 bg-brand-sage text-black font-bold rounded shadow-lg hover:bg-brand-sage/90">Assign</button>
                      </div>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default TrainingManagement;
