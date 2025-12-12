
import React, { useState, useEffect } from 'react';
import { 
  Search, Filter, CheckCircle, XCircle, AlertTriangle, 
  Clock, Shield, ChevronRight, X, 
  RefreshCw, Gavel, History, MapPin, Briefcase, 
  Building, Award, BookOpen, Edit3, Ban, Plus, Trash2, Save,
  HelpCircle, Layout, User
} from 'lucide-react';
import { supabase } from '../../../services/supabase';

type TabType = 'guard-apps' | 'client-apps' | 'supervisor-apps' | 'ops-apps' | 'management-apps' | 'appeals';

interface HistoryEntry {
  date: string;
  action: string;
  by: string;
  role: string;
  note?: string;
  statusChange?: string;
}

interface Record {
  id: string;
  userId: string;
  type: TabType;
  name: string;
  email: string;
  dateSubmitted: string;
  status: string; 
  details: any;
  history: HistoryEntry[];
  tableName?: string; // Helper for updates
}

const ApplicationManagement = ({ currentUserRole = 'Owner' }: { currentUserRole?: string }) => {
  const [activeTab, setActiveTab] = useState<TabType>('guard-apps');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedRecord, setSelectedRecord] = useState<Record | null>(null);
  const [records, setRecords] = useState<Record[]>([]);
  const [actionNote, setActionNote] = useState('');
  const [loading, setLoading] = useState(true);

  // Fetch Data
  useEffect(() => {
    fetchRecords();
  }, [currentUserRole, activeTab]);

  const fetchRecords = async () => {
    setLoading(true);
    setRecords([]);
    try {
        const fetchedRecords: Record[] = [];

        // 1. Guard Applications
        if (activeTab === 'guard-apps') {
            const { data: guards, error } = await supabase
                .from('guard_applications')
                .select('*, user:profiles!guard_applications_user_id_fkey(full_name, email)')
                .order('submitted_at', { ascending: false });
            
            if (guards) {
                guards.forEach((g: any) => {
                    fetchedRecords.push({
                        id: g.id, userId: g.user_id, type: 'guard-apps', 
                        name: g.user?.full_name || 'Unknown', email: g.user?.email || '',
                        dateSubmitted: new Date(g.submitted_at).toLocaleDateString(), status: g.status,
                        details: g, history: [], tableName: 'guard_applications'
                    });
                });
            }
        }

        // 2. Client Applications
        if (activeTab === 'client-apps') {
            const { data: clients } = await supabase
                .from('client_applications')
                .select('*, user:profiles!client_applications_user_id_fkey(full_name, email)')
                .order('submitted_at', { ascending: false });

            if (clients) {
                clients.forEach((c: any) => {
                    fetchedRecords.push({
                        id: c.id, userId: c.user_id, type: 'client-apps', 
                        name: c.business_name || c.user?.full_name || 'Unknown', email: c.user?.email || '',
                        dateSubmitted: new Date(c.submitted_at).toLocaleDateString(), status: c.status,
                        details: c, history: [], tableName: 'client_applications'
                    });
                });
            }
        }

        // 3. Staff Applications (Supervisor, Ops, Management)
        if (['supervisor-apps', 'ops-apps', 'management-apps'].includes(activeTab)) {
            let positionFilter = '';
            if (activeTab === 'supervisor-apps') positionFilter = 'Supervisor';
            if (activeTab === 'ops-apps') positionFilter = 'Operations';
            if (activeTab === 'management-apps') positionFilter = 'Management';

            const { data: staff } = await supabase
                .from('staff_applications')
                .select('*, user:profiles!staff_applications_user_id_fkey(full_name, email)')
                .eq('position_type', positionFilter)
                .order('submitted_at', { ascending: false });

            if (staff) {
                staff.forEach((s: any) => {
                    fetchedRecords.push({
                        id: s.id, userId: s.user_id, type: activeTab, 
                        name: s.user?.full_name || 'Unknown', email: s.user?.email || '',
                        dateSubmitted: new Date(s.submitted_at).toLocaleDateString(), status: s.status,
                        details: s, history: [], tableName: 'staff_applications'
                    });
                });
            }
        }

        setRecords(fetchedRecords);

    } catch (err: any) {
        console.error('Error fetching records:', err);
    } finally {
        setLoading(false);
    }
  };

  // --- Status Logic ---
  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'incomplete': return 'bg-gray-500 text-white';
      case 'not_started': return 'bg-gray-500 text-white';
      case 'pending_review': return 'bg-blue-600 text-white';
      case 'approved': return 'bg-green-600 text-white';
      case 'active': return 'bg-green-600 text-white';
      case 'denied': return 'bg-red-600 text-white';
      case 'blocked': return 'bg-black border border-gray-600 text-white';
      default: return 'bg-gray-700 text-white';
    }
  };

  const handleStatusChange = async (newStatus: string, actionLabel: string) => {
    if (!selectedRecord || !selectedRecord.tableName) return;
    if (!actionNote.trim()) {
      alert("Please provide a note or reason for this action. This is required for the audit trail.");
      return;
    }

    try {
        // Construct payload based on table capabilities
        const updatePayload: any = { status: newStatus };
        
        // Only include review notes if the table supports it (Guard Applications)
        // Client/Staff applications schema currently do not have these columns
        if (selectedRecord.tableName === 'guard_applications') {
             updatePayload.reviewed_at = new Date();
             updatePayload.review_notes = actionNote;
        }

        const { error } = await supabase
            .from(selectedRecord.tableName)
            .update(updatePayload)
            .eq('id', selectedRecord.id);

        if (error) throw error;

        // Log the action and note centrally since some tables don't support review_notes column
        const { data: { user } } = await supabase.auth.getUser();
        await supabase.from('profile_logs').insert({
            profile_id: selectedRecord.userId,
            action: `APPLICATION_${newStatus.toUpperCase()}`,
            performed_by: user?.email || currentUserRole,
            role: currentUserRole,
            note: actionNote
        });

        // Update Profile Status if application approved
        if (['approved', 'denied', 'blocked'].includes(newStatus)) {
             let profileStatus = 'pending';
             if (newStatus === 'approved') profileStatus = 'active';
             if (newStatus === 'denied') profileStatus = 'suspended';
             if (newStatus === 'blocked') profileStatus = 'terminated';

             await supabase.from('profiles').update({ status: profileStatus }).eq('id', selectedRecord.userId);
             
             // Create Guard Record if approved
             if (newStatus === 'approved' && selectedRecord.type === 'guard-apps') {
                 const { data: exist } = await supabase.from('guards').select('id').eq('id', selectedRecord.userId).single();
                 if (!exist) {
                     await supabase.from('guards').insert({ id: selectedRecord.userId });
                 }
             }
             // Create Client Record
             if (newStatus === 'approved' && selectedRecord.type === 'client-apps') {
                 const { data: exist } = await supabase.from('clients').select('id').eq('id', selectedRecord.userId).single();
                 if (!exist) {
                     await supabase.from('clients').insert({ 
                         id: selectedRecord.userId,
                         business_name: selectedRecord.details.business_name || selectedRecord.name
                     });
                 }
             }
        }

        // Optimistic Update
        const updatedRecord = { ...selectedRecord, status: newStatus };
        setRecords(prev => prev.map(r => r.id === selectedRecord.id ? updatedRecord : r));
        setSelectedRecord(updatedRecord);
        setActionNote('');

    } catch (err: any) {
        alert("Error updating status: " + err.message);
    }
  };

  const filteredRecords = records.filter(r => {
    const matchesTab = r.type === activeTab;
    const matchesSearch = r.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          r.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          r.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || r.status === statusFilter;
    return matchesTab && matchesSearch && matchesStatus;
  });

  return (
    <div className="flex flex-col bg-brand-black text-gray-200 animate-fade-in-up w-full">
      {/* Header */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-display font-bold text-white flex items-center">
            <Shield className="w-6 h-6 mr-3 text-brand-sage" />
            Application Management
          </h2>
          <p className="text-sm text-gray-500 mt-1 ml-9">Review and process new account applications.</p>
        </div>
        
        <div className="flex flex-col sm:flex-row w-full xl:w-auto gap-3">
            <div className="relative flex-grow sm:flex-grow-0 min-w-[250px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input 
                type="text" 
                placeholder="Search Name, ID..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-brand-ebony border border-brand-800 rounded pl-10 pr-4 py-2 text-sm text-white focus:border-brand-sage outline-none transition-colors" 
                />
            </div>
            
            <div className="relative min-w-[180px]">
                <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <select 
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="w-full bg-brand-ebony border border-brand-800 rounded pl-10 pr-4 py-2 text-sm text-white focus:border-brand-sage outline-none appearance-none cursor-pointer"
                >
                    <option value="all">All Statuses</option>
                    <option value="pending_review">Pending Review</option>
                    <option value="approved">Approved</option>
                    <option value="denied">Denied</option>
                </select>
            </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex overflow-x-auto border-b border-brand-800 mb-6 scrollbar-hide">
        {[
          { id: 'guard-apps', label: 'Guard Apps', icon: <Shield size={16} /> },
          { id: 'client-apps', label: 'Client Apps', icon: <Building size={16} /> },
          { id: 'supervisor-apps', label: 'Supervisor Apps', icon: <User size={16} /> },
          { id: 'ops-apps', label: 'Operations Apps', icon: <Briefcase size={16} /> },
          { id: 'management-apps', label: 'Executive Apps', icon: <Award size={16} /> },
        ].map(tab => {
          return (
            <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as TabType)}
                className={`flex items-center px-6 py-4 border-b-2 font-medium text-sm whitespace-nowrap transition-colors ${
                activeTab === tab.id 
                    ? 'border-brand-sage text-brand-sage bg-brand-sage/5' 
                    : 'border-transparent text-gray-400 hover:text-white hover:bg-brand-ebony'
                }`}
            >
                <span className="mr-2">{tab.icon}</span>
                {tab.label}
            </button>
          );
        })}
      </div>

      <div className="bg-brand-ebony rounded-xl border border-brand-800 overflow-hidden flex flex-col shadow-xl">
        <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
            <thead className="bg-brand-900 border-b border-brand-800">
            <tr>
                <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Candidate</th>
                <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Details</th>
                <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Date</th>
                <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Review</th>
            </tr>
            </thead>
            <tbody className="divide-y divide-brand-800">
            {filteredRecords.length === 0 ? (
                <tr>
                    <td colSpan={5} className="p-8 text-center text-gray-500">
                        {loading ? 'Loading records...' : 'No records found.'}
                    </td>
                </tr>
            ) : filteredRecords.map((record) => (
                <tr 
                    key={record.id} 
                    onClick={() => setSelectedRecord(record)}
                    className="hover:bg-brand-800/40 transition-colors cursor-pointer group"
                >
                    <td className="p-4">
                        <div className="font-bold text-white text-sm group-hover:text-brand-sage transition-colors">{record.name}</div>
                        <div className="text-xs text-gray-500 font-mono mt-1">{record.email}</div>
                    </td>
                    <td className="p-4 text-sm text-gray-300">
                        <span>{record.type.replace('-apps', '')} Application</span>
                    </td>
                    <td className="p-4 text-sm text-gray-400">{record.dateSubmitted}</td>
                    <td className="p-4">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide ${getStatusStyle(record.status)}`}>
                            {record.status.replace('_', ' ')}
                        </span>
                    </td>
                    <td className="p-4 text-right">
                        <button className="p-2 hover:bg-brand-900 rounded-full text-gray-400 hover:text-white transition-colors">
                            <ChevronRight size={16} />
                        </button>
                    </td>
                </tr>
            ))}
            </tbody>
        </table>
        </div>
      </div>

      {selectedRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/80 backdrop-blur-sm transition-opacity duration-300">
          <div className="absolute inset-0" onClick={() => setSelectedRecord(null)}></div>
          <div className="relative w-full max-w-4xl h-full bg-brand-ebony border-l border-brand-800 shadow-2xl flex flex-col transform transition-transform duration-300 translate-x-0">
            
            <div className="p-6 border-b border-brand-800 bg-brand-900/90 flex justify-between items-start">
              <div>
                <h3 className="text-2xl font-display font-bold text-white mb-2">{selectedRecord.name}</h3>
                <span className={`inline-flex items-center px-3 py-1 rounded text-xs font-bold uppercase tracking-wide ${getStatusStyle(selectedRecord.status)}`}>
                    {selectedRecord.status}
                </span>
              </div>
              <button onClick={() => setSelectedRecord(null)} className="text-gray-500 hover:text-white transition-colors bg-brand-black p-2 rounded-full hover:bg-brand-800">
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 bg-brand-black/20">
               {/* Detail View */}
               <div className="bg-brand-ebony p-6 rounded-xl border border-brand-800 mb-8">
                   <h4 className="text-white font-bold mb-4 border-b border-brand-800 pb-2">
                       Record Data
                   </h4>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 text-sm text-gray-300">
                       {Object.entries(selectedRecord.details).map(([key, value]) => {
                           if (typeof value === 'object' || key === 'user') return null;
                           return (
                               <div key={key}>
                                   <span className="text-gray-500 uppercase text-xs font-bold block">{key.replace(/_/g, ' ')}</span>
                                   <span className="text-white">{value?.toString() || 'N/A'}</span>
                               </div>
                           );
                       })}
                   </div>
               </div>

               {/* Action Section */}
               <div className="bg-brand-800/20 p-6 rounded-xl border border-brand-800">
                   <h4 className="text-white font-bold mb-4">Review Action</h4>
                   <div className="mb-4">
                       <label className="block text-gray-400 text-sm mb-2">Review Notes (Required)</label>
                       <textarea className="w-full bg-brand-black border border-brand-800 rounded p-3 text-white focus:border-brand-sage outline-none" rows={3} placeholder="Enter reason for action..." value={actionNote} onChange={(e) => setActionNote(e.target.value)}></textarea>
                   </div>
                   <div className="flex flex-wrap gap-3">
                       <button onClick={() => handleStatusChange('approved', 'Approved')} className="bg-green-600 hover:bg-green-500 text-white px-6 py-3 rounded font-bold shadow-lg flex items-center"><CheckCircle className="w-4 h-4 mr-2" /> Approve</button>
                       <button onClick={() => handleStatusChange('denied', 'Denied')} className="bg-red-600 hover:bg-red-500 text-white px-6 py-3 rounded font-bold shadow-lg flex items-center"><XCircle className="w-4 h-4 mr-2" /> Deny</button>
                   </div>
               </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ApplicationManagement;
