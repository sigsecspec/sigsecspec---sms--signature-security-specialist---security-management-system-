
import React, { useState, useEffect } from 'react';
import { 
  DollarSign, Search, Filter, CheckCircle, AlertTriangle, 
  Clock, BarChart2, ChevronRight, X, History, User, 
  FileText, Briefcase, CreditCard, PieChart, TrendingUp, 
  Download, Send, AlertCircle, RefreshCw, Layers, Calculator, Calendar
} from 'lucide-react';
import { KPIMeter, SimpleBarChart } from '../../common/DashboardWidgets';
import { supabase } from '../../../services/supabase';

// --- Types ---

type PaymentStatus = 
  | 'pending' 
  | 'processing' 
  | 'ready_to_pay' 
  | 'paid' 
  | 'received' 
  | 'confirmed' 
  | 'disputed' 
  | 'failed' 
  | 'resolved';

interface PaymentHistory {
  date: string;
  action: string;
  user: string;
  role: string;
  note?: string;
}

interface PayBreakdown {
  basePay: number;
  overtimePay: number; 
  spotCheckBonus: number; 
  leadGuardBonus: number;
  holidayPay: number;
  deductions: number;
  netPay: number;
}

interface PaymentRecord {
  id: string;
  guardId: string;
  guardName: string;
  payPeriod: string;
  hoursWorked: number;
  totalPay: number;
  breakdown: PayBreakdown;
  status: PaymentStatus;
  paymentMethod: string;
  paymentDate?: string;
  history: PaymentHistory[];
}

// --- Main Component ---

