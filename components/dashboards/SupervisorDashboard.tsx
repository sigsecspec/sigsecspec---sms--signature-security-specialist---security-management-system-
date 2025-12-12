
import React, { useState, useEffect } from 'react';
import { 
  Users, ClipboardCheck, Target, MessageSquare, Briefcase, 
  FileText, MapPin, GitPullRequest, LayoutDashboard, BookOpen, User, 
  Settings, CheckCircle, AlertTriangle, Clock, Eye, ShieldCheck, PlayCircle,
  Search, Plus, Award
} from 'lucide-react';
import PortalLayout, { NavGroup } from '../layout/PortalLayout';
import { KPIMeter, QuickActionCard, PlaceholderView } from '../common/DashboardWidgets';
import TeamManagement from '../modules/shared/TeamManagement';
import ApplicationTrainingManagement from '../modules/shared/ApplicationTrainingManagement';
import ContractManagement from '../modules/shared/ContractManagement';
import SiteManagement from '../modules/shared/SiteManagement';
import ProfileManagement from '../modules/shared/ProfileManagement';
import Communications from '../modules/communications/Communications';
import TrainingOfficerConsole from '../modules/training/TrainingOfficerConsole';
import MyMissions from '../guard/MyMissions';
import { PageView } from '../../types';
import { supabase } from '../../services/supabase';

interface SupervisorDashboardProps {
  user: any;
  onNavigate: (page: PageView) => void;
  onLogout: () => void;
}

type ViewID = 
  | 'dashboard' 
  | 'spot-checks' 
  | 'my-guard-shifts' 
  | 'team' 
  | 'training' 
  | 'training-command'
  | 'contracts' 
  | 'site-management' 
  | 'messages' 
  | 'profile' 
  | 'settings';

const SupervisorHome = ({ onViewChange, onNavigate, stats }: { onViewChange: (view: ViewID) => void, onNavigate: (page: PageView) => void, stats: any }) => {
  return (
    <div className="space-y-6 animate-fade-in-up pb-20">
       {/* KPIs */}
       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <KPIMeter label="Active Guards" value={stats.activeGuards.toString()} trend="up" trendValue="Online" color="green" icon={<Users />} />
          <KPIMeter label="Spot Checks Due" value={stats.spotChecksDue.toString()} trend="up" trendValue="Action Req" color="orange" icon={<ClipboardCheck />} />
          <KPIMeter label="Training Review" value={stats.pendingTraining.toString()} trend="up" trendValue="Pending" color="blue" icon={<BookOpen />} />
          <KPIMeter label="My Shifts" value={stats.myShifts.toString()} trend="up" trendValue="Upcoming" color="purple" icon={<ShieldCheck />} />
       </div>

       {/* Quick Actions */}
       <div className="bg-brand-ebony p-6 rounded-xl border border-brand-800">
          <h3 className="text-white font-bold mb-4 text-sm uppercase tracking-wider">Supervision Actions</h3>
          <div className="flex flex-wrap gap-4">
             <QuickActionCard icon={<Target />} label="Find Spot Check" color="blue" onClick={() => onViewChange('spot-checks')} />
             <QuickActionCard icon={<Briefcase />} label="My Guard Shifts" color="green" onClick={() => onViewChange('my-guard-shifts')} />
             <QuickActionCard icon={<BookOpen />} label="Review Training" badge={stats.pendingTraining} color="orange" onClick={() => onViewChange('training-command')} />
             <QuickActionCard icon={<MessageSquare />} label="Team Chat" color="purple" onClick={() => onViewChange('messages')} />
          </div>
       </div>

       {/* Recent Activity / Status */}
       <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-brand-ebony rounded-xl border border-brand-800 p-6">
              <h3 className="font-bold text-white mb-4 flex items-center"><ActivityIcon className="w-4 h-4 mr-2 text-brand-sage" /> Live Team Status</h3>
              <div className="space-y-3">
                  <div className="flex justify-between items-center p-3 bg-brand-900/30 rounded border border-brand-800">
                      <span className="text-sm text-gray-300">Guards On Site</span>
                      <span className="text-green-400 font-bold">8</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-brand-900/30 rounded border border-brand-800">
                      <span className="text-sm text-gray-300">Late Check-ins</span>
                      <span className="text-red-400 font-bold">0</span>
                  </div>
                  <button onClick={() => onViewChange('team')} className="text-xs text-brand-sage hover:underline mt-2">View Team Roster</button>
              </div>
          </div>
       </div>
    </div>
  );
};

