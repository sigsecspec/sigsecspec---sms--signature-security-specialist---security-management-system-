
import React, { useState, useEffect } from 'react';
import { 
  Bell, Search, Filter, Plus, CheckCircle, AlertTriangle, 
  Clock, BarChart2, ChevronRight, X, User, 
  FileText, Mail, MessageSquare, Send, Smartphone, 
  Trash2, RefreshCw, Layout, Eye, Calendar,
  PieChart, Activity, Check
} from 'lucide-react';
import { KPIMeter, QuickActionCard, CollapsibleSection } from '../../common/DashboardWidgets';
import { supabase } from '../../../services/supabase';
import { InputLabel, InputField } from '../../common/FormElements';
import CreateNotificationModal from './CreateNotificationModal';
import { useAuth } from '../../../contexts/AuthContext';

interface NotificationManagementProps {
  currentUserRole: string;
}

type NotificationStatus = 'scheduled' | 'queued' | 'processing' | 'ready_to_send' | 'sent' | 'delivered' | 'read' | 'failed' | 'bounced' | 'cancelled' | 'draft';
type NotificationType = 'Mission' | 'Alert' | 'System' | 'Training' | 'Payment' | 'General';
type Channel = 'in_app' | 'email' | 'sms' | 'push';

interface NotificationRecord {
  id: string;
  title: string;
  body: string;
  type: NotificationType;
  status: NotificationStatus;
  channels: Channel[];
  recipientCount: number;
  readCount: number;
  createdBy: string;
  createdAt: string;
  scheduledFor?: string;
  sentAt?: string;
  recipients?: { name: string; role: string; status: string; readAt?: string }[];
  auditLog?: { action: string; by: string; timestamp: string }[];
}

const MOCK_NOTIFICATIONS: NotificationRecord[] = [
    {
        id: 'NOT-1001',
        title: 'Urgent: Shift Coverage Needed',
        body: 'Coverage needed for Downtown Mall, Swing Shift. Bonus rates apply.',
        type: 'Mission',
        status: 'read',
        channels: ['in_app', 'sms'],
        recipientCount: 15,
        readCount: 12,
        createdBy: 'Dispatch',
        createdAt: new Date(Date.now() - 86400000).toISOString(),
        sentAt: new Date(Date.now() - 86000000).toISOString(),
        recipients: [
            { name: 'Officer Miller', role: 'Guard', status: 'read', readAt: new Date().toISOString() },
            { name: 'Officer Jones', role: 'Guard', status: 'delivered' }
        ],
        auditLog: [
            { action: 'Created', by: 'Dispatch', timestamp: new Date(Date.now() - 86400000).toISOString() },
            { action: 'Sent', by: 'System', timestamp: new Date(Date.now() - 86000000).toISOString() }
        ]
    },
    {
        id: 'NOT-1002',
        title: 'System Maintenance Alert',
        body: 'The portal will be down for 30 mins tonight at 02:00.',
        type: 'System',
        status: 'scheduled',
        channels: ['in_app', 'email'],
        recipientCount: 450,
        readCount: 0,
        createdBy: 'Owner',
        createdAt: new Date().toISOString(),
        scheduledFor: new Date(Date.now() + 10000000).toISOString(),
        auditLog: [
            { action: 'Scheduled', by: 'Owner', timestamp: new Date().toISOString() }
        ]
    }
];

