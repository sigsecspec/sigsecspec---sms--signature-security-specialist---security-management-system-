
import React, { useEffect, useState } from 'react';
import { Target, Users, AlertTriangle, Clock, Radio, Truck, FileText, CheckCircle, Activity, MapPin } from 'lucide-react';
import { QuickActionCard, KPIMeter, CollapsibleSection } from '../../common/DashboardWidgets';
import { supabase } from '../../../services/supabase';
import LiveScheduling from './LiveScheduling';

interface DispatchSummaryProps {
  onNavigate: (id: any) => void;
}

const DispatchSummary: React.FC<DispatchSummaryProps> = ({ onNavigate }) => {
  const [stats, setStats] = useState({
      activeMissions: 0,
      availableGuards: 0,
      activeIncidents: 0,
      uncoveredShifts: 0
  });

  useEffect(() => {
      const fetchStats = async () => {
          const { count: missionsCount } = await supabase.from('missions').select('*', { count: 'exact', head: true }).eq('status', 'active');
          const { count: guardsCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'guard').eq('status', 'active');
          const { count: incidentsCount } = await supabase.from('incident_reports').select('*', { count: 'exact', head: true }).eq('status', 'open');
          
          // Mock calculation for uncovered shifts
          const uncovered = 2; 

          setStats({
              activeMissions: missionsCount || 0,
              availableGuards: guardsCount || 0,
              activeIncidents: incidentsCount || 0,
              uncoveredShifts: uncovered
          });
      };
      fetchStats();
  }, []);

  return (
    <div className="space-y-6 animate-fade-in-up pb-12">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-display font-bold text-white">Dispatch Console</h2>
        <p className="text-gray-400 text-sm mt-1">Live scheduling and mission control hub.</p>
      </div>

      {/* Quick Actions */}
      <div className="flex flex-wrap gap-4">
         <QuickActionCard icon={<Target />} label="Create Mission" color="blue" onClick={() => onNavigate('missions')} />
         <QuickActionCard icon={<Users />} label="Find Guard" color="green" onClick={() => onNavigate('team')} />
         <QuickActionCard icon={<Radio />} label="Broadcast" color="red" onClick={() => onNavigate('send-notification')} />
         <QuickActionCard icon={<Clock />} label="Schedule" color="orange" onClick={() => onNavigate('scheduling')} />
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPIMeter label="Active Missions" value={stats.activeMissions.toString()} trend="up" trendValue="Live" color="blue" icon={<Target />} />
        <KPIMeter label="Uncovered Shifts" value={stats.uncoveredShifts.toString()} trend="down" trendValue="Critical" color="red" icon={<AlertTriangle />} />
        <KPIMeter label="Guards Active" value={stats.availableGuards.toString()} trend="up" trendValue="Ready" color="green" icon={<Users />} />
        <KPIMeter label="Incidents (Open)" value={stats.activeIncidents.toString()} trend="down" trendValue="Live" color="orange" icon={<Activity />} />
      </div>

      {/* Emergency Alerts Section */}
      {stats.activeIncidents > 0 || stats.uncoveredShifts > 0 ? (
        <div className="bg-red-900/10 border border-red-500/30 rounded-xl p-4 animate-pulse-slow">
           <h3 className="text-red-400 font-bold flex items-center mb-3 text-sm uppercase tracking-wider">
              <AlertTriangle className="w-4 h-4 mr-2" /> Action Required
           </h3>
           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {stats.uncoveredShifts > 0 && (
                 <div className="bg-red-900/20 p-3 rounded border border-red-500/20 flex justify-between items-center">
                    <div>
                        <p className="text-white font-bold text-sm">Uncovered Shifts</p>
                        <p className="text-xs text-gray-400">{stats.uncoveredShifts} missions require assignment immediately.</p>
                    </div>
                    <button onClick={() => onNavigate('scheduling')} className="text-xs bg-red-600 hover:bg-red-500 text-white px-3 py-1.5 rounded font-bold">Resolve</button>
                 </div>
              )}
              {stats.activeIncidents > 0 && (
                 <div className="bg-orange-900/20 p-3 rounded border border-orange-500/20 flex justify-between items-center">
                    <div>
                        <p className="text-white font-bold text-sm">Active Incident</p>
                        <p className="text-xs text-gray-400">Guard reported incident at Downtown Site.</p>
                    </div>
                    <button className="text-xs bg-orange-600 hover:bg-orange-500 text-white px-3 py-1.5 rounded font-bold">View</button>
                 </div>
              )}
           </div>
        </div>
      ) : null}

      {/* Live Schedule Board */}
      <CollapsibleSection title="Live Schedule Board" icon={<Clock className="text-brand-sage" />}>
          <LiveScheduling />
      </CollapsibleSection>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
         {/* Available Guards Quick View */}
         <div className="bg-brand-ebony p-6 rounded-xl border border-brand-800">
            <h3 className="text-white font-bold mb-4 flex items-center"><CheckCircle className="w-5 h-5 mr-2 text-green-500" /> Standby Personnel</h3>
            <p className="text-sm text-gray-400 mb-4">Total Active Guards: {stats.availableGuards}</p>
            <div className="space-y-2">
               {[1,2,3].map(i => (
                   <div key={i} className="flex justify-between items-center p-3 bg-brand-black/40 rounded border border-brand-800/50">
                       <div className="flex items-center">
                           <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                           <div>
                               <p className="text-sm text-white font-bold">Guard {i}</p>
                               <p className="text-[10px] text-gray-500">Available • 5mi away</p>
                           </div>
                       </div>
                       <button className="text-xs text-brand-sage hover:text-white border border-brand-sage/30 px-2 py-1 rounded hover:bg-brand-sage/10">Ping</button>
                   </div>
               ))}
            </div>
            <button onClick={() => onNavigate('team')} className="w-full mt-4 text-center text-xs text-brand-sage hover:underline py-2">View All Personnel</button>
         </div>

         {/* Recent Activity */}
         <div className="bg-brand-ebony p-6 rounded-xl border border-brand-800">
            <h3 className="text-white font-bold mb-4 flex items-center"><Activity className="w-5 h-5 mr-2 text-blue-400" /> Recent Activity</h3>
            <div className="space-y-4 border-l border-brand-800 ml-2 pl-4">
                <div className="relative">
                    <div className="absolute -left-[21px] top-1 w-2 h-2 rounded-full bg-green-500"></div>
                    <p className="text-xs text-gray-400">10 mins ago</p>
                    <p className="text-sm text-white">Mission #442 Started by Guard Miller.</p>
                </div>
                <div className="relative">
                    <div className="absolute -left-[21px] top-1 w-2 h-2 rounded-full bg-brand-sage"></div>
                    <p className="text-xs text-gray-400">25 mins ago</p>
                    <p className="text-sm text-white">New Mission Created: Retail Security.</p>
                </div>
                <div className="relative">
                    <div className="absolute -left-[21px] top-1 w-2 h-2 rounded-full bg-blue-500"></div>
                    <p className="text-xs text-gray-400">1 hour ago</p>
                    <p className="text-sm text-white">Shift Check-in confirmed for Team Alpha.</p>
                </div>
            </div>
         </div>
      </div>
    </div>
  );
};

export default DispatchSummary;
