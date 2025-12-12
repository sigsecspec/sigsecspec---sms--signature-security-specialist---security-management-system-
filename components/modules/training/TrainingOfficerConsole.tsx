
import React, { useState, useEffect } from 'react';
import { 
  CheckCircle, XCircle, Clock, BookOpen, User, Calendar, 
  Search, Filter, MapPin, RefreshCw, AlertTriangle, Shield,
  Award, ChevronRight, FileText, X, Check, Activity
} from 'lucide-react';
import { KPIMeter } from '../../common/DashboardWidgets';
import { supabase } from '../../../services/supabase';
import { InputLabel } from '../../common/FormElements';
import CertificationManagement from '../shared/CertificationManagement';

interface TrainingOfficerConsoleProps {
  onNavigate: (page: any) => void;
}

type TrainingRecord = {
  id: string;
  guardName: string;
  guardId: string;
  moduleTitle: string;
  score: number;
  submittedAt: string;
  status: string;
  avatar?: string;
  moduleCategory?: string;
  metadata?: any;
  questions?: any[];
  content?: string;
};

const TrainingOfficerConsole: React.FC<TrainingOfficerConsoleProps> = ({ onNavigate }) => {
  const [activeTab, setActiveTab] = useState<'approvals' | 'field-training' | 'certifications'>('approvals');
  const [pendingReviews, setPendingReviews] = useState<TrainingRecord[]>([]);
  const [selectedReview, setSelectedReview] = useState<TrainingRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [reviewNote, setReviewNote] = useState('');
  
  // Field Training State
  const [fieldTrainingQueue, setFieldTrainingQueue] = useState<any[]>([]);
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [selectedFieldTrainee, setSelectedFieldTrainee] = useState<any>(null);
  const [scheduleDate, setScheduleDate] = useState('');
  
  // Stats
  const [stats, setStats] = useState({
    pending: 0,
    fieldTraining: 0,
    expiringCerts: 0,
    completionRate: 92
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // 1. Fetch Pending Approvals with detailed metadata and module questions
      const { data: approvals } = await supabase
        .from('user_training_progress')
        .select(`
          id, score, updated_at, status, module_id, metadata,
          profile:profiles!user_training_progress_user_id_fkey(id, full_name, avatar_url),
          module:training_definitions(title, category, questions, content)
        `)
        .eq('status', 'pending_approval');

      if (approvals) {
        const mapped = approvals.map((a: any) => ({
          id: a.id,
          guardName: a.profile?.full_name || 'Unknown',
          guardId: a.profile?.id,
          moduleTitle: a.module?.title || 'Unknown Module',
          moduleCategory: a.module?.category,
          score: a.score || 0,
          submittedAt: new Date(a.updated_at).toLocaleDateString(),
          status: a.status,
          avatar: a.profile?.avatar_url,
          metadata: a.metadata,
          questions: a.module?.questions,
          content: a.module?.content
        }));
        setPendingReviews(mapped);
      }

      // 2. Fetch Field Training Queue
      const { data: fieldQueue } = await supabase
        .from('user_training_progress')
        .select(`
          id, updated_at,
          profile:profiles!user_training_progress_user_id_fkey(full_name),
          module:training_definitions(title)
        `)
        .eq('status', 'field_training_requested');
      
      setFieldTrainingQueue(fieldQueue || []);

      // 3. Stats
      // Fetch expiring certs count
      const { count: expiringCount } = await supabase
        .from('user_certifications')
        .select('*', { count: 'exact', head: true })
        .lt('expiry_date', new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()) // Expiring in 30 days
        .gt('expiry_date', new Date().toISOString());

      setStats({
        pending: approvals?.length || 0,
        fieldTraining: fieldQueue?.length || 0,
        expiringCerts: expiringCount || 0,
        completionRate: 92 // Mock, or calculate based on total assigned vs completed
      });

    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleReviewAction = async (action: 'approve' | 'deny' | 'retake' | 'field') => {
    if (!selectedReview) return;

    let newStatus = '';
    let notePrefix = '';

    switch (action) {
      case 'approve': newStatus = 'approved'; notePrefix = 'Approved by Training Officer.'; break;
      case 'deny': newStatus = 'denied'; notePrefix = 'Denied.'; break;
      case 'retake': newStatus = 'retake_requested'; notePrefix = 'Retake Requested.'; break;
      case 'field': newStatus = 'field_training_requested'; notePrefix = 'Field Training Required.'; break;
    }

    try {
      const { error } = await supabase.from('user_training_progress').update({
        status: newStatus,
        reviewed_at: new Date(),
        review_notes: `${notePrefix} ${reviewNote}`
      }).eq('id', selectedReview.id);

      if (error) throw error;

      // Optimistic update
      setPendingReviews(prev => prev.filter(r => r.id !== selectedReview.id));
      setSelectedReview(null);
      setReviewNote('');
      fetchData(); // Refresh stats

    } catch (e: any) {
      alert('Error updating status: ' + e.message);
    }
  };

  const handleScheduleFieldTraining = async () => {
      if(!selectedFieldTrainee || !scheduleDate) return;
      // In a real app, this would create a calendar event or notification
      alert(`Field training scheduled for ${selectedFieldTrainee.profile?.full_name} on ${scheduleDate}`);
      setIsScheduleModalOpen(false);
      setScheduleDate('');
      setSelectedFieldTrainee(null);
  };

  const RenderApprovals = () => (
    <div className="space-y-4 animate-fade-in-up">
      {pendingReviews.length === 0 ? (
        <div className="bg-brand-ebony rounded-xl border border-brand-800 p-12 text-center text-gray-500">
          <CheckCircle className="w-16 h-16 mx-auto mb-4 opacity-20" />
          <h3 className="text-xl font-bold text-white mb-2">All Caught Up</h3>
          <p>No pending training approvals found.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {pendingReviews.map(review => (
            <div key={review.id} className="bg-brand-ebony border border-brand-800 rounded-xl p-6 hover:border-brand-sage/50 transition-all group">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center">
                  <div className="w-10 h-10 rounded-full bg-brand-black border border-brand-700 flex items-center justify-center text-gray-400 font-bold mr-3">
                    {review.avatar ? <img src={review.avatar} className="w-full h-full rounded-full" /> : review.guardName.charAt(0)}
                  </div>
                  <div>
                    <h4 className="text-white font-bold text-sm">{review.guardName}</h4>
                    <p className="text-xs text-gray-500">Guard ID: {review.guardId.substring(0, 6)}</p>
                  </div>
                </div>
                <span className={`text-xs font-bold px-2 py-1 rounded border ${review.score >= 80 ? 'bg-green-900/20 text-green-400 border-green-500/30' : 'bg-red-900/20 text-red-400 border-red-500/30'}`}>
                  Score: {review.score}%
                </span>
              </div>
              
              <div className="mb-6 bg-brand-black/30 p-3 rounded border border-brand-800/50">
                <p className="text-xs text-gray-500 uppercase mb-1">Module</p>
                <p className="text-sm text-brand-silver font-medium">{review.moduleTitle}</p>
                <p className="text-xs text-gray-600 mt-1">Submitted: {review.submittedAt}</p>
              </div>

              <button 
                onClick={() => setSelectedReview(review)}
                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 rounded-lg text-sm flex items-center justify-center transition-colors shadow-lg"
              >
                Review Training
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const RenderFieldTraining = () => (
    <div className="bg-brand-ebony rounded-xl border border-brand-800 overflow-hidden animate-fade-in-up">
      <div className="p-6 border-b border-brand-800 flex justify-between items-center">
        <div>
          <h3 className="font-bold text-white text-lg">Field Training Queue</h3>
          <p className="text-gray-400 text-sm">Guards requiring practical assessment before certification.</p>
        </div>
        <button 
            className="bg-brand-sage text-black px-4 py-2 rounded text-xs font-bold hover:bg-brand-sage/90"
            onClick={() => alert("Please select a guard from the list to schedule.")}
        >
          Schedule Session
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-brand-900 border-b border-brand-800">
            <tr>
              <th className="p-4 text-xs font-bold text-gray-500 uppercase">Guard</th>
              <th className="p-4 text-xs font-bold text-gray-500 uppercase">Module</th>
              <th className="p-4 text-xs font-bold text-gray-500 uppercase">Status</th>
              <th className="p-4 text-xs font-bold text-gray-500 uppercase text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-brand-800">
            {fieldTrainingQueue.length === 0 ? (
              <tr><td colSpan={4} className="p-8 text-center text-gray-500">No field training required.</td></tr>
            ) : fieldTrainingQueue.map(item => (
              <tr key={item.id} className="hover:bg-brand-800/30">
                <td className="p-4 text-white font-bold">{item.profile?.full_name}</td>
                <td className="p-4 text-gray-300">{item.module?.title}</td>
                <td className="p-4"><span className="text-blue-400 text-xs bg-blue-900/20 px-2 py-1 rounded border border-blue-500/30">Needs Assessment</span></td>
                <td className="p-4 text-right">
                  <button 
                    onClick={() => { setSelectedFieldTrainee(item); setIsScheduleModalOpen(true); }}
                    className="text-brand-sage text-xs hover:underline font-bold"
                  >
                    Coordinate
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const QuizResults = ({ review }: { review: TrainingRecord }) => {
      const userAnswers = review.metadata?.quizState?.answers || {};
      const questions = review.questions || [];

      if (!questions.length) return <div className="text-gray-500 text-sm">No quiz data available.</div>;

      return (
          <div className="space-y-4">
              {questions.map((q: any, idx: number) => {
                  const userAnsIdx = userAnswers[idx];
                  const isCorrect = userAnsIdx === q.correct;
                  
                  return (
                      <div key={idx} className={`p-4 rounded border ${isCorrect ? 'bg-green-900/10 border-green-500/20' : 'bg-red-900/10 border-red-500/20'}`}>
                          <div className="flex items-start">
                              <div className={`mt-0.5 mr-3 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${isCorrect ? 'bg-green-500 text-black' : 'bg-red-500 text-white'}`}>
                                  {isCorrect ? <Check size={12} /> : <X size={12} />}
                              </div>
                              <div className="flex-1">
                                  <p className="text-white text-sm font-medium mb-2">{idx + 1}. {q.q}</p>
                                  <div className="space-y-1">
                                      {q.options.map((opt: string, oIdx: number) => (
                                          <div key={oIdx} className={`text-xs px-2 py-1 rounded flex justify-between ${
                                              oIdx === q.correct ? 'bg-green-500/20 text-green-400' :
                                              oIdx === userAnsIdx && !isCorrect ? 'bg-red-500/20 text-red-400' : 'text-gray-500'
                                          }`}>
                                              <span>{opt}</span>
                                              {oIdx === userAnsIdx && <span className="text-[10px] font-bold uppercase">Selected</span>}
                                              {oIdx === q.correct && oIdx !== userAnsIdx && <span className="text-[10px] font-bold uppercase">Correct Answer</span>}
                                          </div>
                                      ))}
                                  </div>
                              </div>
                          </div>
                      </div>
                  );
              })}
          </div>
      );
  };

  return (
    <div className="min-h-screen bg-brand-black text-gray-200 p-6">
      
      {/* KPI Header */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <KPIMeter label="Pending Reviews" value={stats.pending.toString()} trend="up" trendValue="Queue" color="orange" icon={<Clock />} />
        <KPIMeter label="Field Training" value={stats.fieldTraining.toString()} trend="up" trendValue="Required" color="blue" icon={<MapPin />} />
        <KPIMeter label="Expiring Certs" value={stats.expiringCerts.toString()} trend="down" trendValue="Alert" color="red" icon={<AlertTriangle />} />
        <KPIMeter label="Completion Rate" value={`${stats.completionRate}%`} trend="up" trendValue="Team" color="green" icon={<CheckCircle />} />
      </div>

      {/* Tabs */}
      <div className="flex border-b border-brand-800 mb-6 space-x-6">
        <button onClick={() => setActiveTab('approvals')} className={`pb-3 text-sm font-bold border-b-2 transition-colors ${activeTab === 'approvals' ? 'text-brand-sage border-brand-sage' : 'text-gray-500 border-transparent hover:text-white'}`}>Approvals Queue</button>
        <button onClick={() => setActiveTab('field-training')} className={`pb-3 text-sm font-bold border-b-2 transition-colors ${activeTab === 'field-training' ? 'text-brand-sage border-brand-sage' : 'text-gray-500 border-transparent hover:text-white'}`}>Field Training</button>
        <button onClick={() => setActiveTab('certifications')} className={`pb-3 text-sm font-bold border-b-2 transition-colors ${activeTab === 'certifications' ? 'text-brand-sage border-brand-sage' : 'text-gray-500 border-transparent hover:text-white'}`}>Certification Tracking</button>
      </div>

      {/* Content */}
      {loading ? (
        <div className="p-12 text-center text-gray-500">Loading Training Data...</div>
      ) : (
        <>
          {activeTab === 'approvals' && <RenderApprovals />}
          {activeTab === 'field-training' && <RenderFieldTraining />}
          {activeTab === 'certifications' && <CertificationManagement currentUserRole="Training Officer" />}
        </>
      )}

      {/* Review Modal */}
      {selectedReview && (
        <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/80 backdrop-blur-sm">
          <div className="absolute inset-0" onClick={() => setSelectedReview(null)}></div>
          <div className="relative w-full max-w-4xl h-full bg-brand-ebony border-l border-brand-800 shadow-2xl flex flex-col animate-fade-in-right">
            
            <div className="p-6 border-b border-brand-800 bg-brand-900/90 flex justify-between items-start">
              <div>
                <h3 className="text-2xl font-bold text-white mb-1">Training Review</h3>
                <p className="text-sm text-gray-400">Reviewing submission from <span className="text-white font-bold">{selectedReview.guardName}</span></p>
              </div>
              <button onClick={() => setSelectedReview(null)} className="text-gray-500 hover:text-white bg-brand-black p-2 rounded-full border border-brand-800"><X size={20} /></button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-brand-black/30 p-5 rounded-xl border border-brand-800">
                    <h4 className="text-brand-sage font-bold text-xs uppercase mb-4 flex items-center"><Activity className="w-4 h-4 mr-2" /> Assessment Summary</h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div><p className="text-xs text-gray-500">Module</p><p className="text-white font-bold">{selectedReview.moduleTitle}</p></div>
                      <div><p className="text-xs text-gray-500">Category</p><p className="text-white">{selectedReview.moduleCategory}</p></div>
                      <div><p className="text-xs text-gray-500">Score</p><p className={`font-bold ${selectedReview.score >= 80 ? 'text-green-400' : 'text-red-400'}`}>{selectedReview.score}%</p></div>
                      <div><p className="text-xs text-gray-500">Date</p><p className="text-white">{selectedReview.submittedAt}</p></div>
                    </div>
                  </div>

                  <div className="bg-brand-black/30 p-5 rounded-xl border border-brand-800">
                    <h4 className="text-brand-sage font-bold text-xs uppercase mb-4 flex items-center"><BookOpen className="w-4 h-4 mr-2" /> Progress Check</h4>
                    <div className="space-y-2">
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-gray-400">Content Sections Read</span>
                            <span className="text-green-400 font-bold flex items-center"><Check size={14} className="mr-1" /> Verified</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-gray-400">Quiz Completed</span>
                            <span className="text-green-400 font-bold flex items-center"><Check size={14} className="mr-1" /> Verified</span>
                        </div>
                        <div className="w-full bg-brand-900 h-2 rounded-full mt-2 overflow-hidden">
                            <div className="bg-green-500 h-full w-full"></div>
                        </div>
                    </div>
                  </div>
              </div>

              <div>
                  <h4 className="text-white font-bold text-sm uppercase mb-3 border-b border-brand-800 pb-2">Detailed Quiz Analysis</h4>
                  <div className="bg-brand-black/20 p-4 rounded-xl border border-brand-800 max-h-96 overflow-y-auto">
                      <QuizResults review={selectedReview} />
                  </div>
              </div>

              <div>
                <InputLabel>Review Notes</InputLabel>
                <textarea 
                  className="w-full bg-brand-black border border-brand-800 rounded p-3 text-white h-24 focus:border-brand-sage outline-none mb-4"
                  placeholder="Enter feedback or internal notes..."
                  value={reviewNote}
                  onChange={e => setReviewNote(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-1 gap-3 border-t border-brand-800 pt-6">
                <button 
                  onClick={() => handleReviewAction('approve')}
                  className="w-full bg-green-600 hover:bg-green-500 text-white font-bold py-4 rounded-xl shadow-lg flex items-center justify-center transition-transform hover:-translate-y-1"
                >
                  <CheckCircle className="w-5 h-5 mr-2" /> Approve Training
                </button>
                
                <div className="grid grid-cols-2 gap-3">
                  <button 
                    onClick={() => handleReviewAction('field')}
                    className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-lg shadow-lg flex items-center justify-center"
                  >
                    <MapPin className="w-4 h-4 mr-2" /> Request Field Training
                  </button>
                  <button 
                    onClick={() => handleReviewAction('retake')}
                    className="bg-orange-600 hover:bg-orange-500 text-white font-bold py-3 rounded-lg shadow-lg flex items-center justify-center"
                  >
                    <RefreshCw className="w-4 h-4 mr-2" /> Request Retake
                  </button>
                </div>

                <button 
                  onClick={() => handleReviewAction('deny')}
                  className="w-full border border-red-500/50 text-red-400 font-bold py-3 rounded-lg hover:bg-red-900/20 flex items-center justify-center mt-2"
                >
                  <XCircle className="w-4 h-4 mr-2" /> Deny
                </button>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* Field Training Modal */}
      {isScheduleModalOpen && selectedFieldTrainee && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
              <div className="bg-brand-ebony border border-brand-700 rounded-xl p-6 w-full max-w-md shadow-2xl animate-fade-in-up">
                  <h3 className="text-xl font-bold text-white mb-4">Schedule Field Training</h3>
                  <div className="bg-brand-black/50 p-4 rounded border border-brand-800 mb-4">
                      <p className="text-sm text-gray-400">Trainee</p>
                      <p className="text-white font-bold">{selectedFieldTrainee.profile?.full_name}</p>
                      <p className="text-sm text-gray-400 mt-2">Module</p>
                      <p className="text-brand-sage font-bold">{selectedFieldTrainee.module?.title}</p>
                  </div>
                  
                  <div className="mb-6">
                      <InputLabel>Session Date & Time</InputLabel>
                      <input 
                          type="datetime-local" 
                          className="w-full bg-brand-black border border-brand-800 rounded p-3 text-white focus:border-brand-sage outline-none"
                          value={scheduleDate}
                          onChange={(e) => setScheduleDate(e.target.value)}
                      />
                  </div>

                  <div className="flex justify-end gap-3">
                      <button onClick={() => setIsScheduleModalOpen(false)} className="text-gray-400 hover:text-white px-4 py-2">Cancel</button>
                      <button onClick={handleScheduleFieldTraining} className="bg-brand-sage text-black font-bold px-6 py-2 rounded hover:bg-brand-sage/90">Confirm Schedule</button>
                  </div>
              </div>
          </div>
      )}

    </div>
  );
};

export default TrainingOfficerConsole;