const NotificationManagement: React.FC<NotificationManagementProps> = ({ currentUserRole }) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'pending' | 'sent' | 'templates' | 'analytics'>('sent');
  const [searchQuery, setSearchQuery] = useState('');
  const [notifications, setNotifications] = useState<NotificationRecord[]>([]);
  const [selectedNotif, setSelectedNotif] = useState<NotificationRecord | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  // Permission check
  const canCreate = ['Owner', 'Management', 'Operations Director', 'Operations Manager', 'Dispatch', 'Secretary'].includes(currentUserRole);

  useEffect(() => {
      // Simulate fetch
      setTimeout(() => {
          setNotifications(MOCK_NOTIFICATIONS);
          setLoading(false);
      }, 800);
  }, []);

  const getStatusColor = (status: NotificationStatus) => {
      switch (status) {
          case 'scheduled': return 'bg-blue-900/30 text-blue-400 border-blue-500/30';
          case 'queued': return 'bg-yellow-900/30 text-yellow-400 border-yellow-500/30';
          case 'processing': return 'bg-orange-900/30 text-orange-400 border-orange-500/30';
          case 'ready_to_send': return 'bg-green-900/30 text-green-400 border-green-500/30';
          case 'sent': return 'bg-blue-600/30 text-blue-300 border-blue-500/30';
          case 'delivered': return 'bg-green-600/30 text-green-300 border-green-500/30';
          case 'read': return 'bg-green-500/20 text-green-400 border-green-500/50';
          case 'failed': return 'bg-red-900/30 text-red-400 border-red-500/30';
          case 'bounced': return 'bg-red-900/50 text-red-300 border-red-500/50';
          case 'cancelled': return 'bg-gray-700 text-gray-400 border-gray-600';
          default: return 'bg-gray-800 text-gray-400';
      }
  };

  const getChannelIcon = (channel: Channel) => {
      switch(channel) {
          case 'email': return <Mail size={12} />;
          case 'sms': return <Smartphone size={12} />;
          case 'in_app': return <Bell size={12} />;
          case 'push': return <Send size={12} />;
      }
  };

  const filteredNotifications = notifications.filter(n => {
      const matchesSearch = n.title.toLowerCase().includes(searchQuery.toLowerCase()) || n.id.toLowerCase().includes(searchQuery.toLowerCase());
      let matchesTab = false;
      if (activeTab === 'pending') matchesTab = ['scheduled', 'queued', 'processing', 'draft'].includes(n.status);
      else if (activeTab === 'sent') matchesTab = ['sent', 'delivered', 'read', 'failed', 'bounced'].includes(n.status);
      else matchesTab = true; 
      return matchesSearch && matchesTab;
  });

  const RenderTable = () => (
      <div className="bg-brand-ebony rounded-xl border border-brand-800 overflow-hidden shadow-xl animate-fade-in-up">
          <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                  <thead className="bg-brand-900 border-b border-brand-800">
                      <tr>
                          <th className="p-4 text-xs font-bold text-gray-500 uppercase">Notification</th>
                          <th className="p-4 text-xs font-bold text-gray-500 uppercase">Target & Type</th>
                          <th className="p-4 text-xs font-bold text-gray-500 uppercase">Channels</th>
                          <th className="p-4 text-xs font-bold text-gray-500 uppercase">Timing</th>
                          <th className="p-4 text-xs font-bold text-gray-500 uppercase">Status</th>
                          <th className="p-4 text-xs font-bold text-gray-500 uppercase text-right">Engagement</th>
                      </tr>
                  </thead>
                  <tbody className="divide-y divide-brand-800">
                      {filteredNotifications.length === 0 ? (
                          <tr><td colSpan={6} className="p-8 text-center text-gray-500">No notifications found.</td></tr>
                      ) : (
                          filteredNotifications.map(notif => (
                              <tr key={notif.id} onClick={() => setSelectedNotif(notif)} className="hover:bg-brand-800/40 cursor-pointer transition-colors group">
                                  <td className="p-4">
                                      <div className="font-bold text-white text-sm group-hover:text-brand-sage transition-colors">{notif.title}</div>
                                      <div className="text-xs text-gray-500 font-mono mt-1">{notif.id}</div>
                                  </td>
                                  <td className="p-4">
                                      <div className="flex flex-col">
                                          <span className="text-sm text-gray-300">{notif.recipientCount} Recipients</span>
                                          <span className="text-xs text-gray-500 bg-brand-black px-2 py-0.5 rounded border border-brand-700 w-fit mt-1">{notif.type}</span>
                                      </div>
                                  </td>
                                  <td className="p-4">
                                      <div className="flex space-x-1">
                                          {notif.channels.map(c => (
                                              <div key={c} className="p-1.5 bg-brand-black rounded border border-brand-700 text-gray-400" title={c.replace('_', ' ')}>
                                                  {getChannelIcon(c)}
                                              </div>
                                          ))}
                                      </div>
                                  </td>
                                  <td className="p-4 text-xs text-gray-400">
                                      {notif.status === 'scheduled' ? (
                                          <div className="text-blue-400 flex items-center"><Clock size={12} className="mr-1" /> {new Date(notif.scheduledFor!).toLocaleDateString()}</div>
                                      ) : (
                                          <div>Sent: {new Date(notif.sentAt || notif.createdAt).toLocaleDateString()}</div>
                                      )}
                                  </td>
                                  <td className="p-4">
                                      <span className={`inline-flex items-center px-2.5 py-1 rounded text-[10px] font-bold uppercase border ${getStatusColor(notif.status)}`}>
                                          {notif.status.replace('_', ' ')}
                                      </span>
                                  </td>
                                  <td className="p-4 text-right">
                                      {notif.status === 'read' || notif.status === 'delivered' ? (
                                          <div className="flex flex-col items-end">
                                              <span className="text-white font-bold text-sm">{Math.round((notif.readCount / notif.recipientCount) * 100)}%</span>
                                              <span className="text-[10px] text-gray-500">Read Rate</span>
                                          </div>
                                      ) : (
                                          <span className="text-gray-600 text-xs">-</span>
                                      )}
                                  </td>
                              </tr>
                          ))
                      )}
                  </tbody>
              </table>
          </div>
      </div>
  );

  const RenderAnalytics = () => (
      <div className="space-y-6 animate-fade-in-up">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-brand-ebony p-6 rounded-xl border border-brand-800">
                  <h3 className="text-white font-bold mb-6 flex items-center"><Activity className="w-5 h-5 mr-2 text-brand-sage" /> Delivery Performance</h3>
                  <div className="space-y-4">
                      {[{ label: 'In-App Delivery', val: 98 }, { label: 'Push Notifications', val: 92 }, { label: 'Email Delivery', val: 99 }, { label: 'SMS Delivery', val: 88 }].map((metric, i) => (
                          <div key={i}>
                              <div className="flex justify-between text-sm mb-1">
                                  <span className="text-gray-400">{metric.label}</span>
                                  <span className="text-white font-bold">{metric.val}%</span>
                              </div>
                              <div className="w-full bg-brand-900 h-2 rounded-full overflow-hidden">
                                  <div className="bg-brand-sage h-full" style={{ width: `${metric.val}%` }}></div>
                              </div>
                          </div>
                      ))}
                  </div>
              </div>
              <div className="bg-brand-ebony p-6 rounded-xl border border-brand-800">
                  <h3 className="text-white font-bold mb-6 flex items-center"><PieChart className="w-5 h-5 mr-2 text-blue-400" /> Engagement by Type</h3>
                  <div className="flex items-center justify-center h-48 text-gray-500 italic">
                      Chart visualization requires historical data.
                  </div>
              </div>
          </div>
      </div>
  );

  const stats = {
      pending: notifications.filter(n => ['scheduled', 'queued', 'processing'].includes(n.status)).length,
      sent: notifications.filter(n => ['sent', 'delivered', 'read'].includes(n.status)).length,
      failed: notifications.filter(n => ['failed', 'bounced'].includes(n.status)).length,
      rate: '98%'
  };

  return (
    <div className="flex flex-col h-full bg-brand-black text-gray-200 animate-fade-in-up">
      {/* Header */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-display font-bold text-white flex items-center">
            <Bell className="w-6 h-6 mr-3 text-brand-sage" />
            Notification Management
          </h2>
          <p className="text-sm text-gray-500 mt-1 ml-9">Manage system alerts, broadcasts, and automated messaging.</p>
        </div>
        
        <div className="flex gap-3">
           <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input 
                type="text" 
                placeholder="Search notifications..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-brand-ebony border border-brand-800 rounded pl-10 pr-4 py-2 text-sm text-white focus:border-brand-sage outline-none" 
              />
           </div>
           {canCreate && (
               <button 
                 onClick={() => setIsCreateModalOpen(true)}
                 className="bg-brand-sage text-black px-4 py-2 rounded font-bold text-sm hover:bg-brand-sage/90 flex items-center shadow-lg"
               >
                 <Plus className="w-4 h-4 mr-2" /> New Notification
               </button>
           )}
        </div>
      </div>

      {/* KPIs */}
      {activeTab !== 'templates' && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <KPIMeter label="Delivery Rate" value={stats.rate} trend="up" trendValue="High" color="green" icon={<CheckCircle />} />
              <KPIMeter label="Pending Queue" value={stats.pending.toString()} trend="down" trendValue="Live" color="blue" icon={<Clock />} />
              <KPIMeter label="Read Rate" value="65%" trend="up" trendValue="Avg" color="purple" icon={<Eye />} />
              <KPIMeter label="Failed / Bounced" value={stats.failed.toString()} trend="down" trendValue="Alert" color="red" icon={<AlertTriangle />} />
          </div>
      )}

      {/* Tabs */}
      <div className="flex overflow-x-auto border-b border-brand-800 mb-6 scrollbar-hide">
        {[
          { id: 'pending', label: 'Pending Queue', icon: <Clock size={16} /> },
          { id: 'sent', label: 'Sent History', icon: <Send size={16} /> },
          { id: 'templates', label: 'Templates', icon: <Layout size={16} /> },
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

      {/* Content */}
      <div className="flex-1 overflow-hidden flex flex-col">
          {loading ? (
              <div className="p-12 text-center text-gray-500">Loading Notifications...</div>
          ) : activeTab === 'analytics' ? (
              <RenderAnalytics />
          ) : activeTab === 'templates' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {['Shift Reminder', 'Payment Confirmation', 'Emergency Alert'].map(t => (
                      <div key={t} className="bg-brand-ebony p-6 rounded-xl border border-brand-800 hover:border-brand-sage/50 cursor-pointer transition-all group">
                          <FileText className="w-10 h-10 text-brand-silver mb-4 group-hover:text-brand-sage" />
                          <h4 className="text-white font-bold mb-2">{t}</h4>
                          <p className="text-xs text-gray-500 mb-4">Standard template for {t.toLowerCase()}.</p>
                          <button className="text-xs text-brand-sage hover:underline">Edit Template</button>
                      </div>
                  ))}
                  <button className="border-2 border-dashed border-brand-800 rounded-xl flex flex-col items-center justify-center p-6 text-gray-500 hover:border-brand-sage hover:text-brand-sage transition-all">
                      <Plus className="w-8 h-8 mb-2" /> Create Template
                  </button>
              </div>
          ) : (
              <RenderTable />
          )}
      </div>

      {/* Detail Modal */}
      {selectedNotif && (
          <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/80 backdrop-blur-sm transition-opacity duration-300">
              <div className="absolute inset-0" onClick={() => setSelectedNotif(null)}></div>
              <div className="relative w-full max-w-2xl h-full bg-brand-ebony border-l border-brand-800 shadow-2xl flex flex-col animate-fade-in-right">
                  <div className="p-6 border-b border-brand-800 bg-brand-900/90 flex justify-between items-start">
                      <div>
                          <div className="flex items-center gap-2 mb-1">
                              <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${getStatusColor(selectedNotif.status)}`}>
                                  {selectedNotif.status.replace('_', ' ')}
                              </span>
                              <span className="text-xs text-gray-500">{selectedNotif.type}</span>
                          </div>
                          <h3 className="text-xl font-bold text-white">{selectedNotif.title}</h3>
                      </div>
                      <button onClick={() => setSelectedNotif(null)} className="text-gray-500 hover:text-white"><X size={20} /></button>
                  </div>
                  
                  <div className="flex-1 overflow-y-auto p-6 space-y-8">
                      <div className="bg-brand-black/50 p-4 rounded border border-brand-800">
                          <h4 className="text-xs font-bold text-gray-500 uppercase mb-2">Message Content</h4>
                          <p className="text-gray-300 text-sm leading-relaxed">{selectedNotif.body}</p>
                      </div>

                      <div>
                          <h4 className="text-brand-sage font-bold text-sm uppercase tracking-wider mb-4 border-b border-brand-800 pb-2">Delivery Details</h4>
                          <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                              <div><span className="text-gray-500 block">Created By</span> <span className="text-white">{selectedNotif.createdBy}</span></div>
                              <div><span className="text-gray-500 block">Created At</span> <span className="text-white">{new Date(selectedNotif.createdAt).toLocaleString()}</span></div>
                              <div><span className="text-gray-500 block">Channels</span> <div className="flex space-x-2 mt-1">{selectedNotif.channels.map(c => <span key={c} className="bg-brand-800 px-2 py-0.5 rounded text-xs text-gray-300 uppercase">{c.replace('_', ' ')}</span>)}</div></div>
                              <div><span className="text-gray-500 block">Recipients</span> <span className="text-white">{selectedNotif.recipientCount}</span></div>
                          </div>
                      </div>

                      {selectedNotif.recipients && (
                          <div>
                              <h4 className="text-brand-sage font-bold text-sm uppercase tracking-wider mb-4 border-b border-brand-800 pb-2">Recipient Status</h4>
                              <div className="bg-brand-black rounded border border-brand-800 overflow-hidden">
                                  {selectedNotif.recipients.map((r, i) => (
                                      <div key={i} className="flex justify-between items-center p-3 border-b border-brand-800/50 last:border-0 hover:bg-brand-800/20">
                                          <div>
                                              <p className="text-white text-sm font-bold">{r.name}</p>
                                              <p className="text-xs text-gray-500">{r.role}</p>
                                          </div>
                                          <div className="text-right">
                                              <span className={`text-xs font-bold uppercase ${r.status === 'read' ? 'text-green-400' : r.status === 'failed' ? 'text-red-400' : 'text-blue-400'}`}>{r.status}</span>
                                              {r.readAt && <p className="text-[10px] text-gray-600">{new Date(r.readAt).toLocaleTimeString()}</p>}
                                          </div>
                                      </div>
                                  ))}
                              </div>
                          </div>
                      )}

                      {selectedNotif.auditLog && (
                          <div>
                              <h4 className="text-brand-sage font-bold text-sm uppercase tracking-wider mb-4 border-b border-brand-800 pb-2">Audit Trail</h4>
                              <div className="space-y-4 border-l border-brand-800 ml-2 pl-4">
                                  {selectedNotif.auditLog.map((log, i) => (
                                      <div key={i} className="relative">
                                          <div className="absolute -left-[21px] top-1.5 w-2 h-2 rounded-full bg-brand-sage"></div>
                                          <p className="text-sm text-white font-bold">{log.action}</p>
                                          <p className="text-xs text-gray-500">{log.by} • {new Date(log.timestamp).toLocaleString()}</p>
                                      </div>
                                  ))}
                              </div>
                          </div>
                      )}
                  </div>
                  
                  {['scheduled', 'queued'].includes(selectedNotif.status) && (
                      <div className="p-4 border-t border-brand-800 bg-brand-black flex justify-end">
                          <button className="text-red-400 hover:text-red-300 font-bold text-sm flex items-center bg-brand-800 px-4 py-2 rounded hover:bg-brand-700">
                              <Trash2 className="w-4 h-4 mr-2" /> Cancel Notification
                          </button>
                      </div>
                  )}
              </div>
          </div>
      )}

      {/* Create Modal */}
      {isCreateModalOpen && user && (
          <CreateNotificationModal
              onClose={() => setIsCreateModalOpen(false)}
              onSuccess={() => {
                  // Simulate refresh
                  setIsCreateModalOpen(false);
              }}
              currentUserRole={currentUserRole}
              currentUserId={user.id}
          />
      )}
    </div>
  );
};

export default NotificationManagement;
