import React, { useState, useEffect } from 'react';
import { 
  BadgeCheck, Search, Filter, CheckCircle, XCircle, AlertTriangle, 
  Clock, FileText, User, Users, Shield, Calendar, Edit, Trash2, 
  Plus, Eye, Download, Mail, RefreshCw, BarChart2, PieChart, 
  ChevronRight, MoreVertical, Ban, Check, X
} from 'lucide-react';
import { KPIMeter, QuickActionCard } from '../../common/DashboardWidgets';
import { supabase } from '../../../services/supabase';
import { InputLabel, InputField, FileUpload } from '../../common/FormElements';

interface CertificationManagementProps {
  currentUserRole: string;
}

type TabType = 'pending' | 'verified' | 'expired' | 'types' | 'reports';

const CertificationManagement: React.FC<CertificationManagementProps> = ({ currentUserRole }) => {
  const [activeTab, setActiveTab] = useState<TabType>('pending');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [certifications, setCertifications] = useState<any[]>([]);
  const [certTypes, setCertTypes] = useState<any[]>([]);
  const [selectedCert, setSelectedCert] = useState<any | null>(null);
  
  // Action Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalAction, setModalAction] = useState<'verify' | 'reject' | 'revoke' | 'edit_type' | 'add_type' | 'assign_user_cert' | 'edit_user_cert' | null>(null);
  const [actionNote, setActionNote] = useState('');
  
  // Data States
  const [editingType, setEditingType] = useState<any | null>(null);
  const [assignCertData, setAssignCertData] = useState({ userId: '', typeId: '', number: '', expiry: '', status: 'verified' });
  const [users, setUsers] = useState<any[]>([]); // For assignment dropdown
  const [userTeamId, setUserTeamId] = useState<string | null>(null);

  // Stats
  const [stats, setStats] = useState({
      pending: 0,
      verified: 0,
      expired: 0,
      compliance: 0
  });

  const isOwner = currentUserRole === 'Owner' || currentUserRole === 'Co-Owner';
  const isMgmt = currentUserRole === 'Management';
  const isOps = currentUserRole === 'Operations' || currentUserRole === 'Operations Manager';

  useEffect(() => {
      fetchUserContext();
      fetchData();
  }, [activeTab]);

  const fetchUserContext = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
          const { data: profile } = await supabase.from('profiles').select('team_id').eq('id', user.id).single();
          if (profile) setUserTeamId(profile.team_id);
      }
  };

  const fetchData = async () => {
      setLoading(true);
      try {
          // Fetch Certification Types
          const { data: types } = await supabase.from('certification_types').select('*').order('sort_order');
          setCertTypes(types || []);

          // Fetch Certifications with User Profile
          let query = supabase.from('user_certifications')
              .select(`
                  *,
                  profile:profiles(full_name, email, role, team_id, team:teams!fk_profiles_team(name)),
                  type:certification_types(name, category, is_required)
              `)
              .order('created_at', { ascending: false });

          const { data: certs, error } = await query;
          
          if (error) throw error;

          let filteredCerts = certs || [];

          // Operations Manager sees only their team
          if (isOps && userTeamId && !isOwner && !isMgmt) {
              filteredCerts = filteredCerts.filter((c: any) => c.profile?.team_id === userTeamId);
          }

          setCertifications(filteredCerts);

          // Calculate Stats
          const pending = filteredCerts.filter((c: any) => c.status === 'pending_verification').length;
          const verified = filteredCerts.filter((c: any) => c.status === 'verified' || c.status === 'valid').length;
          const expired = filteredCerts.filter((c: any) => c.status === 'expired' || (c.expiry_date && new Date(c.expiry_date) < new Date())).length;
          const total = filteredCerts.length || 1;
          
          setStats({
              pending,
              verified,
              expired,
              compliance: Math.round((verified / total) * 100)
          });

      } catch (err) {
          console.error("Error fetching certifications:", err);
      } finally {
          setLoading(false);
      }
  };

  const openAssignModal = async () => {
      // Fetch users for dropdown
      const { data } = await supabase.from('profiles').select('id, full_name, email').in('role', ['guard', 'supervisor', 'operations']);
      if (data) setUsers(data);
      setAssignCertData({ userId: '', typeId: '', number: '', expiry: '', status: 'verified' });
      setModalAction('assign_user_cert');
      setIsModalOpen(true);
  };

  const openEditUserCert = (cert: any) => {
      setSelectedCert(cert);
      setAssignCertData({
          userId: cert.user_id,
          typeId: cert.cert_type_id,
          number: cert.certification_number || '',
          expiry: cert.expiry_date ? cert.expiry_date.split('T')[0] : '',
          status: cert.status
      });
      setModalAction('edit_user_cert');
      setIsModalOpen(true);
  };

  const handleDeleteCert = async (id: string) => {
      if (!confirm("Are you sure you want to remove this certification? This cannot be undone.")) return;
      try {
          await supabase.from('user_certifications').delete().eq('id', id);
          fetchData();
      } catch (e: any) {
          alert("Error: " + e.message);
      }
  };

  const handleAction = async () => {
      try {
          if (modalAction === 'verify') {
              await supabase.from('user_certifications').update({
                  status: 'verified',
                  verified_at: new Date().toISOString(),
                  verified_by: currentUserRole
              }).eq('id', selectedCert.id);
          } else if (modalAction === 'reject') {
              await supabase.from('user_certifications').update({
                  status: 'rejected',
                  rejection_reason: actionNote
              }).eq('id', selectedCert.id);
          } else if (modalAction === 'revoke') {
              await supabase.from('user_certifications').update({
                  status: 'revoked',
                  rejection_reason: actionNote
              }).eq('id', selectedCert.id);
          } else if (modalAction === 'add_type' || modalAction === 'edit_type') {
              const payload = {
                  name: editingType.name,
                  category: editingType.category,
                  description: editingType.description,
                  is_required: editingType.is_required,
                  requires_number: editingType.requires_number,
                  requires_expiration: editingType.requires_expiration,
                  sort_order: editingType.sort_order || 99
              };
              
              if (modalAction === 'edit_type' && editingType.id) {
                  await supabase.from('certification_types').update(payload).eq('id', editingType.id);
              } else {
                  await supabase.from('certification_types').insert(payload);
              }
          } else if (modalAction === 'assign_user_cert') {
              await supabase.from('user_certifications').insert({
                  user_id: assignCertData.userId,
                  cert_type_id: assignCertData.typeId,
                  certification_number: assignCertData.number,
                  expiry_date: assignCertData.expiry || null,
                  status: assignCertData.status,
                  issue_date: new Date().toISOString(),
                  verified_at: new Date().toISOString(),
                  verified_by: currentUserRole
              });
          } else if (modalAction === 'edit_user_cert' && selectedCert) {
              await supabase.from('user_certifications').update({
                  certification_number: assignCertData.number,
                  expiry_date: assignCertData.expiry || null,
                  status: assignCertData.status,
                  updated_at: new Date().toISOString()
              }).eq('id', selectedCert.id);
          }

          setIsModalOpen(false);
          setSelectedCert(null);
          setEditingType(null);
          fetchData();

      } catch (e: any) {
          alert("Action failed: " + e.message);
      }
  };

  const getStatusColor = (status: string) => {
      switch (status) {
          case 'verified': case 'valid': return 'text-green-400 bg-green-900/20 border-green-500/30';
          case 'pending_verification': return 'text-orange-400 bg-orange-900/20 border-orange-500/30';
          case 'expired': return 'text-red-400 bg-red-900/20 border-red-500/30';
          case 'rejected': return 'text-red-400 bg-red-900/20 border-red-500/30';
          case 'revoked': return 'text-gray-400 bg-gray-800 border-gray-600';
          default: return 'text-gray-400 bg-gray-800';
      }
  };

  const filteredCerts = certifications.filter(c => {
      const matchesSearch = c.profile?.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            c.type?.name?.toLowerCase().includes(searchQuery.toLowerCase());
      
      if (activeTab === 'pending') return matchesSearch && c.status === 'pending_verification';
      if (activeTab === 'verified') return matchesSearch && (c.status === 'verified' || c.status === 'valid');
      if (activeTab === 'expired') return matchesSearch && c.status === 'expired';
      return matchesSearch;
  });

  return (
    <div className="flex flex-col min-h-screen bg-brand-black text-gray-200 animate-fade-in-up pb-20">
        {/* Header */}
        <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 mb-6">
            <div>
                <h2 className="text-2xl font-display font-bold text-white flex items-center">
                    <BadgeCheck className="w-6 h-6 mr-3 text-brand-sage" />
                    Certification Management
                </h2>
                <p className="text-sm text-gray-500 mt-1 ml-9">Manage guard licenses, permits, and training certificates.</p>
            </div>
            
            <div className="flex gap-3">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                    <input 
                        type="text" 
                        placeholder="Search certifications..." 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-brand-ebony border border-brand-800 rounded pl-10 pr-4 py-2 text-sm text-white focus:border-brand-sage outline-none" 
                    />
                </div>
                {(isOwner || isMgmt || isOps) && (
                    <button onClick={openAssignModal} className="bg-brand-sage text-black px-4 py-2 rounded font-bold text-sm hover:bg-brand-sage/90 flex items-center shadow-lg">
                        <Plus className="w-4 h-4 mr-2" /> Assign Cert
                    </button>
                )}
            </div>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <KPIMeter label="Pending Review" value={stats.pending.toString()} trend="up" trendValue="Action Req" color="orange" icon={<Clock />} />
            <KPIMeter label="Verified & Valid" value={stats.verified.toString()} trend="up" trendValue="Compliance" color="green" icon={<CheckCircle />} />
            <KPIMeter label="Expired" value={stats.expired.toString()} trend="down" trendValue="Alert" color="red" icon={<AlertTriangle />} />
            <KPIMeter label="Team Compliance" value={`${stats.compliance}%`} trend="up" trendValue="Overall" color="blue" icon={<PieChart />} />
        </div>

        {/* Tabs */}
        <div className="flex overflow-x-auto border-b border-brand-800 mb-6 scrollbar-hide">
            {[
                { id: 'pending', label: 'Pending Verification', icon: <Clock size={16} /> },
                { id: 'verified', label: 'Active Certs', icon: <CheckCircle size={16} /> },
                { id: 'expired', label: 'Expired / Revoked', icon: <XCircle size={16} /> },
                { id: 'types', label: 'Manage Types', icon: <FileText size={16} /> },
            ].map(tab => (
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
            ))}
        </div>

        {/* Content */}
        <div className="flex flex-col bg-brand-ebony rounded-xl border border-brand-800 shadow-xl min-h-[500px]">
            {loading ? (
                <div className="p-12 text-center text-gray-500">Loading Certifications...</div>
            ) : activeTab === 'types' ? (
                <div className="p-4">
                    <div className="flex justify-between mb-4">
                        <h3 className="text-white font-bold">Certification Types</h3>
                        <button 
                            onClick={() => {
                                setEditingType({ name: '', category: 'CORE_BSIS', is_required: false });
                                setModalAction('add_type');
                                setIsModalOpen(true);
                            }} 
                            className="bg-brand-sage text-black px-4 py-2 rounded font-bold text-sm"
                        >
                            Add Type
                        </button>
                    </div>
                    <div className="space-y-2">
                        {certTypes.map(t => (
                            <div key={t.id} className="flex justify-between items-center p-3 bg-brand-900/30 rounded border border-brand-800">
                                <div>
                                    <p className="text-white font-bold">{t.name}</p>
                                    <p className="text-xs text-gray-500">{t.category} • {t.is_required ? 'Required' : 'Optional'}</p>
                                </div>
                                <button 
                                    onClick={() => {
                                        setEditingType(t);
                                        setModalAction('edit_type');
                                        setIsModalOpen(true);
                                    }}
                                    className="p-2 text-gray-400 hover:text-white"
                                >
                                    <Edit size={16} />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-brand-900 border-b border-brand-800">
                            <tr>
                                <th className="p-4 text-xs font-bold text-gray-500 uppercase">Guard</th>
                                <th className="p-4 text-xs font-bold text-gray-500 uppercase">Certification</th>
                                <th className="p-4 text-xs font-bold text-gray-500 uppercase">Details</th>
                                <th className="p-4 text-xs font-bold text-gray-500 uppercase">Status</th>
                                <th className="p-4 text-xs font-bold text-gray-500 uppercase text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-brand-800">
                            {filteredCerts.length === 0 ? (
                                <tr><td colSpan={5} className="p-8 text-center text-gray-500">No records found.</td></tr>
                            ) : filteredCerts.map(cert => (
                                <tr key={cert.id} className="hover:bg-brand-800/40 group">
                                    <td className="p-4">
                                        <div className="font-bold text-white text-sm">{cert.profile?.full_name}</div>
                                        <div className="text-xs text-gray-500">{cert.profile?.email}</div>
                                    </td>
                                    <td className="p-4">
                                        <div className="text-sm text-gray-300">{cert.type?.name || cert.name}</div>
                                        <div className="text-xs text-gray-500">{cert.type?.category}</div>
                                    </td>
                                    <td className="p-4 text-xs text-gray-400">
                                        {cert.certification_number && <div>#: {cert.certification_number}</div>}
                                        {cert.expiry_date && <div>Expires: {new Date(cert.expiry_date).toLocaleDateString()}</div>}
                                    </td>
                                    <td className="p-4">
                                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${getStatusColor(cert.status)}`}>
                                            {cert.status.replace('_', ' ')}
                                        </span>
                                    </td>
                                    <td className="p-4 text-right">
                                        {activeTab === 'pending' ? (
                                            <div className="flex justify-end gap-2">
                                                <button onClick={() => { setSelectedCert(cert); setModalAction('verify'); setIsModalOpen(true); }} className="text-green-400 hover:text-green-300 p-1"><Check size={18} /></button>
                                                <button onClick={() => { setSelectedCert(cert); setModalAction('reject'); setIsModalOpen(true); }} className="text-red-400 hover:text-red-300 p-1"><X size={18} /></button>
                                            </div>
                                        ) : (
                                            <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button onClick={() => openEditUserCert(cert)} className="text-gray-400 hover:text-white p-1"><Edit size={16} /></button>
                                                <button onClick={() => handleDeleteCert(cert.id)} className="text-gray-400 hover:text-red-400 p-1"><Trash2 size={16} /></button>
                                            </div>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>

        {/* Modal */}
        {isModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4">
                <div className="bg-brand-ebony border border-brand-700 rounded-xl p-6 w-full max-w-md shadow-2xl animate-fade-in-up">
                    <h3 className="text-xl font-bold text-white mb-4">
                        {modalAction === 'verify' ? 'Verify Certification' : 
                         modalAction === 'reject' ? 'Reject Submission' :
                         modalAction === 'assign_user_cert' ? 'Assign Certification' :
                         modalAction === 'edit_user_cert' ? 'Edit Certification' :
                         modalAction?.includes('type') ? 'Edit Type' : 'Confirm Action'}
                    </h3>
                    
                    {(modalAction === 'assign_user_cert' || modalAction === 'edit_user_cert') && (
                        <div className="space-y-4">
                            {modalAction === 'assign_user_cert' && (
                                <div>
                                    <InputLabel>Select User</InputLabel>
                                    <select className="w-full bg-brand-black border border-brand-800 rounded p-3 text-white focus:border-brand-sage outline-none" value={assignCertData.userId} onChange={e => setAssignCertData({...assignCertData, userId: e.target.value})}>
                                        <option value="">-- Choose Guard --</option>
                                        {users.map(u => <option key={u.id} value={u.id}>{u.full_name} ({u.role})</option>)}
                                    </select>
                                </div>
                            )}
                            <div>
                                <InputLabel>Certification Type</InputLabel>
                                <select className="w-full bg-brand-black border border-brand-800 rounded p-3 text-white focus:border-brand-sage outline-none" value={assignCertData.typeId} onChange={e => setAssignCertData({...assignCertData, typeId: e.target.value})} disabled={modalAction === 'edit_user_cert'}>
                                    <option value="">-- Choose Type --</option>
                                    {certTypes.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                                </select>
                            </div>
                            <div>
                                <InputLabel>Cert Number</InputLabel>
                                <InputField value={assignCertData.number} onChange={e => setAssignCertData({...assignCertData, number: e.target.value})} placeholder="Optional" />
                            </div>
                            <div>
                                <InputLabel>Expiry Date</InputLabel>
                                <InputField type="date" value={assignCertData.expiry} onChange={e => setAssignCertData({...assignCertData, expiry: e.target.value})} />
                            </div>
                            <div>
                                <InputLabel>Status</InputLabel>
                                <select className="w-full bg-brand-black border border-brand-800 rounded p-3 text-white focus:border-brand-sage outline-none" value={assignCertData.status} onChange={e => setAssignCertData({...assignCertData, status: e.target.value})}>
                                    <option value="verified">Verified</option>
                                    <option value="pending_verification">Pending</option>
                                    <option value="expired">Expired</option>
                                    <option value="revoked">Revoked</option>
                                </select>
                            </div>
                        </div>
                    )}

                    {modalAction?.includes('type') && editingType && (
                        <div className="space-y-4">
                            <div><InputLabel>Name</InputLabel><InputField value={editingType.name} onChange={e => setEditingType({...editingType, name: e.target.value})} /></div>
                            <div>
                                <InputLabel>Category</InputLabel>
                                <select className="w-full bg-brand-black border border-brand-800 rounded p-3 text-white" value={editingType.category} onChange={e => setEditingType({...editingType, category: e.target.value})}>
                                    <option value="CORE_BSIS">Core / BSIS</option>
                                    <option value="DEFENSIVE_TACTICAL">Defensive / Tactical</option>
                                    <option value="SAFETY_RESCUE">Safety / Rescue</option>
                                    <option value="SECURITY_SPECIALTY">Specialty</option>
                                    <option value="PROPERTY_EVENT">Property / Event</option>
                                    <option value="EMERGENCY_MEDICAL">Medical</option>
                                    <option value="SURVEILLANCE_OPERATIONS">Surveillance</option>
                                </select>
                            </div>
                            <label className="flex items-center space-x-2 text-white"><input type="checkbox" checked={editingType.is_required} onChange={e => setEditingType({...editingType, is_required: e.target.checked})} className="accent-brand-sage" /> <span>Required</span></label>
                        </div>
                    )}

                    {(modalAction === 'verify' || modalAction === 'reject' || modalAction === 'revoke') && (
                        <div className="space-y-4">
                            <p className="text-gray-400 text-sm">
                                {modalAction === 'verify' ? "Are you sure you want to mark this certification as valid? This action will be logged." : "Please provide a reason."}
                            </p>
                            {modalAction !== 'verify' && (
                                <textarea className="w-full bg-brand-black border border-brand-800 rounded p-3 text-white" placeholder="Reason..." value={actionNote} onChange={e => setActionNote(e.target.value)} />
                            )}
                        </div>
                    )}

                    <div className="flex justify-end gap-3 mt-6">
                        <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-gray-400 hover:text-white">Cancel</button>
                        <button onClick={handleAction} className="px-6 py-2 bg-brand-sage text-black font-bold rounded hover:bg-brand-sage/90">Confirm</button>
                    </div>
                </div>
            </div>
        )}
    </div>
  );
};

export default CertificationManagement;