const AvailableSpotChecks = ({ userId, onNavigate }: { userId: string, onNavigate: (p: PageView) => void }) => {
    const [available, setAvailable] = useState<any[]>([]);
    const [claimed, setClaimed] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchMissions();
    }, []);

    const fetchMissions = async () => {
        setLoading(true);
        try {
            // Fetch active missions
            const { data: missions } = await supabase
                .from('missions')
                .select(`
                    id, start_time, end_time,
                    site:sites(name, address),
                    assignments:mission_assignments(guard_id, status)
                `)
                .eq('status', 'active');

            if (missions) {
                const now = new Date();
                const myAssignedIds = new Set<string>();
                
                // Process missions to see which ones I am already working (exclude those)
                const candidates: any[] = [];
                const myClaims: any[] = [];

                missions.forEach((m: any) => {
                    const isMyMission = m.assignments.some((a: any) => a.guard_id === userId && a.role !== 'Supervisor');
                    // Logic: If I am working this mission as a guard, I cannot spot check it.
                    
                    if (!isMyMission) {
                        // Check if I have already claimed spot check for this
                        // (Mocking spot check assignment via local logic or hypothetical table)
                        // For demo: randomly assign status
                        const randomStatus = Math.random() > 0.8 ? 'claimed' : 'available'; 
                        
                        const item = {
                            id: m.id,
                            site: m.site?.name,
                            address: m.site?.address,
                            time: `${new Date(m.start_time).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}`,
                            guardCount: m.assignments.length
                        };

                        if (randomStatus === 'claimed') {
                            myClaims.push(item);
                        } else {
                            candidates.push(item);
                        }
                    }
                });

                setAvailable(candidates);
                setClaimed(myClaims);
            }
        } catch(e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleClaim = (id: string) => {
        // In real app: Insert into mission_assignments with role='Supervisor'
        alert("Spot Check Claimed!");
        const mission = available.find(m => m.id === id);
        if (mission) {
            setAvailable(prev => prev.filter(m => m.id !== id));
            setClaimed(prev => [...prev, mission]);
        }
    };

    return (
        <div className="space-y-8 animate-fade-in-up">
            {/* My Assignments */}
            <div>
                <h3 className="text-xl font-bold text-white mb-4 flex items-center">
                    <ClipboardCheck className="w-5 h-5 mr-2 text-brand-sage" /> My Spot Checks
                </h3>
                {claimed.length === 0 ? (
                    <div className="bg-brand-ebony border border-brand-800 rounded-xl p-6 text-center text-gray-500">
                        You have not claimed any spot checks yet.
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {claimed.map(m => (
                            <div key={m.id} className="bg-brand-ebony border border-brand-sage/30 rounded-xl p-6 shadow-lg relative overflow-hidden group">
                                <div className="absolute top-0 right-0 p-4 opacity-10"><Target size={80} /></div>
                                <h4 className="text-lg font-bold text-white">{m.site}</h4>
                                <p className="text-gray-400 text-sm mb-4">{m.address}</p>
                                <div className="flex justify-between items-center">
                                    <span className="text-xs bg-brand-black px-2 py-1 rounded border border-brand-700 text-gray-300">{m.guardCount} Guards On Site</span>
                                    <button 
                                        onClick={() => onNavigate('supervisor-spot-check')}
                                        className="bg-green-600 hover:bg-green-500 text-white font-bold py-2 px-4 rounded-lg text-sm flex items-center shadow-lg transition-transform hover:-translate-y-1"
                                    >
                                        <PlayCircle className="w-4 h-4 mr-2" /> Start Check
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Available Board */}
            <div>
                <h3 className="text-xl font-bold text-white mb-4 flex items-center">
                    <Search className="w-5 h-5 mr-2 text-blue-400" /> Available for Review
                </h3>
                <div className="bg-brand-ebony border border-brand-800 rounded-xl overflow-hidden">
                    {loading ? (
                        <div className="p-8 text-center text-gray-500">Loading missions...</div>
                    ) : available.length === 0 ? (
                        <div className="p-8 text-center text-gray-500">No active missions available for spot checks.</div>
                    ) : (
                        <table className="w-full text-left">
                            <thead className="bg-brand-900 border-b border-brand-800">
                                <tr>
                                    <th className="p-4 text-xs font-bold text-gray-500 uppercase">Site</th>
                                    <th className="p-4 text-xs font-bold text-gray-500 uppercase">Address</th>
                                    <th className="p-4 text-xs font-bold text-gray-500 uppercase">Shift Time</th>
                                    <th className="p-4 text-xs font-bold text-gray-500 uppercase text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-brand-800">
                                {available.map(m => (
                                    <tr key={m.id} className="hover:bg-brand-800/30 transition-colors">
                                        <td className="p-4 font-bold text-white text-sm">{m.site}</td>
                                        <td className="p-4 text-gray-400 text-sm">{m.address}</td>
                                        <td className="p-4 text-gray-400 text-sm">{m.time}</td>
                                        <td className="p-4 text-right">
                                            <button 
                                                onClick={() => handleClaim(m.id)}
                                                className="text-xs bg-blue-600 hover:bg-blue-500 text-white px-3 py-1.5 rounded font-bold"
                                            >
                                                Claim
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </div>
    );
};

const SupervisorDashboard: React.FC<SupervisorDashboardProps> = ({ user, onNavigate, onLogout }) => {
  const [currentView, setCurrentView] = useState<ViewID>('dashboard');
  const [stats, setStats] = useState({ activeGuards: 0, spotChecksDue: 0, pendingTraining: 0, myShifts: 0 });

  useEffect(() => {
      const fetchStats = async () => {
          if (!user) return;
          // Guards
          const { count: guardCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'guard').eq('status', 'active');
          // Training
          const { count: trainingCount } = await supabase.from('user_training_progress').select('*', { count: 'exact', head: true }).eq('status', 'pending_approval');
          // My Shifts
          const { count: myShiftCount } = await supabase.from('mission_assignments').select('*', { count: 'exact', head: true }).eq('guard_id', user.id).eq('status', 'Scheduled');

          setStats({
              activeGuards: guardCount || 0,
              spotChecksDue: 2, // Mocked pending query implementation
              pendingTraining: trainingCount || 0,
              myShifts: myShiftCount || 0
          });
      };
      fetchStats();
  }, [user]);

  const navigation: NavGroup[] = [
    {
      title: 'Field Operations',
      items: [
        { id: 'dashboard', label: 'Overview', icon: <LayoutDashboard size={18} /> },
        { id: 'spot-checks', label: 'Spot Checks', icon: <ClipboardCheck size={18} />, badge: stats.spotChecksDue || undefined },
        { id: 'my-guard-shifts', label: 'Guard Shifts', icon: <ShieldCheck size={18} /> },
        { id: 'team', label: 'Team Roster', icon: <Users size={18} /> },
      ]
    },
    {
      title: 'Management',
      items: [
        { id: 'training-command', label: 'Training Command', icon: <Award size={18} />, badge: stats.pendingTraining || undefined },
        { id: 'training', label: 'My Training', icon: <BookOpen size={18} /> },
        { id: 'contracts', label: 'Contracts', icon: <FileText size={18} /> },
        { id: 'site-management', label: 'Sites', icon: <MapPin size={18} /> },
      ]
    },
    {
      title: 'Account',
      items: [
        { id: 'profile', label: 'My Profile', icon: <User size={18} /> },
        { id: 'messages', label: 'Messages', icon: <MessageSquare size={18} /> },
        { id: 'settings', label: 'Settings', icon: <Settings size={18} /> },
      ]
    }
  ];

  const renderContent = () => {
    switch (currentView) {
      case 'dashboard': return <SupervisorHome onViewChange={setCurrentView} onNavigate={onNavigate} stats={stats} />;
      case 'spot-checks': return <AvailableSpotChecks userId={user.id} onNavigate={onNavigate} />;
      case 'my-guard-shifts': return <div className="h-full"><MyMissions onNavigate={onNavigate} /></div>; // Embed Guard View
      case 'team': return <TeamManagement currentUserRole="Supervisor" />;
      case 'training': return <ApplicationTrainingManagement currentUserRole="Supervisor" />;
      case 'training-command': return <TrainingOfficerConsole onNavigate={onNavigate} />;
      case 'contracts': return <ContractManagement currentUserRole="Supervisor" />;
      case 'site-management': return <SiteManagement currentUserRole="Supervisor" />;
      case 'profile': return <ProfileManagement user={user} />;
      case 'messages': return <Communications user={user} />;
      case 'settings': return <PlaceholderView title="Account Settings" />;
      default: return <SupervisorHome onViewChange={setCurrentView} onNavigate={onNavigate} stats={stats} />;
    }
  };

  return (
    <PortalLayout
      user={user}
      title="SUPERVISOR"
      subtitle="Sergeant Portal"
      onLogout={onLogout}
      onNavigate={onNavigate}
      navigation={navigation}
      activeView={currentView}
      onViewChange={(id) => setCurrentView(id as ViewID)}
    >
      <div className="max-w-7xl mx-auto h-full">
        {renderContent()}
      </div>
    </PortalLayout>
  );
};

const ActivityIcon = ({ className }: { className?: string }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
);

export default SupervisorDashboard;