import React, { useState, useEffect } from 'react';
import { 
  Shirt, Search, Filter, Plus, CheckCircle, AlertTriangle, 
  Clock, BarChart2, ChevronRight, X, History, User, 
  FileText, Package, Truck, QrCode, ClipboardList, 
  ArrowRight, Box, Tag, RefreshCw, Send, AlertCircle, 
  MapPin, Archive, Printer, Download, Save
} from 'lucide-react';
import { KPIMeter, SimpleBarChart } from '../../common/DashboardWidgets';
import { supabase } from '../../../services/supabase';
import { InputLabel, InputField } from '../../common/FormElements';

// --- Types ---

type DistributionStatus = 
  | 'pending' 
  | 'prepared' 
  | 'ready_to_send' 
  | 'sent' 
  | 'in_transit' 
  | 'delivered' 
  | 'received' 
  | 'confirmed' 
  | 'missing' 
  | 'resolved';

type RequestReason = 'New Hire' | 'Promotion' | 'Rank Change' | 'Replacement' | 'Seasonal';

interface UniformItem {
  id: string;
  name: string;
  size?: string;
  quantity: number;
  sku: string;
}

interface DistributionHistory {
  date: string;
  action: string;
  user: string;
  role: string;
  note?: string;
}

interface DistributionRecord {
  id: string;
  employeeName: string;
  employeeId: string;
  team: string;
  reason: RequestReason;
  items: UniformItem[];
  status: DistributionStatus;
  dateRequested: string;
  dateSent?: string;
  dateReceived?: string;
  qrCode?: string;
  trackingNumber?: string;
  history: DistributionHistory[];
  priority: 'High' | 'Normal' | 'Low';
}

interface InventoryItem {
  id: string;
  name: string;
  category: 'Uniform' | 'Patch' | 'Pin' | 'Gear';
  size?: string;
  stockLevel: number;
  reorderPoint: number;
  location: string;
  lastUpdated: string;
}

// --- Main Component ---