const PayrollManagement = ({ currentUserRole = 'Owner' }: { currentUserRole?: string }) => {
  const [activeTab, setActiveTab] = useState<'pending' | 'paid' | 'history' | 'disputes' | 'analytics'>('pending');
  const [searchQuery, setSearchQuery] = useState('');
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [selectedPayment, setSelectedPayment] = useState<PaymentRecord | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPayroll = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('payroll')
                .select(`
                    *,
                    user:profiles!payroll_user_id_fkey(full_name)
                `);

            if (data) {
                setPayments(data.map((p: any) => ({
                    id: p.id,
                    guardId: p.user_id,
                    guardName: p.user?.full_name || 'Unknown',
                    payPeriod: `${p.pay_period_start} - ${p.pay_period_end}`,
                    hoursWorked: p.hours_worked,
                    totalPay: p.total_pay,
                    breakdown: p.breakdown || { basePay: 0, overtimePay: 0, netPay: 0 },
                    status: p.status as PaymentStatus,
                    paymentMethod: p.payment_method || 'Direct Deposit',
                    paymentDate: p.payment_date,
                    history: p.history || []
                })));
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };
    fetchPayroll();
  }, []);

  // --- Helpers ---

  const getStatusColor = (status: PaymentStatus) => {
    switch (status) {
      case 'pending': return 'bg-orange-500/20 text-orange-400 border-orange-500/50';
      case 'processing': return 'bg-blue-500/20 text-blue-400 border-blue-500/50';
      case 'paid': return 'bg-green-500/20 text-green-400 border-green-500/50';
      default: return 'bg-gray-800 text-white';
    }
  };

  const getStatusLabel = (status: string) => {
    return status.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  const filteredPayments = payments.filter(p => {
    const matchesSearch = p.guardName.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          p.id.toLowerCase().includes(searchQuery.toLowerCase());
    
    let matchesTab = false;
    if (activeTab === 'pending') matchesTab = ['pending', 'processing'].includes(p.status);
    else if (activeTab === 'paid') matchesTab = ['paid', 'received', 'confirmed'].includes(p.status);
    else matchesTab = true; 

    return matchesSearch && matchesTab;
  });

  const handleAction = async (action: string, note: string) => {
    if (!selectedPayment) return;
    
    let newStatus: PaymentStatus = selectedPayment.status;
    let updates: any = {};

    if (action === 'Process Payment') newStatus = 'processing';
    if (action === 'Mark as Paid') {
        newStatus = 'paid';
        updates.payment_date = new Date().toISOString().split('T')[0];
    }

    const newHistoryEntry = {
        date: new Date().toLocaleString(),
        action: action,
        user: 'Current User',
        role: currentUserRole,
        note: note
    };

    const updatedHistory = [newHistoryEntry, ...selectedPayment.history];

    const { error } = await supabase
        .from('payroll')
        .update({
            status: newStatus,
            history: updatedHistory,
            ...updates
        })
        .eq('id', selectedPayment.id);

    if (error) {
        alert("Error: " + error.message);
        return;
    }
    
    const updatedPayment = { ...selectedPayment, status: newStatus, history: updatedHistory };
    setPayments(prev => prev.map(p => p.id === selectedPayment.id ? updatedPayment : p));
    setSelectedPayment(updatedPayment);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
  };

  const RenderPaymentTable = ({ data }: { data: PaymentRecord[] }) => (
    <div className="bg-brand-ebony rounded-xl border border-brand-800 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
            <thead className="bg-brand-900 border-b border-brand-800">
            <tr>
                <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Guard / ID</th>
                <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Pay Period</th>
                <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Hours</th>
                <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Total Pay</th>
                <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Actions</th>
            </tr>
            </thead>
            <tbody className="divide-y divide-brand-800">
            {data.length === 0 ? (
                <tr>
                    <td colSpan={6} className="p-12 text-center text-gray-500">
                        <div className="flex flex-col items-center">
                            <DollarSign className="w-12 h-12 mb-4 opacity-20" />
                            <p>No payments found matching criteria.</p>
                        </div>
                    </td>
                </tr>
            ) : (
                data.map(payment => (
                    <tr 
                    key={payment.id} 
                    className={`hover:bg-brand-800/40 transition-colors cursor-pointer group`}
                    onClick={() => setSelectedPayment(payment)}
                    >
                    <td className="p-4">
                        <div className="font-bold text-white text-sm group-hover:text-brand-sage transition-colors">{payment.guardName}</div>
                        <div className="text-xs text-gray-500 font-mono mt-1">{payment.guardId.substring(0,8)}...</div>
                    </td>
                    <td className="p-4">
                        <div className="text-sm text-gray-300">{payment.payPeriod}</div>
                    </td>
                    <td className="p-4 text-sm text-gray-300">
                        {payment.hoursWorked}h
                    </td>
                    <td className="p-4 font-mono font-bold text-white">
                        {formatCurrency(payment.totalPay)}
                    </td>
                    <td className="p-4">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded text-[10px] font-bold uppercase tracking-wide border ${getStatusColor(payment.status)}`}>
                        {getStatusLabel(payment.status)}
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
  );

  return (
    <div className="flex flex-col bg-brand-black text-gray-200 animate-fade-in-up w-full">
      
      {/* Header */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-display font-bold text-white flex items-center">
            <CreditCard className="w-6 h-6 mr-3 text-brand-sage" />
            Payroll Management
          </h2>
          <p className="text-sm text-gray-500 mt-1 ml-9">Process payments, manage disputes, and analyze labor costs.</p>
        </div>
        
        <div className="flex space-x-3 w-full xl:w-auto">
           <div className="relative flex-grow xl:flex-grow-0 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input 
                type="text" 
                placeholder="Search payments..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-brand-ebony border border-brand-800 rounded pl-10 pr-4 py-2 text-sm text-white focus:border-brand-sage outline-none" 
              />
           </div>
           <button className="bg-brand-sage text-black px-4 py-2 rounded font-bold text-sm hover:bg-brand-sage/90 flex items-center whitespace-nowrap shadow-lg">
             <RefreshCw className="w-4 h-4 mr-2" /> Sync Payroll
           </button>
        </div>
      </div>

      <div className="flex overflow-x-auto border-b border-brand-800 mb-6 scrollbar-hide">
        {[
          { id: 'pending', label: 'Pending Payments', icon: <Clock size={16} /> },
          { id: 'paid', label: 'Paid Payments', icon: <CheckCircle size={16} /> },
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

      {loading ? <div className="p-8 text-center text-gray-500">Loading Payroll...</div> : (
          <RenderPaymentTable data={filteredPayments} />
      )}

      {selectedPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/80 backdrop-blur-sm transition-opacity duration-300">
          <div className="absolute inset-0" onClick={() => setSelectedPayment(null)}></div>
          
          <div className="relative w-full max-w-4xl h-full bg-brand-ebony border-l border-brand-800 shadow-2xl flex flex-col transform transition-transform duration-300 translate-x-0">
            
            <div className="p-6 border-b border-brand-800 bg-brand-900/90 flex justify-between items-start">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-2xl font-display font-bold text-white">{selectedPayment.guardName}</h3>
                  <span className={`inline-flex items-center px-3 py-1 rounded text-xs font-bold uppercase tracking-wide border ${getStatusColor(selectedPayment.status)}`}>
                    {getStatusLabel(selectedPayment.status)}
                  </span>
                </div>
              </div>
              <button onClick={() => setSelectedPayment(null)} className="text-gray-500 hover:text-white transition-colors bg-brand-black p-2 rounded-full hover:bg-brand-800">
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 bg-brand-black/20 relative">
               
               <div className="space-y-6">
                   <div className="bg-brand-black/30 p-5 rounded-lg border border-brand-800">
                       <h4 className="text-brand-sage font-bold text-xs uppercase tracking-wider mb-4 border-b border-brand-800 pb-2 flex items-center">
                           <Calculator className="w-3 h-3 mr-2" /> Pay Breakdown
                       </h4>
                       <div className="space-y-3 text-sm">
                           <div className="flex justify-between">
                               <span className="text-gray-400">Hours Worked ({selectedPayment.hoursWorked})</span>
                               <span className="text-white font-mono">${selectedPayment.totalPay}</span>
                           </div>
                       </div>
                   </div>

                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                       <div className="bg-brand-800/20 p-5 rounded-lg border border-brand-800">
                           <h4 className="text-brand-sage font-bold text-xs uppercase tracking-wider mb-4">Actions</h4>
                           <div className="flex flex-col gap-3">
                               {selectedPayment.status === 'pending' && (
                                   <button onClick={() => handleAction('Process Payment', 'Manual processing initiated.')} className="bg-blue-600 hover:bg-blue-500 text-white py-2 rounded font-bold text-sm">Process Payment</button>
                               )}
                               {selectedPayment.status === 'processing' && (
                                   <button onClick={() => handleAction('Mark as Paid', 'Payment confirmed manually.')} className="bg-green-600 hover:bg-green-500 text-white py-2 rounded font-bold text-sm">Mark as Paid</button>
                               )}
                           </div>
                       </div>
                   </div>
               </div>

            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default PayrollManagement;
