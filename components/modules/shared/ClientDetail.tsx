
import React, { useState, useEffect } from 'react';
import { 
  User, MapPin, Globe, Briefcase, CreditCard, MessageSquare, 
  Phone, Mail, Edit, Trash2, PieChart, TrendingUp, 
  X, CheckCircle, AlertTriangle, FileText, History, Building,
  Shield, Users, DollarSign, Save, Calendar, Clock, Plus,
  Lock, Activity, Layout, Ban, PauseCircle, PlayCircle,
  MoreHorizontal, Unlock, Gavel, FilePlus, Eye, ArrowRight, Send
} from 'lucide-react';
import { Client, ClientStatus, ContractSummary, ProfileLog } from '../../../types';
import { supabase } from '../../../services/supabase';
import { KPIMeter } from '../../common/DashboardWidgets';
import CreateContractModal from './CreateContractModal';
import CreateSiteModal from './CreateSiteModal';
import { useAuth } from '../../../contexts/AuthContext';

interface ClientDetailProps {
  client: Client;
  onClose: () => void;
  currentUserRole: string; // 'Owner' | 'Management' | 'Operations Director' | 'Operations Manager' | 'Supervisor' | 'Client'
  onUpdate?: (updatedClient: Client) => void;
}

// Extended interface for local state to handle dynamic fields and detailed structure
interface ExtendedClient extends Client {
  companyType?: string;
  industry?: string;
  website?: string;
  secondaryContact?: { name: string; email: string; phone: string };
  accountType?: string;
  paymentTerms?: string;
  activationDate?: string;
  metadata?: any;
}

