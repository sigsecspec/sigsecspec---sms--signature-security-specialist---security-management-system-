
import React, { useState } from 'react';
import { 
  LifeBuoy, Search, Filter, MessageSquare, CheckCircle, 
  Clock, AlertCircle, ChevronRight, User, X, Send
} from 'lucide-react';
import { KPIMeter } from '../../common/DashboardWidgets';

interface Ticket {
  id: string;
  subject: string;
  requester: string;
  role: string;
  priority: 'High' | 'Medium' | 'Low';
  status: 'Open' | 'In Progress' | 'Resolved';
  date: string;
  lastMessage: string;
  messages: { sender: string; text: string; time: string; isStaff: boolean }[];
}

const MOCK_TICKETS: Ticket[] = [
    {
        id: 'TKT-1001',
        subject: 'Payroll Discrepancy',
        requester: 'Officer Miller',
        role: 'Guard',
        priority: 'High',
        status: 'Open',
        date: '2023-10-27',
        lastMessage: 'My hours for last week seem short.',
        messages: [
            { sender: 'Officer Miller', text: 'Hi, I worked 42 hours but only see 40 on paystub.', time: '10:00 AM', isStaff: false }
        ]
    },
    {
        id: 'TKT-1002',
        subject: 'Uniform Replacement',
        requester: 'Officer Jones',
        role: 'Guard',
        priority: 'Low',
        status: 'In Progress',
        date: '2023-10-26',
        lastMessage: 'Requesting new size L shirt.',
        messages: [
            { sender: 'Officer Jones', text: 'Need a new shirt, ripped during patrol.', time: '2:30 PM', isStaff: false },
            { sender: 'Secretary', text: 'Please submit a formal request via the Uniforms tab. I can assist if needed.', time: '2:45 PM', isStaff: true }
        ]
    },
    {
        id: 'TKT-1003',
        subject: 'Contract Invoice Question',
        requester: 'TechCorp Inc.',
        role: 'Client',
        priority: 'Medium',
        status: 'Open',
        date: '2023-10-27',
        lastMessage: 'Clarification on line item 4.',
        messages: [
            { sender: 'TechCorp Admin', text: 'What is the "Special Equipment Fee"?', time: '09:15 AM', isStaff: false }
        ]
    }
];

