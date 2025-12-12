
import React, { useState, useEffect } from 'react';
import { 
  Target, Search, Filter, Plus, CheckCircle, AlertTriangle, 
  Clock, BarChart2, ChevronRight, X, History, User, 
  MapPin, Shield, Calendar, Activity, Radio, AlertCircle,
  FileText, Users, DollarSign, PieChart, TrendingUp,
  MoreVertical, RefreshCw, Phone, MessageSquare
} from 'lucide-react';
import { KPIMeter, SimpleBarChart, QuickActionCard } from '../../common/DashboardWidgets';
import { supabase } from '../../../services/supabase';
import MissionDetail from './MissionDetail';
import CreateMissionModal from './CreateMissionModal';
import { useAuth } from '../../../contexts/AuthContext';

type MissionStatus = 
  | 'active' 
  | 'pending' 
  | 'assigned' 
  | 'starting_soon' 
  | 'completed' 
  | 'cancelled' 
  | 'on_hold' 
  | 'issue_reported' 
  | 'emergency';

interface Mission {
  id: string;
  clientName: string;
  siteName: string;
  type: string;
  team: string;
  status: MissionStatus;
  startTime: string;
  endTime: string;
  alerts: number;
}

const MissionManagement = ({ currentUserRole = 'Owner' }: { currentUserRole?: string }) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'active' | 'upcoming' | 'assignments' | 'monitoring' | 'analytics'>('active');
  const [searchQuery, setSearchQuery] = useState('');
  const [missions, setMissions] = useState<Mission[]>([]);
  const [selectedMissionId, setSelectedMissionId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Permission to create
  const canCreate = ['Owner', 'Management', 'Operations Director', 'Operations Manager', 'Client'].includes(currentUserRole);

  // Fetch Missions
  const fetchMissions = async () => {
      setLoading(true);
      try {
          let query = supabase
              .from('missions')
              .select(`
                  id,
                  type,
                  status,
                  start_time,
                  end_time,
                  alerts,
                  site:sites(name),
                  client:clients!missions_client_id_fkey(business_name),
                  team:teams(name)
              `)
              .order('start_time', { ascending: false });
          
          if (currentUserRole === 'Client' && user) {
              query = query.eq('client_id', user.id);
          }

          const { data, error } = await query;

          if (data) {
              const formatted: Mission[] = data.map((m: any) => ({
                  id: m.id,
                  clientName: m.client?.business_name || 'Unknown Client',
                  siteName: m.site?.name || 'Unknown Site',
                  type: m.type || 'General',
                  team: m.team?.name || 'Unassigned',
                  status: (m.status as MissionStatus) || 'pending',
                  startTime: new Date(m.start_time).toLocaleString(),
                  endTime: new Date(m.end_time).toLocaleString(),
                  alerts: m.alerts || 0
              }));
              setMissions(formatted);
          }
      } catch (err) {
          console.error(err);
      } finally {
          setLoading(false);
      }
  };

  useEffect(() => {
    fetchMissions();
  }, []);

  const getStatusColor = (status: MissionStatus) => {
    switch (status) {
      case 'active': return 'bg-green-500/20 text-green-400 border-green-500/50';
      case 'completed': return 'bg-blue-500/20 text-blue-400 border-blue-500/50';
      case 'pending': return 'bg-orange-500/20 text-orange-400 border-orange-500/50';
      case 'starting_soon': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50';
      case 'on_hold': return 'bg-gray-500/20 text-gray-400 border-gray-500/50';
      case 'issue_reported': return 'bg-red-500/20 text-red-400 border-red-500/50';
      case 'emergency': return 'bg-red-600/20 text-red-500 border-red-600/50 animate-pulse';
      case 'cancelled': return 'bg-gray-700/20 text-gray-500 border-gray-700/50';
      default: return 'bg-gray-800 text-white';
    }
  };

  const filteredMissions = missions.filter(m => {
    const matchesSearch = m.clientName.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          m.siteName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          m.id.toLowerCase().includes(searchQuery.toLowerCase());
    
    let matchesTab = false;
    if (activeTab === 'active') matchesTab = ['active', 'issue_reported', 'emergency', 'on_hold'].includes(m.status);
    else if (activeTab === 'upcoming') matchesTab = ['pending', 'assigned', 'starting_soon'].includes(m.status);
    else matchesTab = true; 

    return matchesSearch && matchesTab;
  });

  const RenderActiveMissions = () => (
    <div className="bg-brand-ebony rounded-xl border border-brand-800 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
            <thead className="bg-brand-900 border-b border-brand-800">
            <tr>
                <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Mission ID / Client</th>
                <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Site & Type</th>
                <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Schedule</th>
                <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Actions</th>
            </tr>
            </thead>
            <tbody className="divide-y divide-brand-800">
            {filteredMissions.length === 0 ? (
                <tr>
                    <td colSpan={5} className="p-12 text-center text-gray-500">
                        <div className="flex flex-col items-center">
                            <Target className="w-12 h-12 mb-4 opacity-20" />
                            <p>No missions found.</p>
                        </div>
                    </td>
                </tr>
            ) : (
                filteredMissions.map(mission => (
                    <tr 
                    key={mission.id} 
                    onClick={() => setSelectedMissionId(mission.id)}
                    className="hover:bg-brand-800/40 transition-colors cursor-pointer group"
                    >
                    <td className="p-4">
                        <div className="font-bold text-white text-sm group-hover:text-brand-sage transition-colors">{mission.clientName}</div>
                        <div className="text-xs text-gray-500 font-mono mt-1">{mission.id.substring(0,8)}...</div>
                    </td>
                    <td className="p-4">
                        <div className="text-sm text-gray-300">{mission.siteName}</div>
                        <div className="text-xs text-gray-500 mt-1 flex items-center"><Shield className="w-3 h-3 mr-1" /> {mission.type}</div>
                    </td>
                    <td className="p-4 text-xs text-gray-400">
                        <div className="flex items-center text-white"><Clock className="w-3 h-3 mr-1" /> {mission.startTime}</div>
                    </td>
                    <td className="p-4">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded text-[10px] font-bold uppercase tracking-wide border ${getStatusColor(mission.status)}`}>
                        {mission.status}
                        </span>
                    </td>
                    <td className="p-4 text-right">
                        <button className="p-2 hover:bg-brand-900 rounded-full text-gray-400 hover:text-white transition-colors">
                        <ChevronRight size={16} />
                        </button>
                    </td>
                    </tr>
                ))
            )}
            </tbody>
        </table>
        </div>
    </div>
  );

  return (
    <div className="flex flex-col bg-brand-black text-gray-200 animate-fade-in-up w-full">
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-display font-bold text-white flex items-center">
            <Target className="w-6 h-6 mr-3 text-brand-sage" />
            Mission Management
          </h2>
          <p className="text-sm text-gray-500 mt-1 ml-9">Operational oversight, dispatch, and live monitoring.</p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3 w-full xl:w-auto">
           <div className="relative flex-grow xl:flex-grow-0 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input 
                type="text" 
                placeholder="Search missions..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-brand-ebony border border-brand-800 rounded pl-10 pr-4 py-2 text-sm text-white focus:border-brand-sage outline-none" 
              />
           </div>
           {canCreate && (
               <button 
                 onClick={() => setIsCreateModalOpen(true)}
                 className="bg-brand-sage text-black px-4 py-2 rounded font-bold text-sm hover:bg-brand-sage/90 flex items-center justify-center whitespace-nowrap shadow-lg w-full sm:w-auto"
               >
                 <Plus className="w-4 h-4 mr-2" /> Create Mission
               </button>
           )}
        </div>
      </div>

      <div className="flex overflow-x-auto border-b border-brand-800 mb-6 scrollbar-hide">
        {[
          { id: 'active', label: 'Active Missions', icon: <Radio size={16} /> },
          { id: 'upcoming', label: 'Upcoming', icon: <Calendar size={16} /> },
          { id: 'assignments', label: 'Assignments', icon: <Users size={16} /> },
          { id: 'monitoring', label: 'Live Monitoring', icon: <Activity size={16} /> },
          { id: 'analytics', label: 'Analytics', icon: <BarChart2 size={16} /> },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center px-6 py-4 border-b-2 font-medium text-sm whitespace-nowrap transition-colors ${
              activeTab === tab.id 
                ? 'border-brand-sage text-brand-sage bg-brand-sage/5' 
                : 'border-transparent text-gray-400 hover:text-white hover:bg-brand-ebony'
            }`}
          >
            <span className="mr-2">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'active' && <RenderActiveMissions />}
      {activeTab === 'upcoming' && <RenderActiveMissions />} 
      
      {(activeTab === 'assignments' || activeTab === 'monitoring' || activeTab === 'analytics') && (
          <div className="p-8 text-center text-gray-500">Feature awaiting full data integration.</div>
      )}

      {selectedMissionId && (
        <MissionDetail 
            missionId={selectedMissionId} 
            onClose={() => setSelectedMissionId(null)} 
            currentUserRole={currentUserRole}
            onUpdate={fetchMissions}
        />
      )}

      {isCreateModalOpen && user && (
          <CreateMissionModal
              onClose={() => setIsCreateModalOpen(false)}
              onSuccess={() => {
                  fetchMissions();
                  setIsCreateModalOpen(false);
              }}
              currentUserRole={currentUserRole}
              currentUserId={user.id}
          />
      )}
    </div>
  );
};

export default MissionManagement;
