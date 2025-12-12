
import React, { useState, useEffect } from 'react';
import { 
  Camera, MapPin, MessageSquare, FileText, CheckCircle, 
  Image as ImageIcon, Edit, ChevronRight, PlayCircle, ClipboardCheck,
  LogOut, Shield, AlertTriangle, ArrowLeft, Send
} from 'lucide-react';
import { PageView, SpotCheckStage } from '../../types';
import SpotCheckForm from './SpotCheckForm';
import { supabase } from '../../services/supabase';

interface SpotCheckDashboardProps {
  onNavigate: (page: PageView) => void;
}

const SpotCheckDashboard: React.FC<SpotCheckDashboardProps> = ({ onNavigate }) => {
  const [mission, setMission] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [stage, setStage] = useState<SpotCheckStage>('arrival');
  const [completedChecks, setCompletedChecks] = useState<string[]>([]);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [cameraReason, setCameraReason] = useState('');
  
  useEffect(() => {
      fetchAssignment();
  }, []);

  const fetchAssignment = async () => {
      // Fetch active mission that implies supervision (mock for demo, real app would pass ID)
      try {
          const { data: missionData } = await supabase
              .from('missions')
              .select(`
                  id, site:sites(name, address),
                  client:clients!missions_client_id_fkey(business_name),
                  assignments:mission_assignments(
                      id, status, guard:profiles!mission_assignments_guard_id_fkey(id, full_name)
                  )
              `)
              .eq('status', 'active')
              .limit(1)
              .single();

          if (missionData) {
              const guards = missionData.assignments.map((a: any) => ({
                  id: a.guard.id,
                  name: a.guard.full_name,
                  verified: false
              }));

              setMission({
                  id: missionData.id,
                  title: missionData.site?.name || 'Active Mission',
                  client: missionData.client?.business_name || 'Client',
                  address: missionData.site?.address || '',
                  guards: guards
              });
          }
      } catch (e) {
          console.error(e);
      } finally {
          setLoading(false);
      }
  };

  // --- Handlers ---

  const handleArrivalSelfie = () => {
    setCameraReason('Arrival Verification');
    setIsCameraOpen(true);
  };

  const handleFinalSelfie = () => {
    setCameraReason('Completion Verification');
    setIsCameraOpen(true);
  };

  const handleCameraCapture = () => {
      // Simulate upload
      setIsCameraOpen(false);
      if (cameraReason === 'Arrival Verification') {
          setStage('dashboard');
      } else if (cameraReason === 'Completion Verification') {
          alert("Spot Check Completed & Submitted.");
          onNavigate('supervisor-application');
      }
  };

  const handleStartCheck = (type: 'first' | 'mid' | 'last') => {
      // Logic to prevent jumping ahead
      if (type === 'mid' && !completedChecks.includes('first')) return;
      if (type === 'last' && !completedChecks.includes('mid')) return;
      
      const targetStage = type === 'first' ? 'check1' : type === 'mid' ? 'check2' : 'check3';
      setStage(targetStage);
  };

  const handleCheckComplete = (type: string) => {
      setCompletedChecks(prev => [...prev, type]);
      setStage('dashboard');
  };

  if (loading) return <div className="min-h-screen bg-brand-black flex items-center justify-center text-white">Loading Assignment...</div>;
  
  if (!mission) return (
      <div className="min-h-screen bg-brand-black flex flex-col items-center justify-center text-white p-8">
          <AlertTriangle size={48} className="text-yellow-500 mb-4" />
          <h2 className="text-xl font-bold">No Active Missions to Check</h2>
          <button onClick={() => onNavigate('supervisor-application')} className="mt-4 bg-brand-sage text-black px-6 py-2 rounded font-bold">Return to Dashboard</button>
      </div>
  );

  // --- Views ---

  const ArrivalView = () => (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center space-y-8 animate-fade-in-up">
          <div className="w-24 h-24 bg-brand-sage/20 rounded-full flex items-center justify-center border-4 border-brand-sage animate-pulse">
              <MapPin size={48} className="text-brand-sage" />
          </div>
          <div>
              <h2 className="text-3xl font-bold text-white mb-2">Arrived at {mission.title}?</h2>
              <p className="text-gray-400 max-w-sm mx-auto">{mission.address}</p>
              <p className="text-xs text-brand-sage mt-2 uppercase tracking-widest font-bold">Client: {mission.client}</p>
          </div>
          <div className="bg-brand-900/50 p-4 rounded-lg border border-brand-800 max-w-xs text-xs text-gray-300">
              Please take a selfie with the establishment clearly visible in the background to verify your arrival time.
          </div>
          <button onClick={handleArrivalSelfie} className="bg-brand-sage text-black font-bold py-4 px-8 rounded-xl shadow-lg flex items-center text-lg hover:scale-105 transition-transform">
              <Camera className="w-6 h-6 mr-2" /> Verify & Start
          </button>
      </div>
  );

  const DashboardView = () => {
      const firstDone = completedChecks.includes('first');
      const midDone = completedChecks.includes('mid');
      const lastDone = completedChecks.includes('last');

      return (
          <div className="flex flex-col h-full p-6 max-w-2xl mx-auto w-full animate-fade-in-up">
              <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
                  <ClipboardCheck className="w-6 h-6 mr-3 text-brand-sage" /> Spot Check Dashboard
              </h2>

              <div className="flex-1 flex flex-col space-y-6">
                  {/* First Check */}
                  <div className={`p-6 rounded-xl border transition-all ${firstDone ? 'bg-green-900/10 border-green-500/30' : 'bg-brand-ebony border-brand-800'}`}>
                      <div className="flex justify-between items-center mb-4">
                          <h3 className={`font-bold text-lg ${firstDone ? 'text-green-400' : 'text-white'}`}>1. First Spot Check</h3>
                          {firstDone && <CheckCircle className="text-green-500" />}
                      </div>
                      <p className="text-sm text-gray-400 mb-4">Verify initial guard placement, uniform, and gear.</p>
                      <button 
                        onClick={() => handleStartCheck('first')} 
                        disabled={firstDone}
                        className={`w-full py-3 rounded-lg font-bold flex items-center justify-center transition-all ${
                            firstDone 
                            ? 'bg-brand-black text-gray-500 cursor-not-allowed' 
                            : 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg'
                        }`}
                      >
                          {firstDone ? "Completed" : "Start First Check"}
                      </button>
                  </div>

                  {/* Mid Check */}
                  <div className={`p-6 rounded-xl border transition-all ${midDone ? 'bg-green-900/10 border-green-500/30' : !firstDone ? 'opacity-50 grayscale' : 'bg-brand-ebony border-brand-800'}`}>
                      <div className="flex justify-between items-center mb-4">
                          <h3 className={`font-bold text-lg ${midDone ? 'text-green-400' : 'text-white'}`}>2. Mid Spot Check</h3>
                          {midDone && <CheckCircle className="text-green-500" />}
                      </div>
                      <p className="text-sm text-gray-400 mb-4">Verify patrols, logs, and ongoing vigilance.</p>
                      <button 
                        onClick={() => handleStartCheck('mid')} 
                        disabled={!firstDone || midDone}
                        className={`w-full py-3 rounded-lg font-bold flex items-center justify-center transition-all ${
                            midDone 
                            ? 'bg-brand-black text-gray-500 cursor-not-allowed' 
                            : !firstDone ? 'bg-brand-800 text-gray-500 cursor-not-allowed'
                            : 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg'
                        }`}
                      >
                          {midDone ? "Completed" : "Start Mid Check"}
                      </button>
                  </div>

                  {/* Last Check */}
                  <div className={`p-6 rounded-xl border transition-all ${lastDone ? 'bg-green-900/10 border-green-500/30' : !midDone ? 'opacity-50 grayscale' : 'bg-brand-ebony border-brand-800'}`}>
                      <div className="flex justify-between items-center mb-4">
                          <h3 className={`font-bold text-lg ${lastDone ? 'text-green-400' : 'text-white'}`}>3. Last Spot Check</h3>
                          {lastDone && <CheckCircle className="text-green-500" />}
                      </div>
                      <p className="text-sm text-gray-400 mb-4">Final verification before shift change/end.</p>
                      <button 
                        onClick={() => handleStartCheck('last')} 
                        disabled={!midDone || lastDone}
                        className={`w-full py-3 rounded-lg font-bold flex items-center justify-center transition-all ${
                            lastDone 
                            ? 'bg-brand-black text-gray-500 cursor-not-allowed' 
                            : !midDone ? 'bg-brand-800 text-gray-500 cursor-not-allowed'
                            : 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg'
                        }`}
                      >
                          {lastDone ? "Completed" : "Start Last Check"}
                      </button>
                  </div>
              </div>

              <div className="mt-8 pt-6 border-t border-brand-800">
                  <button 
                    onClick={() => setStage('final_report')} 
                    disabled={!lastDone}
                    className={`w-full py-4 rounded-xl font-bold text-lg shadow-lg flex items-center justify-center transition-all ${
                        lastDone ? 'bg-brand-sage text-black hover:bg-brand-sage/90' : 'bg-brand-800 text-gray-500 cursor-not-allowed'
                    }`}
                  >
                      <FileText className="w-5 h-5 mr-2" /> Submit Final Report
                  </button>
              </div>
          </div>
      );
  };

  const FinalReportView = () => (
      <div className="flex flex-col h-full p-6 max-w-2xl mx-auto w-full animate-fade-in-up">
          <h2 className="text-2xl font-bold text-white mb-6">Final Mission Report</h2>
          
          <div className="bg-brand-ebony border border-brand-800 rounded-xl p-6 space-y-6">
              <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Executive Summary</label>
                  <textarea className="w-full bg-brand-black border border-brand-700 rounded p-4 text-white h-40 focus:border-brand-sage outline-none leading-relaxed" placeholder="Summarize the overall mission status, guard performance, and any issues encountered..." />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                  <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Incidents Observed</label>
                      <input type="number" className="w-full bg-brand-black border border-brand-700 rounded p-3 text-white" defaultValue={0} />
                  </div>
                  <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Overall Rating</label>
                      <select className="w-full bg-brand-black border border-brand-700 rounded p-3 text-white">
                          <option>5 - Excellent</option>
                          <option>4 - Good</option>
                          <option>3 - Average</option>
                          <option>2 - Poor</option>
                          <option>1 - Failure</option>
                      </select>
                  </div>
              </div>
          </div>

          <div className="mt-auto pt-6 flex gap-4">
              <button onClick={() => setStage('dashboard')} className="flex-1 py-3 border border-brand-700 text-gray-300 rounded font-bold hover:text-white">Back</button>
              <button onClick={handleFinalSelfie} className="flex-2 w-2/3 py-3 bg-green-600 text-white font-bold rounded shadow-lg hover:bg-green-500 flex items-center justify-center">
                  <Camera className="w-5 h-5 mr-2" /> Verify & Complete
              </button>
          </div>
      </div>
  );

  const CameraOverlay = () => (
      <div className="fixed inset-0 z-[70] bg-black flex flex-col items-center justify-center animate-fade-in-up">
          <div className="relative w-full max-w-lg aspect-[3/4] bg-gray-900 overflow-hidden flex items-center justify-center border-2 border-brand-sage/50 rounded-lg">
              <p className="text-brand-sage animate-pulse font-bold tracking-widest">{cameraReason}</p>
              <div className="absolute inset-0 border-4 border-brand-sage/20 m-8 rounded"></div>
          </div>
          <div className="h-32 flex items-center space-x-12">
              <button onClick={() => setIsCameraOpen(false)} className="text-gray-400 font-bold">Cancel</button>
              <button onClick={handleCameraCapture} className="w-20 h-20 bg-white rounded-full border-4 border-gray-400 shadow-[0_0_30px_rgba(255,255,255,0.3)] hover:scale-105 transition-transform"></button>
          </div>
      </div>
  );

  return (
    <div className="min-h-screen bg-brand-black text-gray-200 flex flex-col relative overflow-hidden">
      {/* Header */}
      <div className="bg-brand-sage/10 border-b border-brand-sage/20 text-brand-sage text-xs font-bold text-center py-1 absolute top-0 w-full z-40 backdrop-blur-sm">
          SUPERVISOR MODE
      </div>
      <div className="pt-8 px-4 pb-4 bg-brand-ebony border-b border-brand-800 flex justify-between items-center z-30">
          <div>
              <h1 className="text-xl font-bold text-white">{mission.title}</h1>
              <p className="text-xs text-gray-400 flex items-center mt-1"><MapPin className="w-3 h-3 mr-1" /> {mission.address}</p>
          </div>
          <button onClick={() => onNavigate('supervisor-application')} className="text-gray-500 hover:text-white p-2 flex items-center text-xs font-bold uppercase"><LogOut size={16} className="mr-1" /> Exit</button>
      </div>

      <div className="flex-1 relative overflow-hidden overflow-y-auto">
          {stage === 'arrival' && <ArrivalView />}
          {stage === 'dashboard' && <DashboardView />}
          {(stage === 'check1' || stage === 'check2' || stage === 'check3') && (
              <SpotCheckForm 
                  checkType={stage === 'check1' ? 'First' : stage === 'check2' ? 'Mid' : 'Last'}
                  guards={mission.guards}
                  onComplete={() => handleCheckComplete(stage === 'check1' ? 'first' : stage === 'check2' ? 'mid' : 'last')}
                  onBack={() => setStage('dashboard')}
              />
          )}
          {stage === 'final_report' && <FinalReportView />}
      </div>

      {isCameraOpen && <CameraOverlay />}
    </div>
  );
};

export default SpotCheckDashboard;
