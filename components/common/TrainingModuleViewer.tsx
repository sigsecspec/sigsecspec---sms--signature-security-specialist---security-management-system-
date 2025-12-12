
import React, { useState, useEffect, useRef } from 'react';
import { 
  BookOpen, AlertTriangle, PlayCircle, CheckCircle, Clock, XCircle, 
  RefreshCw, ChevronRight, ChevronLeft, Volume2, PauseCircle, Save,
  Award, Shield, FileText
} from 'lucide-react';
import { TrainingModule, TrainingStatus } from '../../types';

export interface TrainingSection {
  title: string;
  content: React.ReactNode;
  hasAudio?: boolean;
  minTimeSeconds?: number; // Minimum time required to spend on this section
}

interface TrainingModuleViewerProps {
  module: TrainingModule;
  content: React.ReactNode; // Legacy single content support
  sections?: TrainingSection[]; // New multi-section support
  questions: { q: string; options: string[]; correct: number }[];
  onUpdateStatus: (id: string, status: TrainingStatus, score?: number) => void;
  onSaveProgress?: (id: string, progress: any) => void;
  onBack: () => void;
  isLead?: boolean;
}

export const TrainingModuleViewer: React.FC<TrainingModuleViewerProps> = ({ 
  module, 
  content, 
  sections,
  questions, 
  onUpdateStatus, 
  onSaveProgress,
  onBack,
  isLead 
}) => {
  const [viewState, setViewState] = useState<'content' | 'quiz' | 'result'>('content');
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0);
  const [sectionProgress, setSectionProgress] = useState<boolean[]>([]);
  const [quizAnswers, setQuizAnswers] = useState<Record<number, number>>({});
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  
  // Timer State
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [canProceed, setCanProceed] = useState(false);
  
  // Audio Player State
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioProgress, setAudioProgress] = useState(0);

  // Initialize state from module progress
  useEffect(() => {
    if (sections) {
      if (module.progress && module.progress.sectionProgress) {
          setSectionProgress(module.progress.sectionProgress);
          setCurrentSectionIndex(module.progress.currentSectionIndex || 0);
      } else {
          setSectionProgress(new Array(sections.length).fill(false));
      }
    }
    if (module.progress && module.progress.quizState) {
        setQuizAnswers(module.progress.quizState.answers || {});
        setCurrentQuestionIndex(module.progress.quizState.currentQuestion || 0);
        if (module.progress.quizState.inQuiz) {
            setViewState('quiz');
        }
    }
  }, [sections, module.progress]);

  // Section Timer Logic
  useEffect(() => {
    if (sections && viewState === 'content') {
        const currentSec = sections[currentSectionIndex];
        // Default to 5 seconds if not specified, or 0 if already completed
        const requiredTime = sectionProgress[currentSectionIndex] ? 0 : (currentSec.minTimeSeconds || 5);
        
        setTimeRemaining(requiredTime);
        setCanProceed(requiredTime === 0);

        if (requiredTime > 0) {
            const timer = setInterval(() => {
                setTimeRemaining((prev) => {
                    if (prev <= 1) {
                        clearInterval(timer);
                        setCanProceed(true);
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
            return () => clearInterval(timer);
        }
    }
  }, [currentSectionIndex, sections, viewState]);

  // Save Progress Helper
  const saveState = (overrideState: any = {}) => {
      if (onSaveProgress) {
          const state = {
              sectionProgress,
              currentSectionIndex,
              quizState: {
                  inQuiz: viewState === 'quiz',
                  currentQuestion: currentQuestionIndex,
                  answers: quizAnswers
              },
              ...overrideState
          };
          onSaveProgress(module.id, state);
      }
  };

  // Mock Audio Timer
  useEffect(() => {
    let interval: any;
    if (isPlaying && audioProgress < 100) {
      interval = setInterval(() => {
        setAudioProgress(prev => (prev >= 100 ? 100 : prev + 1));
      }, 100);
    } else if (audioProgress >= 100) {
      setIsPlaying(false);
    }
    return () => clearInterval(interval);
  }, [isPlaying, audioProgress]);

  const handleStartQuiz = () => {
    if (sections) {
        const allComplete = sectionProgress.every(p => p);
        if (!allComplete) {
            alert("Please complete all training sections before starting the final exam.");
            return;
        }
    }
    onUpdateStatus(module.id, 'in_progress');
    setViewState('quiz');
    setCurrentQuestionIndex(0);
    saveState({ quizState: { inQuiz: true, currentQuestion: 0, answers: {} } });
  };

  const markSectionComplete = (index: number) => {
    if (!sectionProgress[index]) {
        const newProgress = [...sectionProgress];
        newProgress[index] = true;
        setSectionProgress(newProgress);
        // Auto-save
        if (onSaveProgress) {
            onSaveProgress(module.id, {
                sectionProgress: newProgress,
                currentSectionIndex,
                quizState: { inQuiz: viewState === 'quiz', currentQuestion: currentQuestionIndex, answers: quizAnswers }
            });
        }
    }
  };

  const handleNextSection = () => {
    if (!canProceed) return;
    
    // Mark current as complete when leaving
    markSectionComplete(currentSectionIndex);

    if (sections && currentSectionIndex < sections.length - 1) {
      const nextIndex = currentSectionIndex + 1;
      setCurrentSectionIndex(nextIndex);
      window.scrollTo(0, 0);
      saveState({ currentSectionIndex: nextIndex });
    } else if (sections && currentSectionIndex === sections.length - 1) {
      handleStartQuiz();
    }
  };

  const handlePrevSection = () => {
    if (currentSectionIndex > 0) {
      const prevIndex = currentSectionIndex - 1;
      setCurrentSectionIndex(prevIndex);
      window.scrollTo(0, 0);
      saveState({ currentSectionIndex: prevIndex });
    }
  };

  const handleSubmitQuiz = () => {
    if (window.confirm("You are about to submit your final exam. This will be recorded.")) {
        let correctCount = 0;
        questions.forEach((q, idx) => {
        if (quizAnswers[idx] === q.correct) correctCount++;
        });
        
        const score = Math.round((correctCount / questions.length) * 100);
        const passed = score >= 80;
        
        onUpdateStatus(module.id, passed ? 'pending_approval' : 'denied', score);
        setViewState('result');
        // Clear progress quiz state on finish
        if (onSaveProgress) onSaveProgress(module.id, { ...module.progress, quizState: { inQuiz: false, answers: {} } });
    }
  };

  const handleAnswerSelect = (qIndex: number, aIndex: number) => {
      const newAnswers = { ...quizAnswers, [qIndex]: aIndex };
      setQuizAnswers(newAnswers);
      // Auto-save
      if (onSaveProgress) {
          onSaveProgress(module.id, {
              sectionProgress,
              currentSectionIndex,
              quizState: { inQuiz: true, currentQuestion: currentQuestionIndex, answers: newAnswers }
          });
      }
  };

  const handleNextQuestion = () => {
      const nextQ = Math.min(questions.length - 1, currentQuestionIndex + 1);
      setCurrentQuestionIndex(nextQ);
      saveState({ quizState: { inQuiz: true, currentQuestion: nextQ, answers: quizAnswers } });
  };

  // --- RENDERERS ---

  const renderAudioPlayer = () => (
    <div className="bg-brand-black/50 p-4 rounded-lg border border-brand-800 mb-6 flex items-center space-x-4 backdrop-blur-sm">
      <button 
        onClick={() => setIsPlaying(!isPlaying)}
        className="w-12 h-12 rounded-full bg-brand-sage text-black flex items-center justify-center hover:bg-white transition-colors shadow-lg"
      >
        {isPlaying ? <PauseCircle size={24} /> : <PlayCircle size={24} />}
      </button>
      <div className="flex-1">
        <div className="flex justify-between text-xs text-gray-400 mb-1">
          <span className="uppercase font-bold tracking-wider">Audio Narration</span>
          <span>{Math.floor((audioProgress / 100) * 5)}:00 / 05:00</span>
        </div>
        <div className="w-full bg-brand-900 h-1.5 rounded-full overflow-hidden">
          <div 
            className="h-full bg-brand-sage transition-all duration-100 ease-linear shadow-[0_0_10px_rgba(124,154,146,0.5)]"
            style={{ width: `${audioProgress}%` }}
          ></div>
        </div>
      </div>
      <Volume2 className="text-gray-500 w-5 h-5" />
    </div>
  );

  // --- CONTENT VIEW ---
  if (viewState === 'content') {
    if (!sections) return <div>No content available.</div>;

    const currentSection = sections[currentSectionIndex];
    const isLastSection = currentSectionIndex === sections.length - 1;

    return (
      <div className="flex flex-col lg:flex-row gap-6 animate-fade-in-up h-[calc(100vh-200px)]">
        
        {/* Sidebar Navigation */}
        <div className="w-full lg:w-72 flex-shrink-0 flex flex-col">
            <div className="bg-brand-ebony rounded-xl border border-brand-800 overflow-hidden flex-1 flex flex-col shadow-xl">
                <div className="p-5 bg-brand-900/50 border-b border-brand-800">
                    <h3 className="text-white font-bold text-sm uppercase tracking-wider flex items-center">
                        <BookOpen className="w-4 h-4 mr-2 text-brand-sage" /> Course Map
                    </h3>
                </div>
                <div className="p-3 overflow-y-auto flex-1 space-y-1">
                    {sections.map((sec, idx) => (
                        <button
                            key={idx}
                            onClick={() => {
                                // Only allow navigation to completed sections or current
                                if (sectionProgress[idx] || idx <= currentSectionIndex) {
                                    setCurrentSectionIndex(idx);
                                    saveState({ currentSectionIndex: idx });
                                }
                            }}
                            className={`w-full text-left px-4 py-3 rounded-lg text-xs font-bold flex items-center justify-between transition-all ${
                                currentSectionIndex === idx 
                                ? 'bg-brand-sage text-black shadow-md' 
                                : sectionProgress[idx]
                                    ? 'bg-brand-900/30 text-green-400 hover:bg-brand-800'
                                    : 'text-gray-600 cursor-not-allowed'
                            }`}
                            disabled={!sectionProgress[idx] && idx > currentSectionIndex}
                        >
                            <span className="truncate mr-2 line-clamp-1">{idx + 1}. {sec.title}</span>
                            {sectionProgress[idx] && <CheckCircle size={14} className={currentSectionIndex === idx ? "text-black" : "text-green-500"} />}
                        </button>
                    ))}
                </div>
                <div className="p-4 border-t border-brand-800 bg-brand-black/20">
                    <div className="flex justify-between text-xs text-gray-500 mb-2 uppercase font-bold tracking-wider">
                        <span>Progress</span>
                        <span>{Math.round((sectionProgress.filter(p=>p).length / sections.length) * 100)}%</span>
                    </div>
                    <div className="w-full bg-brand-900 h-2 rounded-full overflow-hidden border border-brand-800">
                        <div className="bg-brand-sage h-full transition-all duration-500" style={{ width: `${(sectionProgress.filter(p=>p).length / sections.length) * 100}%` }}></div>
                    </div>
                </div>
            </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 bg-brand-ebony rounded-xl border border-brand-800 overflow-hidden flex flex-col shadow-2xl relative">
            {/* Header */}
            <div className="p-6 border-b border-brand-800 flex justify-between items-center bg-brand-900/30 backdrop-blur-sm sticky top-0 z-10">
                <div>
                    <h2 className="text-xl md:text-2xl font-display font-bold text-white tracking-wide">{currentSection.title}</h2>
                    <p className="text-xs text-brand-silver mt-1 uppercase tracking-wider">Section {currentSectionIndex + 1} of {sections.length}</p>
                </div>
                {timeRemaining > 0 && (
                    <div className="flex items-center px-4 py-2 bg-brand-black border border-brand-800 rounded-lg text-orange-400 animate-pulse">
                        <Clock size={16} className="mr-2" />
                        <span className="font-mono font-bold">{timeRemaining}s</span>
                    </div>
                )}
            </div>
            
            {/* Scrollable Content */}
            <div className="p-6 md:p-10 flex-1 overflow-y-auto bg-brand-black/10">
                {currentSection.hasAudio && renderAudioPlayer()}
                
                <div className="prose prose-invert prose-lg max-w-none mb-12 text-gray-300 leading-relaxed">
                    {currentSection.content}
                </div>
            </div>

            {/* Footer Navigation */}
            <div className="p-6 border-t border-brand-800 bg-brand-ebony/90 backdrop-blur-md flex justify-between items-center">
                <button 
                    onClick={handlePrevSection}
                    disabled={currentSectionIndex === 0}
                    className="px-6 py-3 rounded-lg text-sm font-bold text-gray-400 border border-brand-700 hover:text-white hover:bg-brand-800 disabled:opacity-30 disabled:cursor-not-allowed flex items-center transition-all"
                >
                    <ChevronLeft size={16} className="mr-2" /> Previous
                </button>
                
                <div className="flex gap-4">
                    {canProceed ? (
                        <button 
                            onClick={handleNextSection}
                            className={`px-8 py-3 rounded-lg font-bold text-sm shadow-lg flex items-center transition-all transform hover:-translate-y-1 ${
                                isLastSection 
                                ? 'bg-green-600 hover:bg-green-500 text-white' 
                                : 'bg-brand-sage text-black hover:bg-brand-sage/90'
                            }`}
                        >
                            {isLastSection ? (
                                <>Start Final Exam <Shield size={16} className="ml-2" /></>
                            ) : (
                                <>Next Section <ChevronRight size={16} className="ml-2" /></>
                            )}
                        </button>
                    ) : (
                        <button disabled className="px-8 py-3 rounded-lg font-bold text-sm bg-brand-800 text-gray-500 cursor-not-allowed flex items-center border border-brand-700">
                            <Clock size={16} className="mr-2" /> {timeRemaining}s Required
                        </button>
                    )}
                </div>
            </div>
        </div>
      </div>
    );
  }

  // --- QUIZ VIEW ---
  if (viewState === 'quiz') {
      const currentQ = questions[currentQuestionIndex];
      const answeredCount = Object.keys(quizAnswers).length;

      return (
        <div className="bg-brand-ebony rounded-xl border border-brand-800 overflow-hidden max-w-4xl mx-auto animate-fade-in-up shadow-2xl">
             <div className="bg-red-900/20 border-b border-red-500/20 p-4 text-center">
                 <p className="text-red-400 text-sm font-bold flex items-center justify-center uppercase tracking-wider">
                     <AlertTriangle className="w-4 h-4 mr-2" /> Certification Exam In Progress
                 </p>
             </div>

             <div className="bg-brand-900/50 p-8 border-b border-brand-800 flex justify-between items-center">
                <div>
                    <h3 className="text-white font-bold text-2xl font-display">{module.title}</h3>
                    <p className="text-sm text-gray-400 mt-1">Question {currentQuestionIndex + 1} of {questions.length}</p>
                </div>
                <div className="flex items-center space-x-1.5">
                    {questions.map((_, i) => (
                        <div key={i} 
                             className={`w-3 h-3 rounded-full transition-all ${
                                 i === currentQuestionIndex ? 'bg-brand-sage scale-125' : 
                                 quizAnswers[i] !== undefined ? 'bg-blue-500' : 'bg-brand-800'
                             }`}
                        />
                    ))}
                </div>
             </div>
             
             <div className="p-8 md:p-12 min-h-[400px] flex flex-col justify-center">
                 <h4 className="text-2xl font-bold text-white mb-8 leading-snug">{currentQuestionIndex + 1}. {currentQ.q}</h4>
                 <div className="space-y-4 max-w-2xl">
                     {currentQ.options.map((opt, optIdx) => (
                         <label key={optIdx} className={`flex items-center p-5 rounded-xl border-2 cursor-pointer transition-all group ${
                             quizAnswers[currentQuestionIndex] === optIdx 
                             ? 'bg-brand-sage/10 border-brand-sage' 
                             : 'bg-brand-black/50 border-brand-800 hover:border-gray-600'
                         }`}>
                             <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center mr-5 flex-shrink-0 transition-all ${
                                 quizAnswers[currentQuestionIndex] === optIdx ? 'border-brand-sage' : 'border-gray-500 group-hover:border-gray-300'
                             }`}>
                                 {quizAnswers[currentQuestionIndex] === optIdx && <div className="w-3 h-3 rounded-full bg-brand-sage"></div>}
                             </div>
                             <span className={`text-lg ${quizAnswers[currentQuestionIndex] === optIdx ? 'text-white font-bold' : 'text-gray-300 group-hover:text-white'}`}>{opt}</span>
                             <input 
                                type="radio" 
                                name={`q-${currentQuestionIndex}`} 
                                className="hidden" 
                                onChange={() => handleAnswerSelect(currentQuestionIndex, optIdx)}
                                checked={quizAnswers[currentQuestionIndex] === optIdx}
                             />
                         </label>
                     ))}
                 </div>
             </div>

             <div className="p-6 border-t border-brand-800 bg-brand-black/30 flex justify-between items-center">
                 <button 
                    onClick={() => {
                        const prev = Math.max(0, currentQuestionIndex - 1);
                        setCurrentQuestionIndex(prev);
                        saveState({ quizState: { inQuiz: true, currentQuestion: prev, answers: quizAnswers } });
                    }}
                    disabled={currentQuestionIndex === 0}
                    className="text-gray-400 hover:text-white font-bold text-sm px-6 py-3 rounded-lg border border-transparent hover:border-brand-700 disabled:opacity-30 disabled:hover:border-transparent transition-all"
                 >
                     Previous
                 </button>

                 {currentQuestionIndex < questions.length - 1 ? (
                     <button 
                        onClick={handleNextQuestion}
                        className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-3 rounded-xl font-bold text-sm shadow-lg flex items-center transition-all hover:-translate-y-1"
                     >
                        Next Question <ChevronRight size={16} className="ml-2" />
                     </button>
                 ) : (
                     <div className="flex items-center gap-6">
                         <span className="text-sm text-gray-500 font-medium">{answeredCount} / {questions.length} Answered</span>
                         <button 
                            onClick={handleSubmitQuiz}
                            disabled={answeredCount < questions.length}
                            className="bg-green-600 hover:bg-green-500 text-white px-10 py-3 rounded-xl font-bold shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:-translate-y-1 flex items-center"
                         >
                             Submit Exam <CheckCircle size={18} className="ml-2" />
                         </button>
                     </div>
                 )}
             </div>
        </div>
      );
  }

  // --- RESULT VIEW ---
  const passed = (module.score || 0) >= 80;
  return (
      <div className="bg-brand-ebony rounded-xl border border-brand-800 overflow-hidden max-w-2xl mx-auto text-center p-16 animate-fade-in-up shadow-2xl mt-12">
          <div className={`w-32 h-32 rounded-full mx-auto mb-8 flex items-center justify-center border-4 shadow-xl ${passed ? 'bg-green-500/10 text-green-500 border-green-500' : 'bg-red-500/10 text-red-500 border-red-500'}`}>
              {passed ? <Award className="w-16 h-16" /> : <XCircle className="w-16 h-16" />}
          </div>
          
          <h2 className="text-4xl font-display font-bold text-white mb-2 tracking-wide">{passed ? 'CERTIFIED' : 'ASSESSMENT FAILED'}</h2>
          <p className="text-xl text-brand-silver mb-8 font-light">Score: <span className="font-bold font-mono">{module.score}%</span></p>
          
          <div className="bg-brand-black/30 p-6 rounded-xl border border-brand-800 mb-8 max-w-sm mx-auto">
              <p className="text-sm text-gray-400 mb-2">Requirement: 80%</p>
              {passed ? (
                  <p className="text-green-400 text-sm">Your results have been logged. You may now download your certificate.</p>
              ) : (
                  <p className="text-red-400 text-sm">You did not meet the minimum requirements. Please review the material and try again.</p>
              )}
          </div>

          <div className="flex justify-center space-x-4">
              <button onClick={onBack} className="bg-brand-black border border-brand-700 text-gray-300 px-8 py-3 rounded-xl font-bold hover:bg-brand-800 hover:text-white transition-all">
                  Return to Center
              </button>
              {passed ? (
                  <button className="bg-brand-sage text-black px-8 py-3 rounded-xl font-bold hover:bg-brand-sage/90 shadow-lg flex items-center transition-transform hover:-translate-y-1">
                      <FileText size={18} className="mr-2" /> Download Cert
                  </button>
              ) : (
                  <button 
                    onClick={() => {
                        // Reset for retake
                        setViewState('content');
                        setCurrentSectionIndex(0);
                        setSectionProgress(new Array(sections?.length || 0).fill(false)); 
                    }}
                    className="bg-red-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-red-500 shadow-lg flex items-center transition-transform hover:-translate-y-1"
                  >
                      <RefreshCw size={18} className="mr-2" /> Retake Training
                  </button>
              )}
          </div>
      </div>
  );
};
