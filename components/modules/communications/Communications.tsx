
import React, { useState, useEffect } from 'react';
import { MessageSquare, Users, Shield, Radio, Menu, User } from 'lucide-react';
import ChatList from './ChatList';
import ChatWindow from './ChatWindow';
import { Conversation, ChatType } from '../../../types';
import { chatService } from '../../../services/chatService';
import { useAuth } from '../../../contexts/AuthContext';

interface CommunicationsProps {
  user: any;
}

const Communications: React.FC<CommunicationsProps> = ({ user }) => {
  const [activeTab, setActiveTab] = useState<ChatType>('dm');
  const [selectedChat, setSelectedChat] = useState<Conversation | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isMobileListOpen, setIsMobileListOpen] = useState(true);

  useEffect(() => {
    const init = async () => {
        if (user) {
            await chatService.initializeUserChats(user);
            loadConversations(activeTab);
        }
    };
    init();
  }, [user, activeTab]);

  const loadConversations = async (type: ChatType) => {
      const data = await chatService.getConversations(user.id, type);
      setConversations(data);
  };

  const handleTabChange = (type: ChatType) => {
      setActiveTab(type);
      setSelectedChat(null);
      setIsMobileListOpen(true);
  };

  const handleSelectChat = (chat: Conversation) => {
      setSelectedChat(chat);
      setIsMobileListOpen(false); // Close list on mobile when chat selected
  };

  return (
    <div className="flex flex-col h-full bg-brand-black text-gray-200 animate-fade-in-up border border-brand-800 rounded-xl overflow-hidden shadow-2xl">
      {/* Top Navigation Tabs */}
      <div className="flex overflow-x-auto bg-brand-ebony border-b border-brand-800 scrollbar-hide shrink-0">
        {[
            { id: 'dm', label: 'Direct Messages', icon: <User size={16} /> },
            { id: 'team_chat', label: 'Team Chats', icon: <Users size={16} /> }, 
            { id: 'group_chat', label: 'Group Chats', icon: <MessageSquare size={16} /> },
            { id: 'mission_chat', label: 'Mission Chats', icon: <Shield size={16} /> }
        ].map((tab) => (
            <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id as ChatType)}
                className={`flex items-center px-6 py-4 text-sm font-bold border-b-2 transition-colors whitespace-nowrap ${
                    activeTab === tab.id 
                    ? 'border-brand-sage text-brand-sage bg-brand-sage/5' 
                    : 'border-transparent text-gray-400 hover:text-white hover:bg-brand-800'
                }`}
            >
                <span className="mr-2">{tab.icon}</span>
                {tab.label}
            </button>
        ))}
      </div>

      <div className="flex-1 flex overflow-hidden relative">
          
          {/* Chat List Sidebar */}
          <div className={`${isMobileListOpen ? 'flex' : 'hidden'} md:flex w-full md:w-80 border-r border-brand-800 flex-col bg-brand-900/30`}>
              <ChatList 
                  conversations={conversations} 
                  activeId={selectedChat?.id || null} 
                  onSelect={handleSelectChat} 
                  type={activeTab}
              />
          </div>

          {/* Main Chat Window */}
          <div className={`${!isMobileListOpen ? 'flex' : 'hidden'} md:flex flex-1 flex-col bg-brand-black/50`}>
              {selectedChat ? (
                  <ChatWindow 
                      conversation={selectedChat} 
                      currentUser={user} 
                      onBack={() => setIsMobileListOpen(true)}
                  />
              ) : (
                  <div className="flex-1 flex flex-col items-center justify-center text-gray-500 p-8 text-center">
                      <div className="w-24 h-24 bg-brand-ebony rounded-full flex items-center justify-center mb-6 border border-brand-800">
                          <MessageSquare size={48} className="opacity-20" />
                      </div>
                      <h3 className="text-xl font-bold text-white mb-2">Select a Conversation</h3>
                      <p>Choose a thread from the list to start communicating.</p>
                  </div>
              )}
          </div>

      </div>
    </div>
  );
};

export default Communications;
