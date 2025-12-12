
import React, { useState, useEffect } from 'react';
import { 
  Box, Search, Filter, Plus, CheckCircle, AlertTriangle, 
  Clock, RotateCcw, ChevronRight, X, History, User, 
  Shield, Radio, Key, Smartphone, FileText, Wrench,
  MoreVertical, Edit, Trash2, Crosshair, MapPin
} from 'lucide-react';
import { KPIMeter } from '../../common/DashboardWidgets';
import { supabase } from '../../../services/supabase';

// --- Types ---

type ItemStatus = 'Available' | 'Assigned' | 'Maintenance' | 'Missing' | 'Retired';
type ItemCategory = 'Comms' | 'Weapon' | 'Key' | 'IT' | 'Other';

interface InventoryItem {
  id: string;
  name: string;
  serialNumber: string;
  category: ItemCategory;
  status: ItemStatus;
  assignedTo?: string; // Guard Name
  assignedToId?: string; // Guard ID
  location: string;
  lastChecked: string;
  condition: string;
  history: any[];
}

// --- Mock Data Generator (Using real guard ID from initial migration) ---
const MOCK_INVENTORY: InventoryItem[] = [
    { id: '1', name: 'Motorola APX 6000', serialNumber: 'SN-8842-110', category: 'Comms', status: 'Available', location: 'Armory A', lastChecked: '2023-10-25', condition: 'Good', history: [] },
    { id: '2', name: 'Motorola APX 6000', serialNumber: 'SN-8842-112', category: 'Comms', status: 'Assigned', assignedTo: 'Officer M. Aurelius', assignedToId: '7c83bda6-5040-4b4e-90bb-d650904f600a', location: 'Field', lastChecked: '2023-10-26', condition: 'Good', history: [] },
    { id: '3', name: 'Glock 17 Gen 5', serialNumber: 'WPN-9921-X', category: 'Weapon', status: 'Assigned', assignedTo: 'Officer M. Aurelius', assignedToId: '7c83bda6-5040-4b4e-90bb-d650904f600a', location: 'Holster', lastChecked: '2023-10-20', condition: 'Excellent', history: [] },
    { id: '4', name: 'Glock 17 Gen 5', serialNumber: 'WPN-9922-Y', category: 'Weapon', status: 'Maintenance', location: 'Repair Shop', lastChecked: '2023-10-22', condition: 'Service Req', history: [] },
    { id: '5', name: 'Master Key Set - Site A', serialNumber: 'KEY-001', category: 'Key', status: 'Available', location: 'Lockbox 1', lastChecked: '2023-10-27', condition: 'N/A', history: [] },
    { id: '6', name: 'Samsung Galaxy Tab Active3', serialNumber: 'IT-5521-00', category: 'IT', status: 'Available', location: 'Ops Desk', lastChecked: '2023-10-25', condition: 'Good', history: [] },
];

