
import React, { useState, useEffect } from 'react';
import { 
  CheckCircle, PlusCircle, LayoutDashboard, MapPin, BookOpen, User, X, 
  MessageSquare, Briefcase, FileText, CreditCard, Shield, Users, 
  Search, Star, Ban, ThumbsUp, ThumbsDown, ChevronRight, Calendar, Clock, DollarSign,
  AlertCircle, ArrowRight
} from 'lucide-react';
import PortalHeader from '../PortalHeader';
import ProfileManagement from '../modules/shared/ProfileManagement';
import Communications from '../modules/communications/Communications';
import CreateMissionModal from '../modules/shared/CreateMissionModal';
import CreateSiteModal from '../modules/shared/CreateSiteModal';
import CreateContractModal from '../modules/shared/CreateContractModal';
import MissionManagement from '../modules/shared/MissionManagement';
import ContractManagement from '../modules/shared/ContractManagement';
import SiteManagement from '../modules/shared/SiteManagement';
import { PageView } from '../../types';
import { supabase } from '../../services/supabase';
import { InputLabel, InputField } from '../common/FormElements';
import { KPIMeter } from '../common/DashboardWidgets';

interface ClientDashboardProps {
  user: any;
  onNavigate: (page: PageView) => void;
  onLogout: () => void;
}

type ClientView = 'dashboard' | 'profile' | 'messages' | 'guards' | 'settings' | 'missions' | 'contracts' | 'sites';

