
import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, Clock, MapPin, Shield, CheckCircle, AlertTriangle, 
  MessageSquare, Navigation, DollarSign, Calendar, FileText, 
  ChevronRight, Star, AlertCircle, Phone, X, Lock, Search, Camera
} from 'lucide-react';
import { PageView } from '../../types';
import PortalHeader from '../PortalHeader';
import { supabase } from '../../services/supabase';
import MissionDetail from '../modules/shared/MissionDetail';

interface MyMissionsProps {
  onNavigate: (page: PageView) => void;
}

type TabType = 'active' | 'upcoming' | 'history';

interface Mission {
  id: string; 
  assignmentId: string;
  title: string;
  client: string;
  location: string;
  date: string;
  startTime: string;
  endTime: string;
  rate: number;
  status: 'active' | 'upcoming' | 'completed' | 'cancelled' | 'pending';
  type: string;
  instructions?: string;
  team: { name: string; role: string }[];
  leadGuardId?: string;
  leadStatus?: string;
}

const CameraMock = ({ onCapture, onCancel, isLoading }: { onCapture: () => void, onCancel: () => void, isLoading: boolean }) => (
  <div className="fixed inset-0 z-[60] bg-black flex flex-col animate-fade-in-up">
      <div className="flex-1 bg-gray-900 relative flex flex-col items-center justify-center overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-gray-800 to-black opacity-50"></div>
          <div className="absolute top-8 left-0 right-0 flex justify-center z-10">
             <div className="bg-black/50 backdrop-blur-md px-4 py-2 rounded-full flex items-center border border-white/10">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse mr-2"></div>
                <span className="text-xs text-white font-mono">GPS SIGNAL STRONG • ACCURACY 3m</span>
             </div>
          </div>
          <div className="relative w-64 h-80 border-2 border-white/30 rounded-3xl z-10 flex items-center justify-center">
             <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-brand-sage -mt-1 -ml-1 rounded-tl-xl"></div>
             <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-brand-sage -mt-1 -mr-1 rounded-tr-xl"></div>
             <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-brand-sage -mb-1 -ml-1 rounded-bl-xl"></div>
             <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-brand-sage -mb-1 -mr-1 rounded-br-xl"></div>
             {isLoading && (
                 <div className="text-brand-sage font-bold animate-pulse text-lg tracking-widest">VERIFYING...</div>
             )}
          </div>
          <p className="text-gray-400 mt-8 font-medium z-10">Align your face to verify attendance</p>
      </div>
      <div className="h-32 bg-black flex items-center justify-center space-x-16 pb-6 pt-2">
          <button onClick={onCancel} disabled={isLoading} className="text-gray-400 hover:text-white font-bold text-sm disabled:opacity-50">CANCEL</button>
          <button onClick={onCapture} disabled={isLoading} className="w-20 h-20 bg-white rounded-full border-4 border-gray-400 shadow-[0_0_30px_rgba(255,255,255,0.2)] hover:scale-105 active:scale-95 transition-all flex items-center justify-center disabled:opacity-50 disabled:scale-100"><div className="w-16 h-16 bg-white border-2 border-black rounded-full"></div></button>
          <div className="w-12"></div>
      </div>
  </div>
);

