
import React, { useState, useEffect } from 'react';
import { 
  FileText, Search, Plus, CheckCircle, AlertTriangle, 
  Clock, DollarSign, Calendar, BarChart2, ChevronRight, X, 
  History, User, Download, Edit, Shield, Briefcase,
  Activity, PieChart, ArrowRight
} from 'lucide-react';
import { KPIMeter, SimpleBarChart } from '../../common/DashboardWidgets';
import { supabase } from '../../../services/supabase';
import ClientDetail from './ClientDetail';
import CreateContractModal from './CreateContractModal';
import { Client, ClientStatus, ClientType } from '../../../types';
import { useAuth } from '../../../contexts/AuthContext';

type ContractStatus = 
  | 'active' 
  | 'pending_approval' 
  | 'pending_payment' 
  | 'low_budget' 
  | 'budget_exhausted' 
  | 'suspended' 
  | 'expiring_soon' 
  | 'expired' 
  | 'cancelled' 
  | 'renewal_pending';

interface Contract {
  id: string;
  clientId: string;
  clientName: string;
  type: string;
  status: ContractStatus;
  budgetTotal: number;
  budgetUsed: number;
  startDate: string;
  endDate: string;
  teamCode?: string;
  fullClientData?: any; // To pass to detail
}

const ContractManagement = ({ currentUserRole = 'Owner' }: { currentUserRole?: string }) => {
  const [activeTab, setActiveTab] = useState('active');
  const [searchQuery, setSearchQuery] = useState('');
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null);
  const [selectedClientForDetail, setSelectedClientForDetail] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const { user } = useAuth();

  const canCreate = ['Owner', 'Co-Owner', 'Management', 'Operations Director', 'Operations Manager'].includes(currentUserRole);

  const fetchContracts = async () => {
      setLoading(true);
      try {
          const { data, error } = await supabase
              .from('contracts')
              .select(`
                  id,
                  type,
                  status,
                  budget_total,
                  budget_used,
                  start_date,
                  end_date,
                  client:clients!contracts_client_id_fkey(
                      id, 
                      business_name, 
                      primary_contact_name, 
                      business_email, 
                      business_phone,
                      industry_type,
                      business_address,
                      profile:profiles!clients_id_fkey(full_name, email, phone_primary, status)
                  ),
                  team:teams(code)
              `);

          if (data) {
              const formatted = data.map((c: any) => ({
                  id: c.id,
                  clientId: c.client?.id,
                  clientName: c.client?.business_name || c.client?.profile?.full_name || 'Unknown Client',
                  type: c.type || 'General',
                  status: c.status,
                  budgetTotal: c.budget_total || 0,
                  budgetUsed: c.budget_used || 0,
                  startDate: c.start_date,
                  endDate: c.end_date,
                  teamCode: c.team?.code,
                  fullClientData: c.client // Store raw client data to construct Client object if clicked
              }));
              setContracts(formatted);
          }
      } catch (e) {
          console.error(e);
      } finally {
          setLoading(false);
      }
  };

  useEffect(() => {
    fetchContracts();
  }, []);

  const getStatusColor = (status: ContractStatus) => {
    switch (status) {
      case 'active': return 'bg-green-500/20 text-green-400 border-green-500/50';
      case 'pending_approval': return 'bg-orange-500/20 text-orange-400 border-orange-500/50';
      case 'expired': return 'bg-red-500/20 text-red-400 border-red-500/50';
      default: return 'bg-gray-800 text-white';
    }
  };

  const filteredContracts = contracts.filter(c => {
    const matchesSearch = c.clientName.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          c.id.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch; 
  });

  const openClientDetail = (contract: Contract) => {
      // Construct a minimal Client object from available data to open the detail view
      // The Detail view will fetch deeper data on mount
      if (!contract.fullClientData) return;
      
      const clientData = contract.fullClientData;
      const profileData = clientData.profile || {};

      const clientObj: Client = {
          id: clientData.id,
          businessName: clientData.business_name || profileData.full_name || 'Unknown',
          contactName: clientData.primary_contact_name || profileData.full_name || 'Unknown', 
          email: clientData.business_email || profileData.email,
          phone: clientData.business_phone || profileData.phone_primary || '',
          address: clientData.business_address || 'N/A',
          status: profileData.status as ClientStatus,
          type: (clientData.industry_type as ClientType) || 'Corporate',
          team: contract.teamCode || 'Unassigned',
          contracts: [],
          activeMissions: 0,
          satisfactionRating: 5,
          budgetUtilization: 0,
          lastActivity: new Date().toLocaleDateString(),
          tickets: [],
          history: [],
          sites: []
      };
      setSelectedClientForDetail(clientObj);
  };

  const RenderContractTable = () => (
    <div className="bg-brand-ebony rounded-xl border border-brand-800 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
            <thead className="bg-brand-900 border-b border-brand-800">
            <tr>
                <th className="p-4 text-xs font-bold text-gray-500 uppercase">Client / ID</th>
                <th className="p-4 text-xs font-bold text-gray-500 uppercase">Type</th>
                <th className="p-4 text-xs font-bold text-gray-500 uppercase">Budget</th>
                <th className="p-4 text-xs font-bold text-gray-500 uppercase">Dates</th>
                <th className="p-4 text-xs font-bold text-gray-500 uppercase">Status</th>
                <th className="p-4 text-xs font-bold text-gray-500 uppercase text-right">Action</th>
            </tr>
            </thead>
            <tbody className="divide-y divide-brand-800">
            {filteredContracts.map(contract => (
                <tr key={contract.id} className="hover:bg-brand-800/40">
                    <td className="p-4">
                        <button 
                            onClick={(e) => { e.stopPropagation(); openClientDetail(contract); }}
                            className="font-bold text-white text-sm hover:text-brand-sage hover:underline text-left block"
                        >
                            {contract.clientName}
                        </button>
                        <div className="text-xs text-gray-500 font-mono cursor-pointer" onClick={() => setSelectedContract(contract)}>{contract.id.substring(0,8)}...</div>
                    </td>
                    <td className="p-4 text-sm text-gray-300" onClick={() => setSelectedContract(contract)}>{contract.type}</td>
                    <td className="p-4 text-sm font-mono text-white" onClick={() => setSelectedContract(contract)}>${contract.budgetTotal}</td>
                    <td className="p-4 text-xs text-gray-400" onClick={() => setSelectedContract(contract)}>{contract.startDate} -> {contract.endDate}</td>
                    <td className="p-4" onClick={() => setSelectedContract(contract)}>
                        <span className={`inline-flex items-center px-2.5 py-1 rounded text-[10px] font-bold uppercase tracking-wide border ${getStatusColor(contract.status)}`}>
                        {contract.status}
                        </span>
                    </td>
                    <td className="p-4 text-right">
                        <button onClick={() => setSelectedContract(contract)} className="p-2 hover:bg-brand-900 rounded-full text-gray-400 hover:text-white transition-colors">
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

  return (
    <div className="flex flex-col bg-brand-black text-gray-200 animate-fade-in-up w-full">
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-display font-bold text-white flex items-center">
            <FileText className="w-6 h-6 mr-3 text-brand-sage" />
            Contract Management
          </h2>
          <p className="text-sm text-gray-500 mt-1 ml-9">Manage lifecycles, budgets, and client agreements.</p>
        </div>
        
        <div className="flex space-x-3 w-full xl:w-auto">
           <div className="relative flex-grow xl:flex-grow-0 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input 
                type="text" 
                placeholder="Search contracts..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-brand-ebony border border-brand-800 rounded pl-10 pr-4 py-2 text-sm text-white focus:border-brand-sage outline-none" 
              />
           </div>
           {canCreate && (
               <button 
                 onClick={() => setIsCreateModalOpen(true)}
                 className="bg-brand-sage text-black px-4 py-2 rounded font-bold text-sm hover:bg-brand-sage/90 flex items-center whitespace-nowrap shadow-lg"
               >
                 <Plus className="w-4 h-4 mr-2" /> New Contract
               </button>
           )}
        </div>
      </div>

      <RenderContractTable />

      {/* Contract Detail Modal */}
      {selectedContract && (
        <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/80 backdrop-blur-sm transition-opacity duration-300">
          <div className="absolute inset-0" onClick={() => setSelectedContract(null)}></div>
          <div className="relative w-full max-w-4xl h-full bg-brand-ebony border-l border-brand-800 shadow-2xl flex flex-col transform transition-transform duration-300 translate-x-0">
            <div className="p-6 border-b border-brand-800 bg-brand-900/90 flex justify-between items-start">
              <div>
                <h3 className="text-2xl font-display font-bold text-white mb-1">{selectedContract.clientName}</h3>
                <div className="flex gap-2">
                    <span className={`inline-flex items-center px-3 py-1 rounded text-xs font-bold uppercase tracking-wide border ${getStatusColor(selectedContract.status)}`}>
                        {selectedContract.status}
                    </span>
                    <button onClick={() => openClientDetail(selectedContract)} className="text-xs text-brand-sage hover:underline flex items-center ml-2">
                        View Client Profile <ArrowRight size={10} className="ml-1" />
                    </button>
                </div>
              </div>
              <button onClick={() => setSelectedContract(null)} className="text-gray-500 hover:text-white transition-colors bg-brand-black p-2 rounded-full hover:bg-brand-800">
                <X size={20} />
              </button>
            </div>
            <div className="p-6">
                <p className="text-white">Budget Used: ${selectedContract.budgetUsed} / ${selectedContract.budgetTotal}</p>
                <div className="mt-4 p-4 bg-brand-900/30 rounded border border-brand-800">
                    <p className="text-gray-400 text-sm">Contract ID: {selectedContract.id}</p>
                    <p className="text-gray-400 text-sm">Period: {selectedContract.startDate} to {selectedContract.endDate}</p>
                </div>
            </div>
          </div>
        </div>
      )}

      {/* Client Detail Modal */}
      {selectedClientForDetail && (
          <ClientDetail 
              client={selectedClientForDetail}
              onClose={() => setSelectedClientForDetail(null)}
              currentUserRole={currentUserRole}
          />
      )}

      {/* Create Contract Modal */}
      {isCreateModalOpen && (
          <CreateContractModal
              onClose={() => setIsCreateModalOpen(false)}
              onSuccess={fetchContracts}
              currentUserRole={currentUserRole}
              currentUserId={user?.id || ''}
          />
      )}
    </div>
  );
};

export default ContractManagement;