const UniformManagement = ({ currentUserRole = 'Owner' }: { currentUserRole?: string }) => {
  const [activeTab, setActiveTab] = useState<'pending' | 'sent' | 'received' | 'inventory' | 'history'>('pending');
  const [searchQuery, setSearchQuery] = useState('');
  const [distributions, setDistributions] = useState<DistributionRecord[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [selectedRecord, setSelectedRecord] = useState<DistributionRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  
  // Modals
  const [isPrepareModalOpen, setIsPrepareModalOpen] = useState(false);
  const [isMissingModalOpen, setIsMissingModalOpen] = useState(false);
  const [prepNote, setPrepNote] = useState('');
  const [generatedQR, setGeneratedQR] = useState<string | null>(null);
  const [missingReason, setMissingReason] = useState('Lost');

  // Fetch Data
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
      setLoading(true);
      try {
          // 1. Fetch Inventory
          const { data: invData } = await supabase.from('uniform_inventory').select('*');
          if (invData) {
              setInventory(invData.map((i: any) => ({
                  id: i.id,
                  name: i.name,
                  category: i.category,
                  size: i.size,
                  stockLevel: i.stock_level,
                  reorderPoint: i.reorder_point,
                  location: i.location,
                  lastUpdated: i.updated_at
              })));
          }

          // 2. Fetch Distributions
          const { data: distData } = await supabase
              .from('uniform_distributions')
              .select(`
                  *,
                  user:profiles!uniform_distributions_user_id_fkey(full_name, team_id, team:teams!fk_profiles_team(name))
              `)
              .order('created_at', { ascending: false });
          
          if (distData) {
              setDistributions(distData.map((d: any) => ({
                  id: d.id,
                  employeeName: d.user?.full_name || 'Unknown',
                  employeeId: d.user_id,
                  team: d.user?.team?.name || 'Unassigned', 
                  reason: d.reason as RequestReason,
                  items: d.items || [],
                  status: d.status as DistributionStatus,
                  dateRequested: new Date(d.date_requested).toLocaleDateString(),
                  dateSent: d.date_sent ? new Date(d.date_sent).toLocaleDateString() : undefined,
                  dateReceived: d.date_received ? new Date(d.date_received).toLocaleDateString() : undefined,
                  trackingNumber: d.tracking_number,
                  qrCode: d.qr_code,
                  history: d.history || [],
                  priority: d.priority || 'Normal'
              })));
          }

      } catch (error) {
          console.error(error);
      } finally {
          setLoading(false);
      }
  };

  // --- Helpers ---

  const getStatusColor = (status: DistributionStatus) => {
    switch (status) {
      case 'pending': return 'bg-orange-500/20 text-orange-400 border-orange-500/50';
      case 'prepared': return 'bg-blue-500/20 text-blue-400 border-blue-500/50';
      case 'sent': return 'bg-indigo-500/20 text-indigo-400 border-indigo-500/50';
      case 'in_transit': return 'bg-purple-500/20 text-purple-400 border-purple-500/50';
      case 'received': return 'bg-green-500/20 text-green-400 border-green-500/50';
      case 'missing': return 'bg-red-500/20 text-red-400 border-red-500/50';
      default: return 'bg-gray-800 text-white';
    }
  };

  const getStatusLabel = (status: string) => {
    return status.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  const filteredDistributions = distributions.filter(d => {
    const matchesSearch = d.employeeName.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          d.id.toLowerCase().includes(searchQuery.toLowerCase());
    
    let matchesTab = false;
    if (activeTab === 'pending') matchesTab = ['pending', 'prepared', 'ready_to_send'].includes(d.status);
    else if (activeTab === 'sent') matchesTab = ['sent', 'in_transit', 'delivered', 'missing'].includes(d.status);
    else if (activeTab === 'received') matchesTab = ['received', 'confirmed', 'resolved'].includes(d.status);
    else matchesTab = true; 

    return matchesSearch && matchesTab;
  });

  // --- Actions ---

  const handleBulkAction = async (action: string) => {
      if (selectedIds.length === 0) return;
      if (action === 'Prepare Package') {
          setIsPrepareModalOpen(true); // Open prep for first/all selected
          return;
      }
      
      const confirmMsg = `Are you sure you want to mark ${selectedIds.length} items as ${action}?`;
      if (confirm(confirmMsg)) {
          for (const id of selectedIds) {
              await performUpdate(id, action, 'Bulk action via Management Console');
          }
          setSelectedIds([]);
          fetchData();
      }
  };

  const performUpdate = async (id: string, action: string, note: string, extraData: any = {}) => {
      const record = distributions.find(d => d.id === id);
      if (!record) return;

      let newStatus: DistributionStatus = record.status;
      let updates: any = { ...extraData };

      if (action === 'Prepare Package') {
          newStatus = 'prepared';
          updates.qr_code = `PKG-${id}-${Date.now()}`; // Mock QR generation
      }
      if (action === 'Mark Sent') {
          newStatus = 'sent';
          updates.date_sent = new Date().toISOString();
      }
      if (action === 'Mark Received') {
          newStatus = 'received';
          updates.date_received = new Date().toISOString();
      }
      if (action === 'Mark Missing') {
          newStatus = 'missing';
      }

      const newHistoryEntry = {
          date: new Date().toLocaleString(),
          action: action,
          user: 'Current User',
          role: currentUserRole,
          note: note
      };

      const updatedHistory = [newHistoryEntry, ...record.history];

      const { error } = await supabase
          .from('uniform_distributions')
          .update({
              status: newStatus,
              history: updatedHistory,
              ...updates
          })
          .eq('id', id);

      if (error) console.error("Update failed", error);
  };

  const handlePreparePackage = async () => {
      // Process selected ID (from modal context or selection)
      const targetId = selectedRecord?.id || selectedIds[0];
      if (!targetId) return;

      await performUpdate(targetId, 'Prepare Package', prepNote);
      setIsPrepareModalOpen(false);
      setPrepNote('');
      setGeneratedQR(null);
      setSelectedRecord(null); // Close detail if open
      fetchData();
  };

  const handleMarkMissing = async () => {
      if (!selectedRecord) return;
      await performUpdate(selectedRecord.id, 'Mark Missing', `Reason: ${missingReason}`);
      setIsMissingModalOpen(false);
      setSelectedRecord(null);
      fetchData();
  };

  const toggleSelection = (id: string) => {
      setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const generateQRCodeMock = () => {
      setGeneratedQR(`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=SS-PKG-${selectedRecord?.id || 'DEMO'}`);
  };

  // --- Renderers ---

  const RenderDistributionTable = ({ data }: { data: DistributionRecord[] }) => (
    <div className="bg-brand-ebony rounded-xl border border-brand-800 overflow-hidden shadow-xl">
        {/* Bulk Action Bar */}
        {selectedIds.length > 0 && (
            <div className="bg-brand-sage/20 p-3 border-b border-brand-800 flex justify-between items-center animate-fade-in-down">
                <span className="text-brand-sage font-bold text-sm ml-2">{selectedIds.length} Selected</span>
                <div className="flex gap-2">
                    {activeTab === 'pending' && (
                        <button onClick={() => handleBulkAction('Prepare Package')} className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold px-3 py-1.5 rounded shadow-lg">
                            Prepare Selected
                        </button>
                    )}
                    {activeTab === 'pending' && (
                        <button onClick={() => handleBulkAction('Mark Sent')} className="bg-green-600 hover:bg-green-500 text-white text-xs font-bold px-3 py-1.5 rounded shadow-lg">
                            Mark as Sent
                        </button>
                    )}
                    <button onClick={() => setSelectedIds([])} className="text-gray-400 hover:text-white text-xs px-3">Cancel</button>
                </div>
            </div>
        )}

        <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
            <thead className="bg-brand-900 border-b border-brand-800">
            <tr>
                <th className="p-4 w-10">
                    <input 
                        type="checkbox" 
                        onChange={(e) => setSelectedIds(e.target.checked ? data.map(d => d.id) : [])}
                        checked={selectedIds.length === data.length && data.length > 0}
                        className="accent-brand-sage"
                    />
                </th>
                <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Recipient / Details</th>
                <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Contents</th>
                <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Tracking</th>
                <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Actions</th>
            </tr>
            </thead>
            <tbody className="divide-y divide-brand-800">
            {data.length === 0 ? (
                <tr>
                    <td colSpan={6} className="p-12 text-center text-gray-500">
                        <div className="flex flex-col items-center">
                            <Box className="w-12 h-12 mb-4 opacity-20" />
                            <p>No records found in this category.</p>
                        </div>
                    </td>
                </tr>
            ) : (
                data.map(record => (
                    <tr 
                    key={record.id} 
                    className={`hover:bg-brand-800/40 transition-colors cursor-pointer group ${selectedIds.includes(record.id) ? 'bg-brand-800/20' : ''}`}
                    onClick={() => setSelectedRecord(record)}
                    >
                    <td className="p-4" onClick={(e) => e.stopPropagation()}>
                        <input 
                            type="checkbox" 
                            checked={selectedIds.includes(record.id)}
                            onChange={() => toggleSelection(record.id)}
                            className="accent-brand-sage"
                        />
                    </td>
                    <td className="p-4">
                        <div className="font-bold text-white text-sm group-hover:text-brand-sage transition-colors">{record.employeeName}</div>
                        <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs text-gray-500 font-mono">{record.team}</span>
                            <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold uppercase border ${
                                record.priority === 'High' ? 'bg-red-900/30 text-red-400 border-red-500/30' : 
                                record.priority === 'Low' ? 'bg-gray-800 text-gray-400 border-gray-600' : 
                                'bg-blue-900/30 text-blue-400 border-blue-500/30'
                            }`}>
                                {record.priority}
                            </span>
                        </div>
                    </td>
                    <td className="p-4">
                        <div className="text-xs text-gray-300 bg-brand-black px-2 py-1 rounded w-fit border border-brand-700">
                            {record.items.length} Item{record.items.length !== 1 ? 's' : ''}
                        </div>
                    </td>
                    <td className="p-4 text-xs text-gray-400">
                        {record.status === 'sent' || record.status === 'in_transit' ? (
                            <div className="flex items-center text-blue-400"><Truck size={12} className="mr-1" /> In Transit</div>
                        ) : record.qrCode ? (
                            <div className="flex items-center text-green-400"><QrCode size={12} className="mr-1" /> Generated</div>
                        ) : (
                            <span className="text-gray-600">-</span>
                        )}
                    </td>
                    <td className="p-4">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded text-[10px] font-bold uppercase tracking-wide border ${getStatusColor(record.status)}`}>
                        {getStatusLabel(record.status)}
                        </span>
                    </td>
                    <td className="p-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex justify-end gap-2">
                            {record.status === 'pending' && (
                                <button onClick={() => { setSelectedRecord(record); setIsPrepareModalOpen(true); }} className="p-2 bg-blue-600/20 text-blue-400 rounded hover:bg-blue-600/40" title="Prepare"><Package size={16} /></button>
                            )}
                            {record.status === 'prepared' && (
                                <button onClick={() => performUpdate(record.id, 'Mark Sent', 'Sent via console')} className="p-2 bg-green-600/20 text-green-400 rounded hover:bg-green-600/40" title="Mark Sent"><Send size={16} /></button>
                            )}
                            <button onClick={() => setSelectedRecord(record)} className="p-2 hover:bg-brand-900 rounded text-gray-400 hover:text-white transition-colors">
                                <ChevronRight size={16} />
                            </button>
                        </div>
                    </td>
                    </tr>
                ))
            )}
            </tbody>
        </table>
        </div>
    </div>
  );

  const RenderInventory = () => (
      <div className="space-y-6">
          <div className="bg-brand-ebony rounded-xl border border-brand-800 overflow-hidden shadow-xl">
              <div className="p-4 bg-brand-900/50 border-b border-brand-800 flex justify-between items-center">
                  <h3 className="font-bold text-white">Uniform & Gear Inventory</h3>
                  <button className="text-xs bg-brand-sage text-black px-3 py-1 rounded font-bold hover:bg-brand-sage/90 flex items-center">
                      <Plus className="w-3 h-3 mr-1" /> Add Item
                  </button>
              </div>
              <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                      <thead className="bg-brand-900 border-b border-brand-800">
                          <tr>
                              <th className="p-4 text-xs font-bold text-gray-500 uppercase">Item Name</th>
                              <th className="p-4 text-xs font-bold text-gray-500 uppercase">Category</th>
                              <th className="p-4 text-xs font-bold text-gray-500 uppercase">Stock</th>
                              <th className="p-4 text-xs font-bold text-gray-500 uppercase text-right">Actions</th>
                          </tr>
                      </thead>
                      <tbody className="divide-y divide-brand-800">
                          {inventory.map(item => (
                              <tr key={item.id} className="hover:bg-brand-800/40 transition-colors">
                                  <td className="p-4">
                                      <div className="font-bold text-white text-sm">{item.name}</div>
                                  </td>
                                  <td className="p-4">
                                      <span className="text-xs bg-brand-black border border-brand-700 text-gray-300 px-2 py-1 rounded">{item.category}</span>
                                  </td>
                                  <td className="p-4">
                                      <div className="flex items-center">
                                          <span className={`font-bold ${item.stockLevel <= item.reorderPoint ? 'text-red-400' : 'text-white'}`}>{item.stockLevel}</span>
                                      </div>
                                  </td>
                                  <td className="p-4 text-right">
                                      <button className="text-xs text-brand-sage hover:text-white border border-brand-sage/30 hover:bg-brand-sage/20 px-2 py-1 rounded">Replenish</button>
                                  </td>
                              </tr>
                          ))}
                      </tbody>
                  </table>
              </div>
          </div>
      </div>
  );

  return (
    <div className="flex flex-col bg-brand-black text-gray-200 animate-fade-in-up w-full">
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-display font-bold text-white flex items-center">
            <Shirt className="w-6 h-6 mr-3 text-brand-sage" />
            Uniform Logistics
          </h2>
          <p className="text-sm text-gray-500 mt-1 ml-9">Distribution queue, package tracking, and inventory.</p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3 w-full xl:w-auto">
           <div className="relative flex-grow xl:flex-grow-0 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input 
                type="text" 
                placeholder="Search requests..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-brand-ebony border border-brand-800 rounded pl-10 pr-4 py-2 text-sm text-white focus:border-brand-sage outline-none" 
              />
           </div>
           <button className="bg-brand-sage text-black px-4 py-2 rounded font-bold text-sm hover:bg-brand-sage/90 flex items-center justify-center whitespace-nowrap shadow-lg w-full sm:w-auto">
             <Plus className="w-4 h-4 mr-2" /> New Request
           </button>
        </div>
      </div>

      <div className="flex overflow-x-auto border-b border-brand-800 mb-6 scrollbar-hide">
        {[
          { id: 'pending', label: 'Distribution Queue', icon: <Clock size={16} /> },
          { id: 'sent', label: 'Shipped / Active', icon: <Truck size={16} /> },
          { id: 'received', label: 'Completed', icon: <CheckCircle size={16} /> },
          { id: 'inventory', label: 'Inventory', icon: <Box size={16} /> },
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

      {loading ? <div className="p-12 text-center text-gray-500">Loading Logistics...</div> : (
        <>
          {activeTab === 'inventory' && <RenderInventory />}
          {activeTab !== 'inventory' && <RenderDistributionTable data={filteredDistributions} />}
        </>
      )}

      {/* RECORD DETAIL MODAL */}
      {selectedRecord && !isPrepareModalOpen && !isMissingModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/80 backdrop-blur-sm transition-opacity duration-300">
          <div className="absolute inset-0" onClick={() => setSelectedRecord(null)}></div>
          
          <div className="relative w-full max-w-4xl h-full bg-brand-ebony border-l border-brand-800 shadow-2xl flex flex-col transform transition-transform duration-300 translate-x-0">
            
            <div className="p-6 border-b border-brand-800 bg-brand-900/90 flex justify-between items-start">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-2xl font-display font-bold text-white">{selectedRecord.employeeName}</h3>
                  <span className={`inline-flex items-center px-3 py-1 rounded text-xs font-bold uppercase tracking-wide border ${getStatusColor(selectedRecord.status)}`}>
                    {getStatusLabel(selectedRecord.status)}
                  </span>
                </div>
                <div className="flex items-center text-sm text-gray-400 space-x-4">
                   <span className="flex items-center"><User className="w-3 h-3 mr-1" /> {selectedRecord.employeeId.substring(0,8)}</span>
                   <span className="flex items-center"><Tag className="w-3 h-3 mr-1" /> {selectedRecord.reason}</span>
                </div>
              </div>
              <button onClick={() => setSelectedRecord(null)} className="text-gray-500 hover:text-white transition-colors bg-brand-black p-2 rounded-full hover:bg-brand-800">
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 bg-brand-black/20 relative">
               
               <div className="space-y-6">
                   {/* Tracking Timeline */}
                   {(selectedRecord.status === 'sent' || selectedRecord.status === 'in_transit' || selectedRecord.status === 'received') && (
                       <div className="bg-brand-black/30 p-5 rounded-lg border border-brand-800">
                           <h4 className="text-brand-sage font-bold text-xs uppercase tracking-wider mb-4 border-b border-brand-800 pb-2">Package Status</h4>
                           <div className="flex items-center justify-between px-4 mt-6 relative">
                               {/* Line */}
                               <div className="absolute left-0 right-0 top-1/2 h-1 bg-brand-800 -z-10 mx-8"></div>
                               <div className="absolute left-0 right-0 top-1/2 h-1 bg-brand-sage -z-10 mx-8" style={{ width: selectedRecord.status === 'received' ? '100%' : '50%' }}></div>

                               <div className="flex flex-col items-center bg-brand-ebony p-2 rounded border border-brand-sage">
                                   <Package size={20} className="text-brand-sage" />
                                   <span className="text-[10px] mt-1 text-white">Prepared</span>
                               </div>
                               <div className={`flex flex-col items-center bg-brand-ebony p-2 rounded border ${['sent','in_transit','received'].includes(selectedRecord.status) ? 'border-brand-sage' : 'border-brand-800'}`}>
                                   <Truck size={20} className={['sent','in_transit','received'].includes(selectedRecord.status) ? 'text-brand-sage' : 'text-gray-500'} />
                                   <span className="text-[10px] mt-1 text-white">Shipped</span>
                               </div>
                               <div className={`flex flex-col items-center bg-brand-ebony p-2 rounded border ${selectedRecord.status === 'received' ? 'border-brand-sage' : 'border-brand-800'}`}>
                                   <CheckCircle size={20} className={selectedRecord.status === 'received' ? 'text-brand-sage' : 'text-gray-500'} />
                                   <span className="text-[10px] mt-1 text-white">Received</span>
                               </div>
                           </div>
                           <div className="mt-6 text-center">
                               <p className="text-xs text-gray-400">Tracking #: <span className="text-white font-mono">{selectedRecord.trackingNumber || 'PENDING'}</span></p>
                           </div>
                       </div>
                   )}

                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-brand-black/30 p-5 rounded-lg border border-brand-800">
                            <h4 className="text-brand-sage font-bold text-xs uppercase tracking-wider mb-4 border-b border-brand-800 pb-2 flex items-center">
                                <Package className="w-3 h-3 mr-2" /> Package Contents
                            </h4>
                            <div className="space-y-3">
                                {selectedRecord.items.length === 0 ? (
                                    <p className="text-sm text-gray-500 italic">No items listed.</p>
                                ) : (
                                    selectedRecord.items.map((item, idx) => (
                                        <div key={idx} className="flex justify-between items-center bg-brand-900/50 p-3 rounded border border-brand-800">
                                            <span className="text-white text-sm">{item.name} {item.size && `(${item.size})`}</span>
                                            <span className="text-brand-sage font-mono font-bold">x{item.quantity}</span>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>

                        <div className="bg-brand-black/30 p-5 rounded-lg border border-brand-800 flex flex-col items-center justify-center text-center">
                            {selectedRecord.qrCode ? (
                                <>
                                    <img src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${selectedRecord.qrCode}`} alt="QR Code" className="w-32 h-32 mb-4 border-4 border-white rounded-lg" />
                                    <p className="text-xs text-gray-400 font-mono">{selectedRecord.qrCode}</p>
                                    <button className="mt-4 text-xs text-brand-sage hover:underline flex items-center"><Download className="w-3 h-3 mr-1" /> Download Label</button>
                                </>
                            ) : (
                                <div className="text-gray-500">
                                    <QrCode className="w-16 h-16 mx-auto mb-2 opacity-30" />
                                    <p className="text-sm">QR Code not generated.</p>
                                </div>
                            )}
                        </div>
                   </div>

                   <div className="bg-brand-800/20 p-5 rounded-lg border border-brand-800">
                       <h4 className="text-brand-sage font-bold text-xs uppercase tracking-wider mb-4">Management Actions</h4>
                       <div className="flex flex-wrap gap-3">
                           {selectedRecord.status === 'pending' && (
                               <button onClick={() => setIsPrepareModalOpen(true)} className="flex-1 bg-blue-600 hover:bg-blue-500 text-white py-3 rounded font-bold text-sm shadow-lg">Prepare Package</button>
                           )}
                           {selectedRecord.status === 'prepared' && (
                               <button onClick={() => performUpdate(selectedRecord.id, 'Mark Sent', 'Sent via console')} className="flex-1 bg-green-600 hover:bg-green-500 text-white py-3 rounded font-bold text-sm shadow-lg">Mark Sent</button>
                           )}
                           {['sent', 'in_transit'].includes(selectedRecord.status) && (
                               <button onClick={() => performUpdate(selectedRecord.id, 'Mark Received', 'Manual confirmation')} className="flex-1 bg-green-600 hover:bg-green-500 text-white py-3 rounded font-bold text-sm shadow-lg">Confirm Receipt</button>
                           )}
                           
                           <button onClick={() => setIsMissingModalOpen(true)} className="flex-1 bg-red-900/30 border border-red-500 text-red-400 hover:bg-red-900/50 py-3 rounded font-bold text-sm">Mark Missing</button>
                       </div>
                   </div>
               </div>

            </div>
          </div>
        </div>
      )}

      {/* PREPARE PACKAGE MODAL */}
      {isPrepareModalOpen && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 p-4 backdrop-blur-sm animate-fade-in-up">
              <div className="bg-brand-ebony border border-brand-700 rounded-xl p-6 w-full max-w-lg shadow-2xl">
                  <h3 className="text-xl font-bold text-white mb-4 flex items-center"><Box className="w-5 h-5 mr-2 text-brand-sage" /> Prepare Package</h3>
                  
                  <div className="space-y-4 mb-6">
                      <div className="bg-brand-black/50 p-4 rounded border border-brand-800">
                          <p className="text-sm text-gray-400 mb-1">Recipient</p>
                          <p className="text-white font-bold">{selectedRecord?.employeeName || 'Bulk Selection'}</p>
                      </div>
                      
                      <div>
                          <InputLabel>Package Notes / Contents Check</InputLabel>
                          <textarea 
                              className="w-full bg-brand-black border border-brand-800 rounded p-3 text-white text-sm focus:border-brand-sage outline-none h-24"
                              placeholder="Notes about specific items, sizes confirmed, etc."
                              value={prepNote}
                              onChange={(e) => setPrepNote(e.target.value)}
                          />
                      </div>

                      <div className="flex items-center justify-between bg-brand-900/30 p-4 rounded border border-brand-800">
                          <div>
                              <p className="text-sm font-bold text-white">Generate Tracking QR</p>
                              <p className="text-xs text-gray-500">Unique ID for this shipment</p>
                          </div>
                          {generatedQR ? (
                              <div className="text-center">
                                  <CheckCircle className="w-6 h-6 text-green-500 mx-auto" />
                                  <span className="text-[10px] text-green-500">Ready</span>
                              </div>
                          ) : (
                              <button onClick={generateQRCodeMock} className="text-xs bg-brand-ebony border border-brand-700 text-white px-3 py-1.5 rounded hover:border-brand-sage">Generate</button>
                          )}
                      </div>
                  </div>

                  <div className="flex justify-end gap-3">
                      <button onClick={() => setIsPrepareModalOpen(false)} className="px-4 py-2 text-gray-400 hover:text-white">Cancel</button>
                      <button onClick={handlePreparePackage} className="bg-green-600 hover:bg-green-500 text-white px-6 py-2 rounded font-bold shadow-lg">Save Package</button>
                  </div>
              </div>
          </div>
      )}

      {/* MISSING MODAL */}
      {isMissingModalOpen && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 p-4 backdrop-blur-sm animate-fade-in-up">
              <div className="bg-brand-ebony border border-red-500/30 rounded-xl p-6 w-full max-w-md shadow-2xl">
                  <h3 className="text-xl font-bold text-red-500 mb-4 flex items-center"><AlertTriangle className="w-5 h-5 mr-2" /> Report Missing Package</h3>
                  <div className="space-y-4 mb-6">
                      <div>
                          <InputLabel>Reason</InputLabel>
                          <select className="w-full bg-brand-black border border-brand-800 rounded p-3 text-white" value={missingReason} onChange={e => setMissingReason(e.target.value)}>
                              <option>Lost in Transit</option>
                              <option>Damaged</option>
                              <option>Delivered to Wrong Address</option>
                              <option>Stolen</option>
                              <option>Other</option>
                          </select>
                      </div>
                      <p className="text-xs text-gray-400 bg-brand-900/30 p-3 rounded">
                          This will mark the distribution as 'Missing' and alert the inventory manager. You may need to create a replacement request.
                      </p>
                  </div>
                  <div className="flex justify-end gap-3">
                      <button onClick={() => setIsMissingModalOpen(false)} className="px-4 py-2 text-gray-400 hover:text-white">Cancel</button>
                      <button onClick={handleMarkMissing} className="bg-red-600 hover:bg-red-500 text-white px-6 py-2 rounded font-bold shadow-lg">Confirm Missing</button>
                  </div>
              </div>
          </div>
      )}

    </div>
  );
};

export default UniformManagement;