const MyMissions: React.FC<MyMissionsProps> = ({ onNavigate }) => {
  const [activeTab, setActiveTab] = useState<TabType>('upcoming');
  const [user, setUser] = useState<{id: string, name: string, email: string, role: string} | null>(null);
  const [missions, setMissions] = useState<Mission[]>([]);
  const [selectedMissionId, setSelectedMissionId] = useState<string | null>(null);
  const [checkingIn, setCheckingIn] = useState(false);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [missionToStart, setMissionToStart] = useState<Mission | null>(null);

  useEffect(() => {
    const getUser = async () => {
        const { data: { user: authUser } } = await supabase.auth.getUser();
        if (authUser) {
            const { data: profile } = await supabase.from('profiles').select('*').eq('id', authUser.id).single();
            if (profile) {
                setUser({ id: profile.id, name: profile.full_name, email: profile.email, role: profile.role });
                fetchMissions(profile.id);
            }
        }
    };
    getUser();
  }, []);

  const fetchMissions = async (guardId: string) => {
      try {
          const { data } = await supabase
            .from('mission_assignments')
            .select(`
                id, status, role,
                mission:missions (
                    id, type, start_time, end_time, notes,
                    site:sites ( name, address ),
                    client:clients!missions_client_id_fkey ( business_name )
                )
            `)
            .eq('guard_id', guardId);

          if (data) {
              const missionsWithLeadInfo = await Promise.all(data.map(async (ma: any) => {
                  const m = Array.isArray(ma.mission) ? ma.mission[0] : ma.mission;
                  
                  // Filter out supervisor spot check assignments if role is supervisor
                  if (ma.role === 'Supervisor') return null;

                  const site = Array.isArray(m.site) ? m.site[0] : m.site;
                  const client = Array.isArray(m.client) ? m.client[0] : m.client;
                  
                  const { data: leadAssignment } = await supabase
                      .from('mission_assignments')
                      .select('guard_id, status')
                      .eq('mission_id', m.id)
                      .eq('role', 'Lead')
                      .single();

                  let status: any = 'upcoming';
                  if (ma.status === 'On Site' || ma.status === 'Arrived') status = 'active';
                  if (ma.status === 'Completed') status = 'completed';

                  return {
                      id: m.id,
                      assignmentId: ma.id,
                      title: site?.name || 'Mission',
                      client: client?.business_name || 'Client',
                      location: site?.address || '',
                      date: new Date(m.start_time).toLocaleDateString(),
                      startTime: new Date(m.start_time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
                      endTime: new Date(m.end_time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
                      rate: 0, 
                      status: status,
                      type: m.type || 'General',
                      instructions: m.notes,
                      team: [],
                      leadGuardId: leadAssignment?.guard_id, 
                      leadStatus: leadAssignment?.status,
                  };
              }));

              setMissions(missionsWithLeadInfo.filter(Boolean) as Mission[]);
              if(missionsWithLeadInfo.some((m: any) => m && m.status === 'active')) {
                  setActiveTab('active');
              }
          }
      } catch (e) {
          console.error(e);
      }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    onNavigate('login');
  };

  const handleStartMissionClick = (mission: Mission) => {
    const isUserLead = mission.leadGuardId === user?.id;
    if (!isUserLead && mission.leadGuardId && mission.leadStatus !== 'On Site') {
        alert("Cannot start yet. Waiting for Lead Guard to start the mission.");
        return;
    }
    setMissionToStart(mission);
    setIsCameraOpen(true);
  };

  const onSelfieCaptured = async () => {
      if (!missionToStart || !user) return;
      setCheckingIn(true);
      setTimeout(async () => {
        try {
            const hasLead = !!missionToStart.leadGuardId && missionToStart.leadGuardId !== user.id;
            const statusToSet = hasLead ? 'Arrived' : 'On Site';
            const { error } = await supabase.from('mission_assignments').update({ status: statusToSet }).eq('id', missionToStart.assignmentId);
            if (error) throw error;
            const isUserLead = missionToStart.leadGuardId === user.id;
            const targetPage = isUserLead ? 'guard-active-lead-mission' : 'guard-active-mission';
            if (hasLead) {
                alert("Arrival Verified. Please wait for Lead Guard to confirm start.");
                fetchMissions(user.id);
            } else {
                onNavigate(targetPage);
            }
        } catch (e: any) {
            alert("Error checking in: " + e.message);
        } finally {
            setCheckingIn(false);
            setIsCameraOpen(false);
            setMissionToStart(null);
        }
      }, 1500);
  };

  const activeMission = missions.find(m => m.status === 'active');
  const upcomingMissions = missions.filter(m => m.status === 'upcoming');
  const historyMissions = missions.filter(m => m.status === 'completed' || m.status === 'cancelled');

  // Check if we are inside a parent layout (Supervisor) to avoid double headers
  // For now, simple check on user role, though 'onNavigate' context is better. 
  // Assuming Supervisor dashboard handles header, we just render content.
  // Actually, simpler to just always render header but allow hiding menu button.
  const isSupervisorView = user?.role === 'supervisor';

  return (
    <div className="h-full bg-brand-black text-gray-200 flex flex-col">
      {!isSupervisorView && (
          <PortalHeader 
            user={user}
            title="GUARD"
            subtitle="Mission Control"
            onLogout={handleLogout}
            onNavigate={onNavigate}
            hideMenuButton={true}
          />
      )}

      <div className="flex-1 max-w-4xl mx-auto w-full p-4 md:p-6 space-y-6">
        {!isSupervisorView && (
            <button onClick={() => onNavigate('guard-application')} className="flex items-center text-gray-400 hover:text-white transition-colors mb-2">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Dashboard
            </button>
        )}

        <div className="flex bg-brand-ebony rounded-lg p-1 border border-brand-800">
          <button onClick={() => setActiveTab('active')} className={`flex-1 py-2 text-sm font-bold rounded transition-all ${activeTab === 'active' ? 'bg-brand-sage text-black shadow-lg' : 'text-gray-400 hover:text-white hover:bg-brand-800'}`}>Active</button>
          <button onClick={() => setActiveTab('upcoming')} className={`flex-1 py-2 text-sm font-bold rounded transition-all ${activeTab === 'upcoming' ? 'bg-brand-sage text-black shadow-lg' : 'text-gray-400 hover:text-white hover:bg-brand-800'}`}>Upcoming</button>
          <button onClick={() => setActiveTab('history')} className={`flex-1 py-2 text-sm font-bold rounded transition-all ${activeTab === 'history' ? 'bg-brand-sage text-black shadow-lg' : 'text-gray-400 hover:text-white hover:bg-brand-800'}`}>History</button>
        </div>

        {activeTab === 'active' && (
          <div className="space-y-6 animate-fade-in-up">
            {activeMission ? (
              <div className="bg-brand-ebony rounded-xl border border-brand-sage/50 overflow-hidden shadow-[0_0_30px_rgba(124,154,146,0.15)] p-8 text-center">
                  <div className="w-24 h-24 bg-brand-sage/20 rounded-full flex items-center justify-center mx-auto mb-6 border-4 border-brand-sage animate-pulse">
                      <Shield className="w-12 h-12 text-brand-sage" />
                  </div>
                  <h2 className="text-3xl font-bold text-white mb-2">{activeMission.title}</h2>
                  <p className="text-gray-400 mb-8">You are currently checked in.</p>
                  <button onClick={() => {
                        const isUserLead = activeMission.leadGuardId === user?.id;
                        if (isUserLead) onNavigate('guard-active-lead-mission');
                        else onNavigate('guard-active-mission');
                    }} className="w-full bg-brand-sage text-black font-bold py-4 rounded-xl hover:bg-brand-sage/90 shadow-lg text-lg flex items-center justify-center transition-transform hover:-translate-y-1">
                    Open Mission Dashboard <ChevronRight className="w-5 h-5 ml-2" />
                  </button>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="w-20 h-20 bg-brand-800 rounded-full flex items-center justify-center mb-6"><Shield className="w-10 h-10 text-gray-500" /></div>
                <h3 className="text-2xl font-bold text-white mb-2">No Active Mission</h3>
                <p className="text-gray-400 max-w-sm mb-8">You are not currently checked into a mission.</p>
                <button onClick={() => setActiveTab('upcoming')} className="bg-brand-sage text-black px-6 py-3 rounded font-bold hover:bg-brand-sage/90 transition-colors">View Schedule</button>
              </div>
            )}
          </div>
        )}

        {activeTab === 'upcoming' && (
          <div className="space-y-4 animate-fade-in-up">
            <h3 className="text-white font-bold text-lg mb-2">Scheduled Assignments</h3>
            <div onClick={() => onNavigate('guard-mission-board')} className="bg-brand-sage/10 border border-brand-sage/30 p-4 rounded-xl flex items-center justify-between cursor-pointer hover:bg-brand-sage/20 transition-colors group">
                <div className="flex items-center"><Search className="w-5 h-5 text-brand-sage mr-3" /><div><h4 className="font-bold text-white">Find More Missions</h4><p className="text-xs text-brand-sage">Browse available shifts</p></div></div>
                <ChevronRight className="text-brand-sage group-hover:translate-x-1 transition-transform" />
            </div>
            {upcomingMissions.length === 0 ? <p className="text-gray-500 italic text-center py-8">No upcoming missions.</p> : upcomingMissions.map(mission => {
                  const isUserLead = mission.leadGuardId === user?.id;
                  const waitingForLead = !isUserLead && mission.leadGuardId && mission.leadStatus !== 'On Site';
                  return (
                    <div key={mission.id} className="bg-brand-ebony p-5 rounded-xl border border-brand-800 flex flex-col md:flex-row gap-4 justify-between group relative overflow-hidden transition-all hover:border-brand-700">
                        <div className="flex items-start gap-4">
                            <div className="bg-brand-black p-3 rounded-lg border border-brand-700 text-center min-w-[70px]">
                                <span className="block text-xs text-gray-500 uppercase">{mission.date.split('/')[0]}</span>
                                <span className="block text-xl font-bold text-white">{mission.date.split('/')[1]}</span>
                            </div>
                            <div>
                                <h4 className="text-white font-bold text-lg">{mission.title}</h4>
                                <div className="flex flex-col sm:flex-row sm:items-center text-sm text-gray-400 mt-1 gap-2 sm:gap-4">
                                    <span className="flex items-center"><Clock className="w-3 h-3 mr-1" /> {mission.startTime} - {mission.endTime}</span>
                                    <span className="flex items-center"><MapPin className="w-3 h-3 mr-1" /> {mission.location}</span>
                                </div>
                                {isUserLead ? <div className="mt-2 inline-flex items-center text-xs px-2 py-1 rounded bg-blue-900/20 text-blue-400 border border-blue-500/30 font-bold"><Shield className="w-3 h-3 mr-1" /> YOU ARE LEAD GUARD</div> : mission.leadGuardId && <div className="mt-2 inline-flex items-center text-xs px-2 py-1 rounded bg-brand-800 text-gray-400 border border-brand-700"><Shield className="w-3 h-3 mr-1" /> Lead Assigned</div>}
                            </div>
                        </div>
                        <div className="flex flex-col gap-2 justify-center min-w-[140px]">
                            {waitingForLead ? (
                                <button disabled className="w-full py-2 bg-brand-800 text-gray-500 text-xs font-bold rounded cursor-not-allowed flex items-center justify-center border border-brand-700"><Lock className="w-3 h-3 mr-1" /> Waiting for Lead</button>
                            ) : (
                                <button onClick={() => handleStartMissionClick(mission)} className="w-full py-2 bg-green-600 hover:bg-green-500 text-white font-bold rounded shadow-lg flex items-center justify-center transition-all">{isUserLead ? 'Start as Lead' : 'Start Mission'}</button>
                            )}
                            <button onClick={() => setSelectedMissionId(mission.id)} className="w-full py-2 bg-brand-black border border-brand-700 hover:border-gray-500 text-gray-300 text-xs font-bold rounded transition-colors">View Details</button>
                        </div>
                    </div>
                  );
              })}
          </div>
        )}

        {activeTab === 'history' && (
          <div className="space-y-4 animate-fade-in-up">
            {historyMissions.length === 0 ? <p className="text-gray-500 italic text-center py-8">No history available.</p> : historyMissions.map(mission => (
                <div key={mission.id} className="bg-brand-ebony p-4 rounded-xl border border-brand-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div><h4 className="text-gray-300 font-bold">{mission.title}</h4><p className="text-xs text-gray-500">{mission.date} • {mission.client}</p></div>
                  <span className="text-xs font-bold px-2 py-1 rounded bg-brand-black border border-brand-700 text-gray-400 uppercase">{mission.status}</span>
                </div>
              ))}
          </div>
        )}
      </div>

      {selectedMissionId && (
        <MissionDetail missionId={selectedMissionId} onClose={() => setSelectedMissionId(null)} currentUserRole="Guard" onUpdate={() => user && fetchMissions(user.id)} />
      )}

      {isCameraOpen && <CameraMock isLoading={checkingIn} onCapture={onSelfieCaptured} onCancel={() => { setIsCameraOpen(false); setMissionToStart(null); }} />}
    </div>
  );
};

export default MyMissions;
