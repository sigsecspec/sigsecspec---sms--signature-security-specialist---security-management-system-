
import React, { useState, useEffect } from 'react';
import { 
  MapPin, Search, Filter, Plus, CheckCircle, AlertTriangle, 
  Clock, BarChart2, ChevronRight, X, History, User, 
  FileText, Shield, Briefcase, Lock, Eye, Edit, Trash2, 
  MoreVertical, Upload, Download, Key, Layout, Layers, 
  PieChart, Activity
} from 'lucide-react';
import { KPIMeter, SimpleBarChart, QuickActionCard } from '../../common/DashboardWidgets';
import { supabase } from '../../../services/supabase';
import CreateSiteModal from './CreateSiteModal';
import { useAuth } from '../../../contexts/AuthContext';

// --- Types ---

type SiteStatus = 
  | 'active' 
  | 'inactive' 
  | 'pending_approval' 
  | 'under_review' 
  | 'suspended' 
  | 'archived';

type SiteType = 'Retail' | 'Corporate' | 'Residential' | 'Event' | 'Construction' | 'Industrial';

interface SiteHistory {
  date: string;
  action: string;
  user: string;
  role: string;
  note?: string;
  changes?: string;
}

interface SitePost {
  id: string;
  name: string;
  instructions: string;
  requiredLevel: number;
  status: 'active' | 'inactive';
}

interface AccessInfo {
  id: string;
  type: 'Code' | 'Key' | 'Procedure';
  label: string;
  value: string;
  lastUpdated: string;
}

interface SiteDocument {
  id: string;
  name: string;
  type: string;
  uploadedBy: string;
  date: string;
}

interface Site {
  id: string;
  name: string;
  clientName: string;
  address: string;
  type: SiteType;
  status: SiteStatus;
  teamCode: string;
  posts: SitePost[];
  activeMissions: number;
  accessInfo: AccessInfo[];
  documents: SiteDocument[];
  history: SiteHistory[];
  stats: {
    completionRate: number;
    incidentsLastMonth: number;
    clientRating: number;
  };
}

