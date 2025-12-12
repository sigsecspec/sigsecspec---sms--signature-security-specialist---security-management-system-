
import React, { useState, useEffect } from 'react';
import { 
  Briefcase, Search, Filter, Plus, CheckCircle, AlertTriangle, 
  Clock, BarChart2, ChevronRight, X, History, User, 
  FileText, Shield, MapPin, Globe, CreditCard, MessageSquare, 
  Phone, Mail, Edit, Trash2, MoreVertical, PieChart, TrendingUp, 
  Download, Send, AlertCircle, Building, Users, Ban, PauseCircle, PlayCircle,
  MoreHorizontal, Unlock, Gavel, FilePlus, Eye, ArrowRight
} from 'lucide-react';
import { KPIMeter } from '../../common/DashboardWidgets';
import { supabase } from '../../../services/supabase';
import ClientDetail from './ClientDetail';
import CreateClientModal from './CreateClientModal';
import { Client, ClientStatus, ClientType, ContractSummary } from '../../../types';
import { useAuth } from '../../../contexts/AuthContext';

const ClientManagement = ({ currentUserRole = 'Owner' }: { currentUserRole?: string }) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'active' | 'applications' | 'contracts' | 'performance' | 'communication'>('active');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Create Modal State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Permission to create account
  const canCreateAccount = ['Owner', 'Co-Owner', 'Management', 'Operations Director', 'Operations Manager', 'Operations'].includes(currentUserRole);

  // Fetch Clients from DB
  const fetchClients = async () => {
    setLoading(true);
    try {
      // Fetch Clients with profiles
      const { data: clientsData, error: clientError } = await supabase
        .from('clients')
        .select(`
          *,
          profile:profiles!clients_id_fkey (
              id,
              full_name,
              email,
              phone_primary,
              status,
              created_at,
              metadata,
              bio,
              address_street,
              address_city,
              address_state,
              address_zip,
              team:teams!fk_profiles_team(name)
          )
        `);

      if (clientError) throw clientError;

      // Fetch Contracts
      const { data: contractsData } = await supabase.from('contracts').select('*');
      // Fetch Active Missions Count
      const { data: missionsData } = await supabase.from('missions').select('id, client_id, status');

      // Fetch Pending Applications to merge into the list for the 'Applications' tab
      const { data: appsData } = await supabase
        .from('client_applications')
        .select(`
          id, status, submitted_at,
          business_name, industry_type,
          user:profiles!client_applications_user_id_fkey ( id, full_name, email, phone_primary )
        `);

      let allClients: Client[] = [];
      const activeProfileIds = new Set<string>();

      // 1. Map Active/Established Clients
      if (clientsData) {
        const activeList: Client[] = clientsData.map((c: any) => {
          const p = c.profile || {};
          if (p.id) activeProfileIds.add(p.id);
          
          const clientContracts = contractsData?.filter((con: any) => con.client_id === p.id) || [];
          const contracts: ContractSummary[] = clientContracts.map((con: any) => ({
              id: con.id,
              type: con.type,
              startDate: con.start_date,
              endDate: con.end_date,
              status: con.status,
              value: con.budget_total || 0
          }));

          const activeMissions = missionsData?.filter((m: any) => m.client_id === p.id && m.status === 'active').length || 0;
          
          const rawType = c.industry_type || 'Corporate';
          const clientType: ClientType = ['Corporate', 'Retail', 'Event', 'Residential', 'Construction', 'Industrial', 'Government', 'Healthcare'].includes(rawType) 
              ? (rawType as ClientType) 
              : 'Corporate';

          return {
            id: c.id, 
            businessName: c.business_name || p.full_name || 'Unknown Business',
            contactName: c.primary_contact_name || p.full_name || 'Unknown Contact',
            email: c.business_email || p.email,
            phone: c.business_phone || p.phone_primary || 'N/A',
            address: c.business_address || (p.address_street ? `${p.address_street}, ${p.address_city || ''}` : 'N/A'),
            status: (p.status?.toLowerCase() as ClientStatus) || 'applicant',
            type: clientType,
            team: p.team?.name || 'Unassigned',
            contracts: contracts,
            activeMissions: activeMissions,
            satisfactionRating: c.satisfaction_rating || 5.0,
            budgetUtilization: c.budget_utilization || 0,
            lastActivity: new Date(c.updated_at).toLocaleDateString(),
            tickets: [], // Mocked for now
            history: [], // History not easily fetched in bulk in this schema version
            sites: [],
            applicationData: {
              submittedDate: new Date(c.created_at).toLocaleDateString(),
              businessType: 'N/A',
              securityNeeds: [],
              documents: []
            }
          };
        });
        allClients = [...allClients, ...activeList];
      }

      // 2. Map Pending Applications (if not already an active client)
      if (appsData) {
          const pendingList: Client[] = appsData
              .filter((app: any) => {
                  const userId = app.user?.id;
                  // Filter out if user already has a client record
                  return userId && !activeProfileIds.has(userId);
              })
              .map((app: any) => {
                  const u = app.user || {};
                  
                  return {
                      id: app.id,
                      businessName: app.business_name || u.full_name || 'New Applicant',
                      contactName: u.full_name || 'Unknown',
                      email: u.email || '',
                      phone: u.phone_primary || 'N/A',
                      address: 'N/A',
                      status: (app.status as ClientStatus),
                      type: (app.industry_type as ClientType) || 'Corporate', 
                      team: 'Pending',
                      contracts: [],
                      activeMissions: 0,
                      satisfactionRating: 0,
                      budgetUtilization: 0,
                      lastActivity: new Date(app.submitted_at).toLocaleDateString(),
                      tickets: [],
                      history: [],
                      sites: [],
                      applicationData: {
                          submittedDate: new Date(app.submitted_at).toLocaleDateString(),
                          businessType: 'N/A',
                          securityNeeds: [],
                          documents: []
                      }
                  };
              });
          allClients = [...allClients, ...pendingList];
      }

      setClients(allClients);

    } catch (err) {
      console.error('Error fetching clients:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();
  }, []);

  // --- Filter Logic ---
  const filteredClients = clients.filter(c => {
    const searchLower = searchQuery.toLowerCase();
    const matchesSearch = 
        c.businessName.toLowerCase().includes(searchLower) || 
        c.contactName.toLowerCase().includes(searchLower) ||
        c.id.toLowerCase().includes(searchLower);
    
    // Status Filter
    const matchesStatusFilter = statusFilter === 'all' || c.status === statusFilter;

    // Tab Filter
    let matchesTab = false;
    if (activeTab === 'active') {
        matchesTab = ['active', 'suspended', 'on_hold', 'inactive', 'terminated'].includes(c.status);
    } else if (activeTab === 'applications') {
        matchesTab = ['pending', 'applicant', 'under_review', 'incomplete', 'denied', 'pending_review'].includes(c.status);
    } else if (activeTab === 'contracts') {
        matchesTab = c.contracts.length > 0;
    } else {
        matchesTab = true; // Performance & Communication show all active
    }

    return matchesSearch && matchesTab && matchesStatusFilter;
  });

  const getStatusBadge = (status: ClientStatus | string) => {
    switch (status) {
      case 'active': return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-green-500/20 text-green-400 border border-green-500/50">Active</span>;
      case 'pending': 
      case 'applicant':
      case 'under_review':
      case 'pending_review':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-orange-500/20 text-orange-400 border border-orange-500/50">Reviewing</span>;
      case 'suspended': return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-yellow-500/20 text-yellow-400 border border-yellow-500/50">Suspended</span>;
      case 'on_hold': return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-blue-500/20 text-blue-400 border border-blue-500/50">On Hold</span>;
      case 'terminated': return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-red-500/20 text-red-400 border border-red-500/50">Terminated</span>;
      case 'inactive': return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-gray-500/20 text-gray-400 border border-gray-500/50">Inactive</span>;
      case 'denied': return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-red-900/20 text-red-500 border border-red-900/50">Denied</span>;
      default: return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-gray-800 text-white">Unknown</span>;
    }
  };

  const updateClientInList = (updatedClient: Client) => {
      setClients(prev => prev.map(c => c.id === updatedClient.id ? updatedClient : c));
      setSelectedClient(updatedClient);
  };

  // --- Renderers ---

  const RenderOverview = () => {
      const activeCount = clients.filter(c => c.status === 'active').length;
      const pendingCount = clients.filter(c => ['pending', 'applicant', 'under_review', 'pending_review'].includes(c.status)).length;
      const riskCount = clients.filter(c => c.satisfactionRating > 0 && c.satisfactionRating < 3.5).length;
      const totalRevenue = clients.reduce((sum, c) => sum + c.contracts.reduce((cSum, con) => cSum + (con.value || 0), 0), 0);

      return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <KPIMeter label="Active Clients" value={activeCount.toString()} trend="up" trendValue="Live" color="green" icon={<Briefcase />} />
            <KPIMeter label="Pending Apps" value={pendingCount.toString()} trend="up" trendValue="Action Req" color="orange" icon={<FileText />} />
            <KPIMeter label="Total Contract Value" value={`$${(totalRevenue/1000).toFixed(1)}k`} trend="up" trendValue="YTD" color="blue" icon={<CreditCard />} />
            <KPIMeter label="At-Risk Clients" value={riskCount.toString()} trend="down" trendValue="Attention" color="red" icon={<AlertCircle />} />
        </div>
      );
  };

  const RenderTable = () => (
    <div className="bg-brand-ebony rounded-xl border border-brand-800 overflow-hidden shadow-xl animate-fade-in-up">
        <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
            <thead className="bg-brand-900 border-b border-brand-800">
            <tr>
                <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Client / ID</th>
                <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Contact</th>
                <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Status & Team</th>
                <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Activity</th>
                {activeTab !== 'applications' && <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Performance</th>}
                <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Actions</th>
            </tr>
            </thead>
            <tbody className="divide-y divide-brand-800">
            {filteredClients.length === 0 ? (
                <tr>
                    <td colSpan={6} className="p-12 text-center text-gray-500">
                        <div className="flex flex-col items-center">
                            <Search className="w-12 h-12 mb-4 opacity-20" />
                            <p>No clients found matching your criteria.</p>
                        </div>
                    </td>
                </tr>
            ) : (
                filteredClients.map(client => (
                    <tr 
                    key={client.id} 
                    onClick={() => setSelectedClient(client)}
                    className="hover:bg-brand-800/40 transition-colors cursor-pointer group"
                    >
                    <td className="p-4">
                        <div className="font-bold text-white text-sm group-hover:text-brand-sage transition-colors">{client.businessName}</div>
                        <div className="text-xs text-gray-500 font-mono mt-1 flex items-center">
                            <span className="bg-brand-black px-1.5 py-0.5 rounded border border-brand-800 mr-2">{client.type}</span>
                            {client.id.substring(0,8)}
                        </div>
                    </td>
                    <td className="p-4">
                        <div className="text-sm text-white font-medium">{client.contactName}</div>
                        <div className="text-xs text-gray-500">{client.email}</div>
                    </td>
                    <td className="p-4">
                        <div className="flex flex-col items-start gap-1">
                            {getStatusBadge(client.status)}
                            <span className="text-xs text-gray-500 flex items-center"><Users className="w-3 h-3 mr-1" /> {client.team}</span>
                        </div>
                    </td>
                    <td className="p-4 text-xs text-gray-400">
                        {activeTab === 'applications' ? (
                            <div>Applied: {client.applicationData?.submittedDate}</div>
                        ) : (
                            <>
                                <div><span className="text-white font-bold">{client.activeMissions}</span> Active Missions</div>
                                <div><span className="text-white font-bold">{client.contracts.length}</span> Contracts</div>
                            </>
                        )}
                    </td>
                    {activeTab !== 'applications' && (
                        <td className="p-4">
                            <div className="flex items-center">
                                <div className="flex-1 h-1.5 bg-brand-900 rounded-full mr-2 overflow-hidden w-16">
                                    <div 
                                        className={`h-full rounded-full ${client.satisfactionRating >= 4 ? 'bg-green-500' : client.satisfactionRating >= 3 ? 'bg-yellow-500' : 'bg-red-500'}`} 
                                        style={{ width: `${(client.satisfactionRating / 5) * 100}%` }}
                                    ></div>
                                </div>
                                <span className="text-xs font-bold text-white">{client.satisfactionRating}/5</span>
                            </div>
                        </td>
                    )}
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
            <Briefcase className="w-6 h-6 mr-3 text-brand-sage" />
            Client Management
          </h2>
          <p className="text-sm text-gray-500 mt-1 ml-9">Manage relationships, contracts, and service delivery.</p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3 w-full xl:w-auto">
           <div className="relative flex-grow xl:flex-grow-0 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input 
                type="text" 
                placeholder="Search clients..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-brand-ebony border border-brand-800 rounded pl-10 pr-4 py-2 text-sm text-white focus:border-brand-sage outline-none" 
              />
           </div>
           
           <div className="relative min-w-[150px]">
             <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
             <select 
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full bg-brand-ebony border border-brand-800 rounded pl-10 pr-4 py-2 text-sm text-white focus:border-brand-sage outline-none appearance-none cursor-pointer"
             >
                <option value="all">All Statuses</option>
                <option value="active">Active</option>
                <option value="pending">Pending</option>
                <option value="suspended">Suspended</option>
                <option value="terminated">Terminated</option>
             </select>
           </div>

           {canCreateAccount && (
               <button 
                 onClick={() => setIsCreateModalOpen(true)}
                 className="bg-brand-sage text-black px-4 py-2 rounded font-bold text-sm hover:bg-brand-sage/90 flex items-center justify-center whitespace-nowrap shadow-lg w-full sm:w-auto"
               >
                 <Plus className="w-4 h-4 mr-2" /> Create Client Account
               </button>
           )}
        </div>
      </div>

      <RenderOverview />

      <div className="flex overflow-x-auto border-b border-brand-800 mb-6 scrollbar-hide">
        {[
          { id: 'active', label: 'Active Clients', icon: <CheckCircle size={16} /> },
          { id: 'applications', label: 'Applications', icon: <FileText size={16} /> },
          { id: 'contracts', label: 'Contracts', icon: <FileText size={16} /> },
          { id: 'performance', label: 'Performance', icon: <TrendingUp size={16} /> },
          { id: 'communication', label: 'Communication', icon: <MessageSquare size={16} /> },
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

      {loading ? <div className="p-8 text-center text-gray-500">Loading Clients...</div> : (
        <>
          {activeTab === 'active' && <RenderTable />}
          {activeTab === 'applications' && <RenderTable />}
          {activeTab === 'contracts' && (
              <div className="space-y-6">
                  {/* Reuse table but filtered for contract data view would be better, using standard view for now */}
                  <RenderTable />
              </div>
          )}
          {activeTab === 'performance' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in-up">
                  <div className="bg-brand-ebony p-6 rounded-xl border border-brand-800">
                      <h3 className="text-white font-bold mb-4 flex items-center"><PieChart className="w-5 h-5 mr-2 text-brand-sage" /> Retention & Growth</h3>
                      <div className="h-64 flex items-end justify-between space-x-2">
                          {/* Mock Chart */}
                          {[65, 70, 68, 72, 75, 80, 85, 82, 90, 92, 95, 94].map((v, i) => (
                              <div key={i} className="w-full bg-brand-800 rounded-t relative group">
                                  <div className="absolute bottom-0 w-full bg-brand-sage/50 group-hover:bg-brand-sage transition-all rounded-t" style={{height: `${v}%`}}></div>
                              </div>
                          ))}
                      </div>
                      <div className="flex justify-between text-xs text-gray-500 mt-2">
                          <span>Jan</span><span>Dec</span>
                      </div>
                  </div>
                  <div className="bg-brand-ebony p-6 rounded-xl border border-brand-800">
                      <h3 className="text-white font-bold mb-4 flex items-center"><AlertTriangle className="w-5 h-5 mr-2 text-red-500" /> Client Alerts</h3>
                      <div className="space-y-3">
                          {clients.filter(c => c.status === 'suspended').map(c => (
                              <div key={c.id} className="p-3 bg-red-900/10 border border-red-500/30 rounded flex justify-between items-center">
                                  <span className="text-white text-sm">{c.businessName}</span>
                                  <span className="text-red-400 text-xs font-bold uppercase">Suspended</span>
                              </div>
                          ))}
                          {clients.filter(c => c.status === 'suspended').length === 0 && <p className="text-gray-500 italic text-sm">No critical alerts.</p>}
                      </div>
                  </div>
              </div>
          )}
          
          {activeTab === 'communication' && (
              <div className="bg-brand-ebony p-12 text-center text-gray-500 rounded-xl border border-brand-800">
                  <MessageSquare className="w-16 h-16 mx-auto mb-4 opacity-20" />
                  <h3 className="text-xl font-bold text-white mb-2">Communication Center</h3>
                  <p>Client messaging and notification history will appear here.</p>
              </div>
          )}
        </>
      )}

      {selectedClient && (
        <ClientDetail 
            client={selectedClient} 
            onClose={() => setSelectedClient(null)} 
            currentUserRole={currentUserRole}
            onUpdate={updateClientInList}
        />
      )}

      {isCreateModalOpen && (
          <CreateClientModal 
              onClose={() => setIsCreateModalOpen(false)}
              onSuccess={() => {
                  fetchClients();
                  setIsCreateModalOpen(false);
              }}
              currentUserRole={currentUserRole}
              currentUserId={user?.id || ''}
          />
      )}
    </div>
  );
};

export default ClientManagement;
