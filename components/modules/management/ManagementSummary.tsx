
import React, { useEffect, useState } from 'react';
import { 
  FileText, Shirt, Users, AlertCircle, CheckCircle, 
  Clock, Activity, ClipboardList, Shield, Briefcase 
} from 'lucide-react';
import { QuickActionCard, KPIMeter, CollapsibleSection } from '../../common/DashboardWidgets';
import { supabase } from '../../../services/supabase';

interface ManagementSummaryProps {
  onNavigate: (id: any) => void;
}

const ManagementSummary: React.FC<ManagementSummaryProps> = ({ onNavigate }) => {
  const [stats, setStats] = useState({
      pendingApps: 0,
      uniformRequests: 0,
      systemAlerts: 0,
      complianceRate: 98
  });

  useEffect(() => {
      const fetchStats = async () => {
          // 1. Applications
          const { count: guardApps } = await supabase.from('guard_applications').select('*', { count: 'exact', head: true }).eq('status', 'pending_review');
          const { count: clientApps } = await supabase.from('client_applications').select('*', { count: 'exact', head: true }).eq('status', 'pending_review');
          const { count: staffApps } = await supabase.from('staff_applications').select('*', { count: 'exact', head: true }).eq('status', 'pending_review');
          const totalPending = (guardApps || 0) + (clientApps || 0) + (staffApps || 0);

          // 2. Uniforms
          const { count: uniformsCount } = await supabase.from('uniform_distributions').select('*', { count: 'exact', head: true }).eq('status', 'pending');

          // 3. Alerts (Mocked via Incidents for now)
          const { count: alertsCount } = await supabase.from('incident_reports').select('*', { count: 'exact', head: true }).eq('status', 'open');

          setStats({
              pendingApps: totalPending,
              uniformRequests: uniformsCount || 0,
              systemAlerts: alertsCount || 0,
              complianceRate: 98
          });
      };
      fetchStats();
  }, []);

  return (
    <div className="space-y-6 animate-fade-in-up pb-12">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-display font-bold text-white">Management Command</h2>
        <p className="text-gray-400 text-sm mt-1">Administrative oversight, policy enforcement, and logistics.</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPIMeter label="App Queue" value={stats.pendingApps.toString()} trend="up" trendValue="Action Req" color="blue" icon={<FileText />} />
        <KPIMeter label="Uniform Dist." value={stats.uniformRequests.toString()} trend="up" trendValue="Pending" color="green" icon={<Shirt />} />
        <KPIMeter label="System Alerts" value={stats.systemAlerts.toString()} trend="down" trendValue="Critical" color="red" icon={<AlertCircle />} />
        <KPIMeter label="Compliance" value={`${stats.complianceRate}%`} trend="up" trendValue="System Wide" color="purple" icon={<Shield />} />
      </div>

      {/* Quick Actions */}
      <div className="flex flex-wrap gap-4">
         <QuickActionCard icon={<Users />} label="Review Apps" badge={stats.pendingApps} color="blue" onClick={() => onNavigate('applications')} />
         <QuickActionCard icon={<Shirt />} label="Distribution" badge={stats.uniformRequests} color="green" onClick={() => onNavigate('uniforms')} />
         <QuickActionCard icon={<Activity />} label="System Logs" color="orange" onClick={() => onNavigate('reports')} />
         <QuickActionCard icon={<Briefcase />} label="Policies" color="purple" onClick={() => onNavigate('settings')} />
      </div>

      {/* Workflow Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
         <CollapsibleSection title="Administrative Tasks" icon={<ClipboardList className="text-brand-sage" />}>
            <div className="space-y-3">
               {stats.pendingApps > 0 && (
                   <div className="flex justify-between items-center p-3 bg-blue-900/20 border border-blue-500/30 rounded">
                       <div className="flex items-center">
                           <Users className="w-4 h-4 text-blue-400 mr-3" />
                           <div>
                               <p className="text-sm font-bold text-white">Application Review</p>
                               <p className="text-xs text-gray-400">{stats.pendingApps} candidates waiting.</p>
                           </div>
                       </div>
                       <button onClick={() => onNavigate('applications')} className="text-xs bg-blue-600 hover:bg-blue-500 text-white px-3 py-1.5 rounded font-bold">Review</button>
                   </div>
               )}
               {stats.uniformRequests > 0 && (
                   <div className="flex justify-between items-center p-3 bg-green-900/20 border border-green-500/30 rounded">
                       <div className="flex items-center">
                           <Shirt className="w-4 h-4 text-green-400 mr-3" />
                           <div>
                               <p className="text-sm font-bold text-white">Uniform Logistics</p>
                               <p className="text-xs text-gray-400">{stats.uniformRequests} packages to prepare.</p>
                           </div>
                       </div>
                       <button onClick={() => onNavigate('uniforms')} className="text-xs bg-green-600 hover:bg-green-500 text-white px-3 py-1.5 rounded font-bold">Manage</button>
                   </div>
               )}
               {stats.pendingApps === 0 && stats.uniformRequests === 0 && (
                   <div className="p-4 text-center text-gray-500 italic">No urgent administrative tasks.</div>
               )}
            </div>
         </CollapsibleSection>

         <CollapsibleSection title="Compliance Monitor" icon={<Shield className="text-purple-400" />}>
             <div className="space-y-4">
                <div className="flex justify-between text-sm mb-1">
                   <span className="text-gray-400">License Verification</span>
                   <span className="text-white font-bold">100%</span>
                </div>
                <div className="w-full bg-brand-900 h-2 rounded-full overflow-hidden">
                   <div className="bg-green-500 h-full w-full"></div>
                </div>
                
                <div className="flex justify-between text-sm mb-1">
                   <span className="text-gray-400">Policy Acknowledgment</span>
                   <span className="text-white font-bold">96%</span>
                </div>
                <div className="w-full bg-brand-900 h-2 rounded-full overflow-hidden">
                   <div className="bg-purple-500 h-full w-[96%]"></div>
                </div>
             </div>
         </CollapsibleSection>
      </div>
    </div>
  );
};

export default ManagementSummary;