const SiteManagement = ({ currentUserRole = 'Owner' }: { currentUserRole?: string }) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'active' | 'posts' | 'config' | 'performance' | 'analytics'>('active');
  const [searchQuery, setSearchQuery] = useState('');
  const [sites, setSites] = useState<Site[]>([]);
  const [selectedSite, setSelectedSite] = useState<Site | null>(null);
  const [detailViewTab, setDetailViewTab] = useState<'overview' | 'posts' | 'config' | 'history'>('overview');
  const [revealedAccessId, setRevealedAccessId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Modal State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Permission Check
  const canCreateSite = ['Owner', 'Co-Owner', 'Management', 'Operations Director', 'Operations Manager', 'Operations', 'Client'].includes(currentUserRole);

  const fetchSites = async () => {
      setLoading(true);
      try {
          // Fetch Sites with correct client relation naming
          const { data: sitesData, error: sitesError } = await supabase
              .from('sites')
              .select(`
                  id, name, address, type, status, access_info, documents, history, created_at,
                  client:clients!sites_client_id_fkey(business_name),
                  team:teams(code)
              `);

          if (sitesError) throw sitesError;

          const { data: postsData } = await supabase.from('site_posts').select('*');

          const { data: missionsData } = await supabase
              .from('missions')
              .select('site_id')
              .eq('status', 'active');

          if (sitesData) {
              const formatted: Site[] = sitesData.map((s: any) => {
                  const sitePosts = postsData?.filter((p: any) => p.site_id === s.id).map((p: any) => ({
                      id: p.id,
                      name: p.name,
                      instructions: p.instructions || '',
                      requiredLevel: p.required_level,
                      status: p.status
                  })) || [];

                  const activeMissionsCount = missionsData?.filter((m: any) => m.site_id === s.id).length || 0;

                  return {
                      id: s.id,
                      name: s.name,
                      clientName: s.client?.business_name || 'Unknown Client',
                      address: s.address,
                      type: (s.type as SiteType) || 'Corporate',
                      status: (s.status as SiteStatus) || 'active',
                      teamCode: s.team?.code || 'N/A',
                      posts: sitePosts,
                      activeMissions: activeMissionsCount,
                      accessInfo: s.access_info || [],
                      documents: s.documents || [],
                      history: s.history || [],
                      stats: { completionRate: 98, incidentsLastMonth: 0, clientRating: 5.0 }
                  };
              });
              setSites(formatted);
          }
      } catch (err) {
          console.error('Error fetching sites:', err);
      } finally {
          setLoading(false);
      }
  };

  useEffect(() => {
    fetchSites();
  }, []);

  const getStatusColor = (status: SiteStatus) => {
    switch (status) {
      case 'active': return 'bg-green-500/20 text-green-400 border-green-500/50';
      case 'inactive': return 'bg-gray-500/20 text-gray-400 border-gray-500/50';
      case 'pending_approval': return 'bg-orange-500/20 text-orange-400 border-orange-500/50';
      case 'under_review': return 'bg-blue-500/20 text-blue-400 border-blue-500/50';
      case 'suspended': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50';
      case 'archived': return 'bg-gray-700/20 text-gray-500 border-gray-700/50';
      default: return 'bg-gray-800 text-white';
    }
  };

  const getStatusLabel = (status: string) => {
    return status.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  const filteredSites = sites.filter(site => 
    site.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    site.clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    site.address.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAction = async (action: string, note: string) => {
    if (!selectedSite) return;
    
    let newStatus: SiteStatus = selectedSite.status;
    if (action === 'Activate') newStatus = 'active';
    if (action === 'Suspend') newStatus = 'suspended';
    if (action === 'Approve') newStatus = 'active';

    const newHistoryEntry = {
        date: new Date().toLocaleString(),
        action: action,
        user: 'Current User',
        role: currentUserRole,
        note: note
    };

    const updatedHistory = [newHistoryEntry, ...selectedSite.history];

    const { error } = await supabase
        .from('sites')
        .update({
            status: newStatus,
            history: updatedHistory
        })
        .eq('id', selectedSite.id);

    if (error) {
        alert('Error updating site: ' + error.message);
        return;
    }
    
    const updatedSite = { ...selectedSite, status: newStatus, history: updatedHistory };
    setSites(prev => prev.map(s => s.id === selectedSite.id ? updatedSite : s));
    setSelectedSite(updatedSite);
  };

  const RenderAnalytics = () => (
    <div className="space-y-6 animate-fade-in-up">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <KPIMeter label="Active Sites" value={sites.filter(s => s.status === 'active').length.toString()} trend="up" trendValue="Live" color="green" icon={<MapPin />} />
            <KPIMeter label="Avg Client Rating" value="4.8" trend="up" trendValue="High" color="blue" icon={<Briefcase />} />
            <KPIMeter label="Incident Rate" value="0.2%" trend="down" trendValue="Low" color="orange" icon={<AlertTriangle />} />
            <KPIMeter label="Guard Coverage" value="99%" trend="up" trendValue="Full" color="purple" icon={<Shield />} />
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-brand-ebony p-6 rounded-xl border border-brand-800">
                <h3 className="text-white font-bold mb-4 flex items-center"><PieChart className="w-5 h-5 mr-2 text-brand-sage" /> Sites by Type</h3>
                <div className="p-8 text-center text-gray-500">Analytics data aggregating...</div>
            </div>
            <div className="bg-brand-ebony p-6 rounded-xl border border-brand-800">
                <h3 className="text-white font-bold mb-4 flex items-center"><Activity className="w-5 h-5 mr-2 text-brand-sage" /> Recent Site Activity</h3>
                <div className="p-8 text-center text-gray-500">Live feed connecting...</div>
            </div>
        </div>
    </div>
  );

  return (
    <div className="flex flex-col bg-brand-black text-gray-200 animate-fade-in-up w-full">
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-display font-bold text-white flex items-center">
            <Layout className="w-6 h-6 mr-3 text-brand-sage" />
            Site Management
          </h2>
          <p className="text-sm text-gray-500 mt-1 ml-9">Manage client locations, post orders, and access configurations.</p>
        </div>
        
        <div className="flex space-x-3 w-full xl:w-auto">
           <div className="relative flex-grow xl:flex-grow-0 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input 
                type="text" 
                placeholder="Search sites..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-brand-ebony border border-brand-800 rounded pl-10 pr-4 py-2 text-sm text-white focus:border-brand-sage outline-none" 
              />
           </div>
           {canCreateSite && (
               <button 
                 onClick={() => setIsCreateModalOpen(true)}
                 className="bg-brand-sage text-black px-4 py-2 rounded font-bold text-sm hover:bg-brand-sage/90 flex items-center whitespace-nowrap shadow-lg"
               >
                 <Plus className="w-4 h-4 mr-2" /> Create Site
               </button>
           )}
        </div>
      </div>

      <div className="flex overflow-x-auto border-b border-brand-800 mb-6 scrollbar-hide">
        {[
          { id: 'active', label: 'Active Sites', icon: <MapPin size={16} /> },
          { id: 'posts', label: 'Site Posts', icon: <Layers size={16} /> },
          { id: 'config', label: 'Site Configuration', icon: <Layout size={16} /> },
          { id: 'performance', label: 'Site Performance', icon: <Activity size={16} /> },
          { id: 'analytics', label: 'Analytics', icon: <BarChart2 size={16} /> },
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

      {activeTab === 'analytics' || activeTab === 'performance' ? (
        <RenderAnalytics />
      ) : (
        <div className="bg-brand-ebony rounded-xl border border-brand-800 overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-brand-900 border-b border-brand-800">
                <tr>
                  <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Site Name / Client</th>
                  <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Address & Team</th>
                  <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Type</th>
                  <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Activity</th>
                  <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-800">
                {loading ? (
                    <tr><td colSpan={6} className="p-8 text-center text-gray-500">Loading Sites...</td></tr>
                ) : filteredSites.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-16 text-center text-gray-500">
                      <div className="flex flex-col items-center">
                        <MapPin className="w-12 h-12 mb-4 opacity-20" />
                        <p>No sites found matching criteria.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredSites.map(site => (
                    <tr 
                      key={site.id} 
                      onClick={() => setSelectedSite(site)}
                      className="hover:bg-brand-800/40 transition-colors cursor-pointer group"
                    >
                      <td className="p-4">
                        <div className="font-bold text-white text-sm group-hover:text-brand-sage transition-colors">{site.name}</div>
                        <div className="text-xs text-gray-500 flex items-center"><Briefcase className="w-3 h-3 mr-1" /> {site.clientName}</div>
                      </td>
                      <td className="p-4">
                        <div className="text-sm text-gray-300 truncate max-w-[200px]">{site.address}</div>
                        <div className="text-xs text-gray-500 mt-1 flex items-center"><User className="w-3 h-3 mr-1" /> {site.teamCode}</div>
                      </td>
                      <td className="p-4">
                         <span className="text-xs bg-brand-900 border border-brand-800 px-2 py-1 rounded text-gray-300">{site.type}</span>
                      </td>
                      <td className="p-4 text-xs text-gray-400">
                        <div className="flex items-center"><Layers className="w-3 h-3 mr-1" /> {site.posts.length} Posts</div>
                        <div className="flex items-center mt-1"><Shield className="w-3 h-3 mr-1" /> {site.activeMissions} Active Missions</div>
                      </td>
                      <td className="p-4">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded text-[10px] font-bold uppercase tracking-wide border ${getStatusColor(site.status)}`}>
                          {getStatusLabel(site.status)}
                        </span>
                      </td>
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
      )}

      {selectedSite && (
        <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/80 backdrop-blur-sm transition-opacity duration-300">
          <div className="absolute inset-0" onClick={() => setSelectedSite(null)}></div>
          
          <div className="relative w-full max-w-4xl h-full bg-brand-ebony border-l border-brand-800 shadow-2xl flex flex-col transform transition-transform duration-300 translate-x-0">
            
            <div className="p-6 border-b border-brand-800 bg-brand-900/90 flex justify-between items-start">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-2xl font-display font-bold text-white">{selectedSite.name}</h3>
                  <span className={`inline-flex items-center px-3 py-1 rounded text-xs font-bold uppercase tracking-wide border ${getStatusColor(selectedSite.status)}`}>
                    {getStatusLabel(selectedSite.status)}
                  </span>
                </div>
                <div className="flex items-center text-sm text-gray-400 space-x-4">
                   <span className="flex items-center"><MapPin className="w-3 h-3 mr-1" /> {selectedSite.address}</span>
                   <span className="flex items-center"><Briefcase className="w-3 h-3 mr-1" /> {selectedSite.clientName}</span>
                </div>
              </div>
              <button onClick={() => setSelectedSite(null)} className="text-gray-500 hover:text-white transition-colors bg-brand-black p-2 rounded-full hover:bg-brand-800">
                <X size={20} />
              </button>
            </div>

            <div className="flex border-b border-brand-800 px-6 bg-brand-900/50">
               {['overview', 'posts', 'config', 'history'].map((tab) => (
                  <button 
                    key={tab}
                    onClick={() => setDetailViewTab(tab as any)}
                    className={`px-4 py-3 text-sm font-bold border-b-2 transition-colors capitalize ${detailViewTab === tab ? 'border-brand-sage text-brand-sage' : 'border-transparent text-gray-400 hover:text-white'}`}
                  >
                    {tab === 'config' ? 'Configuration' : tab}
                  </button>
               ))}
            </div>

            <div className="flex-1 overflow-y-auto p-6 bg-brand-black/20">
               
               {detailViewTab === 'overview' && (
                  <div className="space-y-6">
                     <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-brand-black/30 p-4 rounded-lg border border-brand-800">
                           <p className="text-xs text-gray-500 uppercase font-bold mb-1">Completion Rate</p>
                           <p className="text-2xl font-mono font-bold text-green-500">{selectedSite.stats.completionRate}%</p>
                        </div>
                        <div className="bg-brand-black/30 p-4 rounded-lg border border-brand-800">
                           <p className="text-xs text-gray-500 uppercase font-bold mb-1">Client Rating</p>
                           <p className="text-2xl font-mono font-bold text-blue-500">{selectedSite.stats.clientRating}/5</p>
                        </div>
                        <div className="bg-brand-black/30 p-4 rounded-lg border border-brand-800">
                           <p className="text-xs text-gray-500 uppercase font-bold mb-1">Incidents (Mo)</p>
                           <p className="text-2xl font-mono font-bold text-orange-500">{selectedSite.stats.incidentsLastMonth}</p>
                        </div>
                     </div>

                     <div className="bg-brand-800/20 p-4 rounded-lg border border-brand-800">
                        <h4 className="text-brand-sage font-bold text-sm uppercase tracking-wider mb-4 border-b border-brand-800 pb-2">Quick Actions</h4>
                        <div className="flex flex-wrap gap-3">
                           {selectedSite.status === 'pending_approval' && (
                              <button onClick={() => handleAction('Approve', 'Site approved for operations.')} className="flex-1 bg-green-600 hover:bg-green-500 text-white py-2 rounded font-bold text-sm">Approve Site</button>
                           )}
                           {selectedSite.status === 'active' && (
                              <button onClick={() => handleAction('Suspend', 'Site suspended manually.')} className="flex-1 bg-yellow-600/20 border border-yellow-600 text-yellow-500 hover:bg-yellow-600/30 py-2 rounded font-bold text-sm">Suspend Operations</button>
                           )}
                           <button className="flex-1 bg-brand-ebony border border-brand-700 hover:bg-brand-800 text-white py-2 rounded font-bold text-sm">Edit Details</button>
                           <button className="flex-1 bg-brand-ebony border border-brand-700 hover:bg-brand-800 text-white py-2 rounded font-bold text-sm">Contact Client</button>
                        </div>
                     </div>
                  </div>
               )}

               {detailViewTab === 'posts' && (
                  <div className="space-y-4">
                     <div className="flex justify-between items-center mb-4">
                        <h4 className="text-white font-bold">Active Posts ({selectedSite.posts.length})</h4>
                        <button className="text-xs bg-brand-sage text-black px-3 py-1 rounded font-bold hover:bg-brand-sage/90">Add Post</button>
                     </div>
                     
                     {selectedSite.posts.map(post => (
                        <div key={post.id} className="bg-brand-900/30 p-4 rounded-lg border border-brand-800 hover:border-brand-700 transition-colors">
                           <div className="flex justify-between items-start mb-2">
                              <h5 className="font-bold text-white text-sm">{post.name}</h5>
                              <span className={`text-[10px] px-2 py-0.5 rounded uppercase font-bold ${post.status === 'active' ? 'bg-green-900/50 text-green-400' : 'bg-gray-800 text-gray-500'}`}>{post.status}</span>
                           </div>
                           <p className="text-xs text-gray-400 mb-3">{post.instructions}</p>
                           <div className="flex justify-between items-center text-xs text-gray-500 border-t border-brand-800 pt-2">
                              <span>Required Level: {post.requiredLevel}</span>
                              <div className="flex space-x-2">
                                 <button className="text-brand-sage hover:text-white flex items-center"><Edit className="w-3 h-3 mr-1" /> Edit</button>
                                 <button className="text-red-400 hover:text-red-300 flex items-center"><Trash2 className="w-3 h-3 mr-1" /> Remove</button>
                              </div>
                           </div>
                        </div>
                     ))}
                  </div>
               )}

               {detailViewTab === 'config' && (
                  <div className="space-y-8">
                     
                     <div>
                        <h4 className="text-brand-sage font-bold text-sm uppercase tracking-wider mb-4 flex items-center border-b border-brand-800 pb-2">
                           <Key className="w-4 h-4 mr-2" /> Access Information
                        </h4>
                        <div className="space-y-3">
                           {selectedSite.accessInfo.length === 0 ? <p className="text-gray-500 text-sm italic">No access info configured.</p> : 
                              selectedSite.accessInfo.map(info => (
                                 <div key={info.id} className="flex justify-between items-center bg-brand-900/30 p-3 rounded border border-brand-800">
                                    <div className="flex items-center">
                                       <div className="p-2 bg-brand-black rounded border border-brand-800 mr-3">
                                          {info.type === 'Code' ? <Lock className="w-4 h-4 text-brand-silver" /> : <Key className="w-4 h-4 text-brand-silver" />}
                                       </div>
                                       <div>
                                          <p className="text-sm font-bold text-white">{info.label}</p>
                                          <p className="text-[10px] text-gray-500">Updated: {info.lastUpdated}</p>
                                       </div>
                                    </div>
                                    <div className="flex items-center">
                                       <div className="mr-4 font-mono text-brand-sage bg-brand-black px-3 py-1 rounded border border-brand-800 text-sm">
                                          {revealedAccessId === info.id ? info.value : '••••••'}
                                       </div>
                                       <button 
                                          onClick={() => setRevealedAccessId(revealedAccessId === info.id ? null : info.id)}
                                          className="text-gray-400 hover:text-white"
                                       >
                                          <Eye className="w-4 h-4" />
                                       </button>
                                    </div>
                                 </div>
                              ))
                           }
                           <button className="w-full py-2 border border-dashed border-brand-700 text-gray-500 text-xs font-bold rounded hover:border-brand-sage hover:text-brand-sage transition-all">
                              + Add Access Code/Key
                           </button>
                        </div>
                     </div>

                     <div>
                        <h4 className="text-brand-sage font-bold text-sm uppercase tracking-wider mb-4 flex items-center border-b border-brand-800 pb-2">
                           <FileText className="w-4 h-4 mr-2" /> Site Documents
                        </h4>
                        <div className="space-y-3">
                           {selectedSite.documents.length === 0 ? <p className="text-gray-500 text-sm italic">No documents uploaded.</p> : 
                              selectedSite.documents.map(doc => (
                                 <div key={doc.id} className="flex justify-between items-center bg-brand-900/30 p-3 rounded border border-brand-800">
                                    <div className="flex items-center">
                                       <FileText className="w-4 h-4 text-brand-silver mr-3" />
                                       <div>
                                          <p className="text-sm font-bold text-white">{doc.name}</p>
                                          <p className="text-[10px] text-gray-500">Uploaded by {doc.uploadedBy} • {doc.date}</p>
                                       </div>
                                    </div>
                                    <div className="flex space-x-2">
                                       <button className="p-2 hover:bg-brand-800 rounded text-gray-400 hover:text-white"><Download className="w-4 h-4" /></button>
                                       <button className="p-2 hover:bg-brand-800 rounded text-gray-400 hover:text-red-400"><Trash2 className="w-4 h-4" /></button>
                                    </div>
                                 </div>
                              ))
                           }
                           <div className="mt-2 flex justify-center px-6 pt-5 pb-6 border-2 border-brand-700 border-dashed rounded-md hover:border-brand-sage transition-colors group cursor-pointer bg-brand-800/20">
                              <div className="space-y-1 text-center">
                                 <Upload className="mx-auto h-8 w-8 text-gray-400 group-hover:text-brand-sage transition-colors" />
                                 <div className="flex text-sm text-gray-400">
                                    <label className="relative cursor-pointer rounded-md font-medium text-brand-sage hover:text-brand-sage/80 focus-within:outline-none">
                                       <span>Upload Document</span>
                                    </label>
                                 </div>
                              </div>
                           </div>
                        </div>
                     </div>

                  </div>
               )}

               {detailViewTab === 'history' && (
                  <div>
                     <h4 className="text-brand-sage font-bold text-sm uppercase tracking-wider mb-4 flex items-center border-b border-brand-800 pb-2">
                        <History className="w-4 h-4 mr-2" /> Audit Trail
                     </h4>
                     <div className="space-y-4 pl-4 border-l border-brand-800 ml-2">
                        {selectedSite.history.length === 0 ? (
                           <p className="text-sm text-gray-500 italic">No history available.</p>
                        ) : (
                           selectedSite.history.map((entry, idx) => (
                              <div key={idx} className="relative">
                                 <div className="absolute -left-[21px] top-1 w-3 h-3 rounded-full bg-brand-black border-2 border-brand-600"></div>
                                 <div className="bg-brand-900/40 p-3 rounded border border-brand-800/50">
                                    <div className="flex justify-between items-start mb-1">
                                       <span className="font-bold text-white text-sm">{entry.action}</span>
                                       <span className="text-[10px] text-gray-500 font-mono">{entry.date}</span>
                                    </div>
                                    <p className="text-xs text-brand-sage mb-1">{entry.user} <span className="text-gray-600">•</span> {entry.role}</p>
                                    {entry.note && <p className="text-xs text-gray-400 italic">"{entry.note}"</p>}
                                 </div>
                              </div>
                           ))
                        )}
                     </div>
                  </div>
               )}

            </div>
          </div>
        </div>
      )}

      {isCreateModalOpen && user && (
          <CreateSiteModal
              onClose={() => setIsCreateModalOpen(false)}
              onSuccess={() => {
                  fetchSites();
                  setIsCreateModalOpen(false);
              }}
              currentUserRole={currentUserRole}
              currentUserId={user.id}
          />
      )}

    </div>
  );
};

export default SiteManagement;
