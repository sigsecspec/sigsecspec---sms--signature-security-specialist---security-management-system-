
import React, { useState, useEffect } from 'react';
import { 
  Camera, Clock, MapPin, MessageSquare, Phone, FileText, 
  AlertTriangle, Radio, LogOut, CheckCircle, Users, Eye, PlayCircle, Shield
} from 'lucide-react';
import { PageView, MissionCode } from '../../types';
import { supabase } from '../../services/supabase';
import { useAuth } from '../../contexts/AuthContext';

interface ActiveLeadMissionDashboardProps {
  onNavigate: (page: PageView) => void;
}

const ActiveLeadMissionDashboard: React.FC<ActiveLeadMissionDashboardProps> = ({ onNavigate }) => {
  const { user } = useAuth();
  const [activeMission, setActiveMission] = useState<any>(null);
  const [teamRoster, setTeamRoster] = useState<any[]>([]);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [showCheckInModal, setShowCheckInModal] = useState(false);
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [checkOutStep, setCheckOutStep] = useState<'report' | 'verify' | 'selfie' | 'done'>('report');
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isStartingMission, setIsStartingMission] = useState(false);
  const [missionReport, setMissionReport] = useState({ summary: '', incidents: 0, issues: '' });

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const fetchData = async () => {
      if (!user) return;
      try {
          // 1. Get Lead Assignment (Scheduled OR On Site)
          const { data: assignment } = await supabase
              .from('mission_assignments')
              .select(`
                  id, status, mission_id,
                  mission:missions (
                      id, title:type, start_time, end_time, notes,
                      site:sites(name, address),
                      client:clients!missions_client_id_fkey(business_name, business_phone)
                  )
              `)
              .eq('guard_id', user.id)
              .or('status.eq.On Site,status.eq.Scheduled')
              .order('created_at', { ascending: false })
              .limit(1)
              .single();

          if (assignment && assignment.mission) {
              const m: any = assignment.mission;
              setActiveMission({
                  id: m.id,
                  assignmentId: assignment.id,
                  title: m.site?.name || 'Lead Mission',
                  address: m.site?.address || '',
                  client: m.client?.business_name || 'Client',
                  orders: m.notes,
                  status: assignment.status
              });

              // 2. Fetch Roster
              const { data: team } = await supabase
                  .from('mission_assignments')
                  .select(`
                      id, status, role,
                      guard:profiles!mission_assignments_guard_id_fkey ( id, full_name )
                  `)
                  .eq('mission_id', m.id);
              
              if (team) {
                  setTeamRoster(team.map((t: any) => ({
                      id: t.id, // Assignment ID
                      guardId: t.guard.id,
                      name: t.guard.full_name,
                      status: t.status, // Scheduled, Arrived, On Site, Pending End, Completed
                      role: t.role
                  })));
              }
          }
      } catch (e) {
          console.error(e);
      } finally {
          setLoading(false);
      }
  };

  useEffect(() => {
      fetchData();
  }, [user]);

  const handleStartMission = () => {
      setIsStartingMission(true);
      setIsCameraOpen(true);
  };

  const confirmStartMission = async () => {
      // Called after selfie
      if(!activeMission) return;
      
      await supabase
          .from('mission_assignments')
          .update({ status: 'On Site', check_in_time: new Date() })
          .eq('id', activeMission.assignmentId);
      
      // Update local state to reflect started
      setActiveMission((prev: any) => ({ ...prev, status: 'On Site' }));
      setIsCameraOpen(false);
      setIsStartingMission(false);
      fetchData(); // Refresh roster
  };

  const handleVerifyGuard = async (assignmentId: string, action: 'confirm_start' | 'confirm_end') => {
      const newStatus = action === 'confirm_start' ? 'On Site' : 'Completed';
      
      // Optimistic update
      setTeamRoster(prev => prev.map(g => g.id === assignmentId ? { ...g, status: newStatus } : g));

      await supabase
          .from('mission_assignments')
          .update({ status: newStatus })
          .eq('id', assignmentId);
  };

  // Debug function to simulate guard actions for demo purposes
  const simulateGuardAction = (assignmentId: string, action: 'arrive' | 'finish') => {
      const status = action === 'arrive' ? 'Arrived' : 'Pending End';
      setTeamRoster(prev => prev.map(g => g.id === assignmentId ? { ...g, status: status } : g));
  };

  const handleLeadCheckOut = async () => {
      // Verify all guards are completed
      const pendingGuards = teamRoster.filter(g => g.role !== 'Lead' && g.role !== 'lead' && g.status !== 'Completed' && g.status !== 'No Show');
      
      if (pendingGuards.length > 0) {
          alert("Cannot check out. All guards must be verified as Completed first.");
          return;
      }

      if (checkOutStep === 'report') {
          setCheckOutStep('verify'); // Move to confirmation
      } else if (checkOutStep === 'verify') {
          setCheckOutStep('selfie');
          setIsCameraOpen(true);
      } else if (checkOutStep === 'selfie') {
          // Finalize Lead
          await supabase
              .from('mission_assignments')
              .update({ status: 'Completed', check_out_time: new Date() })
              .eq('id', activeMission.assignmentId);
          
          // Mark mission as completed
          await supabase.from('missions').update({ status: 'completed' }).eq('id', activeMission.id);

          // Submit report (Mock)
          // await supabase.from('mission_reports').insert({...})

          setIsCameraOpen(false);
          setCheckOutStep('done');
          setTimeout(() => onNavigate('lead-guard-dashboard'), 2000);
      }
  };

  const handleHourlyCheckIn = (code: MissionCode) => {
      alert(`Lead Log: ${code}`);
      setShowCheckInModal(false);
  };

  const CameraMock = ({ onCapture }: { onCapture: () => void }) => (
      <div className="fixed inset-0 z-[60] bg-black flex flex-col animate-fade-in-up">
          <div className="flex-1 bg-gray-900 relative flex items-center justify-center">
              <p className="text-gray-500 animate-pulse font-bold tracking-widest uppercase">
                  {isStartingMission ? 'Mission Start Verification' : 'Mission End Verification'}
              </p>
              <div className="absolute inset-0 border-4 border-brand-sage/30 m-8 rounded-lg"></div>
          </div>
          <div className="h-32 bg-black flex items-center justify-center space-x-12">
              <button onClick={() => setIsCameraOpen(false)} className="text-white font-bold">Cancel</button>
              <button onClick={onCapture} className="w-20 h-20 bg-white rounded-full border-8 border-gray-800 shadow-[0_0_20px_rgba(255,255,255,0.3)] hover:scale-105 transition-transform"></button>
          </div>
      </div>
  );

  const StartMissionView = () => (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center animate-fade-in-up">
          <div className="w-24 h-24 bg-blue-500/20 rounded-full flex items-center justify-center border-4 border-blue-500 mb-6 shadow-[0_0_30px_rgba(59,130,246,0.3)]">
              <PlayCircle className="w-12 h-12 text-blue-500" />
          </div>
          <h2 className="text-3xl font-display font-bold text-white mb-2">Ready to Lead?</h2>
          <p className="text-gray-400 max-w-sm mb-8">
              You are the Lead Guard for <strong>{activeMission.title}</strong>. 
              <br/><br/>
              Starting the mission will notify your team and unlock their check-in capabilities.
          </p>
          <button 
            onClick={handleStartMission}
            className="w-full max-w-sm bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 rounded-xl shadow-lg flex items-center justify-center text-lg transition-transform hover:-translate-y-1"
          >
              Start Mission
          </button>
          <button onClick={() => onNavigate('lead-guard-dashboard')} className="mt-6 text-gray-500 hover:text-white text-sm">Return to Dashboard</button>
      </div>
  );

  if (loading) return <div className="min-h-screen bg-brand-black flex items-center justify-center text-white">Loading Command...</div>;
  
  if (!activeMission) return (
      <div className="min-h-screen bg-brand-black flex flex-col items-center justify-center text-white p-8">
          <AlertTriangle size={48} className="text-yellow-500 mb-4" />
          <h2 className="text-xl font-bold">No Active Lead Mission</h2>
          <button onClick={() => onNavigate('lead-guard-dashboard')} className="bg-brand-sage text-black px-6 py-2 rounded font-bold mt-4">Return</button>
      </div>
  );

  // Determine View: Start Screen vs Dashboard
  if (activeMission.status === 'Scheduled') {
      return (
        <div className="min-h-screen bg-brand-black text-gray-200 flex flex-col relative overflow-hidden">
            {isCameraOpen && <CameraMock onCapture={confirmStartMission} />}
            <StartMissionView />
        </div>
      );
  }

  return (
    <div className="min-h-screen bg-brand-black text-gray-200 flex flex-col relative overflow-hidden">
      
      {/* BANNER */}
      <div className="bg-blue-900/90 text-white text-xs font-bold text-center py-1 absolute top-0 w-full z-40 backdrop-blur-sm border-b border-blue-500/30">
          LEAD COMMAND CENTER • LIVE
      </div>

      {/* HEADER */}
      <div className="pt-8 px-4 pb-4 bg-brand-ebony border-b border-brand-800 flex justify-between items-center z-30">
          <div>
              <h1 className="text-xl font-bold text-white leading-tight">{activeMission.title}</h1>
              <p className="text-xs text-brand-sage flex items-center mt-1">
                  <Clock className="w-3 h-3 mr-1" /> {currentTime.toLocaleTimeString()}
              </p>
          </div>
          <div className="flex gap-2">
              <button className="p-2 border border-brand-700 rounded text-gray-300"><MessageSquare size={20} /></button>
          </div>
      </div>

      <div className="flex-1 flex flex-col relative overflow-y-auto pb-32 p-4 space-y-6">
          
          {/* Main Actions */}
          <button 
            onClick={() => setShowCheckInModal(true)}
            className="w-full bg-brand-sage text-black font-bold py-4 rounded-xl shadow-lg flex items-center justify-center text-lg hover:bg-brand-sage/90"
          >
              <Radio className="w-6 h-6 mr-3" /> Log Hourly Status
          </button>

          {/* Roster */}
          <div className="bg-brand-ebony rounded-xl border border-brand-800 overflow-hidden">
              <div className="p-4 border-b border-brand-800 bg-brand-900/30">
                  <h3 className="font-bold text-white flex items-center"><Users className="w-4 h-4 mr-2 text-brand-sage" /> Team Roster & Verification</h3>
              </div>
              <div className="p-4 space-y-3">
                  {teamRoster.map(guard => (
                      <div key={guard.id} className="bg-brand-900/40 p-4 rounded-lg border border-brand-800 flex flex-col gap-3">
                          <div className="flex items-center justify-between">
                              <div className="flex items-center">
                                  <div className={`w-3 h-3 rounded-full mr-3 ${
                                      guard.status === 'On Site' ? 'bg-green-500 animate-pulse' :
                                      guard.status === 'Completed' ? 'bg-blue-500' : 
                                      guard.status === 'Arrived' ? 'bg-yellow-500' :
                                      guard.status === 'Pending End' ? 'bg-orange-500' : 'bg-gray-600'
                                  }`}></div>
                                  <div>
                                      <p className="text-white font-bold text-sm">{guard.name}</p>
                                      <p className="text-xs text-gray-400">{guard.role} • <span className="uppercase">{guard.status}</span></p>
                                  </div>
                              </div>
                              
                              {/* Debug Controls (Hidden in Prod) */}
                              {/* <div className="flex gap-1">
                                  <button onClick={() => simulateGuardAction(guard.id, 'arrive')} className="text-[10px] text-gray-600 border border-gray-700 px-1">Sim:Arr</button>
                                  <button onClick={() => simulateGuardAction(guard.id, 'finish')} className="text-[10px] text-gray-600 border border-gray-700 px-1">Sim:End</button>
                              </div> */}
                          </div>
                          
                          {/* Verification Actions */}
                          {/* Case 1: Guard Arrived -> Needs Start Confirmation */}
                          {guard.status === 'Arrived' && (
                              <button onClick={() => handleVerifyGuard(guard.id, 'confirm_start')} className="w-full bg-green-600 text-white text-xs font-bold py-2 rounded flex items-center justify-center animate-pulse">
                                  <CheckCircle className="w-3 h-3 mr-2" /> Confirm Start
                              </button>
                          )}

                          {/* Case 2: Guard Pending End -> Needs End Confirmation */}
                          {guard.status === 'Pending End' && (
                              <button onClick={() => handleVerifyGuard(guard.id, 'confirm_end')} className="w-full bg-blue-600 text-white text-xs font-bold py-2 rounded flex items-center justify-center animate-pulse">
                                  <LogOut className="w-3 h-3 mr-2" /> Confirm End
                              </button>
                          )}

                          {/* Demo Buttons to Simulate Guard Actions since we don't have multi-user */}
                          {(guard.status === 'Scheduled' && guard.role !== 'Lead') && (
                              <button onClick={() => simulateGuardAction(guard.id, 'arrive')} className="w-full bg-brand-800 border border-brand-700 text-gray-400 text-xs py-1 rounded hover:text-white">
                                  [Demo] Simulate Guard Arrival
                              </button>
                          )}
                          {(guard.status === 'On Site' && guard.role !== 'Lead') && (
                              <button onClick={() => simulateGuardAction(guard.id, 'finish')} className="w-full bg-brand-800 border border-brand-700 text-gray-400 text-xs py-1 rounded hover:text-white">
                                  [Demo] Simulate Guard Checkout
                              </button>
                          )}
                      </div>
                  ))}
              </div>
          </div>

          <div className="bg-brand-ebony rounded-xl border border-brand-800 p-4">
              <h4 className="text-xs font-bold text-gray-500 uppercase mb-2">Orders</h4>
              <p className="text-sm text-gray-300">{activeMission.orders || "Standard Orders Apply."}</p>
          </div>
      </div>

      {/* Footer */}
      <div className="absolute bottom-0 w-full bg-brand-ebony border-t border-brand-800 p-4 z-30">
          <button 
            onClick={() => { setCheckOutStep('report'); setShowCheckoutModal(true); }}
            className="w-full py-4 rounded-xl font-bold flex items-center justify-center bg-brand-800 text-gray-300 hover:bg-red-900/30 hover:text-white transition-all"
          >
              <LogOut className="w-5 h-5 mr-2" /> End Mission
          </button>
      </div>

      {/* Modals */}
      {showCheckInModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 backdrop-blur-md">
              <div className="bg-brand-ebony border border-brand-800 rounded-xl w-full max-w-md p-6">
                  <h3 className="text-xl font-bold text-white mb-4 text-center">Lead Status Log</h3>
                  <div className="grid grid-cols-2 gap-3 mb-4">
                      {['Code 4', 'Code 1', 'Code 3', 'Code 7'].map(c => (
                          <button key={c} onClick={() => handleHourlyCheckIn(c as MissionCode)} className="bg-brand-black border border-brand-700 text-white py-3 rounded hover:bg-brand-800">{c}</button>
                      ))}
                  </div>
                  <button onClick={() => setShowCheckInModal(false)} className="w-full text-gray-500">Cancel</button>
              </div>
          </div>
      )}

      {showCheckoutModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 backdrop-blur-md">
              <div className="bg-brand-ebony border border-brand-800 rounded-xl w-full max-w-md p-6">
                  {checkOutStep === 'report' && (
                      <div className="space-y-4">
                          <h3 className="text-xl font-bold text-white flex items-center"><FileText className="w-5 h-5 mr-2" /> End of Shift Report</h3>
                          <div>
                              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Shift Summary</label>
                              <textarea 
                                className="w-full bg-brand-black border border-brand-700 rounded p-3 text-white text-sm h-24 focus:border-brand-sage outline-none"
                                placeholder="Brief summary of events..."
                                value={missionReport.summary}
                                onChange={e => setMissionReport({...missionReport, summary: e.target.value})}
                              />
                          </div>
                          <div>
                              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Issues / Incidents</label>
                              <input 
                                className="w-full bg-brand-black border border-brand-700 rounded p-3 text-white text-sm focus:border-brand-sage outline-none"
                                placeholder="Any open issues?"
                                value={missionReport.issues}
                                onChange={e => setMissionReport({...missionReport, issues: e.target.value})}
                              />
                          </div>
                          <div className="flex gap-3 pt-2">
                              <button onClick={() => setShowCheckoutModal(false)} className="flex-1 py-3 text-gray-400">Cancel</button>
                              <button onClick={handleLeadCheckOut} className="flex-1 bg-brand-sage text-black font-bold py-3 rounded">Next</button>
                          </div>
                      </div>
                  )}

                  {checkOutStep === 'verify' && (
                      <div className="text-center">
                          <h3 className="text-2xl font-bold text-white mb-2">Close Mission?</h3>
                          <p className="text-gray-400 text-sm mb-4">Ensure all team members are accounted for. This action is final.</p>
                          <button onClick={handleLeadCheckOut} className="w-full bg-green-600 text-white font-bold py-3 rounded mb-2">Proceed to Verification</button>
                          <button onClick={() => setShowCheckoutModal(false)} className="w-full text-gray-400 mt-2">Cancel</button>
                      </div>
                  )}

                  {checkOutStep === 'done' && (
                      <div className="animate-fade-in-up text-center">
                          <CheckCircle size={64} className="text-green-500 mx-auto mb-4" />
                          <h3 className="text-2xl font-bold text-white">Mission Closed</h3>
                          <p className="text-gray-400 text-sm mt-2">Good work, Lead.</p>
                      </div>
                  )}
              </div>
          </div>
      )}

      {isCameraOpen && <CameraMock onCapture={isStartingMission ? confirmStartMission : handleLeadCheckOut} />}

    </div>
  );
};

export default ActiveLeadMissionDashboard;
