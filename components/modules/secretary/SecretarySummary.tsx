
import React, { useEffect, useState } from 'react';
import { FileText, Shirt, Users, AlertCircle, Plus, CheckCircle, Clock, LifeBuoy, Inbox } from 'lucide-react';
import { QuickActionCard, KPIMeter, CollapsibleSection } from '../../common/DashboardWidgets';
import { supabase } from '../../../services/supabase';

interface SecretarySummaryProps {
  onNavigate: (id: any) => void;
}

const SecretarySummary: React.FC<SecretarySummaryProps> = ({ onNavigate }) => {
  const [stats, setStats] = useState({
      pendingApps: 0,
      uniformRequests: 0,
      activeContracts: 0,
      openTickets: 0
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

          // 3. Contracts
          const { count: contractsCount } = await supabase.from('contracts').select('*', { count: 'exact', head: true }).eq('status', 'active');

          // 4. Support Tickets (Mocked for now)
          const openTickets = 5;

          setStats({
              pendingApps: totalPending,
              uniformRequests: uniformsCount || 0,
              activeContracts: contractsCount || 0,
              openTickets
          });
      };
      fetchStats();
  }, []);

  return (
    <div className="space-y-6 animate-fade-in-up pb-12">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-display font-bold text-white">Administrative Support</h2>
        <p className="text-gray-400 text-sm mt-1">Application processing, logistics, and support coordination.</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPIMeter label="App Queue" value={stats.pendingApps.toString()} trend="up" trendValue="Action Req" color="blue" icon={<FileText />} />
        <KPIMeter label="Uniform Dist." value={stats.uniformRequests.toString()} trend="up" trendValue="Pending" color="green" icon={<Shirt />} />
        <KPIMeter label="Open Tickets" value={stats.openTickets.toString()} trend="down" trendValue="Support" color="red" icon={<LifeBuoy />} />
        <KPIMeter label="Active Contracts" value={stats.activeContracts.toString()} trend="up" trendValue="Total" color="purple" icon={<CheckCircle />} />
      </div>

      {/* Quick Actions */}
      <div className="flex flex-wrap gap-4">
         <QuickActionCard icon={<Users />} label="Applications" badge={stats.pendingApps} color="blue" onClick={() => onNavigate('applications')} />
         <QuickActionCard icon={<Shirt />} label="Uniforms" badge={stats.uniformRequests} color="green" onClick={() => onNavigate('uniforms')} />
         <QuickActionCard icon={<LifeBuoy />} label="Support" badge={stats.openTickets} color="red" onClick={() => onNavigate('support')} />
         <QuickActionCard icon={<FileText />} label="Contracts" color="orange" onClick={() => onNavigate('contracts')} />
         <QuickActionCard icon={<Plus />} label="New Guard" color="purple" onClick={() => onNavigate('team')} />
      </div>

      {/* Workflow Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
         <CollapsibleSection title="Application Queue" icon={<Users className="text-brand-sage" />}>
            <div className="space-y-3">
               {stats.pendingApps === 0 ? (
                   <p className="text-gray-500 text-sm italic">No pending applications.</p>
               ) : (
                   <div className="flex justify-between items-center p-3 bg-blue-900/20 border border-blue-500/30 rounded">
                       <div className="flex items-center">
                           <Users className="w-4 h-4 text-blue-400 mr-3" />
                           <div>
                               <p className="text-sm font-bold text-white">Pending Reviews</p>
                               <p className="text-xs text-gray-400">{stats.pendingApps} candidate(s) waiting.</p>
                           </div>
                       </div>
                       <button onClick={() => onNavigate('applications')} className="text-xs bg-blue-600 hover:bg-blue-500 text-white px-3 py-1.5 rounded font-bold">Review</button>
                   </div>
               )}
            </div>
         </CollapsibleSection>

         <CollapsibleSection title="Support & Logistics" icon={<Inbox className="text-green-400" />}>
             <div className="space-y-3">
                {stats.uniformRequests > 0 && (
                   <div className="flex justify-between items-center p-3 bg-green-900/20 border border-green-500/30 rounded">
                       <div className="flex items-center">
                           <Shirt className="w-4 h-4 text-green-400 mr-3" />
                           <div>
                               <p className="text-sm font-bold text-white">Uniform Packages</p>
                               <p className="text-xs text-gray-400">{stats.uniformRequests} to prepare.</p>
                           </div>
                       </div>
                       <button onClick={() => onNavigate('uniforms')} className="text-xs bg-green-600 hover:bg-green-500 text-white px-3 py-1.5 rounded font-bold">Process</button>
                   </div>
                )}
                {stats.openTickets > 0 && (
                   <div className="flex justify-between items-center p-3 bg-red-900/20 border border-red-500/30 rounded">
                       <div className="flex items-center">
                           <LifeBuoy className="w-4 h-4 text-red-400 mr-3" />
                           <div>
                               <p className="text-sm font-bold text-white">Support Tickets</p>
                               <p className="text-xs text-gray-400">{stats.openTickets} open issues.</p>
                           </div>
                       </div>
                       <button onClick={() => onNavigate('support')} className="text-xs bg-red-600 hover:bg-red-500 text-white px-3 py-1.5 rounded font-bold">View</button>
                   </div>
                )}
             </div>
         </CollapsibleSection>
      </div>
    </div>
  );
};

export default SecretarySummary;
