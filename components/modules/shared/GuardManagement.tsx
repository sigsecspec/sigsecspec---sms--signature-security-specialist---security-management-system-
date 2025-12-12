
import React, { useState, useEffect } from 'react';
import { 
  Users, Search, Shield, ChevronRight, UserPlus, AlertCircle, TrendingUp,
  Filter, Award, Briefcase, AlertTriangle, FileText, BarChart2, Calendar,
  CheckCircle, XCircle, Clock, Ban, Star, ExternalLink, ArrowUpRight
} from 'lucide-react';
import { supabase } from '../../../services/supabase';
import GuardDetail from './GuardDetail';
import CreateGuardModal from './CreateGuardModal';
import { Guard, ProfileStatus } from '../../../types';
import { KPIMeter } from '../../common/DashboardWidgets';
import { useAuth } from '../../../contexts/AuthContext';

const GuardManagement = ({ currentUserRole = 'Owner' }: { currentUserRole?: string }) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'active' | 'performance' | 'assignments' | 'issues' | 'development'>('active');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [rankFilter, setRankFilter] = useState('all');
  const [teamFilter, setTeamFilter] = useState('all');
  const [guards, setGuards] = useState<Guard[]>([]);
  const [selectedGuard, setSelectedGuard] = useState<Guard | null>(null);
  const [loading, setLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [stats, setStats] = useState({ total: 0, active: 0, onLeave: 0, issues: 0 });

  // Permissions for creating accounts
  const canCreateAccount = ['Owner', 'Co-Owner', 'Management', 'Operations Director', 'Operations Manager', 'Operations'].includes(currentUserRole);

  useEffect(() => {
    fetchStaff();
  }, []);

  const fetchStaff = async () => {
      setLoading(true);
      try {
          // Fetch all records from 'guards' table (which includes Owner, Directors, Managers, Guards)
          const { data: staffData, error } = await supabase
              .from('guards')
              .select(`
                  *,
                  profile:profiles!guards_id_fkey (
                      id,
                      full_name,
                      email,
                      phone_primary,
                      status,
                      role,
                      is_blocked,
                      bio,
                      address_street,
                      address_city,
                      address_state,
                      address_zip,
                      created_at,
                      team:teams!fk_profiles_team(name)
                  )
              `);

          if (error) throw error;

          if (staffData) {
              const activeList: Guard[] = staffData.map((g: any) => {
                  const p = g.profile || {};
                  return {
                      id: g.id, 
                      full_name: p.full_name || 'Unknown',
                      email: p.email || '',
                      phone_primary: p.phone_primary || 'N/A',
                      rank: g.rank || 'OFC',
                      badgeNumber: g.badge_number || 'N/A',
                      level: g.guard_level ? `Level ${g.guard_level}` : 'Level 1',
                      status: p.status as ProfileStatus,
                      role: p.role, // This is the system role (e.g. 'owner', 'operations', 'guard')
                      team: p.team?.name || 'Unassigned',
                      performanceRating: g.performance_rating || 5.0,
                      lastActivity: g.last_activity ? new Date(g.last_activity).toLocaleDateString() : 'Never',
                      missionCount: g.mission_count || 0,
                      trainingStatus: 'Active', // Mocked, would check training table
                      created_at: p.created_at ? new Date(p.created_at).toLocaleDateString() : 'N/A',
                      history: [], 
                      bio: p.bio,
                      is_blocked: p.is_blocked,
                      address_street: p.address_street,
                      address_city: p.address_city,
                      address_state: p.address_state,
                      address_zip: p.address_zip
                  };
              });
              
              setGuards(activeList);
              setStats({
                  total: activeList.length,
                  active: activeList.filter(g => g.status === 'active').length,
                  onLeave: activeList.filter(g => g.status === 'on_leave').length,
                  issues: activeList.filter(g => g.status === 'suspended' || g.status === 'terminated').length
              });
          }
      } catch (err) {
          console.error('Error fetching staff:', err);
      } finally {
          setLoading(false);
      }
  };

  const getStatusColor = (status: string | ProfileStatus, isBlocked?: boolean) => {
    if (isBlocked) return 'bg-red-900/50 text-red-400 border-red-500';
    switch (status) {
      case 'active': return 'bg-green-500/20 text-green-400 border-green-500/50';
      case 'pending': return 'bg-orange-500/20 text-orange-400 border-orange-500/50';
      case 'suspended': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50';
      case 'terminated': return 'bg-red-500/20 text-red-400 border-red-500/50';
      case 'on_leave': return 'bg-blue-500/20 text-blue-400 border-blue-500/50';
      default: return 'bg-gray-800 text-gray-400 border-gray-700';
    }
  };

  const getRankBadge = (rank: string) => {
      const colors: any = {
          'CHF': 'bg-purple-900/50 text-purple-200 border-purple-500', // Chief
          'ASST CHF': 'bg-purple-900/30 text-purple-300 border-purple-500/50',
          'DPT CHF': 'bg-purple-900/20 text-purple-400 border-purple-500/30',
          'CMD': 'bg-blue-900/50 text-blue-200 border-blue-500', // Commander
          'CAP': 'bg-blue-900/30 text-blue-300 border-blue-500/50', // Captain
          'LT': 'bg-blue-900/20 text-blue-400 border-blue-500/30', // Lieutenant
          'SGT': 'bg-green-900/30 text-green-300 border-green-500/50', // Sergeant
          'CPL': 'bg-green-900/20 text-green-400 border-green-500/30', // Corporal
          'PVT': 'bg-gray-800 text-gray-300 border-gray-600', // Private
          'OFC': 'bg-gray-900 text-gray-400 border-gray-700' // Officer
      };
      return colors[rank] || colors['OFC'];
  };

  const getRankWeight = (rank: string) => {
      const ranks: Record<string, number> = { 
          'CHF': 10, 'ASST CHF': 9, 'DPT CHF': 8, 'CMD': 7, 'CAP': 6, 
          'LT': 5, 'SGT': 4, 'CPL': 3, 'PVT': 2, 'OFC': 1 
      };
      return ranks[rank] || 0;
  };

  const filteredGuards = guards.filter(g => {
    const matchesSearch = g.full_name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          g.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          g.badgeNumber.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || g.status === statusFilter;
    const matchesRank = rankFilter === 'all' || g.rank === rankFilter;
    const matchesTeam = teamFilter === 'all' || g.team === teamFilter;
    return matchesSearch && matchesStatus && matchesRank && matchesTeam;
  }).sort((a, b) => getRankWeight(b.rank) - getRankWeight(a.rank));

  // --- Renderers ---

  const RenderActiveGuards = () => (
    <div className="bg-brand-ebony rounded-xl border border-brand-800 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
            <thead className="bg-brand-900 border-b border-brand-800">
            <tr>
                <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Rank & Name</th>
                <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Badge & Role</th>
                <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Team</th>
                <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Performance</th>
                <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Actions</th>
            </tr>
            </thead>
            <tbody className="divide-y divide-brand-800">
            {filteredGuards.map(guard => (
                <tr key={guard.id} onClick={() => setSelectedGuard(guard)} className="hover:bg-brand-800/40 cursor-pointer group">
                <td className="p-4">
                    <div className="flex items-center">
                        <span className={`w-8 h-8 rounded flex items-center justify-center text-[10px] font-bold border mr-3 ${getRankBadge(guard.rank)}`}>
                            {guard.rank}
                        </span>
                        <div>
                            <div className="font-bold text-white text-sm group-hover:text-brand-sage transition-colors">{guard.full_name}</div>
                            <div className="text-xs text-gray-500">{guard.email}</div>
                        </div>
                    </div>
                </td>
                <td className="p-4">
                    <div className="text-sm text-gray-300 font-mono">{guard.badgeNumber}</div>
                    <div className="text-xs text-gray-500 capitalize">{guard.role}</div>
                </td>
                <td className="p-4">
                    <span className="text-xs bg-brand-black border border-brand-700 px-2 py-1 rounded text-gray-300">{guard.team}</span>
                </td>
                <td className="p-4">
                    <span className={`inline-flex items-center px-2 py-1 rounded text-[10px] font-bold uppercase border ${getStatusColor(guard.status, guard.is_blocked)}`}>
                        {guard.is_blocked ? <Ban className="w-3 h-3 mr-1" /> : null}
                        {guard.status.replace('_', ' ')}
                    </span>
                </td>
                <td className="p-4">
                    <div className="flex items-center">
                        <Star className="w-3 h-3 text-yellow-500 mr-1" />
                        <span className="text-sm font-bold text-white">{guard.performanceRating.toFixed(1)}</span>
                    </div>
                </td>
                <td className="p-4 text-right">
                    <button className="p-2 hover:bg-brand-900 rounded-full text-gray-400 hover:text-white transition-colors">
                        <ChevronRight size={16} />
                    </button>
                </td>
                </tr>
            ))}
            </tbody>
        </table>
        </div>
    </div>
  );

  const RenderPerformance = () => (
      <div className="bg-brand-ebony rounded-xl border border-brand-800 overflow-hidden shadow-xl">
          <table className="w-full text-left border-collapse">
              <thead className="bg-brand-900 border-b border-brand-800">
                  <tr>
                      <th className="p-4 text-xs font-bold text-gray-500 uppercase">Guard</th>
                      <th className="p-4 text-xs font-bold text-gray-500 uppercase">Rating</th>
                      <th className="p-4 text-xs font-bold text-gray-500 uppercase">Missions</th>
                      <th className="p-4 text-xs font-bold text-gray-500 uppercase">Reliability</th>
                      <th className="p-4 text-xs font-bold text-gray-500 uppercase">Last Review</th>
                  </tr>
              </thead>
              <tbody className="divide-y divide-brand-800">
                  {filteredGuards.sort((a,b) => b.performanceRating - a.performanceRating).map(g => (
                      <tr key={g.id} onClick={() => setSelectedGuard(g)} className="hover:bg-brand-800/40 cursor-pointer">
                          <td className="p-4 font-bold text-white text-sm">{g.full_name}</td>
                          <td className="p-4 text-brand-sage font-bold">{g.performanceRating.toFixed(1)}/5.0</td>
                          <td className="p-4 text-gray-300">{g.missionCount}</td>
                          <td className="p-4">
                              <div className="w-24 bg-brand-900 h-1.5 rounded-full overflow-hidden">
                                  <div className="bg-blue-500 h-full" style={{ width: '95%' }}></div>
                              </div>
                              <span className="text-xs text-blue-400 mt-1 block">95%</span>
                          </td>
                          <td className="p-4 text-xs text-gray-500">2 weeks ago</td>
                      </tr>
                  ))}
              </tbody>
          </table>
      </div>
  );

  const RenderAssignments = () => (
      <div className="bg-brand-ebony rounded-xl border border-brand-800 overflow-hidden shadow-xl">
          <table className="w-full text-left border-collapse">
              <thead className="bg-brand-900 border-b border-brand-800">
                  <tr>
                      <th className="p-4 text-xs font-bold text-gray-500 uppercase">Guard</th>
                      <th className="p-4 text-xs font-bold text-gray-500 uppercase">Availability</th>
                      <th className="p-4 text-xs font-bold text-gray-500 uppercase">Current Status</th>
                      <th className="p-4 text-xs font-bold text-gray-500 uppercase">Last Active</th>
                  </tr>
              </thead>
              <tbody className="divide-y divide-brand-800">
                  {filteredGuards.map(g => (
                      <tr key={g.id} onClick={() => setSelectedGuard(g)} className="hover:bg-brand-800/40 cursor-pointer">
                          <td className="p-4 font-bold text-white text-sm">{g.full_name}</td>
                          <td className="p-4 text-green-400 text-xs font-bold">Full-Time</td>
                          <td className="p-4">
                              {g.status === 'active' ? (
                                  <span className="text-xs bg-blue-900/30 text-blue-400 px-2 py-1 rounded border border-blue-500/30">Available</span>
                              ) : (
                                  <span className="text-xs text-gray-500">Unavailable</span>
                              )}
                          </td>
                          <td className="p-4 text-xs text-gray-500">{g.lastActivity}</td>
                      </tr>
                  ))}
              </tbody>
          </table>
      </div>
  );

  return (
    <div className="flex flex-col bg-brand-black text-gray-200 animate-fade-in-up w-full">
      {/* Header & Stats */}
      <div className="mb-6">
          <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 mb-6">
            <div>
                <h2 className="text-2xl font-display font-bold text-white flex items-center">
                    <Shield className="w-6 h-6 mr-3 text-brand-sage" /> Guard Management
                </h2>
                <p className="text-sm text-gray-500 mt-1 ml-9">Manage all mission-capable personnel (Guards, Supervisors, Ops, Owners).</p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3 w-full xl:w-auto">
                <div className="relative flex-grow xl:flex-grow-0 min-w-[200px]">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                    <input 
                        type="text" 
                        placeholder="Search name, badge, email..." 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-brand-ebony border border-brand-800 rounded pl-10 pr-4 py-2 text-sm text-white focus:border-brand-sage outline-none" 
                    />
                </div>
                <div className="flex gap-2">
                    <select 
                        value={rankFilter} 
                        onChange={(e) => setRankFilter(e.target.value)}
                        className="bg-brand-ebony border border-brand-800 rounded px-3 py-2 text-sm text-white focus:border-brand-sage outline-none cursor-pointer"
                    >
                        <option value="all">All Ranks</option>
                        <option value="OFC">Officer</option>
                        <option value="PVT">Lead</option>
                        <option value="SGT">Supervisor</option>
                        <option value="LT">Ops Manager</option>
                        <option value="CAP">Ops Director</option>
                        <option value="CHF">Owner</option>
                    </select>
                    <select 
                        value={statusFilter} 
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="bg-brand-ebony border border-brand-800 rounded px-3 py-2 text-sm text-white focus:border-brand-sage outline-none cursor-pointer"
                    >
                        <option value="all">All Statuses</option>
                        <option value="active">Active</option>
                        <option value="pending">Pending</option>
                        <option value="suspended">Suspended</option>
                        <option value="on_leave">On Leave</option>
                    </select>
                </div>
                {canCreateAccount && (
                    <button 
                        onClick={() => setIsCreateModalOpen(true)}
                        className="bg-brand-sage text-black px-4 py-2 rounded font-bold text-sm hover:bg-brand-sage/90 flex items-center justify-center whitespace-nowrap shadow-lg"
                    >
                        <UserPlus className="w-4 h-4 mr-2" /> Create Guard Account
                    </button>
                )}
            </div>
          </div>

          {/* Training & App Hint */}
          <div className="bg-brand-900/30 border border-brand-800 p-3 rounded-lg mb-6 flex items-center justify-between">
              <div className="flex items-center text-sm text-gray-400">
                  <AlertCircle className="w-4 h-4 mr-2 text-brand-sage" />
                  <span>Looking for applications or training approvals? Check the Application & Training Management page.</span>
              </div>
              <div className="text-xs font-bold text-brand-sage uppercase tracking-wider flex items-center">
                  Apps & Training <ArrowUpRight className="w-3 h-3 ml-1" />
              </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <KPIMeter label="Total Personnel" value={stats.total.toString()} trend="up" trendValue="Total" color="blue" icon={<Users />} />
              <KPIMeter label="Active Duty" value={stats.active.toString()} trend="up" trendValue="Working" color="green" icon={<Shield />} />
              <KPIMeter label="On Leave" value={stats.onLeave.toString()} trend="down" trendValue="Away" color="gray" icon={<Clock />} />
              <KPIMeter label="Issues / Suspended" value={stats.issues.toString()} trend="down" trendValue="Alert" color="red" icon={<AlertTriangle />} />
          </div>
      </div>

      {/* Tabs */}
      <div className="flex overflow-x-auto border-b border-brand-800 mb-6 scrollbar-hide">
        {[
          { id: 'active', label: 'Active Guards', icon: <Users size={16} /> },
          { id: 'performance', label: 'Performance', icon: <TrendingUp size={16} /> },
          { id: 'assignments', label: 'Assignments', icon: <Briefcase size={16} /> },
          { id: 'issues', label: 'Issues & Compliance', icon: <AlertTriangle size={16} /> },
          { id: 'development', label: 'Development', icon: <Award size={16} /> },
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

      {loading ? (
          <div className="p-12 text-center text-gray-500">Loading Personnel Data...</div>
      ) : (
          <>
            {activeTab === 'active' && <RenderActiveGuards />}
            {activeTab === 'performance' && <RenderPerformance />}
            {activeTab === 'assignments' && <RenderAssignments />}
            
            {/* Placeholders for secondary tabs */}
            {(activeTab === 'issues' || activeTab === 'development') && (
                <div className="bg-brand-ebony rounded-xl border border-brand-800 p-12 text-center text-gray-500">
                    <FileText className="w-16 h-16 mx-auto mb-4 opacity-20" />
                    <h3 className="text-xl font-bold text-white mb-2 capitalize">{activeTab.replace('-', ' ')} Module</h3>
                    <p>Advanced management features for {activeTab} will be displayed here.</p>
                    <p className="text-xs mt-2">Use Detailed View on individual guards for specific records.</p>
                </div>
            )}
          </>
      )}

      {selectedGuard && (
        <GuardDetail 
            guard={selectedGuard} 
            onClose={() => setSelectedGuard(null)} 
            currentUserRole={currentUserRole}
            onUpdate={(updated) => setGuards(prev => prev.map(g => g.id === updated.id ? updated : g))}
        />
      )}

      {isCreateModalOpen && user && (
          <CreateGuardModal
              onClose={() => setIsCreateModalOpen(false)}
              onSuccess={() => {
                  fetchStaff();
                  setIsCreateModalOpen(false);
              }}
              currentUserRole={currentUserRole}
              currentUserId={user.id}
          />
      )}
    </div>
  );
};

export default GuardManagement;
