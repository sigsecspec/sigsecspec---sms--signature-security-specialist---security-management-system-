
import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Send, Paperclip, MoreVertical, Flag, Info, User, AlertTriangle, Users, Briefcase } from 'lucide-react';
import { Conversation, Message } from '../../../types';
import { chatService } from '../../../services/chatService';

interface ChatWindowProps {
  conversation: Conversation;
  currentUser: any;
  onBack: () => void;
}

const ChatWindow: React.FC<ChatWindowProps> = ({ conversation, currentUser, onBack }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
      loadMessages();
  }, [conversation.id]);

  useEffect(() => {
      scrollToBottom();
  }, [messages]);

  const loadMessages = async () => {
      const msgs = await chatService.getMessages(conversation.id);
      setMessages(msgs);
  };

  const scrollToBottom = () => {
      if (scrollRef.current) {
          scrollRef.current.scrollIntoView({ behavior: 'smooth' });
      }
  };

  const handleSend = async (e?: React.FormEvent) => {
      e?.preventDefault();
      if (!newMessage.trim() || isSending) return;

      setIsSending(true);
      try {
          const sentMsg = await chatService.sendMessage(conversation.id, currentUser, newMessage);
          setMessages(prev => [...prev, sentMsg]);
          setNewMessage('');
      } catch (error) {
          console.error("Failed to send message", error);
      } finally {
          setIsSending(false);
      }
  };

  const renderToolbar = () => {
      // 1. DM
      if (conversation.type === 'dm') {
          return (
              <div className="flex space-x-2">
                  <button className="text-xs bg-brand-black border border-brand-700 px-3 py-1.5 rounded-lg text-gray-300 hover:text-white hover:border-brand-sage transition-colors font-bold flex items-center"><User size={12} className="mr-1"/> Profile</button>
                  <button className="text-xs bg-brand-black border border-brand-700 px-3 py-1.5 rounded-lg text-gray-300 hover:text-red-400 hover:border-red-500 transition-colors font-bold flex items-center"><Flag size={12} className="mr-1"/> Report</button>
              </div>
          );
      }
      
      // 2. Support Channels (Guard -> Hierarchy)
      if (conversation.subType === 'support_channel') {
          return (
              <div className="flex space-x-2">
                  <button className="text-xs bg-brand-black border border-brand-700 px-3 py-1.5 rounded-lg text-gray-300 hover:text-white hover:border-brand-sage transition-colors font-bold flex items-center"><User size={12} className="mr-1"/> View Profile</button>
                  <button className="text-xs bg-brand-black border border-brand-700 px-3 py-1.5 rounded-lg text-gray-300 hover:text-white hover:border-brand-sage transition-colors font-bold flex items-center"><Briefcase size={12} className="mr-1"/> Message</button>
                  <button className="text-xs bg-brand-black border border-brand-700 px-3 py-1.5 rounded-lg text-gray-300 hover:text-red-400 hover:border-red-500 transition-colors font-bold flex items-center"><Flag size={12} className="mr-1"/> Report User</button>
              </div>
          );
      }

      // 3. Peer Channels
      if (conversation.subType === 'peer_channel') {
          return (
              <div className="flex space-x-2">
                  <button className="text-xs bg-brand-black border border-brand-700 px-3 py-1.5 rounded-lg text-gray-300 hover:text-white transition-colors font-bold flex items-center"><Users size={12} className="mr-1"/> View Team Roster</button>
                  <button className="text-xs bg-brand-black border border-brand-700 px-3 py-1.5 rounded-lg text-gray-300 hover:text-white transition-colors font-bold">Message All</button>
                  <button className="text-xs bg-brand-black border border-brand-700 px-3 py-1.5 rounded-lg text-gray-300 hover:text-red-400 transition-colors font-bold flex items-center"><Flag size={12} className="mr-1"/> Report Issue</button>
              </div>
          );
      }

      // 4. Company/Team Channels
      if (conversation.subType === 'company_channel') {
          return (
              <div className="flex space-x-2">
                  <button className="text-xs bg-brand-black border border-brand-700 px-3 py-1.5 rounded-lg text-gray-300 hover:text-white transition-colors font-bold">View Members</button>
                  <button className="text-xs bg-brand-black border border-brand-700 px-3 py-1.5 rounded-lg text-gray-300 hover:text-red-400 transition-colors font-bold flex items-center"><Flag size={12} className="mr-1"/> Report Channel</button>
              </div>
          );
      }

      // Default
      return (
          <button className="p-2 text-gray-400 hover:text-white bg-brand-black/50 rounded-full hover:bg-brand-black transition-colors"><Info size={20} /></button>
      );
  };

  return (
    <div className="flex flex-col h-full relative bg-brand-black/40">
      {/* Header */}
      <div className="p-4 border-b border-brand-800 bg-brand-ebony/95 backdrop-blur-md flex justify-between items-center z-10 shadow-lg sticky top-0">
          <div className="flex items-center">
              <button onClick={onBack} className="md:hidden mr-3 p-2 rounded-full hover:bg-brand-800 text-gray-400 hover:text-white transition-colors">
                  <ArrowLeft size={20} />
              </button>
              <div>
                  <h3 className="font-bold text-white text-lg leading-tight font-display tracking-wide">{conversation.name}</h3>
                  <div className="flex items-center space-x-2 mt-0.5">
                      <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.6)]"></span>
                      <span className="text-[10px] text-gray-400 uppercase tracking-widest font-bold">
                          {conversation.subType ? conversation.subType.replace('_', ' ') : conversation.type.replace('_', ' ')}
                      </span>
                  </div>
              </div>
          </div>
          <div className="hidden md:block">
            {renderToolbar()}
          </div>
          <div className="md:hidden">
             <button className="p-2 text-gray-400"><MoreVertical size={20} /></button>
          </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6 bg-brand-black/20">
          <div className="text-center text-xs text-gray-500 my-6 flex items-center justify-center">
              <span className="h-px w-16 bg-brand-800 mr-3"></span>
              <span className="uppercase tracking-widest font-bold">Conversation Started</span>
              <span className="h-px w-16 bg-brand-800 ml-3"></span>
          </div>
          
          {messages.map((msg, idx) => {
              const isMe = msg.senderId === currentUser.id;
              const isSystem = msg.type === 'system';

              if (isSystem) {
                  return (
                      <div key={msg.id} className="flex justify-center my-6">
                          <div className="bg-brand-800/40 border border-brand-700/50 text-brand-sage text-xs px-4 py-2 rounded-full flex items-center shadow-sm backdrop-blur-sm">
                              <AlertTriangle size={12} className="mr-2 text-yellow-500" /> {msg.content}
                          </div>
                      </div>
                  );
              }

              return (
                  <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'} animate-fade-in-up group`}>
                      {!isMe && (
                          <div className="w-8 h-8 rounded-full bg-brand-black border border-brand-800 flex items-center justify-center mr-2 self-end mb-1 text-xs font-bold text-gray-500">
                              {msg.senderName.charAt(0)}
                          </div>
                      )}
                      <div className={`max-w-[80%] md:max-w-[70%] flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                          <div className="flex items-center mb-1 space-x-2 px-1 opacity-70 group-hover:opacity-100 transition-opacity">
                              {!isMe && <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">{msg.senderName}</span>}
                              <span className="text-[10px] text-gray-500 font-mono">{new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                          </div>
                          <div className={`p-4 rounded-2xl text-sm leading-relaxed shadow-lg backdrop-blur-sm ${
                              isMe 
                              ? 'bg-brand-sage text-black font-medium rounded-tr-none shadow-[0_4px_12px_rgba(124,154,146,0.1)]' 
                              : 'bg-brand-ebony border border-brand-700/60 text-gray-200 rounded-tl-none'
                          }`}>
                              {msg.content}
                          </div>
                      </div>
                  </div>
              );
          })}
          <div ref={scrollRef} className="h-1" />
      </div>

      {/* Input */}
      <div className="p-4 bg-brand-ebony border-t border-brand-800/60 sticky bottom-0 z-10">
          <form onSubmit={handleSend} className="flex items-center space-x-3 bg-brand-black p-2 rounded-2xl border border-brand-800 focus-within:border-brand-sage/50 transition-colors shadow-inner">
              <button type="button" className="p-2 text-gray-500 hover:text-brand-sage transition-colors rounded-full hover:bg-brand-800/50">
                  <Paperclip size={20} />
              </button>
              <input 
                  type="text" 
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type a secure message..." 
                  className="flex-1 bg-transparent px-2 py-2 text-white outline-none placeholder-gray-600 text-sm"
              />
              <button 
                  type="submit" 
                  disabled={!newMessage.trim() || isSending}
                  className="p-3 bg-brand-sage text-black rounded-xl hover:bg-brand-sage/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg transform active:scale-95 flex items-center justify-center"
              >
                  <Send size={18} className={isSending ? "animate-pulse" : ""} />
              </button>
          </form>
      </div>
    </div>
  );
};

export default ChatWindow;
