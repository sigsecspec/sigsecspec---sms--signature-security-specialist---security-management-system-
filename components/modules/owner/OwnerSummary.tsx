
import React, { useEffect, useState } from 'react';
import { DollarSign, Target, Users, Activity, Download, RefreshCw, PieChart, UserPlus, FileText, AlertTriangle, Send, Settings, Radio, CheckCircle, ArrowRight, X, Shield, Server } from 'lucide-react';
import { QuickActionCard, KPIMeter, CollapsibleSection, SimpleBarChart, StatCard } from '../../common/DashboardWidgets';
import { supabase } from '../../../services/supabase';

interface OwnerSummaryProps {
  pendingCount: number;
  onNavigate: (id: any) => void;
}

const OwnerSummary: React.FC<OwnerSummaryProps> = ({ pendingCount, onNavigate }) => {
  const [stats, setStats] = useState({
      revenue: 0,
      activeMissions: 0,
      guardCount: 0,
      guardSatisfaction: 4.8,
      pendingPayroll: 0,
      pendingContracts: 0,
      alerts: 0
  });
  const [loading, setLoading] = useState(true);
  const [isBriefingOpen, setIsBriefingOpen] = useState(false);
  const [briefingStep, setBriefingStep] = useState(1);

  const fetchStats = async () => {
      setLoading(true);
      try {
          const { data: contracts } = await supabase.from('contracts').select('budget_used').eq('status', 'active');
          const revenue = contracts?.reduce((acc, curr) => acc + (curr.budget_used || 0), 0) || 0;
          const { count: missionsCount } = await supabase.from('missions').select('*', { count: 'exact', head: true }).eq('status', 'active');
          const { count: guardsCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'guard').eq('status', 'active');
          const { count: payrollCount } = await supabase.from('payroll').select('*', { count: 'exact', head: true }).eq('status', 'pending');
          const { count: contractsCount } = await supabase.from('contracts').select('*', { count: 'exact', head: true }).eq('status', 'pending_approval');
          const { count: alertsCount } = await supabase.from('incident_reports').select('*', { count: 'exact', head: true }).eq('status', 'open');

          setStats({
              revenue,
              activeMissions: missionsCount || 0,
              guardCount: guardsCount || 0,
              guardSatisfaction: 4.8,
              pendingPayroll: payrollCount || 0,
              pendingContracts: contractsCount || 0,
              alerts: alertsCount || 0
          });
      } catch (error) {
          console.error('Error fetching dashboard stats:', error);
      } finally {
          setLoading(false);
      }
  };

  useEffect(() => {
      fetchStats();
  }, []);

  const MorningBriefingModal = () => {
      const nextStep = () => {
          if (briefingStep < 4) setBriefingStep(briefingStep + 1);
          else {
              setIsBriefingOpen(false);
              setBriefingStep(1);
          }
      };

      return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 backdrop-blur-sm animate-fade-in-up">
              <div className="bg-brand-ebony border border-brand-700 rounded-2xl w-full max-w-2xl shadow-2xl flex flex-col overflow-hidden">
                  {/* Header */}
                  <div className="p-6 border-b border-brand-800 bg-brand-900/50 flex justify-between items-center">
                      <div>
                          <h3 className="text-xl font-display font-bold text-white flex items-center">
                              <Activity className="w-5 h-5 mr-3 text-brand-sage" /> MORNING EXECUTIVE REVIEW
                          </h3>
                          <p className="text-xs text-gray-400 mt-1 uppercase tracking-widest font-bold">Step {briefingStep} of 4</p>
                      </div>
                      <button onClick={() => setIsBriefingOpen(false)} className="text-gray-500 hover:text-white p-2 hover:bg-white/5 rounded-full"><X size={20} /></button>
                  </div>

                  {/* Body */}
                  <div className="p-10 flex-1 flex flex-col items-center justify-center min-h-[300px]">
                      {briefingStep === 1 && (
                          <div className="space-y-6 text-center animate-fade-in-right w-full">
                              <div className="w-24 h-24 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-6 border-2 border-green-500/50 shadow-[0_0_30px_rgba(34,197,94,0.2)]">
                                  <Server className="w-10 h-10 text-green-500" />
                              </div>
                              <h4 className="text-3xl font-display font-bold text-white">System Status: Nominal</h4>
                              <p className="text-gray-400 max-w-md mx-auto leading-relaxed">All systems are operational. Database latency is low (24ms). No security breaches detected in the last 24 hours.</p>
                              <div className="grid grid-cols-3 gap-6 mt-8 w-full max-w-lg mx-auto">
                                  <StatCard label="API Uptime" value="100%" />
                                  <StatCard label="Active Users" value={stats.guardCount.toString()} />
                                  <StatCard label="Error Rate" value="0.0%" />
                              </div>
                          </div>
                      )}

                      {briefingStep === 2 && (
                          <div className="space-y-6 text-center animate-fade-in-right w-full">
                              <div className="w-24 h-24 bg-blue-500/10 rounded-full flex items-center justify-center mx-auto mb-6 border-2 border-blue-500/50 shadow-[0_0_30px_rgba(59,130,246,0.2)]">
                                  <DollarSign className="w-10 h-10 text-blue-500" />
                              </div>
                              <h4 className="text-3xl font-display font-bold text-white">Financial Snapshot</h4>
                              <p className="text-gray-400 max-w-md mx-auto leading-relaxed">Revenue tracking is on target. {stats.pendingPayroll > 0 ? `${stats.pendingPayroll} payroll items require approval.` : 'All payroll is up to date.'}</p>
                              <div className="grid grid-cols-2 gap-6 mt-8 w-full max-w-lg mx-auto">
                                  <StatCard label="YTD Revenue" value={`$${(stats.revenue / 1000).toFixed(1)}k`} subtext="+8% vs Last Month" />
                                  <StatCard label="Pending Contracts" value={stats.pendingContracts.toString()} subtext="Requires Signature" />
                              </div>
                          </div>
                      )}

                      {briefingStep === 3 && (
                          <div className="space-y-6 text-center animate-fade-in-right w-full">
                              <div className="w-24 h-24 bg-orange-500/10 rounded-full flex items-center justify-center mx-auto mb-6 border-2 border-orange-500/50 shadow-[0_0_30px_rgba(249,115,22,0.2)]">
                                  <AlertTriangle className="w-10 h-10 text-orange-500" />
                              </div>
                              <h4 className="text-3xl font-display font-bold text-white">Operational Risks</h4>
                              <p className="text-gray-400 max-w-md mx-auto leading-relaxed">
                                  {stats.alerts > 0 
                                      ? `There are ${stats.alerts} active incident reports requiring review.` 
                                      : 'No critical incidents reported overnight. Operations are stable.'}
                              </p>
                              <div className="bg-brand-black/30 p-6 rounded-xl border border-brand-800 mt-6 text-left w-full max-w-md mx-auto">
                                  <div className="flex justify-between items-center mb-2">
                                      <span className="text-sm font-bold text-white uppercase tracking-wider">Shift Coverage</span>
                                      <span className="text-green-400 text-xs font-bold">98%</span>
                                  </div>
                                  <div className="w-full bg-brand-800 h-2 rounded-full overflow-hidden">
                                      <div className="bg-green-500 h-full w-[98%] shadow-[0_0_10px_rgba(34,197,94,0.5)]"></div>
                                  </div>
                              </div>
                          </div>
                      )}

                      {briefingStep === 4 && (
                          <div className="space-y-6 text-center animate-fade-in-right w-full">
                              <div className="w-24 h-24 bg-purple-500/10 rounded-full flex items-center justify-center mx-auto mb-6 border-2 border-purple-500/50 shadow-[0_0_30px_rgba(168,85,247,0.2)]">
                                  <CheckCircle className="w-10 h-10 text-purple-500" />
                              </div>
                              <h4 className="text-3xl font-display font-bold text-white">Action Items</h4>
                              <p className="text-gray-400 max-w-md mx-auto leading-relaxed">You have {pendingCount} pending applications and {stats.pendingContracts} contracts waiting for your approval.</p>
                              <button onClick={() => { setIsBriefingOpen(false); onNavigate('applications'); }} className="mt-6 text-brand-sage hover:text-white font-bold hover:underline transition-colors">
                                  Go to Approvals Queue
                              </button>
                          </div>
                      )}
                  </div>

                  {/* Footer */}
                  <div className="p-6 border-t border-brand-800 bg-brand-black/80 flex justify-end">
                      <button 
                          onClick={nextStep} 
                          className="bg-brand-sage text-black font-bold px-8 py-3 rounded-xl hover:bg-brand-sage/90 flex items-center shadow-[0_0_20px_rgba(124,154,146,0.3)] transition-transform hover:-translate-y-1"
                      >
                          {briefingStep === 4 ? 'Finish Briefing' : 'Next Step'} <ArrowRight className="w-4 h-4 ml-2" />
                      </button>
                  </div>
              </div>
          </div>
      );
  };

  return (
    <div className="space-y-8 animate-fade-in-up pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-white/5 pb-8">
         <div>
           <h2 className="text-4xl font-display font-bold text-white tracking-tight">Executive Command</h2>
           <p className="text-gray-400 text-sm mt-2 max-w-xl leading-relaxed">System-wide operational oversight. Monitoring financial health, field operations, and personnel status in real-time.</p>
         </div>
         <div className="flex gap-4">
            <button className="px-5 py-3 bg-white/5 border border-white/10 text-gray-300 rounded-xl hover:text-white hover:bg-white/10 transition-all text-xs font-bold uppercase tracking-wider flex items-center shadow-lg hover:shadow-xl">
               <Download className="w-4 h-4 mr-2" /> Report
            </button>
            <button 
                onClick={() => { setBriefingStep(1); setIsBriefingOpen(true); }}
                className="px-5 py-3 bg-brand-sage text-black font-bold rounded-xl hover:bg-brand-sage/90 transition-all text-xs uppercase tracking-wider flex items-center shadow-[0_0_20px_rgba(124,154,146,0.3)] hover:shadow-[0_0_30px_rgba(124,154,146,0.5)] transform hover:-translate-y-0.5"
            >
               <Activity className="w-4 h-4 mr-2" /> Morning Briefing
            </button>
         </div>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPIMeter label="Total Revenue (YTD)" value={`$${(stats.revenue / 1000).toFixed(1)}k`} trend="up" trendValue="+8.2%" color="green" icon={<DollarSign />} />
        <KPIMeter label="Active Missions" value={stats.activeMissions.toString()} trend="up" trendValue="Live" color="blue" icon={<Target />} />
        <KPIMeter label="Active Guards" value={stats.guardCount.toString()} trend="up" trendValue="Deployed" color="orange" icon={<Users />} />
        <KPIMeter label="System Health" value="99.9%" trend="up" trendValue="Stable" color="purple" icon={<Activity />} />
      </div>

      {/* Quick Action Bar */}
      <div className="glass-panel p-6 rounded-2xl">
          <h3 className="text-white font-bold mb-4 text-xs uppercase tracking-widest text-brand-sage">Rapid Access</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
              <QuickActionCard icon={<DollarSign />} label="Run Payroll" badge={stats.pendingPayroll} color="green" onClick={() => onNavigate('payroll')} />
              <QuickActionCard icon={<UserPlus />} label="Applicants" badge={pendingCount} color="orange" onClick={() => onNavigate('applications')} />
              <QuickActionCard icon={<Shield />} label="Add Guard" badge={0} color="blue" onClick={() => onNavigate('guards')} />
              <QuickActionCard icon={<FileText />} label="Contracts" badge={stats.pendingContracts} color="blue" onClick={() => onNavigate('contracts')} />
              <QuickActionCard icon={<AlertTriangle />} label="Alerts" badge={stats.alerts} color="red" onClick={() => onNavigate('alerts')} />
              <QuickActionCard icon={<Settings />} label="Sys Config" badge={0} color="purple" onClick={() => onNavigate('system-settings')} />
          </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Financial Overview Section */}
          <div className="lg:col-span-2">
            <CollapsibleSection title="Financial Performance" icon={<PieChart className="text-brand-sage" />}>
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h4 className="text-white font-bold text-lg">Revenue vs Expenses</h4>
                        <p className="text-xs text-gray-500">Year to Date Comparison</p>
                    </div>
                    <select className="bg-black/30 border border-white/10 text-xs text-gray-300 rounded px-3 py-1.5 focus:border-brand-sage outline-none"><option>This Year</option></select>
                </div>
                <div className="h-64 flex items-end space-x-3 px-2">
                    {/* Visual Chart */}
                    {[65, 59, 80, 81, 56, 55, 40, 70, 75, 82, 90, 95].map((h, i) => (
                        <div key={i} className="flex-1 flex flex-col justify-end gap-1 group relative">
                            <div className="w-full bg-brand-sage/80 rounded-t-sm hover:bg-brand-sage transition-all shadow-[0_0_10px_rgba(124,154,146,0.2)]" style={{ height: `${h}%` }}></div>
                            <div className="w-full bg-red-500/30 rounded-b-sm hover:bg-red-500/50 transition-all" style={{ height: `${h * 0.6}%` }}></div>
                            {/* Tooltip */}
                            <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-black text-white text-[10px] py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 border border-white/10">
                                ${h}k Rev
                            </div>
                        </div>
                    ))}
                </div>
                <div className="flex justify-between mt-4 text-[10px] text-gray-500 uppercase font-bold tracking-wider px-2">
                    <span>Jan</span><span>Feb</span><span>Mar</span><span>Apr</span><span>May</span><span>Jun</span><span>Jul</span><span>Aug</span><span>Sep</span><span>Oct</span><span>Nov</span><span>Dec</span>
                </div>
            </CollapsibleSection>
          </div>

          {/* Side Status Panels */}
          <div className="space-y-6">
             <div className="bg-brand-ebony/60 backdrop-blur-sm p-6 rounded-2xl border border-white/5 shadow-lg">
               <h5 className="text-xs text-gray-400 uppercase font-bold mb-4 tracking-wider flex items-center"><Activity size={14} className="mr-2 text-blue-400" /> Operational Metrics</h5>
               <div className="space-y-6">
                   <div>
                       <div className="flex justify-between text-sm mb-1">
                           <span className="text-gray-300">Mission Completion</span>
                           <span className="text-white font-bold">98%</span>
                       </div>
                       <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden"><div className="bg-blue-500 h-full w-[98%] shadow-[0_0_8px_rgba(59,130,246,0.5)]"></div></div>
                   </div>
                   <div>
                       <div className="flex justify-between text-sm mb-1">
                           <span className="text-gray-300">Guard Utilization</span>
                           <span className="text-white font-bold">85%</span>
                       </div>
                       <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden"><div className="bg-orange-500 h-full w-[85%] shadow-[0_0_8px_rgba(249,115,22,0.5)]"></div></div>
                   </div>
                   <div>
                       <div className="flex justify-between text-sm mb-1">
                           <span className="text-gray-300">Client Satisfaction</span>
                           <span className="text-white font-bold">4.8/5</span>
                       </div>
                       <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden"><div className="bg-green-500 h-full w-[96%] shadow-[0_0_8px_rgba(34,197,94,0.5)]"></div></div>
                   </div>
               </div>
             </div>

             <div className="bg-brand-ebony/60 backdrop-blur-sm p-6 rounded-2xl border border-white/5 shadow-lg">
                <div className="flex items-center justify-between mb-4">
                    <h5 className="text-xs text-gray-400 uppercase font-bold tracking-wider">Live Status</h5>
                    <span className="flex items-center">
                        <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-green-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                    </span>
                </div>
                <div className="flex items-center justify-between bg-green-900/10 border border-green-500/20 p-4 rounded-xl mb-4">
                    <div className="flex items-center">
                        <CheckCircle size={18} className="text-green-500 mr-2" />
                        <span className="text-sm font-bold text-white">All Systems Nominal</span>
                    </div>
                </div>
                <button onClick={() => onNavigate('live-control')} className="w-full py-3 bg-white/5 hover:bg-white/10 text-xs font-bold uppercase tracking-wider text-brand-sage rounded-xl border border-white/10 transition-all hover:border-brand-sage/30">
                    Open Live Command
                </button>
             </div>
          </div>
      </div>

      {isBriefingOpen && <MorningBriefingModal />}
    </div>
  );
};

export default OwnerSummary;
