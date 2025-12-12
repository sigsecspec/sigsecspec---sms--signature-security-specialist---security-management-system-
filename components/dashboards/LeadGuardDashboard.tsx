
import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, Users, Briefcase, BookOpen, Clock, Award, 
  User, MessageSquare, Menu, MapPin, CheckCircle, Phone, 
  FileText, LogOut, ChevronRight, Gavel, Shirt, TrendingUp, 
  Target, AlertTriangle, UserCheck, XCircle, Search, 
  MoreVertical, Bell, Radio, PlayCircle
} from 'lucide-react';
import { PageView } from '../../types';
import PortalHeader from '../PortalHeader';
import { KPIMeter } from '../../components/common/DashboardWidgets';
import ProfileManagement from '../modules/shared/ProfileManagement';
import { supabase } from '../../services/supabase';

interface LeadGuardDashboardProps {
  onNavigate: (page: PageView) => void;
}

type InternalView = 'dashboard' | 'team' | 'missions' | 'profile' | 'messages' | 'performance' | 'training' | 'uniforms' | 'appeals' | 'promotions' | 'settings';

const LeadGuardDashboard: React.FC<LeadGuardDashboardProps> = ({ onNavigate }) => {
  const [currentView, setCurrentView] = useState<InternalView>('dashboard');
  const [user, setUser] = useState<any>(null);
  const [activeMission, setActiveMission] = useState<any>(null);
  const [teamRoster, setTeamRoster] = useState<any[]>([]);
  const [isShiftActive, setIsShiftActive] = useState(false);

  useEffect(() => {
    // 1. Get User
    const fetchUserAndMission = async () => {
        const { data: { user: authUser } } = await supabase.auth.getUser();
        if (authUser) {
            const { data: profile } = await supabase.from('profiles').select('*').eq('id', authUser.id).single();
            if (profile) {
                setUser({ name: profile.full_name, role: profile.role, email: profile.email, id: profile.id });
                fetchActiveMission(profile.id);
            }
        }
    };
    fetchUserAndMission();
  }, []);

  const fetchActiveMission = async (guardId: string) => {
      // Find mission where this guard is assigned (Scheduled OR On Site) to allow starting
      const { data: assignments } = await supabase
        .from('mission_assignments')
        .select(`
            id,
            status,
            mission:missions (
                id,
                start_time,
                end_time,
                notes,
                site:sites(name, address),
                client:clients!missions_client_id_fkey(full_name, phone)
            )
        `)
        .eq('guard_id', guardId)
        .or('status.eq.On Site,status.eq.Scheduled')
        .order('created_at', { ascending: false }) // Get most recent
        .limit(1);

      const assignment = assignments && assignments[0];

      if (assignment && assignment.mission) {
          const m: any = assignment.mission; // Type casting for simplicity
          const site = Array.isArray(m.site) ? m.site[0] : m.site;
          const client = Array.isArray(m.client) ? m.client[0] : m.client;
          
          const isLive = assignment.status === 'On Site';

          setActiveMission({
              id: m.id,
              title: site?.name || 'Mission',
              client: client?.full_name || 'Client',
              clientPOC: client?.full_name || 'POC',
              pocPhone: client?.phone || '',
              location: site?.address || '',
              startTime: new Date(m.start_time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
              endTime: new Date(m.end_time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
              instructions: m.notes,
              status: isLive ? 'In Progress' : 'Scheduled',
              assignmentStatus: assignment.status
          });
          setIsShiftActive(isLive);
          fetchTeamRoster(m.id);
      }
  };

  const fetchTeamRoster = async (missionId: string) => {
      const { data } = await supabase
        .from('mission_assignments')
        .select(`
            id,
            status,
            guard:profiles!mission_assignments_guard_id_fkey(id, full_name, phone)
        `)
        .eq('mission_id', missionId);
      
      if (data) {
          setTeamRoster(data.map((ma: any) => ({
              id: ma.id, // Assignment ID
              guardId: ma.guard.id,
              name: ma.guard.full_name,
              status: ma.status,
              phone: ma.guard.phone,
              checkInTime: '08:00 AM' // Placeholder as check_ins table isn't fully linked in this view yet
          })));
      }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    onNavigate('login');
  };

  // --- Views ---

  const DashboardHome = () => (
    <div className="space-y-8 animate-fade-in-up pb-24">
      {/* Header */}
      <div className="flex justify-between items-end border-b border-white/5 pb-6">
        <div>
          <h1 className="text-3xl font-display font-bold text-white tracking-wide">LEAD COMMAND</h1>
          <p className="text-gray-400 text-sm mt-1 flex items-center">
             <ShieldCheck className="w-4 h-4 mr-2 text-brand-sage" />
             {user ? `Officer ${user.name.split(' ')[1]} (PVT)` : 'Loading...'}
          </p>
        </div>
        {isShiftActive && (
            <div className="flex items-center space-x-2">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-sage opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-brand-sage"></span>
                </span>
                <span className="text-brand-sage font-bold text-xs tracking-widest uppercase">Live Ops</span>
            </div>
        )}
      </div>

      {/* Active Mission Card (Prominent) */}
      {activeMission ? (
          <div className={`rounded-2xl border overflow-hidden relative transition-all duration-300 ${activeMission.assignmentStatus === 'On Site' ? 'bg-gradient-to-br from-brand-ebony to-brand-900 border-brand-sage/50 shadow-[0_0_40px_rgba(124,154,146,0.1)]' : 'bg-brand-ebony border-white/10'}`}>
            <div className="absolute top-0 right-0 p-8 opacity-[0.03]">
                <Target size={200} className="text-white" />
            </div>
            
            <div className="p-8 relative z-10">
                <div className="flex justify-between mb-6">
                    <span className="text-[10px] font-bold text-brand-silver uppercase tracking-[0.2em] border border-white/10 px-3 py-1 rounded-full">Current Assignment</span>
                    <span className={`text-xs font-bold flex items-center ${activeMission.assignmentStatus === 'On Site' ? 'text-green-400' : 'text-blue-400'}`}>
                        <Clock className="w-4 h-4 mr-2" /> {activeMission.startTime} - {activeMission.endTime}
                    </span>
                </div>
                
                <h2 className="text-4xl font-display font-bold text-white mb-2">{activeMission.title}</h2>
                <p className="text-brand-sage text-lg mb-8 flex items-center"><MapPin className="w-5 h-5 mr-2" /> {activeMission.location}</p>

                <div className="grid grid-cols-2 gap-4 mb-8">
                    <div className="bg-black/30 backdrop-blur-sm p-4 rounded-xl border border-white/5">
                        <p className="text-[10px] text-gray-500 uppercase font-bold mb-1">Team Status</p>
                        <p className="text-white font-mono text-xl">{teamRoster.filter(g => g.status === 'On Site').length} / {teamRoster.length} <span className="text-xs text-gray-500 font-sans">Active</span></p>
                    </div>
                    <div className="bg-black/30 backdrop-blur-sm p-4 rounded-xl border border-white/5">
                        <p className="text-[10px] text-gray-500 uppercase font-bold mb-1">Mission Phase</p>
                        <p className={`font-mono text-xl uppercase ${activeMission.assignmentStatus === 'On Site' ? 'text-green-400' : 'text-blue-400'}`}>{activeMission.assignmentStatus}</p>
                    </div>
                </div>

                <button 
                    onClick={() => onNavigate('guard-active-lead-mission')}
                    className={`w-full font-bold py-4 rounded-xl flex items-center justify-center transition-all shadow-lg text-lg group ${activeMission.assignmentStatus === 'On Site' ? 'bg-brand-sage text-black hover:bg-brand-sage/90' : 'bg-blue-600 text-white hover:bg-blue-500'}`}
                >
                    {activeMission.assignmentStatus === 'On Site' ? (
                        <>Enter Command Dashboard <ChevronRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" /></>
                    ) : (
                        <><PlayCircle className="w-5 h-5 mr-2" /> Start Mission Workflow</>
                    )}
                </button>
            </div>
        </div>
      ) : (
          <div className="bg-brand-ebony rounded-2xl border border-dashed border-white/10 p-12 text-center group hover:border-brand-sage/30 transition-colors">
              <div className="w-20 h-20 bg-brand-black rounded-full flex items-center justify-center mx-auto mb-6 border border-white/5 group-hover:scale-110 transition-transform">
                  <ShieldCheck className="w-10 h-10 text-gray-600 group-hover:text-brand-sage transition-colors" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">No Active Orders</h3>
              <p className="text-gray-500 mb-8 max-w-sm mx-auto">You have no upcoming missions scheduled as a Lead Guard. Check the mission board for opportunities.</p>
              <button onClick={() => onNavigate('guard-missions')} className="bg-white/5 text-white border border-white/10 px-8 py-3 rounded-xl font-bold hover:bg-white/10 hover:border-white/20 transition-all">
                  View Schedule
              </button>
          </div>
      )}

      {/* Quick Actions Grid */}
      <div>
        <h3 className="text-white font-bold mb-6 text-sm uppercase tracking-wider border-l-4 border-brand-sage pl-3">Lead Actions</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <button onClick={() => setCurrentView('team')} className="bg-brand-ebony p-6 rounded-2xl border border-white/5 hover:border-brand-sage/30 hover:bg-brand-ebony/80 transition-all group text-center">
            <Users className="w-8 h-8 text-blue-400 mb-3 mx-auto group-hover:scale-110 transition-transform" />
            <span className="text-sm font-bold text-gray-300 group-hover:text-white">Team Roster</span>
          </button>
          <button className="bg-brand-ebony p-6 rounded-2xl border border-white/5 hover:border-brand-sage/30 hover:bg-brand-ebony/80 transition-all group text-center">
            <Phone className="w-8 h-8 text-green-400 mb-3 mx-auto group-hover:scale-110 transition-transform" />
            <span className="text-sm font-bold text-gray-300 group-hover:text-white">Contact Client</span>
          </button>
          <button className="bg-brand-ebony p-6 rounded-2xl border border-white/5 hover:border-brand-sage/30 hover:bg-brand-ebony/80 transition-all group text-center">
            <FileText className="w-8 h-8 text-orange-400 mb-3 mx-auto group-hover:scale-110 transition-transform" />
            <span className="text-sm font-bold text-gray-300 group-hover:text-white">Incident Report</span>
          </button>
          <button onClick={() => setCurrentView('messages')} className="bg-brand-ebony p-6 rounded-2xl border border-white/5 hover:border-brand-sage/30 hover:bg-brand-ebony/80 transition-all group text-center">
            <MessageSquare className="w-8 h-8 text-purple-400 mb-3 mx-auto group-hover:scale-110 transition-transform" />
            <span className="text-sm font-bold text-gray-300 group-hover:text-white">Ops Chat</span>
          </button>
        </div>
      </div>
    </div>
  );

  const TeamView = () => (
    <div className="space-y-6 animate-fade-in-up pb-24">
      <div className="bg-brand-ebony p-8 rounded-2xl border border-white/5">
        <div className="flex justify-between items-center mb-6">
            <h3 className="text-2xl font-display font-bold text-white">Squad Roster</h3>
            <span className="text-xs font-bold bg-brand-sage/10 text-brand-sage px-3 py-1 rounded-full border border-brand-sage/20">{teamRoster.length} Personnel</span>
        </div>
        
        <div className="space-y-3">
          {teamRoster.map(guard => (
            <div key={guard.id} className="flex items-center justify-between bg-brand-black/40 p-4 rounded-xl border border-white/5 hover:border-white/10 transition-colors group">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-brand-black rounded-full flex items-center justify-center text-sm font-bold text-gray-400 mr-4 border border-white/10 group-hover:border-brand-sage/50 transition-colors">
                  {guard.name.charAt(0)}
                </div>
                <div>
                  <p className="text-white font-bold text-lg">{guard.name}</p>
                  <div className="flex items-center text-xs text-gray-500 mt-1">
                      <span className={`w-2 h-2 rounded-full mr-2 ${guard.status === 'On Site' ? 'bg-green-500 animate-pulse' : 'bg-gray-600'}`}></span>
                      {guard.status} • {guard.phone}
                  </div>
                </div>
              </div>
              <div className="flex space-x-2">
                <button className="p-2 bg-brand-ebony rounded-lg text-gray-400 hover:text-white border border-white/5 hover:bg-brand-800 transition-colors">
                  <MessageSquare className="w-5 h-5" />
                </button>
                <button className="p-2 bg-brand-ebony rounded-lg text-gray-400 hover:text-white border border-white/5 hover:bg-brand-800 transition-colors">
                  <Phone className="w-5 h-5" />
                </button>
              </div>
            </div>
          ))}
        </div>
        <button className="w-full mt-8 py-3 border-2 border-dashed border-white/10 text-gray-400 rounded-xl hover:border-brand-sage hover:text-brand-sage transition-colors text-sm font-bold flex items-center justify-center">
          <UserCheck className="w-4 h-4 mr-2" /> Request Additional Staff
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-brand-black font-sans text-gray-200">
      
      {/* Top Navigation */}
      <div className="bg-brand-black/90 backdrop-blur-md border-b border-white/5 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
                <div className="flex items-center cursor-pointer group" onClick={() => setCurrentView('dashboard')}>
                    <div className="bg-brand-sage/10 p-2 rounded-lg mr-3 group-hover:bg-brand-sage/20 transition-colors">
                        <ShieldCheck className="w-6 h-6 text-brand-sage" />
                    </div>
                    <div>
                        <span className="font-display font-bold text-white tracking-wider block leading-none">LEAD GUARD</span>
                    </div>
                </div>
                
                {/* Desktop Nav */}
                <div className="hidden md:flex space-x-1">
                    {['dashboard', 'team', 'missions', 'messages', 'profile'].map((tab) => (
                        <button 
                            key={tab}
                            onClick={() => tab === 'missions' ? onNavigate('guard-missions') : setCurrentView(tab as InternalView)} 
                            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${currentView === tab ? 'text-brand-black bg-brand-sage' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
                        >
                            {tab.charAt(0).toUpperCase() + tab.slice(1)}
                        </button>
                    ))}
                </div>

                {/* Profile/Logout */}
                <div className="hidden md:block">
                    <PortalHeader 
                        user={user ? { name: user.name, role: user.role, email: user.email } : null}
                        title="LEAD"
                        subtitle="Command"
                        onLogout={handleLogout}
                        onNavigate={onNavigate}
                        onProfileClick={() => setCurrentView('profile')}
                        onSettingsClick={() => setCurrentView('settings')}
                        hideMenuButton={true}
                    />
                </div>
                {/* Mobile Profile Toggle */}
                <div className="md:hidden">
                    <button onClick={() => setCurrentView('profile')} className="w-8 h-8 rounded-full bg-brand-sage text-black font-bold flex items-center justify-center shadow-lg text-xs">
                        {user?.name?.charAt(0) || 'U'}
                    </button>
                </div>
            </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-8 max-w-5xl mx-auto w-full pb-24 md:pb-8">
        {currentView !== 'dashboard' && (
          <button 
            onClick={() => setCurrentView('dashboard')}
            className="flex items-center text-gray-400 hover:text-white mb-8 text-sm font-bold group bg-brand-ebony/50 w-fit px-4 py-2 rounded-lg border border-white/5 hover:border-brand-sage/30 transition-all"
          >
            <ChevronRight className="w-4 h-4 mr-1 rotate-180 group-hover:-translate-x-1 transition-transform" /> Back to Command
          </button>
        )}

        {currentView === 'dashboard' && <DashboardHome />}
        {currentView === 'team' && <TeamView />}
        {currentView === 'profile' && <ProfileManagement user={user} />}
        
        {/* Placeholders for other views sharing same layout logic */}
        {(currentView === 'messages' || currentView === 'training' || currentView === 'appeals' || currentView === 'uniforms' || currentView === 'performance' || currentView === 'promotions' || currentView === 'settings') && (
           <div className="bg-brand-ebony rounded-2xl border border-white/5 p-16 text-center animate-fade-in-up">
              <div className="w-20 h-20 bg-brand-black rounded-full flex items-center justify-center mx-auto mb-6 border border-white/10 shadow-xl">
                 <Clock className="w-10 h-10 text-gray-600" />
              </div>
              <h3 className="text-3xl font-display font-bold text-white mb-2 capitalize">{currentView.replace('-', ' ')}</h3>
              <p className="text-gray-500 max-w-md mx-auto text-lg">This module is part of the standard guard suite. Lead Guard specific features are prioritized in the Dashboard and Active Mission views.</p>
              <button onClick={() => setCurrentView('dashboard')} className="mt-8 text-brand-sage hover:text-white text-sm font-bold underline decoration-2 underline-offset-4">Return Home</button>
           </div>
        )}
      </main>

      {/* Mobile Bottom Navigation */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-brand-black/90 backdrop-blur-xl border-t border-white/10 pb-6 pt-2 px-4 flex justify-between items-center z-50">
        <button onClick={() => setCurrentView('dashboard')} className={`flex flex-col items-center p-2 rounded-xl transition-colors ${currentView === 'dashboard' ? 'text-brand-sage bg-brand-sage/10' : 'text-gray-500'}`}>
          <Briefcase className="w-6 h-6 mb-1" />
          <span className="text-[10px] font-bold">Home</span>
        </button>
        <button onClick={() => onNavigate('guard-active-lead-mission')} className="flex flex-col items-center p-2 text-gray-500 hover:text-white transition-colors">
          <Target className="w-6 h-6 mb-1" />
          <span className="text-[10px] font-bold">Mission</span>
        </button>
        <button onClick={() => setCurrentView('team')} className={`flex flex-col items-center p-2 rounded-xl transition-colors ${currentView === 'team' ? 'text-brand-sage bg-brand-sage/10' : 'text-gray-500'}`}>
          <Users className="w-6 h-6 mb-1" />
          <span className="text-[10px] font-bold">Team</span>
        </button>
        <button onClick={() => setCurrentView('profile')} className={`flex flex-col items-center p-2 rounded-xl transition-colors ${currentView === 'profile' ? 'text-brand-sage bg-brand-sage/10' : 'text-gray-500'}`}>
          <User className="w-6 h-6 mb-1" />
          <span className="text-[10px] font-bold">Profile</span>
        </button>
      </div>

    </div>
  );
};

export default LeadGuardDashboard;