const InventoryManagement = () => {
  const [activeTab, setActiveTab] = useState<ItemCategory | 'All'>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [isCheckOutModalOpen, setIsCheckOutModalOpen] = useState(false);
  const [assigneeName, setAssigneeName] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
      // Simulate API fetch
      setTimeout(() => {
          setItems(MOCK_INVENTORY);
          setLoading(false);
      }, 800);
  }, []);

  const getStatusColor = (status: ItemStatus) => {
    switch (status) {
      case 'Available': return 'bg-green-500/20 text-green-400 border-green-500/50';
      case 'Assigned': return 'bg-blue-500/20 text-blue-400 border-blue-500/50';
      case 'Maintenance': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50';
      case 'Missing': return 'bg-red-500/20 text-red-400 border-red-500/50';
      case 'Retired': return 'bg-gray-500/20 text-gray-400 border-gray-500/50';
      default: return 'bg-gray-800 text-white';
    }
  };

  const filteredItems = items.filter(item => {
      const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            item.serialNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            item.assignedTo?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesTab = activeTab === 'All' || item.category === activeTab;
      return matchesSearch && matchesTab;
  });

  const handleCheckOut = () => {
      if (!selectedItem || !assigneeName) return;
      
      const updatedItem = {
          ...selectedItem,
          status: 'Assigned' as ItemStatus,
          assignedTo: assigneeName,
          location: 'Field',
          lastChecked: new Date().toLocaleDateString()
      };

      setItems(prev => prev.map(i => i.id === selectedItem.id ? updatedItem : i));
      setSelectedItem(null);
      setIsCheckOutModalOpen(false);
      setAssigneeName('');
  };

  const handleCheckIn = (item: InventoryItem) => {
      const updatedItem = {
          ...item,
          status: 'Available' as ItemStatus,
          assignedTo: undefined,
          assignedToId: undefined,
          location: 'Storage',
          lastChecked: new Date().toLocaleDateString()
      };
      setItems(prev => prev.map(i => i.id === item.id ? updatedItem : i));
      if (selectedItem?.id === item.id) setSelectedItem(null);
  };

  const handleMarkMaintenance = (item: InventoryItem) => {
      const updatedItem = {
          ...item,
          status: 'Maintenance' as ItemStatus,
          location: 'Repair',
          lastChecked: new Date().toLocaleDateString()
      };
      setItems(prev => prev.map(i => i.id === item.id ? updatedItem : i));
  };

  // --- Renderers ---

  const RenderOverview = () => {
      const total = items.length;
      const assigned = items.filter(i => i.status === 'Assigned').length;
      const maintenance = items.filter(i => i.status === 'Maintenance').length;
      const missing = items.filter(i => i.status === 'Missing').length;

      return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <KPIMeter label="Total Assets" value={total.toString()} trend="up" trendValue="Stock" color="blue" icon={<Box />} />
            <KPIMeter label="Deployed" value={assigned.toString()} trend="up" trendValue="Active" color="green" icon={<User />} />
            <KPIMeter label="In Repair" value={maintenance.toString()} trend="down" trendValue="Service" color="orange" icon={<Wrench />} />
            <KPIMeter label="Missing" value={missing.toString()} trend="down" trendValue="Alert" color="red" icon={<AlertTriangle />} />
        </div>
      );
  };

  return (
    <div className="flex flex-col h-full bg-brand-black text-gray-200 animate-fade-in-up">
      {/* Header */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-display font-bold text-white flex items-center">
            <Shield className="w-6 h-6 mr-3 text-brand-sage" />
            Inventory & Armory
          </h2>
          <p className="text-sm text-gray-500 mt-1 ml-9">Manage accountable property, weapons, and communications equipment.</p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3 w-full xl:w-auto">
           <div className="relative flex-grow xl:flex-grow-0 min-w-[250px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input 
                type="text" 
                placeholder="Search serial, item, or guard..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-brand-ebony border border-brand-800 rounded pl-10 pr-4 py-2 text-sm text-white focus:border-brand-sage outline-none" 
              />
           </div>
           <button className="bg-brand-sage text-black px-4 py-2 rounded font-bold text-sm hover:bg-brand-sage/90 flex items-center justify-center whitespace-nowrap shadow-lg w-full sm:w-auto">
             <Plus className="w-4 h-4 mr-2" /> Add Item
           </button>
        </div>
      </div>

      <RenderOverview />

      {/* Tabs */}
      <div className="flex overflow-x-auto border-b border-brand-800 mb-6 scrollbar-hide">
        {[
          { id: 'All', label: 'All Items', icon: <Box size={16} /> },
          { id: 'Comms', label: 'Radios & Comms', icon: <Radio size={16} /> },
          { id: 'Weapon', label: 'Weapons', icon: <Crosshair size={16} /> },
          { id: 'Key', label: 'Keys', icon: <Key size={16} /> },
          { id: 'IT', label: 'IT & Tech', icon: <Smartphone size={16} /> },
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

      {/* Table */}
      <div className="bg-brand-ebony rounded-xl border border-brand-800 overflow-hidden shadow-xl flex-1 flex flex-col">
        {loading ? (
            <div className="p-12 text-center text-gray-500">Loading Inventory...</div>
        ) : (
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-brand-900 border-b border-brand-800">
                    <tr>
                        <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Item Name</th>
                        <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Serial Number</th>
                        <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Category</th>
                        <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                        <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Assigned To</th>
                        <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Actions</th>
                    </tr>
                    </thead>
                    <tbody className="divide-y divide-brand-800">
                    {filteredItems.length === 0 ? (
                        <tr>
                            <td colSpan={6} className="p-12 text-center text-gray-500">
                                <div className="flex flex-col items-center">
                                    <Box className="w-12 h-12 mb-4 opacity-20" />
                                    <p>No items found.</p>
                                </div>
                            </td>
                        </tr>
                    ) : (
                        filteredItems.map(item => (
                            <tr 
                            key={item.id} 
                            onClick={() => setSelectedItem(item)}
                            className={`hover:bg-brand-800/40 transition-colors cursor-pointer group ${selectedItem?.id === item.id ? 'bg-brand-800/60' : ''}`}
                            >
                            <td className="p-4">
                                <div className="font-bold text-white text-sm group-hover:text-brand-sage transition-colors">{item.name}</div>
                                <div className="text-xs text-gray-500 flex items-center mt-1"><MapPin className="w-3 h-3 mr-1" /> {item.location}</div>
                            </td>
                            <td className="p-4 text-sm font-mono text-gray-300">{item.serialNumber}</td>
                            <td className="p-4 text-xs text-gray-400">{item.category}</td>
                            <td className="p-4">
                                <span className={`inline-flex items-center px-2.5 py-1 rounded text-[10px] font-bold uppercase tracking-wide border ${getStatusColor(item.status)}`}>
                                {item.status}
                                </span>
                            </td>
                            <td className="p-4">
                                {item.assignedTo ? (
                                    <div className="flex items-center text-white text-sm">
                                        <User className="w-3 h-3 mr-2 text-brand-sage" />
                                        {item.assignedTo}
                                    </div>
                                ) : (
                                    <span className="text-gray-500 text-xs italic">Unassigned</span>
                                )}
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
        )}
      </div>

      {/* Item Detail Modal */}
      {selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/80 backdrop-blur-sm transition-opacity duration-300">
          <div className="absolute inset-0" onClick={() => setSelectedItem(null)}></div>
          
          <div className="relative w-full max-w-md h-full bg-brand-ebony border-l border-brand-800 shadow-2xl flex flex-col transform transition-transform duration-300 translate-x-0">
            
            <div className="p-6 border-b border-brand-800 bg-brand-900/90 flex justify-between items-start">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-xl font-display font-bold text-white">{selectedItem.name}</h3>
                </div>
                <p className="text-brand-sage font-mono text-sm">{selectedItem.serialNumber}</p>
              </div>
              <button onClick={() => setSelectedItem(null)} className="text-gray-500 hover:text-white transition-colors bg-brand-black p-2 rounded-full hover:bg-brand-800">
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 bg-brand-black/20">
               
               <div className="space-y-6">
                   
                   {/* Status Card */}
                   <div className="bg-brand-black/30 p-5 rounded-lg border border-brand-800">
                       <h4 className="text-gray-500 font-bold text-xs uppercase mb-4">Current Status</h4>
                       <div className="flex justify-between items-center mb-4">
                           <span className={`inline-flex items-center px-3 py-1 rounded text-xs font-bold uppercase tracking-wide border ${getStatusColor(selectedItem.status)}`}>
                               {selectedItem.status}
                           </span>
                           <span className="text-gray-400 text-xs">Last Checked: {selectedItem.lastChecked}</span>
                       </div>
                       
                       {selectedItem.status === 'Assigned' ? (
                           <div className="bg-brand-800/30 p-3 rounded border border-brand-700 flex items-center">
                               <div className="w-8 h-8 rounded-full bg-brand-sage/20 flex items-center justify-center text-brand-sage mr-3">
                                   <User size={16} />
                               </div>
                               <div>
                                   <p className="text-xs text-gray-400 uppercase">Assigned To</p>
                                   <p className="text-white font-bold text-sm">{selectedItem.assignedTo}</p>
                               </div>
                           </div>
                       ) : (
                           <div className="bg-brand-800/30 p-3 rounded border border-brand-700 flex items-center">
                               <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center text-green-500 mr-3">
                                   <CheckCircle size={16} />
                               </div>
                               <div>
                                   <p className="text-xs text-gray-400 uppercase">Location</p>
                                   <p className="text-white font-bold text-sm">{selectedItem.location}</p>
                               </div>
                           </div>
                       )}
                   </div>

                   {/* Actions */}
                   <div className="bg-brand-800/20 p-5 rounded-lg border border-brand-800">
                       <h4 className="text-brand-sage font-bold text-xs uppercase tracking-wider mb-4">Actions</h4>
                       <div className="flex flex-col gap-3">
                           {selectedItem.status === 'Available' && (
                               <button onClick={() => setIsCheckOutModalOpen(true)} className="w-full bg-blue-600 hover:bg-blue-500 text-white py-3 rounded font-bold text-sm flex items-center justify-center">
                                   <User className="w-4 h-4 mr-2" /> Check Out / Assign
                               </button>
                           )}
                           
                           {selectedItem.status === 'Assigned' && (
                               <button onClick={() => handleCheckIn(selectedItem)} className="w-full bg-green-600 hover:bg-green-500 text-white py-3 rounded font-bold text-sm flex items-center justify-center">
                                   <RotateCcw className="w-4 h-4 mr-2" /> Check In / Return
                               </button>
                           )}

                           {selectedItem.status !== 'Maintenance' && (
                               <button onClick={() => handleMarkMaintenance(selectedItem)} className="w-full bg-yellow-600/20 border border-yellow-600 text-yellow-500 hover:bg-yellow-600/30 py-3 rounded font-bold text-sm flex items-center justify-center transition-all">
                                   <Wrench className="w-4 h-4 mr-2" /> Mark for Maintenance
                               </button>
                           )}

                           <button className="w-full bg-brand-black border border-brand-700 text-gray-300 hover:text-white py-3 rounded font-bold text-sm flex items-center justify-center hover:bg-brand-800 transition-all">
                               <FileText className="w-4 h-4 mr-2" /> View Audit Log
                           </button>
                       </div>
                   </div>

                   {/* Details */}
                   <div className="bg-brand-black/30 p-5 rounded-lg border border-brand-800">
                       <h4 className="text-gray-500 font-bold text-xs uppercase mb-4">Item Details</h4>
                       <div className="space-y-3 text-sm">
                           <div className="flex justify-between"><span className="text-gray-500">Category</span> <span className="text-white">{selectedItem.category}</span></div>
                           <div className="flex justify-between"><span className="text-gray-500">Condition</span> <span className="text-white">{selectedItem.condition}</span></div>
                           <div className="flex justify-between"><span className="text-gray-500">Inventory ID</span> <span className="text-white font-mono">{selectedItem.id}</span></div>
                       </div>
                   </div>

               </div>

            </div>
          </div>
        </div>
      )}

      {/* Check Out Modal */}
      {isCheckOutModalOpen && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 p-4 backdrop-blur-sm">
              <div className="bg-brand-ebony border border-brand-700 rounded-xl p-6 w-full max-w-md shadow-2xl animate-fade-in-up">
                  <h4 className="text-lg font-bold text-white mb-4">Assign Item</h4>
                  <div className="mb-4">
                      <p className="text-sm text-gray-400 mb-1">Item to Assign</p>
                      <div className="p-3 bg-brand-black border border-brand-800 rounded text-white font-bold">{selectedItem?.name} <span className="text-brand-sage font-mono ml-2">{selectedItem?.serialNumber}</span></div>
                  </div>
                  <div className="mb-6">
                      <label className="block text-sm text-gray-400 mb-1">Assign To (Guard Name)</label>
                      <input 
                          type="text" 
                          className="w-full bg-brand-black border border-brand-800 rounded p-3 text-white focus:border-brand-sage outline-none"
                          placeholder="Search guard..."
                          value={assigneeName}
                          onChange={(e) => setAssigneeName(e.target.value)}
                      />
                  </div>
                  <div className="flex justify-end space-x-3">
                      <button onClick={() => setIsCheckOutModalOpen(false)} className="px-4 py-2 rounded text-sm text-gray-400 hover:text-white">Cancel</button>
                      <button 
                          onClick={handleCheckOut}
                          disabled={!assigneeName}
                          className="px-4 py-2 rounded text-sm font-bold text-black bg-brand-sage hover:bg-brand-sage/90 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                          Confirm Assignment
                      </button>
                  </div>
              </div>
          </div>
      )}

    </div>
  );
};

export default InventoryManagement;
