
import React, { useState } from 'react';
import { Search, Hash, Shield, User, Users, MessageSquare, Briefcase, Flag } from 'lucide-react';
import { Conversation, ChatType } from '../../../types';

interface ChatListProps {
  conversations: Conversation[];
  activeId: string | null;
  onSelect: (chat: Conversation) => void;
  type: ChatType;
}

const ChatList: React.FC<ChatListProps> = ({ conversations, activeId, onSelect, type }) => {
  const [search, setSearch] = useState('');

  const filtered = conversations.filter(c => c.name.toLowerCase().includes(search.toLowerCase()));

  const getIcon = (chat: Conversation) => {
      // Logic for specific icons based on subType
      if (chat.subType === 'support_channel') return <Briefcase size={18} />;
      if (chat.subType === 'peer_channel') return <Users size={18} />;
      if (chat.subType === 'company_channel') return <Hash size={18} />;
      if (chat.type === 'dm') return <User size={18} />;
      if (chat.type === 'mission_chat') return <Shield size={18} />;
      return <MessageSquare size={18} />;
  };

  return (
    <div className="flex flex-col h-full bg-brand-ebony border-r border-brand-800">
      <div className="p-4 border-b border-brand-800 bg-brand-black/20">
          <div className="relative group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 group-focus-within:text-brand-sage transition-colors" />
              <input 
                  type="text" 
                  placeholder="Search chats..." 
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full bg-brand-black border border-brand-700 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:border-brand-sage outline-none transition-all shadow-inner"
              />
          </div>
      </div>
      
      <div className="flex-1 overflow-y-auto p-3 space-y-1 scrollbar-hide">
          {filtered.length === 0 ? (
              <div className="text-center text-gray-500 text-sm py-12 flex flex-col items-center">
                  <MessageSquare className="w-12 h-12 opacity-20 mb-2" />
                  <p>No conversations found.</p>
              </div>
          ) : (
              filtered.map(chat => (
                  <button
                      key={chat.id}
                      onClick={() => onSelect(chat)}
                      className={`w-full flex items-start p-3 rounded-xl transition-all text-left group relative overflow-hidden ${
                          activeId === chat.id 
                          ? 'bg-brand-sage/10 border border-brand-sage/40 shadow-[0_0_15px_rgba(124,154,146,0.1)]' 
                          : 'hover:bg-brand-800/50 border border-transparent hover:border-white/5'
                      }`}
                  >
                      {activeId === chat.id && (
                          <div className="absolute left-0 top-0 bottom-0 w-1 bg-brand-sage"></div>
                      )}
                      
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center mr-3 shrink-0 transition-colors shadow-lg ${
                          activeId === chat.id 
                          ? 'bg-brand-sage text-black' 
                          : 'bg-brand-black text-gray-400 border border-brand-700 group-hover:border-gray-500'
                      }`}>
                          {chat.avatar ? <img src={chat.avatar} className="w-full h-full rounded-full object-cover" /> : getIcon(chat)}
                      </div>
                      
                      <div className="flex-1 min-w-0 py-0.5">
                          <div className="flex justify-between items-baseline mb-1">
                              <h4 className={`text-sm font-bold truncate ${activeId === chat.id ? 'text-brand-sage' : 'text-white group-hover:text-gray-200'}`}>{chat.name}</h4>
                              {chat.lastMessageTime && <span className="text-[10px] text-gray-500 shrink-0 ml-2 font-mono">{new Date(chat.lastMessageTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>}
                          </div>
                          <p className={`text-xs truncate ${activeId === chat.id ? 'text-gray-300' : 'text-gray-500 group-hover:text-gray-400'}`}>
                              {chat.lastMessage || 'No messages yet.'}
                          </p>
                      </div>
                      
                      {chat.unreadCount > 0 && (
                          <div className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0 shadow-md animate-pulse">
                              {chat.unreadCount}
                          </div>
                      )}
                  </button>
              ))
          )}
      </div>
    </div>
  );
};

export default ChatList;
