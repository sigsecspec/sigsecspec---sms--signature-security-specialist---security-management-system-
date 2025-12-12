
import React, { useState, useEffect } from 'react';
import { 
  User, Shield, MapPin, Calendar, Clock, Activity, FileText, 
  History, Mail, Edit, Phone, X, CheckCircle, AlertTriangle, 
  Award, DollarSign, MessageSquare, Gavel, Briefcase, Lock, 
  Unlock, Star, TrendingUp, AlertCircle, ChevronRight, Save,
  Radio, Archive, Upload, Trash2, Key, Send, UserPlus, Sliders, 
  BookOpen, Ban, UserX, RefreshCw, Eye, Plus, Crown, ArrowUpCircle
} from 'lucide-react';
import { Guard, GuardStatus } from '../../../types';
import { supabase } from '../../../services/supabase';

interface GuardDetailProps {
  guard: Guard;
  onClose: () => void;
  currentUserRole: string;
  onUpdate?: (updatedGuard: Guard) => void;
}

const GuardDetail: React.FC<GuardDetailProps> = ({ guard, onClose, currentUserRole, onUpdate }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'assignments' | 'performance' | 'issues' | 'development' | 'audit'>('overview');
  const [isActionModalOpen, setIsActionModalOpen] = useState(false);
  const [actionType, setActionType] = useState('');
  const [actionReason, setActionReason] = useState('');
  const [selectedRank, setSelectedRank] = useState('');
  const [localGuard, setLocalGuard] = useState<Guard>(guard);

  // Helper to format address from flat properties
  const formatAddress = (g: Guard) => {
      const parts = [
          g.address_street, 
          g.address_city,
          g.address_state,
          g.address_zip
      ].filter(Boolean);
      
      return parts.length > 0 ? parts.join(', ') : 'N/A';
  };

  const getStatusColor = (status: string, isBlocked?: boolean) => {
    if (isBlocked) return 'bg-red-900/50 text-red-400 border-red-500';
    switch (status) {
      case 'active': return 'bg-green-500/20 text-green-400 border-green-500/50';
      case 'pending': return 'bg-orange-500/20 text-orange-400 border-orange-500/50';
      case 'inactive': return 'bg-gray-500/20 text-gray-400 border-gray-500/50';
      case 'suspended': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50';
      case 'terminated': return 'bg-red-500/20 text-red-400 border-red-500/50';
      case 'on_leave': return 'bg-blue-500/20 text-blue-400 border-blue-500/50';
      default: return 'bg-gray-800 text-white';
    }
  };

  const getStatusLabel = (status: string, isBlocked?: boolean) => {
    if (isBlocked) return 'BLOCKED';
    return status.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  const handleAction = async () => {
    if (!localGuard || !actionType) return;
    
    let newStatus: string = localGuard.status;
    let newBlockedStatus = localGuard.is_blocked;
    let note = actionReason;
    let newRank = localGuard.rank;

    if (actionType === 'activate') newStatus = 'active';
    if (actionType === 'suspend') newStatus = 'suspended';
    if (actionType === 'terminate') newStatus = 'terminated';
    if (actionType === 'reactivate') newStatus = 'active';
    if (actionType === 'set_leave') newStatus = 'on_leave';
    if (actionType === 'return_leave') newStatus = 'active';
    if (actionType === 'block') newBlockedStatus = true;
    if (actionType === 'unblock') newBlockedStatus = false;

    if (actionType === 'promote' && selectedRank) {
        newRank = selectedRank;
        note = `Promoted from ${localGuard.rank} to ${newRank}. Reason: ${actionReason}`;
    }

    try {
        const { error: profileError } = await supabase.from('profiles').update({
            status: newStatus,
            is_blocked: newBlockedStatus
        }).eq('id', localGuard.id);
        if (profileError) throw profileError;

        if (newRank !== localGuard.rank) {
            const { error: guardError } = await supabase.from('guards').update({ rank: newRank }).eq('id', localGuard.id);
            if (guardError) throw guardError;
        }

        // Insert log
        await supabase.from('profile_logs').insert({
            profile_id: localGuard.id,
            action: actionType.toUpperCase().replace('_', ' '),
            performed_by: currentUserRole,
            role: currentUserRole,
            note: note
        });

        const updatedGuard = { 
            ...localGuard, 
            status: newStatus as any, 
            rank: newRank,
            is_blocked: newBlockedStatus
        };
        
        setLocalGuard(updatedGuard);
        if (onUpdate) onUpdate(updatedGuard);

    } catch (e: any) {
        console.error("Update failed", e);
        alert("Action failed: " + e.message);
    }
    
    setIsActionModalOpen(false);
    setActionType('');
    setActionReason('');
    setSelectedRank('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/80 backdrop-blur-sm transition-opacity duration-300">
      <div className="absolute inset-0" onClick={onClose}></div>
      <div className="relative w-full max-w-4xl h-full bg-brand-ebony border-l border-brand-800 shadow-2xl flex flex-col transform transition-transform duration-300 translate-x-0 animate-fade-in-right">
        {/* Header */}
        <div className="p-6 border-b border-brand-800 bg-brand-900/90 flex flex-col md:flex-row justify-between items-start gap-4">
            <div>
                <h3 className="text-3xl font-display font-bold text-white tracking-wide flex items-center">
                    {localGuard.full_name}
                    {localGuard.is_blocked && <Ban className="w-6 h-6 text-red-500 ml-3" />}
                </h3>
                <div className="flex items-center gap-3 mt-1 text-sm">
                    <span className="bg-brand-black px-2 py-0.5 rounded border border-brand-700 text-brand-sage font-bold font-mono">{localGuard.rank}</span>
                    <span className="text-gray-400 font-mono">Badge: {localGuard.badgeNumber}</span>
                    <span className={`uppercase font-bold text-xs px-2 py-0.5 rounded border ${getStatusColor(localGuard.status, localGuard.is_blocked)}`}>
                        {getStatusLabel(localGuard.status, localGuard.is_blocked)}
                    </span>
                </div>
            </div>
            <button onClick={onClose} className="text-gray-500 hover:text-white bg-brand-black p-2 rounded-full border border-brand-800"><X size={20} /></button>
        </div>

        {/* Tabs */}
        <div className="flex overflow-x-auto border-b border-brand-800 px-6 bg-brand-900/50 scrollbar-hide">
            {[
                { id: 'overview', label: 'Overview', icon: <User size={14} /> },
                { id: 'assignments', label: 'Assignments', icon: <Briefcase size={14} /> },
                { id: 'performance', label: 'Performance', icon: <TrendingUp size={14} /> },
                { id: 'issues', label: 'Issues', icon: <AlertTriangle size={14} /> },
                { id: 'development', label: 'Development', icon: <Award size={14} /> },
                { id: 'audit', label: 'Audit Log', icon: <History size={14} /> },
            ].map(tab => (
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
            ))}
        </div>
        
        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 bg-brand-black/20">
            {activeTab === 'overview' && (
                <div className="space-y-6 animate-fade-in-up">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-brand-black/30 p-5 rounded-lg border border-brand-800">
                            <h4 className="text-brand-sage font-bold text-xs uppercase tracking-wider mb-4 border-b border-brand-800 pb-2">Profile Status</h4>
                            <div className="space-y-3 text-sm">
                                <div className="flex justify-between"><span className="text-gray-500">Current Rank</span> <span className="text-white font-bold">{localGuard.rank}</span></div>
                                <div className="flex justify-between"><span className="text-gray-500">Guard Level</span> <span className="text-white">{localGuard.level}</span></div>
                                <div className="flex justify-between"><span className="text-gray-500">Team</span> <span className="text-white">{localGuard.team}</span></div>
                                <div className="flex justify-between"><span className="text-gray-500">Joined</span> <span className="text-white">{localGuard.created_at}</span></div>
                            </div>
                        </div>

                        <div className="bg-brand-black/30 p-5 rounded-lg border border-brand-800">
                            <h4 className="text-brand-sage font-bold text-xs uppercase tracking-wider mb-4 border-b border-brand-800 pb-2">Contact Info</h4>
                            <div className="space-y-3 text-sm">
                                <div className="flex justify-between"><span className="text-gray-500">Phone</span> <span className="text-white">{localGuard.phone_primary}</span></div>
                                <div className="flex justify-between"><span className="text-gray-500">Email</span> <span className="text-white">{localGuard.email}</span></div>
                                <div className="flex justify-between"><span className="text-gray-500">Address</span> <span className="text-white text-right max-w-[200px]">{formatAddress(localGuard)}</span></div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-brand-800/20 p-5 rounded-lg border border-brand-800">
                        <h4 className="text-white font-bold text-sm uppercase mb-4">Account Actions</h4>
                        <div className="flex flex-wrap gap-3">
                            <button onClick={() => { setActionType('promote'); setIsActionModalOpen(true); }} className="bg-brand-ebony border border-brand-700 text-white px-4 py-2 rounded text-sm hover:border-brand-sage">Change Rank</button>
                            {localGuard.status === 'active' && (
                                <>
                                    <button onClick={() => { setActionType('suspend'); setIsActionModalOpen(true); }} className="bg-yellow-900/20 text-yellow-500 border border-yellow-600 px-4 py-2 rounded text-sm hover:bg-yellow-900/40">Suspend</button>
                                    <button onClick={() => { setActionType('set_leave'); setIsActionModalOpen(true); }} className="bg-blue-900/20 text-blue-400 border border-blue-600 px-4 py-2 rounded text-sm hover:bg-blue-900/40">Set On Leave</button>
                                </>
                            )}
                            {(localGuard.status === 'suspended' || localGuard.status === 'on_leave') && (
                                <button onClick={() => { setActionType('reactivate'); setIsActionModalOpen(true); }} className="bg-green-900/20 text-green-400 border border-green-600 px-4 py-2 rounded text-sm hover:bg-green-900/40">Reactivate</button>
                            )}
                            {!localGuard.is_blocked ? (
                                <button onClick={() => { setActionType('block'); setIsActionModalOpen(true); }} className="bg-red-900/20 text-red-500 border border-red-600 px-4 py-2 rounded text-sm hover:bg-red-900/40 ml-auto">Block Account</button>
                            ) : (
                                <button onClick={() => { setActionType('unblock'); setIsActionModalOpen(true); }} className="bg-gray-800 text-white border border-gray-600 px-4 py-2 rounded text-sm hover:bg-gray-700 ml-auto">Unblock</button>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Placeholder for other tabs */}
            {activeTab !== 'overview' && (
                <div className="text-center p-12 text-gray-500 border border-brand-800 rounded-xl bg-brand-black/30">
                    <p className="mb-2">Detailed view for <span className="font-bold text-brand-sage capitalize">{activeTab}</span> is currently being integrated.</p>
                    <p className="text-xs">Data exists in system but is not yet fully visualized in this modal.</p>
                </div>
            )}
        </div>
      </div>
      
      {isActionModalOpen && (
          <div className="absolute inset-0 z-[60] flex items-center justify-center bg-black/90 p-4">
              <div className="bg-brand-ebony border border-brand-700 rounded-xl p-6 w-full max-w-md shadow-2xl animate-fade-in-up">
                  <h4 className="text-lg font-bold text-white mb-4 capitalize flex items-center">
                      <AlertTriangle className="w-5 h-5 mr-2 text-yellow-500" /> Confirm {actionType.replace('_', ' ')}
                  </h4>
                  
                  {actionType === 'promote' && (
                      <div className="mb-4">
                          <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Select New Rank</label>
                          <select className="w-full bg-brand-black border border-brand-800 rounded p-2 text-white" value={selectedRank} onChange={(e) => setSelectedRank(e.target.value)}>
                              <option value="">Choose Rank...</option>
                              <option value="OFC">Officer (OFC)</option>
                              <option value="PVT">Lead Guard (PVT)</option>
                              <option value="CPL">Training Officer (CPL)</option>
                              <option value="SGT">Supervisor (SGT)</option>
                              <option value="LT">Ops Manager (LT)</option>
                              <option value="CAP">Ops Director (CAP)</option>
                          </select>
                      </div>
                  )}

                  <textarea className="w-full bg-brand-black border border-brand-800 rounded p-3 text-white mb-4 focus:border-brand-sage outline-none" placeholder="Reason / Administrative Note..." value={actionReason} onChange={(e) => setActionReason(e.target.value)} />
                  
                  <div className="flex justify-end space-x-3">
                      <button onClick={() => setIsActionModalOpen(false)} className="text-gray-400 hover:text-white px-4 py-2">Cancel</button>
                      <button onClick={handleAction} disabled={!actionReason} className="bg-brand-sage text-black font-bold px-4 py-2 rounded hover:bg-brand-sage/90 disabled:opacity-50">Confirm</button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default GuardDetail;