const SupportTicketCenter = () => {
  const [activeTab, setActiveTab] = useState<'Open' | 'In Progress' | 'Resolved'>('Open');
  const [tickets, setTickets] = useState<Ticket[]>(MOCK_TICKETS);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [replyText, setReplyText] = useState('');

  const filteredTickets = tickets.filter(t => t.status === activeTab);

  const getPriorityColor = (p: string) => {
      switch(p) {
          case 'High': return 'text-red-400 bg-red-900/20 border-red-500/30';
          case 'Medium': return 'text-yellow-400 bg-yellow-900/20 border-yellow-500/30';
          default: return 'text-blue-400 bg-blue-900/20 border-blue-500/30';
      }
  };

  const handleReply = () => {
      if (!selectedTicket || !replyText.trim()) return;
      
      const newMessage = {
          sender: 'Secretary',
          text: replyText,
          time: new Date().toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'}),
          isStaff: true
      };

      const updatedTicket = {
          ...selectedTicket,
          messages: [...selectedTicket.messages, newMessage],
          status: 'In Progress' as const
      };

      setTickets(prev => prev.map(t => t.id === selectedTicket.id ? updatedTicket : t));
      setSelectedTicket(updatedTicket);
      setReplyText('');
  };

  const handleResolve = () => {
      if (!selectedTicket) return;
      const updatedTicket = { ...selectedTicket, status: 'Resolved' as const };
      setTickets(prev => prev.map(t => t.id === selectedTicket.id ? updatedTicket : t));
      setSelectedTicket(updatedTicket);
  };

  return (
    <div className="flex flex-col h-full bg-brand-black text-gray-200 animate-fade-in-up">
        {/* Header */}
        <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 mb-6">
            <div>
                <h2 className="text-2xl font-display font-bold text-white flex items-center">
                    <LifeBuoy className="w-6 h-6 mr-3 text-brand-sage" />
                    Support Center
                </h2>
                <p className="text-sm text-gray-500 mt-1 ml-9">Manage inquiries, issues, and support requests.</p>
            </div>
            
            <div className="flex gap-3">
                <div className="bg-brand-ebony border border-brand-800 rounded flex p-1">
                    {['Open', 'In Progress', 'Resolved'].map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab as any)}
                            className={`px-4 py-2 text-xs font-bold rounded transition-colors ${activeTab === tab ? 'bg-brand-sage text-black' : 'text-gray-400 hover:text-white'}`}
                        >
                            {tab}
                        </button>
                    ))}
                </div>
            </div>
        </div>

        {/* Content */}
        <div className="flex flex-1 gap-6 overflow-hidden">
            {/* List */}
            <div className="w-full lg:w-1/3 bg-brand-ebony rounded-xl border border-brand-800 flex flex-col overflow-hidden">
                <div className="p-4 border-b border-brand-800 bg-brand-900/30">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                        <input className="w-full bg-brand-black border border-brand-700 rounded pl-10 pr-4 py-2 text-sm text-white focus:border-brand-sage outline-none" placeholder="Search tickets..." />
                    </div>
                </div>
                <div className="flex-1 overflow-y-auto">
                    {filteredTickets.map(ticket => (
                        <div 
                            key={ticket.id}
                            onClick={() => setSelectedTicket(ticket)}
                            className={`p-4 border-b border-brand-800 cursor-pointer hover:bg-brand-800/40 transition-colors ${selectedTicket?.id === ticket.id ? 'bg-brand-800/60 border-l-4 border-l-brand-sage' : ''}`}
                        >
                            <div className="flex justify-between items-start mb-1">
                                <span className={`text-[10px] px-2 py-0.5 rounded font-bold border uppercase ${getPriorityColor(ticket.priority)}`}>{ticket.priority}</span>
                                <span className="text-xs text-gray-500">{ticket.date}</span>
                            </div>
                            <h4 className="text-white font-bold text-sm mb-1 truncate">{ticket.subject}</h4>
                            <p className="text-xs text-gray-400 flex items-center mb-2">
                                <User size={12} className="mr-1" /> {ticket.requester} ({ticket.role})
                            </p>
                            <p className="text-xs text-gray-500 truncate">{ticket.lastMessage}</p>
                        </div>
                    ))}
                    {filteredTickets.length === 0 && <div className="p-8 text-center text-gray-500 text-sm">No tickets found.</div>}
                </div>
            </div>

            {/* Detail */}
            <div className="hidden lg:flex flex-1 bg-brand-ebony rounded-xl border border-brand-800 flex-col overflow-hidden">
                {selectedTicket ? (
                    <>
                        <div className="p-6 border-b border-brand-800 bg-brand-900/50 flex justify-between items-start">
                            <div>
                                <h3 className="text-xl font-bold text-white mb-2">{selectedTicket.subject}</h3>
                                <div className="flex items-center gap-3 text-sm text-gray-400">
                                    <span className="bg-brand-black px-2 py-1 rounded border border-brand-700 font-mono text-xs">{selectedTicket.id}</span>
                                    <span className="flex items-center"><User size={14} className="mr-1" /> {selectedTicket.requester}</span>
                                    <span className={`text-xs font-bold ${selectedTicket.status === 'Open' ? 'text-green-400' : 'text-gray-400'}`}>{selectedTicket.status}</span>
                                </div>
                            </div>
                            {selectedTicket.status !== 'Resolved' && (
                                <button onClick={handleResolve} className="bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded font-bold text-xs flex items-center">
                                    <CheckCircle size={14} className="mr-2" /> Resolve Ticket
                                </button>
                            )}
                        </div>

                        <div className="flex-1 overflow-y-auto p-6 space-y-4">
                            {selectedTicket.messages.map((msg, idx) => (
                                <div key={idx} className={`flex ${msg.isStaff ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`max-w-[80%] rounded-lg p-4 ${msg.isStaff ? 'bg-brand-sage text-black rounded-tr-none' : 'bg-brand-black border border-brand-800 text-gray-300 rounded-tl-none'}`}>
                                        <div className="flex justify-between items-center mb-1 text-xs opacity-70 font-bold">
                                            <span>{msg.sender}</span>
                                            <span>{msg.time}</span>
                                        </div>
                                        <p className="text-sm">{msg.text}</p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="p-4 border-t border-brand-800 bg-brand-black/30">
                            <div className="flex gap-2">
                                <input 
                                    className="flex-1 bg-brand-ebony border border-brand-700 rounded-lg px-4 py-2 text-white focus:border-brand-sage outline-none"
                                    placeholder="Type a reply..."
                                    value={replyText}
                                    onChange={(e) => setReplyText(e.target.value)}
                                    onKeyPress={(e) => e.key === 'Enter' && handleReply()}
                                />
                                <button onClick={handleReply} className="bg-brand-sage text-black p-2 rounded-lg hover:bg-brand-sage/90">
                                    <Send size={20} />
                                </button>
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-gray-500">
                        <MessageSquare size={48} className="mb-4 opacity-20" />
                        <p>Select a ticket to view details.</p>
                    </div>
                )}
            </div>
        </div>
    </div>
  );
};

export default SupportTicketCenter;
