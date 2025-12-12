
import React, { useState, useEffect } from 'react';
import { 
  Briefcase, BookOpen, Clock, Award, User, 
  MessageSquare, DollarSign, Shirt, MapPin, Shield, 
  Bell, Search, ChevronRight, Lock, Target
} from 'lucide-react';
import { PageView } from '../../types';
import { KPIMeter, QuickActionCard } from '../../components/common/DashboardWidgets';
import ProfileManagement from '../modules/shared/ProfileManagement';
import Communications from '../modules/communications/Communications';
import { supabase } from '../../services/supabase';
import PortalHeader from '../PortalHeader';

interface GuardDashboardProps {
  user: any;
  onNavigate: (page: PageView) => void;
}

type InternalView = 'dashboard' | 'profile' | 'messages' | 'earnings' | 'performance' | 'uniforms' | 'appeals' | 'promotions' | 'settings';

const GuardDashboard: React.FC<GuardDashboardProps> = ({ user, onNavigate }) => {
  const [currentView, setCurrentView] = useState<InternalView>('dashboard');
  const [activeMission, setActiveMission] = useState<any>(null);
  const [hasPendingTraining, setHasPendingTraining] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
        if (!user) return;
        setIsLoading(true);
        try {
            const { data: assignmentData } = await supabase
                .from('mission_assignments')
                .select(`
                    id, role, status,
                    mission:missions (
                        id, type, start_time, end_time,
                        site:sites ( name, address ),
                        client:profiles!missions_client_id_fkey ( full_name )
                    )
                `)
                .eq('guard_id', user.id)
                .eq('status', 'On Site')
                .single();

            if (assignmentData) {
                const missionData: any = assignmentData.mission;
                const mission = Array.isArray(missionData) ? missionData[0] : missionData;
                if (mission) {
                    const site = Array.isArray(mission.site) ? mission.site[0] : mission.site;
                    const client = Array.isArray(mission.client) ? mission.client[0] : mission.client;
                    setActiveMission({
                        id: mission.id,
                        title: site?.name || 'Unknown Site',
                        client: client?.full_name || 'Unknown Client',
                        location: site?.address || '',
                        startTime: new Date(mission.start_time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
                        endTime: new Date(mission.end_time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
                        status: 'In Progress'
                    });
                }
            }
            setHasPendingTraining(false);
        } catch (err) {
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };
    fetchData();
  }, [user]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    onNavigate('login');
  };

  const DashboardHome = () => (
    <div className="space-y-6 animate-fade-in-up pb-24">
      {/* Welcome & Notifications */}
      <div className="flex justify-between items-center px-2 pt-2">
        <div>
          <h1 className="text-2xl md:text-3xl font-display font-bold text-white tracking-wide">FIELD COMMAND</h1>
          <p className="text-gray-400 text-sm">Status: <span className="text-green-400 font-bold">Active Duty</span></p>
        </div>
        <button onClick={() => setCurrentView('messages')} className="relative p-3 bg-white/5 rounded-xl text-gray-400 hover:text-white transition-all border border-white/10 shadow-lg backdrop-blur-sm">
          <Bell className="w-5 h-5" />
          <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
        </button>
      </div>

      {/* Active Mission Card - The Hero */}
      <div className="relative group">
        <div className="absolute inset-0 bg-gradient-to-r from-brand-sage/20 to-blue-500/20 rounded-2xl blur-xl opacity-50 group-hover:opacity-75 transition-opacity"></div>
        <div className="glass-panel rounded-2xl p-6 md:p-8 relative overflow-hidden shadow-2xl border border-white/10 bg-brand-ebony/90">
            <div className="absolute top-0 right-0 p-6 opacity-[0.05] pointer-events-none">
               <Shield size={180} />
            </div>
            
            <div className="relative z-10">
                <div className="flex justify-between items-start mb-6">
                    <span className="bg-brand-black/50 text-gray-300 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border border-white/10 backdrop-blur-md">Current Assignment</span>
                    {activeMission && (
                        <span className="flex items-center text-xs font-bold text-green-400 bg-green-900/30 px-3 py-1 rounded-full border border-green-500/30 animate-pulse">
                            <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span> LIVE
                        </span>
                    )}
                </div>
                
                {activeMission ? (
                    <div className="space-y-6">
                        <div>
                            <h2 className="text-3xl md:text-4xl font-display font-bold text-white leading-tight mb-2">{activeMission.title}</h2>
                            <p className="text-brand-sage text-lg flex items-center"><MapPin className="w-4 h-4 mr-2" /> {activeMission.location}</p>
                        </div>
                        
                        <div className="flex gap-4">
                            <div className="bg-brand-black/50 px-4 py-3 rounded-xl border border-white/10 backdrop-blur-sm flex-1">
                                <p className="text-[10px] uppercase text-gray-500 font-bold mb-1">Shift Start</p>
                                <p className="font-mono font-bold text-xl text-white">{activeMission.startTime}</p>
                            </div>
                            <div className="bg-brand-black/50 px-4 py-3 rounded-xl border border-white/10 backdrop-blur-sm flex-1">
                                <p className="text-[10px] uppercase text-gray-500 font-bold mb-1">Shift End</p>
                                <p className="font-mono font-bold text-xl text-white">{activeMission.endTime}</p>
                            </div>
                        </div>

                        <button 
                            onClick={() => onNavigate('guard-active-mission')}
                            className="w-full bg-brand-sage text-black font-bold py-4 rounded-xl flex items-center justify-center hover:bg-brand-sage/90 transition-all shadow-[0_0_20px_rgba(124,154,146,0.3)] text-lg transform active:scale-95"
                        >
                            Open Mission Dashboard <ChevronRight className="w-5 h-5 ml-2" />
                        </button>
                    </div>
                ) : (
                    <div className="text-center py-8">
                        <div className="w-20 h-20 bg-brand-black/50 rounded-full flex items-center justify-center mx-auto mb-4 border border-white/10 shadow-inner">
                            <Shield className="w-10 h-10 text-gray-600" />
                        </div>
                        <h2 className="text-2xl font-bold text-white mb-2">Off Duty</h2>
                        <p className="text-gray-400 mb-8 max-w-xs mx-auto text-sm">You are not currently checked in. View available missions to pick up a shift.</p>
                        <button 
                            onClick={() => onNavigate('guard-mission-board')}
                            className="w-full bg-white/5 text-white border border-white/10 font-bold py-4 rounded-xl flex items-center justify-center hover:bg-white/10 transition-all shadow-lg text-sm uppercase tracking-wide"
                        >
                            Find Available Missions <Search className="w-4 h-4 ml-2" />
                        </button>
                    </div>
                )}
            </div>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 gap-4">
          <KPIMeter label="Monthly Pay" value="$3,240" trend="up" trendValue="+12%" color="green" icon={<DollarSign />} />
          <KPIMeter label="Rating" value="4.9" trend="up" trendValue="Top 5%" color="orange" icon={<Award />} />
      </div>

      {/* Quick Actions Grid */}
      <div>
        <h3 className="text-white font-bold mb-4 text-sm uppercase tracking-wider px-2">Quick Access</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <QuickActionCard icon={<Search />} label="Find Work" color="blue" onClick={() => onNavigate('guard-mission-board')} />
            <QuickActionCard icon={<BookOpen />} label="Training" badge={hasPendingTraining ? 1 : 0} color="purple" onClick={() => onNavigate('guard-training')} />
            <QuickActionCard icon={<Shirt />} label="Uniforms" color="green" onClick={() => setCurrentView('uniforms')} />
            <QuickActionCard icon={<MessageSquare />} label="Support" color="orange" onClick={() => setCurrentView('messages')} />
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-brand-black flex flex-col font-sans text-gray-200 pb-20 md:pb-0">
      
      {/* Desktop Header */}
      <div className="hidden md:block">
          <PortalHeader 
            user={user ? { name: user.full_name, role: user.role, email: user.email } : null}
            title="GUARD"
            subtitle="Portal"
            onLogout={handleLogout}
            onNavigate={onNavigate}
            onProfileClick={() => setCurrentView('profile')}
            onSettingsClick={() => setCurrentView('settings')}
            hideMenuButton={true}
          />
      </div>

      {/* Mobile Top Bar (Simplified) */}
      <div className="md:hidden bg-brand-black/80 backdrop-blur-md border-b border-white/10 p-4 flex justify-between items-center sticky top-0 z-50">
        <div className="flex items-center">
          <Shield className="w-6 h-6 text-brand-sage mr-2" />
          <span className="font-display font-bold text-white tracking-wider">GUARD PORTAL</span>
        </div>
        <button onClick={() => setCurrentView('profile')} className="w-8 h-8 rounded-full bg-brand-sage text-black font-bold flex items-center justify-center shadow-lg text-xs">
          {user?.full_name?.charAt(0) || 'U'}
        </button>
      </div>

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-8 max-w-5xl mx-auto w-full">
        {currentView !== 'dashboard' && (
          <button 
            onClick={() => setCurrentView('dashboard')}
            className="flex items-center text-gray-400 hover:text-white mb-6 text-sm font-medium group px-2"
          >
            <ChevronRight className="w-4 h-4 mr-1 rotate-180 group-hover:-translate-x-1 transition-transform" /> Back to Dashboard
          </button>
        )}

        {currentView === 'dashboard' && <DashboardHome />}
        {currentView === 'profile' && <ProfileManagement user={user} />}
        {currentView === 'messages' && <Communications user={user} />}
        
        {/* Placeholders */}
        {['earnings', 'performance', 'uniforms', 'appeals', 'promotions', 'settings'].includes(currentView) && (
           <div className="flex flex-col items-center justify-center min-h-[50vh] text-center p-8 bg-brand-ebony border border-white/10 rounded-2xl">
              <div className="w-20 h-20 bg-brand-black rounded-full flex items-center justify-center mb-6 border border-white/10">
                 <Lock className="w-8 h-8 text-gray-600" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-2 capitalize">{currentView} Module</h3>
              <p className="text-gray-400 max-w-xs">This feature is currently being integrated into the new platform.</p>
           </div>
        )}
      </main>

      {/* Mobile Bottom Nav (App-like feel) */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-brand-black/95 backdrop-blur-xl border-t border-white/10 pb-6 pt-3 px-6 flex justify-between items-center z-50 shadow-[0_-10px_40px_rgba(0,0,0,0.5)]">
        <button onClick={() => setCurrentView('dashboard')} className={`flex flex-col items-center gap-1 transition-colors ${currentView === 'dashboard' ? 'text-brand-sage' : 'text-gray-500'}`}>
          <Briefcase size={24} />
          <span className="text-[10px] font-bold">Home</span>
        </button>
        <button onClick={() => onNavigate('guard-missions')} className="flex flex-col items-center gap-1 text-gray-500 hover:text-white transition-colors">
          <MapPin size={24} />
          <span className="text-[10px] font-bold">Missions</span>
        </button>
        <button onClick={() => setCurrentView('messages')} className={`flex flex-col items-center gap-1 transition-colors ${currentView === 'messages' ? 'text-brand-sage' : 'text-gray-500'}`}>
          <MessageSquare size={24} />
          <span className="text-[10px] font-bold">Chat</span>
        </button>
        <button onClick={() => setCurrentView('profile')} className={`flex flex-col items-center gap-1 transition-colors ${currentView === 'profile' ? 'text-brand-sage' : 'text-gray-500'}`}>
          <User size={24} />
          <span className="text-[10px] font-bold">Profile</span>
        </button>
      </div>
    </div>
  );
};

export default GuardDashboard;
