
import React, { useEffect, useState } from 'react';
import { Target, Users, AlertTriangle, Clock, Radio, Truck, FileText, CheckCircle, PieChart, TrendingUp, DollarSign, Activity, MapPin } from 'lucide-react';
import { QuickActionCard, KPIMeter, CollapsibleSection } from '../../common/DashboardWidgets';
import LiveControlPanel from '../shared/LiveControlPanel';
import { supabase } from '../../../services/supabase';

interface OperationsSummaryProps {
  onNavigate: (id: any) => void;
}

const OperationsSummary: React.FC<OperationsSummaryProps> = ({ onNavigate }) => {
  const [stats, setStats] = useState({
      activeMissions: 0,
      personnelDeployed: 0,
      pendingReports: 0,
      teamPerformance: 0,
      clientSatisfaction: 0,
      missionCompletionRate: 0,
      guardUtilization: 0,
      budgetUtilization: 0,
      alerts: 0
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
      const fetchStats = async () => {
          try {
              // 1. Mission Metrics
              const { data: missions } = await supabase.from('missions').select('status');
              const activeMissions = missions?.filter(m => m.status === 'active').length || 0;
              const completedMissions = missions?.filter(m => m.status === 'completed').length || 0;
              const totalMissions = missions?.length || 1;
              const missionCompletionRate = Math.round((completedMissions / totalMissions) * 100);

              // 2. Personnel Metrics (Guard Utilization)
              const { data: guards } = await supabase.from('profiles').select('status').eq('role', 'guard');
              const activeGuards = guards?.filter(g => g.status === 'active').length || 0;
              const totalGuards = guards?.length || 1;
              const guardUtilization = Math.round((activeGuards / totalGuards) * 100);

              // 3. Client & Budget (Mocked averages as per provided types limitation in bulk fetch)
              // In real implementation, perform aggregation queries
              const { data: contracts } = await supabase.from('contracts').select('budget_total, budget_used').eq('status', 'active');
              const totalBudget = contracts?.reduce((acc, c) => acc + (c.budget_total || 0), 0) || 1;
              const usedBudget = contracts?.reduce((acc, c) => acc + (c.budget_used || 0), 0) || 0;
              const budgetUtilization = Math.round((usedBudget / totalBudget) * 100);

              // 4. Alerts
              const { count: reportsCount } = await supabase.from('incident_reports').select('*', { count: 'exact', head: true }).eq('status', 'open');

              // Mocked Ratings (Requires new table/columns in full schema)
              const teamPerformance = 88;
              const clientSatisfaction = 4.8;

              setStats({
                  activeMissions,
                  personnelDeployed: activeGuards,
                  pendingReports: reportsCount || 0,
                  teamPerformance,
                  clientSatisfaction,
                  missionCompletionRate,
                  guardUtilization,
                  budgetUtilization,
                  alerts: reportsCount || 0
              });
          } catch (e) {
              console.error("Error fetching ops stats", e);
          } finally {
              setLoading(false);
          }
      };
      fetchStats();
  }, []);

  return (
    <div className="space-y-8 animate-fade-in-up pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-white/5 pb-8">
        <div>
            <h2 className="text-4xl font-display font-bold text-white tracking-tight">Operations Command</h2>
            <p className="text-gray-400 text-sm mt-2">Daily workflow: Morning review, team oversight, and mission control.</p>
        </div>
        <div className="flex gap-4">
            <button className="px-5 py-3 bg-brand-sage text-black font-bold rounded-xl shadow-[0_0_20px_rgba(124,154,146,0.3)] text-xs uppercase tracking-wider hover:bg-brand-sage/90 transition-transform hover:-translate-y-0.5">
                Morning Briefing
            </button>
        </div>
      </div>

      {/* Key Metrics Review (As per Workflow) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <KPIMeter label="Team Perf." value={`${stats.teamPerformance}%`} trend="up" trendValue="Goal: 90%" color="blue" icon={<TrendingUp />} />
        <KPIMeter label="Client Sat." value={`${stats.clientSatisfaction}`} trend="up" trendValue="/ 5.0" color="purple" icon={<Users />} />
        <KPIMeter label="Mission Comp." value={`${stats.missionCompletionRate}%`} trend="up" trendValue="Rate" color="green" icon={<CheckCircle />} />
        <KPIMeter label="Guard Util." value={`${stats.guardUtilization}%`} trend="down" trendValue="Capacity" color="orange" icon={<Users />} />
        <KPIMeter label="Budget Util." value={`${stats.budgetUtilization}%`} trend="up" trendValue="YTD" color="red" icon={<DollarSign />} />
      </div>

      {/* Quick Actions (Workflow Specific) */}
      <div className="glass-panel p-6 rounded-2xl">
         <h3 className="text-white font-bold text-xs uppercase tracking-widest text-brand-sage mb-4">Operational Actions</h3>
         <div className="flex flex-wrap gap-4">
            <QuickActionCard icon={<Target />} label="Create Mission" color="blue" onClick={() => onNavigate('missions')} />
            <QuickActionCard icon={<Users />} label="Manage Teams" color="green" onClick={() => onNavigate('team')} />
            <QuickActionCard icon={<Radio />} label="Dispatch" color="red" onClick={() => onNavigate('live-control')} />
            <QuickActionCard icon={<Truck />} label="Fleet" color="orange" onClick={() => onNavigate('shop')} />
            <QuickActionCard icon={<FileText />} label="Reports" color="purple" onClick={() => onNavigate('reports')} />
         </div>
      </div>

      {/* Morning Review Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
         <CollapsibleSection title="Team Status Review" icon={<Clock className="text-brand-sage" />}>
            <div className="space-y-4">
               <div className="flex justify-between items-center p-4 bg-brand-900/30 rounded-xl border border-brand-800 hover:border-brand-700 transition-colors">
                  <div className="flex items-center">
                     <div className="w-2 h-2 bg-green-500 rounded-full mr-4 animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.5)]"></div>
                     <div>
                        <p className="text-sm font-bold text-white">Alpha Team (Morning)</p>
                        <p className="text-xs text-gray-500">12/12 Guards Checked In</p>
                     </div>
                  </div>
                  <button onClick={() => onNavigate('team')} className="text-xs text-brand-sage font-bold hover:underline">View Roster</button>
               </div>
               <div className="flex justify-between items-center p-4 bg-brand-900/30 rounded-xl border border-brand-800 hover:border-brand-700 transition-colors">
                  <div className="flex items-center">
                     <div className="w-2 h-2 bg-yellow-500 rounded-full mr-4"></div>
                     <div>
                        <p className="text-sm font-bold text-white">Bravo Team (Swing)</p>
                        <p className="text-xs text-gray-500">Shift Prep • 2 Open Slots</p>
                     </div>
                  </div>
                  <button onClick={() => onNavigate('team')} className="text-xs text-yellow-500 font-bold hover:underline">Fill Slots</button>
               </div>
            </div>
         </CollapsibleSection>

         <CollapsibleSection title="Client Activity Monitor" icon={<Activity className="text-blue-400" />}>
             <div className="space-y-4">
                <div className="flex justify-between items-center p-4 bg-brand-900/30 rounded-xl border border-brand-800 hover:border-brand-700 transition-colors">
                   <div>
                      <p className="text-sm font-bold text-white">TechCorp HQ</p>
                      <p className="text-xs text-gray-500">Mission Active • No Incidents</p>
                   </div>
                   <span className="text-xs font-bold text-green-500 bg-green-900/20 px-2 py-1 rounded border border-green-500/20">Stable</span>
                </div>
                <div className="flex justify-between items-center p-4 bg-brand-900/30 rounded-xl border border-brand-800 hover:border-brand-700 transition-colors">
                   <div>
                      <p className="text-sm font-bold text-white">Downtown Mall</p>
                      <p className="text-xs text-gray-500">Incident Reported 10m ago</p>
                   </div>
                   <span className="text-xs font-bold text-red-500 flex items-center bg-red-900/20 px-2 py-1 rounded border border-red-500/20"><AlertTriangle className="w-3 h-3 mr-1" /> Alert</span>
                </div>
             </div>
         </CollapsibleSection>
      </div>

      {/* Live Control */}
      <div className="h-[600px] border border-white/5 rounded-2xl overflow-hidden shadow-2xl">
         <LiveControlPanel />
      </div>
    </div>
  );
};

export default OperationsSummary;
