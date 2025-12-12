
import React, { useState } from 'react';
import { 
  Gavel, Search, CheckCircle, XCircle, AlertCircle, FileText, User
} from 'lucide-react';
import { supabase } from '../../../services/supabase';

// Mock Data for Appeals (Since this is a specific Owner feature)
const MOCK_APPEALS = [
    { id: 'APP-001', user: 'Guard Miller', type: 'Training Denial', date: '2023-10-25', reason: 'Believe score calculation error', status: 'pending' },
    { id: 'APP-002', user: 'Client XYZ Corp', type: 'Account Suspension', date: '2023-10-24', reason: 'Payment was made via wire', status: 'pending' },
    { id: 'APP-003', user: 'Guard Jones', type: 'Disciplinary', date: '2023-10-20', reason: 'Dispute report details', status: 'resolved' },
];

const AppealsManagement = () => {
  const [appeals, setAppeals] = useState(MOCK_APPEALS);
  const [selectedAppeal, setSelectedAppeal] = useState<any>(null);

  const handleDecision = (id: string, decision: 'grant' | 'deny') => {
      // In real app: Update DB, trigger notification
      alert(`Appeal ${decision === 'grant' ? 'Granted (Override)' : 'Denied'}. Notification sent.`);
      setAppeals(prev => prev.map(a => a.id === id ? { ...a, status: 'resolved' } : a));
      setSelectedAppeal(null);
  };

  return (
    <div className="space-y-6 animate-fade-in-up">
        {/* Header */}
        <div className="border-b border-white/5 pb-6 flex justify-between items-end">
            <div>
                <h2 className="text-3xl font-display font-bold text-white tracking-tight">Appeals & Overrides</h2>
                <p className="text-gray-400 text-sm mt-2">Review escalated decisions and exercise final override authority.</p>
            </div>
            <div className="bg-brand-900/30 px-4 py-2 rounded-lg border border-brand-800 flex items-center">
                <Gavel className="w-5 h-5 text-brand-sage mr-2" />
                <span className="text-white font-bold">{appeals.filter(a => a.status === 'pending').length} Pending</span>
            </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* List */}
            <div className="lg:col-span-2 space-y-4">
                {appeals.map(appeal => (
                    <div 
                        key={appeal.id} 
                        onClick={() => setSelectedAppeal(appeal)}
                        className={`p-4 rounded-xl border cursor-pointer transition-all ${
                            selectedAppeal?.id === appeal.id 
                            ? 'bg-brand-sage/10 border-brand-sage' 
                            : 'bg-brand-ebony border-brand-800 hover:border-brand-700'
                        }`}
                    >
                        <div className="flex justify-between items-start">
                            <div>
                                <h4 className="text-white font-bold flex items-center">
                                    {appeal.type} <span className="mx-2 text-gray-600">•</span> {appeal.user}
                                </h4>
                                <p className="text-sm text-gray-400 mt-1 line-clamp-1">"{appeal.reason}"</p>
                            </div>
                            <span className={`text-[10px] px-2 py-1 rounded uppercase font-bold ${
                                appeal.status === 'pending' ? 'bg-orange-900/30 text-orange-400 border border-orange-500/30' : 'bg-green-900/30 text-green-400 border border-green-500/30'
                            }`}>
                                {appeal.status}
                            </span>
                        </div>
                        <div className="mt-3 flex items-center text-xs text-gray-500">
                            <Clock className="w-3 h-3 mr-1" /> {appeal.date}
                        </div>
                    </div>
                ))}
            </div>

            {/* Detail Panel */}
            <div className="bg-brand-ebony rounded-xl border border-brand-800 p-6 h-fit sticky top-6">
                {selectedAppeal ? (
                    <div className="animate-fade-in-up">
                        <h3 className="text-xl font-bold text-white mb-4">Appeal Detail</h3>
                        
                        <div className="space-y-4 mb-8">
                            <div className="bg-brand-black p-3 rounded border border-brand-800">
                                <span className="text-xs text-gray-500 uppercase block mb-1">Appellant</span>
                                <span className="text-white font-bold flex items-center"><User className="w-4 h-4 mr-2" /> {selectedAppeal.user}</span>
                            </div>
                            <div className="bg-brand-black p-3 rounded border border-brand-800">
                                <span className="text-xs text-gray-500 uppercase block mb-1">Appeal Reason</span>
                                <p className="text-gray-300 text-sm leading-relaxed">{selectedAppeal.reason}</p>
                            </div>
                            <div className="bg-brand-900/30 p-3 rounded border border-brand-800">
                                <span className="text-xs text-gray-500 uppercase block mb-1">Original Decision</span>
                                <p className="text-gray-400 text-sm">Denied by Operations (Automated)</p>
                            </div>
                        </div>

                        {selectedAppeal.status === 'pending' ? (
                            <div className="grid grid-cols-2 gap-3">
                                <button 
                                    onClick={() => handleDecision(selectedAppeal.id, 'deny')}
                                    className="py-3 border border-brand-700 text-gray-300 rounded-lg hover:bg-brand-800 hover:text-white font-bold text-sm"
                                >
                                    Sustain Denial
                                </button>
                                <button 
                                    onClick={() => handleDecision(selectedAppeal.id, 'grant')}
                                    className="py-3 bg-brand-sage text-black rounded-lg hover:bg-brand-sage/90 font-bold text-sm shadow-lg"
                                >
                                    Override & Approve
                                </button>
                            </div>
                        ) : (
                            <div className="text-center p-4 bg-green-900/20 rounded border border-green-500/30 text-green-400 font-bold">
                                Case Resolved
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="text-center text-gray-500 py-12">
                        <FileText className="w-12 h-12 mx-auto mb-4 opacity-20" />
                        <p>Select an appeal to view details.</p>
                    </div>
                )}
            </div>
        </div>
    </div>
  );
};

import { Clock } from 'lucide-react';
export default AppealsManagement;