const ClientDetail: React.FC<ClientDetailProps> = ({ client, onClose, currentUserRole, onUpdate }) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'overview' | 'contracts' | 'sites' | 'missions' | 'financials' | 'communication' | 'audit'>('overview');
  const [isActionModalOpen, setIsActionModalOpen] = useState(false);
  const [isCreateContractOpen, setIsCreateContractOpen] = useState(false);
  const [isCreateSiteOpen, setIsCreateSiteOpen] = useState(false);
  const [currentAction, setCurrentAction] = useState('');
  const [actionReason, setActionReason] = useState('');
  const [localClient, setLocalClient] = useState<ExtendedClient>({
      ...client,
      // Defaulting fields that might be missing from the base type but are in spec
      companyType: client.applicationData?.businessType || 'Corporation',
      industry: client.type,
      accountType: 'Standard',
      paymentTerms: 'Net 30',
      activationDate: client.history?.find(h => h.action === 'Activate')?.created_at || 'N/A'
  });
  const [isEditing, setIsEditing] = useState(false);
  const [loadingData, setLoadingData] = useState(false);

  // --- Permissions Logic ---
  const isOwner = currentUserRole === 'Owner' || currentUserRole === 'Co-Owner';
  const isMgmt = currentUserRole === 'Management';
  const isDirector = currentUserRole === 'Operations Director' || currentUserRole === 'Operations';
  const isManager = currentUserRole === 'Operations Manager';
  const isSupervisor = currentUserRole === 'Supervisor';
  const isClientUser = currentUserRole === 'Client';

  const permissions = {
    // View Access
    canViewFinancials: isOwner || isMgmt || isDirector || isClientUser,
    canViewAudit: isOwner || isMgmt || isDirector,
    canViewFullMissions: !isSupervisor, // Supervisors view recent only in summary
    
    // Edit Access
    canEditProfile: isOwner || isMgmt || isDirector || isManager || isClientUser,
    canEditSensitive: isOwner || isMgmt || isDirector, // Account info, payment terms
    
    // Actions
    canCreateContract: isOwner || isMgmt || isDirector || isClientUser,
    canEditContract: isOwner || isMgmt || isDirector,
    canCreateSite: isOwner || isMgmt || isDirector || isManager || isClientUser,
    canEditSite: isOwner || isMgmt || isDirector || isManager,
    canCreateMission: isOwner || isMgmt || isDirector || isManager || isClientUser,
    canAssignTeam: isOwner || isMgmt || (isDirector && false), // Director requests only
    canTransferTeam: isOwner || isMgmt,
    
    // Status
    canActivate: isOwner || isMgmt || isDirector || isManager,
    canSuspend: isOwner || isMgmt || isDirector,
    canTerminate: isOwner || isMgmt || (isDirector && false), // Director needs approval
    canChangeStatus: isOwner || isMgmt || isDirector || isManager,
    canOverride: isOwner,
    
    // Financial
    canProcessPayment: isOwner,
    canGenerateInvoice: isOwner || isMgmt || isDirector,
  };

  useEffect(() => {
      // In a real app, fetch deep details here (payments, full history, messages)
      // setLocalClient(prev => ({...prev, ...fetchedDetails}));
  }, [client.id]);

  const refreshClientData = async () => {
      // Re-fetch client data including contracts/sites to update the view
      if (onUpdate) {
          // Trigger parent update logic if available or just reload local list
          setIsCreateContractOpen(false);
          setIsCreateSiteOpen(false);
          
          // Fetch sites for this client again
          const { data: siteData } = await supabase
            .from('sites')
            .select('id, name, address, type, status, access_info, documents, history')
            .eq('client_id', client.id);
            
          if (siteData) {
              setLocalClient(prev => ({ ...prev, sites: siteData as any }));
          }
      }
  };

  // --- Helpers ---

  const getStatusColor = (status: ClientStatus) => {
    switch (status) {
      case 'active': return 'bg-green-500/20 text-green-400 border-green-500/50';
      case 'pending': 
      case 'applicant':
      case 'under_review':
        return 'bg-orange-500/20 text-orange-400 border-orange-500/50';
      case 'suspended': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50';
      case 'inactive': return 'bg-gray-500/20 text-gray-400 border-gray-500/50';
      case 'terminated': return 'bg-red-500/20 text-red-400 border-red-500/50';
      case 'on_hold': return 'bg-blue-500/20 text-blue-400 border-blue-500/50';
      case 'denied': return 'bg-red-900/20 text-red-500 border-red-900/50';
      default: return 'bg-gray-800 text-white';
    }
  };

  const handleAction = async () => {
    if (!localClient || !currentAction) return;
    
    let newStatus: ClientStatus = localClient.status;
    if (['Activate', 'Reactivate'].includes(currentAction)) newStatus = 'active';
    if (currentAction === 'Suspend') newStatus = 'suspended';
    if (currentAction === 'Terminate') newStatus = 'terminated';
    if (currentAction === 'Hold') newStatus = 'on_hold';

    const historyEntry: ProfileLog = {
        id: `log-${Date.now()}`,
        created_at: new Date().toISOString(),
        action: currentAction,
        performed_by: currentUserRole,
        role: currentUserRole,
        note: actionReason
    };

    const updatedClient = {
        ...localClient,
        status: newStatus,
        history: [historyEntry, ...localClient.history]
    };

    try {
        if (!['Create Contract', 'Create Site', 'Create Mission'].includes(currentAction)) {
             await supabase.from('clients').update({ status: newStatus }).eq('id', localClient.id);
             if(['applicant', 'under_review'].includes(localClient.status)) {
                 await supabase.from('applications').update({ status: newStatus }).eq('id', localClient.id); 
             }
        }
        
        setLocalClient(updatedClient);
        if (onUpdate) onUpdate(updatedClient);
        setIsActionModalOpen(false);
        setActionReason('');
        
    } catch(e) {
        console.error(e);
        alert("Action failed");
    }
  };

  const openAction = (action: string) => {
      if (action === 'Create Contract') {
          setIsCreateContractOpen(true);
      } else if (action === 'Create Site') {
          setIsCreateSiteOpen(true);
      } else {
          setCurrentAction(action);
          setIsActionModalOpen(true);
      }
  };

  // --- Render Sections ---

  const renderHeader = () => (
    <div className="p-6 border-b border-brand-800 bg-brand-900/90 flex flex-col md:flex-row justify-between items-start gap-4">
      <div>
        <div className="flex items-center gap-3 mb-2">
          <div className="w-12 h-12 rounded-lg bg-brand-sage/20 text-brand-sage flex items-center justify-center border border-brand-sage/30">
             <Building size={24} />
          </div>
          <div>
            <h3 className="text-2xl font-display font-bold text-white">{localClient.businessName}</h3>
            <div className="flex items-center gap-2 mt-1">
                <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide border ${getStatusColor(localClient.status)}`}>
                    {localClient.status.toUpperCase()}
                </span>
                <span className="text-xs text-gray-400 border border-brand-800 px-2 py-0.5 rounded bg-brand-black">{localClient.accountType}</span>
                <span className="text-xs text-gray-400 flex items-center"><Users className="w-3 h-3 mr-1" /> {localClient.team}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center text-sm text-gray-400 space-x-4 ml-1">
           <span className="flex items-center"><User className="w-3 h-3 mr-1" /> {localClient.contactName}</span>
           <span className="flex items-center"><MapPin className="w-3 h-3 mr-1" /> {localClient.sites?.length || 0} Sites</span>
        </div>
      </div>
      
      <div className="flex flex-wrap items-center gap-2 justify-end">
         <button className="p-2 bg-brand-ebony border border-brand-700 rounded-full text-gray-400 hover:text-white hover:border-brand-sage transition-all" title="Message">
            <MessageSquare size={18} />
         </button>

         {permissions.canEditProfile && (
             <button onClick={() => setIsEditing(!isEditing)} className={`p-2 border rounded-full transition-all ${isEditing ? 'bg-brand-sage text-black border-brand-sage' : 'bg-brand-ebony border-brand-700 text-gray-400 hover:text-white'}`} title="Edit Profile">
                {isEditing ? <Save size={18} /> : <Edit size={18} />}
             </button>
         )}

         {permissions.canCreateMission && (
             <button onClick={() => openAction('Create Mission')} className="hidden md:flex items-center px-3 py-1.5 bg-blue-600/20 text-blue-400 border border-blue-500/30 rounded font-bold text-xs hover:bg-blue-600/30">
                 <Plus size={14} className="mr-1" /> Mission
             </button>
         )}

         {permissions.canChangeStatus && (
             <div className="relative group">
                 <button className="p-2 bg-brand-ebony border border-brand-700 rounded-full text-yellow-500 hover:text-yellow-400 hover:border-yellow-500 transition-all ml-2">
                    <AlertTriangle size={18} />
                 </button>
                 <div className="absolute right-0 top-full mt-2 w-48 bg-brand-ebony border border-brand-800 rounded shadow-xl hidden group-hover:block z-50">
                    {localClient.status === 'active' ? (
                        <>
                            {permissions.canSuspend && <button onClick={() => openAction('Suspend')} className="block w-full text-left px-4 py-2 text-sm text-yellow-500 hover:bg-brand-800">Suspend Client</button>}
                            {permissions.canSuspend && <button onClick={() => openAction('Hold')} className="block w-full text-left px-4 py-2 text-sm text-blue-400 hover:bg-brand-800">Put On Hold</button>}
                        </>
                    ) : (
                        permissions.canActivate && <button onClick={() => openAction('Activate')} className="block w-full text-left px-4 py-2 text-sm text-green-400 hover:bg-brand-800">Activate Client</button>
                    )}
                    {permissions.canTerminate && (
                        <button onClick={() => openAction('Terminate')} className="block w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-brand-800 border-t border-brand-800">Terminate Contract</button>
                    )}
                 </div>
             </div>
         )}

         {permissions.canOverride && (
             <button onClick={() => openAction('Override')} className="p-2 bg-red-900/20 border border-red-500/50 rounded-full text-red-500 hover:bg-red-900/40 transition-all ml-2" title="Owner Override">
                <Unlock size={18} />
             </button>
         )}

         <button onClick={onClose} className="p-2 bg-brand-black border border-brand-800 rounded-full text-gray-500 hover:text-white transition-all ml-2">
            <X size={20} />
         </button>
      </div>
    </div>
  );

  const renderTabs = () => (
    <div className="flex overflow-x-auto border-b border-brand-800 px-6 bg-brand-900/50 scrollbar-hide">
       {[
         { id: 'overview', label: 'Overview', icon: <Activity size={14} /> },
         { id: 'contracts', label: 'Contracts', icon: <FileText size={14} /> },
         { id: 'sites', label: 'Sites', icon: <MapPin size={14} /> },
         { id: 'missions', label: 'Missions', icon: <Shield size={14} /> },
         { id: 'financials', label: 'Financials', icon: <DollarSign size={14} />, restricted: !permissions.canViewFinancials },
         { id: 'communication', label: 'Communication', icon: <MessageSquare size={14} /> },
         { id: 'audit', label: 'Audit', icon: <History size={14} />, restricted: !permissions.canViewAudit },
       ].map((tab) => {
          if (tab.restricted) return null;
          return (
            <button 
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center px-4 py-3 text-sm font-bold border-b-2 transition-colors whitespace-nowrap ${
                    activeTab === tab.id 
                    ? 'border-brand-sage text-brand-sage' 
                    : 'border-transparent text-gray-400 hover:text-white'
                }`}
            >
                <span className="mr-2">{tab.icon}</span>
                {tab.label}
            </button>
          );
       })}
    </div>
  );

  const renderContent = () => (
    <div className="flex-1 overflow-y-auto p-6 bg-brand-black/20 relative">
        {/* OVERVIEW TAB */}
        {activeTab === 'overview' && (
            <div className="space-y-6 animate-fade-in-up">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <KPIMeter label="Budget Used" value={`${localClient.budgetUtilization}%`} trend="up" trendValue="Tracking" color="green" icon={<PieChart />} />
                    <KPIMeter label="Satisfaction" value={`${localClient.satisfactionRating}/5.0`} trend="up" trendValue="High" color="blue" icon={<CheckCircle />} />
                    <KPIMeter label="Mission Comp." value="98%" trend="up" trendValue="Excellent" color="purple" icon={<Shield />} />
                    <KPIMeter label="Active Guards" value="12" trend="up" trendValue="Deployed" color="orange" icon={<Users />} />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-brand-black/30 p-5 rounded-lg border border-brand-800">
                        <h4 className="text-brand-sage font-bold text-xs uppercase tracking-wider mb-4 border-b border-brand-800 pb-2 flex items-center">
                            <Building className="w-3 h-3 mr-2" /> Company Information
                        </h4>
                        <div className="space-y-3 text-sm">
                            <div className="flex justify-between items-center">
                                <span className="text-gray-500">Legal Name</span> 
                                {isEditing ? <input className="bg-brand-black border border-brand-700 rounded px-2 py-1 text-right text-white w-1/2" defaultValue={localClient.businessName} /> : <span className="text-white">{localClient.businessName}</span>}
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-gray-500">Type</span> 
                                {isEditing ? <input className="bg-brand-black border border-brand-700 rounded px-2 py-1 text-right text-white w-1/2" defaultValue={localClient.companyType} /> : <span className="text-white">{localClient.companyType}</span>}
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-gray-500">Industry</span> 
                                {isEditing ? <input className="bg-brand-black border border-brand-700 rounded px-2 py-1 text-right text-white w-1/2" defaultValue={localClient.industry} /> : <span className="text-white">{localClient.industry}</span>}
                            </div>
                            <div className="flex justify-between items-start">
                                <span className="text-gray-500">Address</span> 
                                {isEditing ? <textarea className="bg-brand-black border border-brand-700 rounded px-2 py-1 text-right text-white w-1/2" defaultValue={localClient.address} /> : <span className="text-white text-right max-w-[200px]">{localClient.address}</span>}
                            </div>
                        </div>
                    </div>

                    <div className="bg-brand-black/30 p-5 rounded-lg border border-brand-800">
                        <h4 className="text-brand-sage font-bold text-xs uppercase tracking-wider mb-4 border-b border-brand-800 pb-2 flex items-center">
                            <User className="w-3 h-3 mr-2" /> Contact Information
                        </h4>
                        <div className="space-y-3 text-sm">
                            <div className="flex justify-between items-center">
                                <span className="text-gray-500">Primary Contact</span> 
                                {isEditing ? <input className="bg-brand-black border border-brand-700 rounded px-2 py-1 text-right text-white w-1/2" defaultValue={localClient.contactName} /> : <span className="text-white font-bold">{localClient.contactName}</span>}
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-gray-500">Email</span> 
                                <span className="text-white">{localClient.email}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-gray-500">Phone</span> 
                                {isEditing ? <input className="bg-brand-black border border-brand-700 rounded px-2 py-1 text-right text-white w-1/2" defaultValue={localClient.phone} /> : <span className="text-white">{localClient.phone}</span>}
                            </div>
                            <div className="pt-2 border-t border-brand-800 mt-2">
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-500">Secondary</span> 
                                    <span className="text-gray-400">{localClient.secondaryContact?.name || 'None Listed'}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-brand-black/30 p-5 rounded-lg border border-brand-800">
                        <h4 className="text-brand-sage font-bold text-xs uppercase tracking-wider mb-4 border-b border-brand-800 pb-2 flex items-center">
                            <CreditCard className="w-3 h-3 mr-2" /> Account Details
                        </h4>
                        <div className="space-y-3 text-sm">
                            <div className="flex justify-between items-center">
                                <span className="text-gray-500">Status</span> 
                                <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${getStatusColor(localClient.status)}`}>{localClient.status}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-gray-500">Package</span> 
                                <span className="text-white">{localClient.accountType}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-gray-500">Payment Terms</span> 
                                <span className="text-white">{localClient.paymentTerms}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-gray-500">Active Since</span> 
                                <span className="text-white">{localClient.activationDate}</span>
                            </div>
                        </div>
                    </div>

                    <div className="bg-brand-black/30 p-5 rounded-lg border border-brand-800">
                        <h4 className="text-brand-sage font-bold text-xs uppercase tracking-wider mb-4 border-b border-brand-800 pb-2 flex items-center">
                            <Users className="w-3 h-3 mr-2" /> Operations Team
                        </h4>
                        <div className="space-y-3 text-sm">
                            <div className="flex justify-between items-center">
                                <span className="text-gray-500">Assigned Team</span> 
                                <span className="text-white font-bold">{localClient.team}</span>
                            </div>
                            {permissions.canTransferTeam && (
                                <button onClick={() => openAction('Transfer Team')} className="w-full mt-2 bg-brand-ebony border border-brand-700 text-gray-300 text-xs py-2 rounded hover:text-white hover:border-brand-sage transition-all flex items-center justify-center">
                                    <ArrowRight className="w-3 h-3 mr-1" /> Transfer Team
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        )}

        {/* CONTRACTS TAB */}
        {activeTab === 'contracts' && (
            <div className="space-y-4 animate-fade-in-up">
                <div className="flex justify-between items-center mb-2">
                    <h4 className="text-white font-bold">Active Agreements</h4>
                    {permissions.canCreateContract && (
                        <button onClick={() => openAction('Create Contract')} className="bg-brand-sage text-black px-3 py-1.5 rounded font-bold text-xs hover:bg-brand-sage/90 flex items-center">
                            <Plus className="w-3 h-3 mr-1" /> New Contract
                        </button>
                    )}
                </div>
                {localClient.contracts.length === 0 ? (
                    <div className="p-8 text-center text-gray-500 bg-brand-900/30 rounded border border-brand-800">No active contracts.</div>
                ) : (
                    localClient.contracts.map(contract => (
                        <div key={contract.id} className="bg-brand-900/30 p-4 rounded-lg border border-brand-800 hover:border-brand-700 transition-colors">
                            <div className="flex justify-between items-start mb-2">
                                <div>
                                    <h5 className="font-bold text-white text-sm">{contract.type}</h5>
                                    <p className="text-xs text-gray-500 font-mono">ID: {contract.id.substring(0,8)}</p>
                                </div>
                                <span className="text-[10px] bg-green-900/50 text-green-400 px-2 py-0.5 rounded uppercase font-bold border border-green-500/30">Active</span>
                            </div>
                            <div className="flex justify-between items-center text-xs text-gray-400 mt-2">
                                <div className="flex items-center"><Calendar className="w-3 h-3 mr-1" /> {contract.startDate} - {contract.endDate}</div>
                                <span className="text-white font-mono font-bold">${contract.value.toLocaleString()}</span>
                            </div>
                            {permissions.canEditContract && (
                                <div className="mt-3 pt-3 border-t border-brand-800 flex justify-end space-x-3">
                                    <button className="text-xs text-gray-400 hover:text-white flex items-center"><Edit className="w-3 h-3 mr-1" /> Edit</button>
                                    <button className="text-xs text-red-400 hover:text-red-300 flex items-center"><X className="w-3 h-3 mr-1" /> Terminate</button>
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>
        )}

        {/* SITES TAB */}
        {activeTab === 'sites' && (
            <div className="space-y-4 animate-fade-in-up">
                <div className="flex justify-between items-center mb-2">
                    <h4 className="text-white font-bold">Client Sites</h4>
                    {permissions.canCreateSite && (
                        <button onClick={() => openAction('Create Site')} className="bg-brand-sage text-black px-3 py-1.5 rounded font-bold text-xs hover:bg-brand-sage/90 flex items-center">
                            <Plus className="w-3 h-3 mr-1" /> Add Site
                        </button>
                    )}
                </div>
                {localClient.sites && localClient.sites.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {localClient.sites.map((site: any) => (
                            <div key={site.id} className="bg-brand-900/30 p-4 rounded-lg border border-brand-800">
                                <div className="flex justify-between items-start mb-2">
                                    <h5 className="font-bold text-white text-sm">{site.name}</h5>
                                    <span className="text-[10px] bg-brand-black px-2 py-0.5 rounded text-gray-400">{site.type}</span>
                                </div>
                                <p className="text-xs text-gray-400 mb-2">{site.address}</p>
                                <div className="flex justify-between items-center pt-2 border-t border-brand-800/50">
                                    <span className={`text-[10px] uppercase font-bold ${site.status === 'active' ? 'text-green-400' : 'text-gray-500'}`}>{site.status}</span>
                                    <button className="text-xs text-brand-sage hover:underline">View Details</button>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="bg-brand-900/30 p-8 rounded-lg border border-brand-800 text-center text-gray-500">
                        <MapPin className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        <p className="text-sm">No sites found for this client.</p>
                        {permissions.canCreateSite && (
                            <button onClick={() => openAction('Create Site')} className="mt-4 text-brand-sage hover:underline text-xs">Create First Site</button>
                        )}
                    </div>
                )}
            </div>
        )}

        {/* FINANCIALS TAB */}
        {activeTab === 'financials' && (
            <div className="space-y-6 animate-fade-in-up">
                {permissions.canViewFinancials ? (
                    <>
                        <div className="bg-brand-ebony p-6 rounded-lg border border-brand-800 flex justify-between items-center">
                            <div>
                                <p className="text-gray-400 text-sm">Outstanding Balance</p>
                                <h3 className="text-3xl font-bold text-white font-mono">$0.00</h3>
                            </div>
                            {permissions.canGenerateInvoice && (
                                <button className="text-xs bg-brand-black border border-brand-700 text-white px-4 py-2 rounded hover:border-brand-sage transition-all">Generate Invoice</button>
                            )}
                        </div>
                        
                        <div className="bg-brand-black/30 rounded-lg border border-brand-800 overflow-hidden">
                            <table className="w-full text-left">
                                <thead className="bg-brand-900 border-b border-brand-800">
                                    <tr>
                                        <th className="p-4 text-xs font-bold text-gray-500 uppercase">Invoice #</th>
                                        <th className="p-4 text-xs font-bold text-gray-500 uppercase">Date</th>
                                        <th className="p-4 text-xs font-bold text-gray-500 uppercase">Amount</th>
                                        <th className="p-4 text-xs font-bold text-gray-500 uppercase">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-brand-800 text-sm">
                                    <tr className="hover:bg-brand-800/30">
                                        <td className="p-4 text-white">INV-2024-001</td>
                                        <td className="p-4 text-gray-300">Oct 01, 2024</td>
                                        <td className="p-4 text-white font-mono">$5,000.00</td>
                                        <td className="p-4"><span className="text-green-400 text-xs uppercase font-bold">Paid</span></td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </>
                ) : (
                    <div className="p-12 text-center text-gray-500 bg-brand-ebony rounded-lg border border-brand-800">
                        <Lock className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        <p>You do not have permission to view financial records.</p>
                    </div>
                )}
            </div>
        )}

        {/* AUDIT TAB */}
        {activeTab === 'audit' && (
            <div className="space-y-6 animate-fade-in-up">
                {permissions.canViewAudit ? (
                    <>
                        <h4 className="text-brand-sage font-bold text-sm uppercase tracking-wider mb-4 flex items-center border-b border-brand-800 pb-2">
                            <History className="w-4 h-4 mr-2" /> Change History
                        </h4>
                        <div className="space-y-4 pl-4 border-l border-brand-800 ml-2">
                            {localClient.history.length === 0 ? (
                                <p className="text-sm text-gray-500 italic">No history available.</p>
                            ) : (
                                localClient.history.map((entry, idx) => (
                                    <div key={idx} className="relative">
                                        <div className="absolute -left-[21px] top-1 w-3 h-3 rounded-full bg-brand-black border-2 border-brand-600"></div>
                                        <div className="bg-brand-900/40 p-3 rounded border border-brand-800/50">
                                            <div className="flex justify-between items-start mb-1">
                                                <span className="font-bold text-white text-sm">{entry.action}</span>
                                                <span className="text-[10px] text-gray-500 font-mono">{entry.created_at ? new Date(entry.created_at).toLocaleString() : 'Unknown Date'}</span>
                                            </div>
                                            <p className="text-xs text-brand-sage mb-1">{entry.performed_by} <span className="text-gray-600">•</span> {entry.role}</p>
                                            {entry.note && <p className="text-xs text-gray-400 italic">"{entry.note}"</p>}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </>
                ) : (
                    <div className="p-12 text-center text-gray-500 bg-brand-ebony rounded-lg border border-brand-800">
                        <Lock className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        <p>Audit trail access restricted.</p>
                    </div>
                )}
            </div>
        )}

        {/* COMM TAB */}
        {activeTab === 'communication' && (
            <div className="space-y-4 animate-fade-in-up">
                <div className="flex justify-between items-center mb-4">
                    <h4 className="text-white font-bold">Message History</h4>
                    <button className="bg-brand-sage text-black px-3 py-1.5 rounded font-bold text-xs hover:bg-brand-sage/90 flex items-center">
                        <Send className="w-3 h-3 mr-1" /> New Message
                    </button>
                </div>
                <div className="bg-brand-black/30 border border-brand-800 rounded-lg p-8 text-center text-gray-500 italic">
                    <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    No recent messages.
                </div>
            </div>
        )}

        {/* MISSIONS TAB */}
        {activeTab === 'missions' && (
            <div className="space-y-4 animate-fade-in-up">
                <h4 className="text-white font-bold mb-2">Mission Activity</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-brand-900/30 p-4 rounded-lg border border-brand-800">
                        <div className="flex justify-between mb-2">
                            <span className="text-white font-bold text-sm">Completed Missions</span>
                            <span className="text-brand-sage font-bold">142</span>
                        </div>
                        <div className="w-full bg-brand-900 h-1.5 rounded-full overflow-hidden">
                            <div className="bg-brand-sage h-full w-full"></div>
                        </div>
                    </div>
                    <div className="bg-brand-900/30 p-4 rounded-lg border border-brand-800">
                        <div className="flex justify-between mb-2">
                            <span className="text-white font-bold text-sm">Active Now</span>
                            <span className="text-green-400 font-bold">{localClient.activeMissions}</span>
                        </div>
                        <div className="w-full bg-brand-900 h-1.5 rounded-full overflow-hidden">
                            <div className="bg-green-500 h-full w-1/3"></div>
                        </div>
                    </div>
                </div>
                <div className="bg-brand-black/30 border border-brand-800 rounded-lg p-4 text-center text-gray-500 text-sm">
                    Full mission history available in Mission Management module.
                </div>
            </div>
        )}

    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/80 backdrop-blur-sm transition-opacity duration-300">
      <div className="absolute inset-0" onClick={onClose}></div>
      <div className="relative w-full max-w-4xl h-full bg-brand-ebony border-l border-brand-800 shadow-2xl flex flex-col transform transition-transform duration-300 translate-x-0 animate-fade-in-right">
        {renderHeader()}
        
        {renderTabs()}

        {renderContent()}
      </div>

      {isActionModalOpen && (
          <div className="absolute inset-0 z-[60] flex items-center justify-center bg-black/90 p-4 backdrop-blur-sm">
              <div className="bg-brand-ebony border border-brand-700 rounded-xl p-6 w-full max-w-md shadow-2xl animate-fade-in-up">
                  <h4 className="text-lg font-bold text-white mb-4 capitalize flex items-center">
                      <AlertTriangle className="w-5 h-5 mr-2 text-yellow-500" /> Confirm {currentAction}
                  </h4>
                  <p className="text-sm text-gray-400 mb-4">
                      Please provide a reason/note for this action. This will be recorded in the audit trail.
                  </p>
                  <textarea 
                      className="w-full bg-brand-black border border-brand-800 rounded p-3 text-sm text-white focus:border-brand-sage outline-none mb-4"
                      rows={3}
                      placeholder="Reason for action..."
                      value={actionReason}
                      onChange={(e) => setActionReason(e.target.value)}
                  />
                  <div className="flex justify-end space-x-3">
                      <button onClick={() => setIsActionModalOpen(false)} className="px-4 py-2 rounded text-sm text-gray-400 hover:text-white">Cancel</button>
                      <button 
                          onClick={handleAction}
                          disabled={!actionReason.trim()}
                          className="px-4 py-2 rounded text-sm font-bold text-black bg-brand-sage hover:bg-brand-sage/90 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                          Confirm
                      </button>
                  </div>
              </div>
          </div>
      )}

      {isCreateContractOpen && (
          <CreateContractModal 
              onClose={() => setIsCreateContractOpen(false)}
              onSuccess={refreshClientData}
              currentUserRole={currentUserRole}
              currentUserId={user?.id || ''}
              preSelectedClientId={client.id}
          />
      )}

      {isCreateSiteOpen && (
          <CreateSiteModal 
              onClose={() => setIsCreateSiteOpen(false)}
              onSuccess={refreshClientData}
              currentUserRole={currentUserRole}
              currentUserId={user?.id || ''}
              preSelectedClientId={client.id}
          />
      )}
    </div>
  );
};

export default ClientDetail;