const ClientDashboard: React.FC<ClientDashboardProps> = ({ user, onNavigate, onLogout }) => {
  const [view, setView] = useState<ClientView>('dashboard');
  const [stats, setStats] = useState({ activeMissions: 0, activeContracts: 0, sites: 0, budgetUsed: 0 });
  const [showMissionModal, setShowMissionModal] = useState(false);
  const [showSiteModal, setShowSiteModal] = useState(false);
  const [showContractModal, setShowContractModal] = useState(false);
  const [sites, setSites] = useState<any[]>([]);
  const [contracts, setContracts] = useState<any[]>([]);

  const refreshData = async () => {
      if (!user?.id) return;
      
      try {
          // Stats & Lists
          const { count: missionsCount } = await supabase.from('missions').select('*', { count: 'exact', head: true }).eq('client_id', user.id).eq('status', 'active');
          const { data: contractsData } = await supabase.from('contracts').select('*').eq('client_id', user.id).eq('status', 'active');
          const { data: sitesData } = await supabase.from('sites').select('*').eq('client_id', user.id);

          setSites(sitesData || []);
          setContracts(contractsData || []);

          const totalBudget = contractsData?.reduce((acc, c) => acc + (c.budget_total || 0), 0) || 0;
          const usedBudget = contractsData?.reduce((acc, c) => acc + (c.budget_used || 0), 0) || 0;
          const utilization = totalBudget > 0 ? Math.round((usedBudget / totalBudget) * 100) : 0;

          setStats({
              activeMissions: missionsCount || 0,
              activeContracts: contractsData?.length || 0,
              sites: sitesData?.length || 0,
              budgetUsed: utilization
          });
      } catch (err) {
          console.error("Error refreshing client data:", err);
      }
  };

  useEffect(() => {
      refreshData();
  }, [user]);

  // --- Sub-Components ---

  const ClientGuardManager = () => {
      const [activeGuardTab, setActiveGuardTab] = useState<'whitelist' | 'blacklist' | 'lead'>('whitelist');
      const [guards, setGuards] = useState<any[]>([]); // Mock data for demo
      
      // Mock data population
      useEffect(() => {
          setGuards([
              { id: '1', name: 'Officer Miller', rating: 4.8, status: 'whitelist', avatar: 'M' },
              { id: '2', name: 'Officer Jones', rating: 4.5, status: 'whitelist', avatar: 'J' },
              { id: '3', name: 'Guard Smith', rating: 2.1, status: 'blacklist', reason: 'Late arrival multiple times', avatar: 'S' },
              { id: '4', name: 'Lead Officer Davis', rating: 4.9, status: 'lead', avatar: 'D' },
          ]);
      }, []);

      const filteredGuards = guards.filter(g => g.status === activeGuardTab);

      return (
          <div className="space-y-6 animate-fade-in-up">
              <div className="flex justify-between items-center">
                  <h2 className="text-3xl font-display font-bold text-white">Guard Management</h2>
                  <button className="bg-brand-sage text-black px-6 py-2 rounded-xl font-bold text-sm flex items-center shadow-lg hover:bg-brand-sage/90 transition-all">
                      <Search className="w-4 h-4 mr-2" /> Find Guards
                  </button>
              </div>

              <div className="flex bg-brand-ebony border border-brand-800 rounded-xl p-1 max-w-lg">
                  <button onClick={() => setActiveGuardTab('whitelist')} className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all ${activeGuardTab === 'whitelist' ? 'bg-brand-sage text-black shadow' : 'text-gray-400 hover:text-white'}`}>Preferred</button>
                  <button onClick={() => setActiveGuardTab('lead')} className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all ${activeGuardTab === 'lead' ? 'bg-blue-600 text-white shadow' : 'text-gray-400 hover:text-white'}`}>Leads</button>
                  <button onClick={() => setActiveGuardTab('blacklist')} className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all ${activeGuardTab === 'blacklist' ? 'bg-red-600 text-white shadow' : 'text-gray-400 hover:text-white'}`}>Blocked</button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredGuards.length === 0 ? (
                      <div className="col-span-3 text-center p-12 text-gray-500 border border-brand-800 rounded-xl bg-brand-black/20">No guards in this list.</div>
                  ) : filteredGuards.map(guard => (
                      <div key={guard.id} className="bg-brand-ebony border border-brand-800 p-6 rounded-xl flex items-center gap-4 hover:border-brand-sage/30 transition-colors shadow-lg">
                          <div className={`w-14 h-14 rounded-full flex items-center justify-center text-xl font-bold border-2 ${activeGuardTab === 'blacklist' ? 'bg-red-900/20 text-red-500 border-red-500/30' : 'bg-brand-black text-gray-300 border-brand-700'}`}>
                              {guard.avatar}
                          </div>
                          <div className="flex-1">
                              <h4 className="text-white font-bold text-lg">{guard.name}</h4>
                              <div className="flex items-center text-sm text-gray-400 mt-1">
                                  <Star className="w-4 h-4 text-yellow-500 mr-1" /> {guard.rating}/5.0
                              </div>
                              {guard.reason && <p className="text-xs text-red-400 mt-2 bg-red-900/10 px-2 py-1 rounded border border-red-500/20">{guard.reason}</p>}
                          </div>
                          <button className="p-2 hover:bg-brand-800 rounded-full text-gray-500 hover:text-white transition-colors"><ChevronRight /></button>
                      </div>
                  ))}
              </div>
          </div>
      );
  };

  return (
    <div className="h-screen bg-brand-black flex flex-col overflow-hidden font-sans text-gray-200">
      <PortalHeader 
        user={user}
        title="CLIENT"
        subtitle="Services Portal"
        onLogout={onLogout}
        onNavigate={onNavigate}
        onProfileClick={() => setView('profile')}
        onSettingsClick={() => setView('settings')}
        hideMenuButton={true}
      />

      <div className="flex-1 overflow-y-auto py-8 px-4 sm:px-8 bg-brand-black">
        {view !== 'dashboard' ? (
            <div className="max-w-7xl mx-auto animate-fade-in-up h-full flex flex-col">
                <button onClick={() => setView('dashboard')} className="text-gray-400 hover:text-white mb-6 text-sm flex items-center font-bold uppercase tracking-wider w-fit">
                    &larr; Back to Dashboard
                </button>
                <div className="flex-1">
                    {view === 'profile' && <ProfileManagement user={user} />}
                    {view === 'messages' && <Communications user={user} />}
                    {view === 'guards' && <ClientGuardManager />}
                    {view === 'missions' && <MissionManagement currentUserRole="Client" />}
                    {view === 'contracts' && <ContractManagement currentUserRole="Client" />}
                    {view === 'sites' && <SiteManagement currentUserRole="Client" />}
                    {view === 'settings' && (
                        <div className="bg-brand-ebony rounded-xl border border-white/5 p-12 text-center">
                            <h3 className="text-2xl text-white font-bold mb-2">Settings</h3>
                            <p className="text-gray-500">Client configuration settings module.</p>
                        </div>
                    )}
                </div>
            </div>
        ) : (
            <div className="max-w-7xl mx-auto space-y-10 animate-fade-in-up pb-12">
                {/* Welcome Banner */}
                <div className="bg-gradient-to-r from-brand-ebony via-brand-900 to-brand-ebony border border-white/10 p-8 md:p-10 rounded-3xl flex flex-col md:flex-row items-start md:items-center justify-between shadow-2xl relative overflow-hidden group">
                    {/* Abstract background shine */}
                    <div className="absolute top-0 right-0 w-96 h-96 bg-brand-sage/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none group-hover:bg-brand-sage/10 transition-colors duration-500"></div>
                    
                    <div className="relative z-10">
                        <h2 className="text-4xl font-display font-bold text-white mb-3 tracking-wide">Welcome, {user?.full_name}</h2>
                        <div className="flex flex-wrap items-center gap-4 text-sm">
                            <span className="text-green-400 font-bold flex items-center px-4 py-1.5 bg-green-900/20 rounded-full border border-green-500/30"><CheckCircle className="w-4 h-4 mr-2" /> Account Active</span>
                            {stats.activeContracts > 0 && <span className="text-blue-400 font-bold flex items-center px-4 py-1.5 bg-blue-900/20 rounded-full border border-blue-500/30"><FileText className="w-4 h-4 mr-2" /> Contract Active</span>}
                        </div>
                    </div>
                    <div className="mt-8 md:mt-0 flex gap-4 relative z-10">
                        <button onClick={() => setShowSiteModal(true)} className="bg-brand-black/50 backdrop-blur-md border border-brand-sage text-brand-sage px-6 py-3 rounded-xl font-bold hover:bg-brand-sage hover:text-black transition-all flex items-center shadow-lg hover:shadow-brand-sage/20">
                            <MapPin className="w-5 h-5 mr-2" /> New Site
                        </button>
                        {stats.activeContracts > 0 ? (
                            <button onClick={() => setShowMissionModal(true)} className="bg-brand-sage text-black px-8 py-3 rounded-xl font-bold shadow-[0_0_20px_rgba(124,154,146,0.3)] hover:scale-105 transition-transform flex items-center hover:bg-brand-sage/90">
                                <PlusCircle className="w-5 h-5 mr-2" /> Request Mission
                            </button>
                        ) : (
                            <button onClick={() => setShowContractModal(true)} className="bg-brand-ebony border border-brand-sage text-brand-sage px-6 py-3 rounded-xl font-bold hover:bg-brand-sage hover:text-black transition-all flex items-center">
                                <FileText className="w-5 h-5 mr-2" /> Request Contract
                            </button>
                        )}
                    </div>
                </div>

                {/* Metrics */}
                <div>
                    <h3 className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-4 ml-1">Key Performance Indicators</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <KPIMeter label="Active Contracts" value={stats.activeContracts.toString()} trend="up" trendValue="Current" color="blue" icon={<FileText />} />
                        <KPIMeter label="Budget Used" value={`${stats.budgetUsed}%`} trend={stats.budgetUsed > 90 ? 'down' : 'up'} trendValue="Of Limit" color={stats.budgetUsed > 90 ? 'red' : 'green'} icon={<DollarSign />} />
                        <KPIMeter label="Live Missions" value={stats.activeMissions.toString()} trend="up" trendValue="Ongoing" color="green" icon={<Shield />} />
                        <KPIMeter label="Sites Managed" value={stats.sites.toString()} trend="up" trendValue="Total" color="purple" icon={<MapPin />} />
                    </div>
                </div>

                {/* Service Cards Grid */}
                <div>
                    <h3 className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-6 ml-1">Management Tools</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {/* Missions Card */}
                        <div onClick={() => setView('missions')} className="glass-panel hover:border-brand-sage/30 rounded-2xl p-8 transition-all hover:-translate-y-1 hover:shadow-2xl cursor-pointer group bg-brand-ebony/60">
                            <div className="w-14 h-14 bg-brand-black rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform border border-white/5 shadow-inner">
                                <LayoutDashboard className="w-7 h-7 text-brand-silver group-hover:text-brand-sage transition-colors" />
                            </div>
                            <h4 className="text-2xl font-display font-bold text-white mb-2 group-hover:text-brand-sage transition-colors">Mission Control</h4>
                            <p className="text-sm text-gray-400 mb-6 leading-relaxed">View active guard locations, real-time reports, and incident logs.</p>
                            <span className="text-xs font-bold text-brand-sage uppercase tracking-wide flex items-center group-hover:translate-x-2 transition-transform">View Dashboard <ArrowRight className="ml-2 w-3 h-3" /></span>
                        </div>

                        {/* Guard Management Card */}
                        <div onClick={() => setView('guards')} className="glass-panel hover:border-brand-sage/30 rounded-2xl p-8 transition-all hover:-translate-y-1 hover:shadow-2xl cursor-pointer group bg-brand-ebony/60">
                            <div className="w-14 h-14 bg-brand-black rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform border border-white/5 shadow-inner">
                                <Users className="w-7 h-7 text-brand-silver group-hover:text-brand-sage transition-colors" />
                            </div>
                            <h4 className="text-2xl font-display font-bold text-white mb-2 group-hover:text-brand-sage transition-colors">Guard Management</h4>
                            <p className="text-sm text-gray-400 mb-6 leading-relaxed">Manage preferred guards, blocklists, and request Lead Guards.</p>
                            <span className="text-xs font-bold text-brand-sage uppercase tracking-wide flex items-center group-hover:translate-x-2 transition-transform">Manage Team <ArrowRight className="ml-2 w-3 h-3" /></span>
                        </div>

                        {/* Sites Card */}
                        <div onClick={() => setView('sites')} className="glass-panel hover:border-brand-sage/30 rounded-2xl p-8 transition-all hover:-translate-y-1 hover:shadow-2xl cursor-pointer group bg-brand-ebony/60">
                            <div className="w-14 h-14 bg-brand-black rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform border border-white/5 shadow-inner">
                                <MapPin className="w-7 h-7 text-brand-silver group-hover:text-brand-sage transition-colors" />
                            </div>
                            <h4 className="text-2xl font-display font-bold text-white mb-2 group-hover:text-brand-sage transition-colors">Site Profiles</h4>
                            <p className="text-sm text-gray-400 mb-6 leading-relaxed">Manage access codes, post orders, and site-specific instructions.</p>
                            <div className="flex justify-between items-center">
                                <span className="text-xs font-bold text-brand-sage uppercase tracking-wide flex items-center group-hover:translate-x-2 transition-transform">Manage Sites <ArrowRight className="ml-2 w-3 h-3" /></span>
                                <button 
                                    onClick={(e) => { e.stopPropagation(); setShowSiteModal(true); }}
                                    className="text-xs bg-brand-black border border-brand-700 px-3 py-1.5 rounded-lg text-white hover:border-brand-sage hover:text-brand-sage transition-colors"
                                >
                                    + Add New
                                </button>
                            </div>
                        </div>

                        {/* Communications Card */}
                        <div onClick={() => setView('messages')} className="glass-panel hover:border-brand-sage/30 rounded-2xl p-8 transition-all hover:-translate-y-1 hover:shadow-2xl cursor-pointer group bg-brand-ebony/60">
                            <div className="w-14 h-14 bg-brand-black rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform border border-white/5 shadow-inner">
                                <MessageSquare className="w-7 h-7 text-brand-silver group-hover:text-brand-sage transition-colors" />
                            </div>
                            <h4 className="text-2xl font-display font-bold text-white mb-2 group-hover:text-brand-sage transition-colors">Operations Chat</h4>
                            <p className="text-sm text-gray-400 mb-6 leading-relaxed">Direct line to dispatch and management for urgent requests.</p>
                            <span className="text-xs font-bold text-brand-sage uppercase tracking-wide flex items-center group-hover:translate-x-2 transition-transform">Open Chat <ArrowRight className="ml-2 w-3 h-3" /></span>
                        </div>

                        {/* Contracts Card */}
                        <div onClick={() => setView('contracts')} className="glass-panel hover:border-brand-sage/30 rounded-2xl p-8 transition-all hover:-translate-y-1 hover:shadow-2xl cursor-pointer group bg-brand-ebony/60">
                            <div className="w-14 h-14 bg-brand-black rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform border border-white/5 shadow-inner">
                                <CreditCard className="w-7 h-7 text-brand-silver group-hover:text-brand-sage transition-colors" />
                            </div>
                            <h4 className="text-2xl font-display font-bold text-white mb-2 group-hover:text-brand-sage transition-colors">Contracts & Billing</h4>
                            <p className="text-sm text-gray-400 mb-6 leading-relaxed">View active agreements, payment history, and invoices.</p>
                            <span className="text-xs font-bold text-brand-sage uppercase tracking-wide flex items-center group-hover:translate-x-2 transition-transform">View Financials <ArrowRight className="ml-2 w-3 h-3" /></span>
                        </div>

                        {/* Training Card */}
                        <div onClick={() => onNavigate('client-training')} className="glass-panel hover:border-brand-sage/30 rounded-2xl p-8 transition-all hover:-translate-y-1 hover:shadow-2xl cursor-pointer group bg-brand-ebony/60">
                            <div className="w-14 h-14 bg-brand-black rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform border border-white/5 shadow-inner">
                                <BookOpen className="w-7 h-7 text-brand-silver group-hover:text-brand-sage transition-colors" />
                            </div>
                            <h4 className="text-2xl font-display font-bold text-white mb-2 group-hover:text-brand-sage transition-colors">Resources</h4>
                            <p className="text-sm text-gray-400 mb-6 leading-relaxed">Guides on optimizing your security coverage and using the portal.</p>
                            <span className="text-xs font-bold text-brand-sage uppercase tracking-wide flex items-center group-hover:translate-x-2 transition-transform">Learn More <ArrowRight className="ml-2 w-3 h-3" /></span>
                        </div>
                    </div>
                </div>
            </div>
        )}
        
        {showMissionModal && user && (
            <CreateMissionModal 
                onClose={() => setShowMissionModal(false)}
                onSuccess={() => {
                    setShowMissionModal(false);
                    refreshData();
                }}
                currentUserRole="Client"
                currentUserId={user.id}
                preSelectedClientId={user.id}
            />
        )}

        {showSiteModal && user && (
            <CreateSiteModal
                onClose={() => setShowSiteModal(false)}
                onSuccess={() => {
                    setShowSiteModal(false);
                    refreshData();
                }}
                currentUserRole="Client"
                currentUserId={user.id}
                preSelectedClientId={user.id}
            />
        )}

        {showContractModal && user && (
            <CreateContractModal
                onClose={() => setShowContractModal(false)}
                onSuccess={() => {
                    setShowContractModal(false);
                    refreshData();
                }}
                currentUserRole="Client"
                currentUserId={user.id}
                preSelectedClientId={user.id}
            />
        )}
      </div>
    </div>
  );
};

export default ClientDashboard;
