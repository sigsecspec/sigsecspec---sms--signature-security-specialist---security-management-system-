
import React, { useState, useEffect } from 'react';
import { 
  Camera, Clock, MapPin, MessageSquare, Phone, FileText, 
  AlertTriangle, Radio, LogOut, CheckCircle, X, Coffee, 
  Image as ImageIcon, Edit, ChevronRight
} from 'lucide-react';
import { PageView, MissionCode } from '../../types';
import { supabase } from '../../services/supabase';
import { useAuth } from '../../contexts/AuthContext';

interface ActiveMissionDashboardProps {
  onNavigate: (page: PageView) => void;
}

const ActiveMissionDashboard: React.FC<ActiveMissionDashboardProps> = ({ onNavigate }) => {
  const { user } = useAuth();
  const [activeMission, setActiveMission] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  const [currentTime, setCurrentTime] = useState(new Date());
  const [showCheckInModal, setShowCheckInModal] = useState(false);
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [showBreakModal, setShowBreakModal] = useState(false);
  const [showInfoPanel, setShowInfoPanel] = useState(false);
  const [isOnBreak, setIsOnBreak] = useState(false);
  const [breakTimer, setBreakTimer] = useState(0);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [checkOutStep, setCheckOutStep] = useState<'verify' | 'selfie' | 'done'>('verify');

  // Clock
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch Mission
  useEffect(() => {
      const fetchMission = async () => {
          if (!user) return;
          try {
              // Get active assignment
              const { data: assignment } = await supabase
                  .from('mission_assignments')
                  .select(`
                      id, status,
                      mission:missions (
                          id, title:type, start_time, end_time, notes,
                          site:sites(name, address),
                          client:clients!missions_client_id_fkey(business_name, business_phone)
                      )
                  `)
                  .eq('guard_id', user.id)
                  .eq('status', 'On Site')
                  .single();

              if (assignment && assignment.mission) {
                  const m: any = assignment.mission;
                  setActiveMission({
                      id: m.id,
                      assignmentId: assignment.id,
                      title: m.site?.name || 'Active Mission',
                      address: m.site?.address || '',
                      client: m.client?.business_name || 'Client',
                      phone: m.client?.business_phone || '',
                      start: new Date(m.start_time),
                      end: new Date(m.end_time),
                      notes: m.notes
                  });
              }
          } catch (e) {
              console.error(e);
          } finally {
              setLoading(false);
          }
      };
      fetchMission();
  }, [user]);

  // Break Timer Logic
  useEffect(() => {
    let interval: any;
    if (isOnBreak && breakTimer > 0) {
        interval = setInterval(() => setBreakTimer(prev => prev - 1), 1000);
    } else if (breakTimer === 0 && isOnBreak) {
        setIsOnBreak(false);
        alert("Break time is over.");
    }
    return () => clearInterval(interval);
  }, [isOnBreak, breakTimer]);

  const handleHourlyCheckIn = async (code: MissionCode) => {
      // Mock GPS for now, would use navigator.geolocation
      // Insert into check_ins table (assumed exists or log to history)
      alert(`Recorded: ${code} at ${new Date().toLocaleTimeString()}`);
      setShowCheckInModal(false);
  };

  const startBreak = (minutes: number) => {
      setBreakTimer(minutes * 60);
      setIsOnBreak(true);
      setShowBreakModal(false);
  };

  const handleCheckOut = async () => {
      if (checkOutStep === 'verify') {
          setCheckOutStep('selfie');
          setIsCameraOpen(true);
      } else if (checkOutStep === 'selfie') {
          // Update DB
          if (activeMission) {
              await supabase
                  .from('mission_assignments')
                  .update({ status: 'Completed', check_out_time: new Date() })
                  .eq('id', activeMission.assignmentId);
          }
          setIsCameraOpen(false);
          setCheckOutStep('done');
          setTimeout(() => onNavigate('guard-missions'), 2000);
      }
  };

  const formatTime = (seconds: number) => {
      const m = Math.floor(seconds / 60);
      const s = seconds % 60;
      return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const CameraMock = ({ onCapture }: { onCapture: () => void }) => (
      <div className="fixed inset-0 z-[60] bg-black flex flex-col">
          <div className="flex-1 bg-gray-900 relative flex items-center justify-center">
              <p className="text-gray-500">Camera Active (Mock)</p>
              <div className="absolute inset-0 border-4 border-brand-sage/30 m-8 rounded-lg"></div>
          </div>
          <div className="h-32 bg-black flex items-center justify-center space-x-12">
              <button onClick={() => setIsCameraOpen(false)} className="text-white">Cancel</button>
              <button onClick={onCapture} className="w-16 h-16 bg-white rounded-full border-4 border-gray-300"></button>
          </div>
      </div>
  );

  if (loading) return <div className="min-h-screen bg-brand-black flex items-center justify-center text-white">Loading Mission...</div>;
  if (!activeMission) return (
      <div className="min-h-screen bg-brand-black flex flex-col items-center justify-center text-white p-8">
          <AlertTriangle size={48} className="text-yellow-500 mb-4" />
          <h2 className="text-xl font-bold">No Active Mission</h2>
          <p className="text-gray-400 mb-6">You are not currently checked into a mission.</p>
          <button onClick={() => onNavigate('guard-missions')} className="bg-brand-sage text-black px-6 py-2 rounded font-bold">Go to Missions</button>
      </div>
  );

  return (
    <div className="min-h-screen bg-brand-black text-gray-200 flex flex-col relative overflow-hidden">
      
      {/* LOCKED INDICATOR */}
      <div className="bg-red-900/80 text-white text-xs font-bold text-center py-1 absolute top-0 w-full z-40 backdrop-blur-sm border-b border-red-500/50">
          MISSION DASHBOARD LOCKED
      </div>

      {/* HEADER */}
      <div className="pt-8 px-4 pb-4 bg-brand-ebony border-b border-brand-800 flex justify-between items-center z-30">
          <div>
              <h1 className="text-xl font-bold text-white leading-tight">{activeMission.title}</h1>
              <p className="text-xs text-brand-sage flex items-center mt-1">
                  <Clock className="w-3 h-3 mr-1" /> {currentTime.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                  <span className="mx-2">•</span>
                  <MapPin className="w-3 h-3 mr-1" /> {activeMission.address}
              </p>
          </div>
          <button onClick={() => setShowInfoPanel(!showInfoPanel)} className="p-2 rounded-full border border-brand-700">
              <FileText size={20} />
          </button>
      </div>

      {/* MAIN CONTENT */}
      <div className="flex-1 flex flex-col relative overflow-y-auto">
          
          <div className="grid grid-cols-3 gap-2 p-4">
              {['Report', 'Note', 'Photo'].map(lbl => (
                  <button key={lbl} className="flex flex-col items-center justify-center bg-brand-ebony border border-brand-800 p-3 rounded-lg hover:bg-brand-800 transition-all">
                      <Edit className="w-5 h-5 text-brand-sage mb-1" />
                      <span className="text-[10px] font-bold">{lbl}</span>
                  </button>
              ))}
          </div>

          <div className="flex-1 flex flex-col items-center justify-center p-6 space-y-8 min-h-[300px]">
              {isOnBreak ? (
                  <div className="text-center animate-pulse">
                      <Coffee size={64} className="text-yellow-500 mx-auto mb-4" />
                      <h2 className="text-3xl font-bold text-white mb-2">ON BREAK</h2>
                      <p className="text-4xl font-mono text-brand-sage">{formatTime(breakTimer)}</p>
                      <button onClick={() => setBreakTimer(0)} className="mt-6 px-6 py-2 bg-brand-ebony border border-brand-700 rounded-full text-sm hover:text-white">End Break</button>
                  </div>
              ) : (
                  <button 
                    onClick={() => setShowCheckInModal(true)}
                    className="w-64 h-64 rounded-full bg-gradient-to-br from-brand-sage to-green-900 shadow-[0_0_50px_rgba(124,154,146,0.3)] flex flex-col items-center justify-center border-8 border-brand-black relative group hover:scale-105 transition-transform"
                  >
                      <Radio size={48} className="text-black mb-2" />
                      <span className="text-2xl font-black text-black uppercase tracking-tighter">Hourly<br/>Check-In</span>
                  </button>
              )}
          </div>

          <div className="p-4 grid grid-cols-2 gap-4 pb-8">
              <button onClick={() => setShowBreakModal(true)} disabled={isOnBreak} className="bg-brand-ebony border border-brand-700 text-white py-4 rounded-xl font-bold flex flex-col items-center justify-center hover:bg-brand-800">
                  <Coffee className="w-5 h-5 mb-1 text-yellow-500" /> Take Break
              </button>
              <button onClick={() => setShowCheckoutModal(true)} className="bg-brand-black border border-brand-700 text-white py-4 rounded-xl font-bold flex flex-col items-center justify-center hover:bg-red-900/20">
                  <LogOut className="w-5 h-5 mb-1 text-red-500" /> Check Out
              </button>
          </div>
      </div>

      {/* INFO PANEL */}
      {showInfoPanel && (
          <div className="absolute inset-0 bg-brand-black/95 z-40 p-6 overflow-y-auto">
              <div className="flex justify-between mb-6">
                  <h2 className="text-2xl font-bold text-white">Mission Orders</h2>
                  <button onClick={() => setShowInfoPanel(false)}><X size={24} /></button>
              </div>
              <div className="bg-brand-ebony p-4 rounded-lg border border-brand-800">
                  <p className="text-gray-300 text-sm leading-relaxed">{activeMission.notes || "No special orders."}</p>
              </div>
              <div className="mt-6">
                  <h4 className="text-brand-sage font-bold text-xs uppercase mb-2">Client Contact</h4>
                  <div className="flex items-center justify-between bg-brand-ebony p-4 rounded border border-brand-800">
                      <span className="text-white">{activeMission.client}</span>
                      <a href={`tel:${activeMission.phone}`} className="p-2 bg-brand-black rounded-full border border-brand-700 text-green-400"><Phone size={16} /></a>
                  </div>
              </div>
          </div>
      )}

      {/* CHECK IN MODAL */}
      {showCheckInModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 backdrop-blur-md">
              <div className="bg-brand-ebony border border-brand-800 rounded-xl w-full max-w-md p-6">
                  <h3 className="text-xl font-bold text-white mb-4 text-center">Status Check</h3>
                  <div className="grid grid-cols-2 gap-3 mb-4">
                      <button onClick={() => handleHourlyCheckIn('Code 4')} className="col-span-2 bg-green-600 text-white py-3 rounded font-bold">CODE 4 (All Good)</button>
                      <button onClick={() => handleHourlyCheckIn('Code 1')} className="bg-brand-black border border-brand-700 text-white py-3 rounded">Code 1</button>
                      <button onClick={() => handleHourlyCheckIn('Code 3')} className="bg-brand-black border border-brand-700 text-white py-3 rounded">Code 3</button>
                  </div>
                  <button onClick={() => setShowCheckInModal(false)} className="w-full text-gray-500 text-sm">Cancel</button>
              </div>
          </div>
      )}

      {/* BREAK MODAL */}
      {showBreakModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 backdrop-blur-md">
              <div className="bg-brand-ebony border border-brand-800 rounded-xl w-full max-w-sm p-6 text-center">
                  <h3 className="text-xl font-bold text-white mb-4">Break Duration</h3>
                  <div className="grid grid-cols-2 gap-4 mb-4">
                      <button onClick={() => startBreak(10)} className="py-3 bg-brand-black border border-brand-700 text-white rounded">10 Min</button>
                      <button onClick={() => startBreak(30)} className="py-3 bg-brand-black border border-brand-700 text-white rounded">30 Min</button>
                  </div>
                  <button onClick={() => setShowBreakModal(false)} className="text-gray-500 text-sm">Cancel</button>
              </div>
          </div>
      )}

      {/* CHECKOUT MODAL */}
      {showCheckoutModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 backdrop-blur-md">
              <div className="bg-brand-ebony border border-brand-800 rounded-xl w-full max-w-md p-6 text-center">
                  {checkOutStep === 'verify' ? (
                      <>
                          <h3 className="text-2xl font-bold text-white mb-2">End Shift?</h3>
                          <button onClick={handleCheckOut} className="w-full bg-brand-sage text-black font-bold py-3 rounded mb-3">Proceed</button>
                          <button onClick={() => setShowCheckoutModal(false)} className="w-full text-gray-400">Cancel</button>
                      </>
                  ) : (
                      <div className="animate-fade-in-up">
                          <CheckCircle size={64} className="text-green-500 mx-auto mb-4" />
                          <h3 className="text-2xl font-bold text-white">Shift Completed</h3>
                      </div>
                  )}
              </div>
          </div>
      )}

      {isCameraOpen && <CameraMock onCapture={handleCheckOut} />}

    </div>
  );
};

export default ActiveMissionDashboard;
