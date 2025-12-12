import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Send, Bot, ShieldAlert } from 'lucide-react';
import { ChatMessage } from '../types';
import { createSecurityChat, sendMessageStreamToGemini } from '../services/geminiService';
import { Chat } from '@google/genai';

const AIChatbot: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      role: 'model',
      text: 'Hello. I am Sentinel, your virtual security consultant. How can I assist you with your security needs today?',
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [chatInstance, setChatInstance] = useState<Chat | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Initialize chat when component mounts
    const chat = createSecurityChat();
    if (chat) {
      setChatInstance(chat);
    }
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen]);

  const handleSend = async () => {
    if (!inputValue.trim() || !chatInstance) return;

    const userText = inputValue;
    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: userText,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMsg]);
    setInputValue('');
    setIsLoading(true);

    try {
      const stream = sendMessageStreamToGemini(chatInstance, userText);
      let botMsgId: string | null = null;
      let fullText = '';

      for await (const chunk of stream) {
        fullText += chunk;
        
        if (!botMsgId) {
          // First chunk received, create the message
          setIsLoading(false);
          botMsgId = (Date.now() + 1).toString();
          const botMsg: ChatMessage = {
            id: botMsgId,
            role: 'model',
            text: fullText,
            timestamp: new Date()
          };
          setMessages(prev => [...prev, botMsg]);
        } else {
          // Subsequent chunks, update the message
          setMessages(prev => 
            prev.map(msg => 
              msg.id === botMsgId ? { ...msg, text: fullText } : msg
            )
          );
        }
      }
      
      if (!botMsgId) {
         // Stream finished without yielding any text
         setIsLoading(false);
      }

    } catch (error) {
      console.error("Chat error", error);
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <>
      {/* Floating Toggle Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-40 bg-brand-accent text-white p-4 rounded-full shadow-lg shadow-blue-500/40 hover:scale-110 transition-transform duration-300 group"
        >
          <MessageSquare className="w-6 h-6" />
          <span className="absolute -top-10 right-0 bg-white text-brand-900 text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap font-bold">
            Chat with Sentinel AI
          </span>
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 z-50 w-full sm:w-96 h-[500px] bg-brand-900 border border-brand-700 rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-fade-in-up">
          {/* Header */}
          <div className="bg-brand-800 p-4 border-b border-brand-700 flex justify-between items-center">
            <div className="flex items-center">
              <div className="bg-brand-accent/20 p-2 rounded-full mr-3">
                <Bot className="w-5 h-5 text-brand-accent" />
              </div>
              <div>
                <h3 className="font-bold text-white text-sm">Sentinel AI</h3>
                <p className="text-xs text-brand-gold flex items-center">
                  <span className="w-1.5 h-1.5 bg-green-500 rounded-full mr-1 animate-pulse"></span>
                  Secure & Online
                </p>
              </div>
            </div>
            <button 
              onClick={() => setIsOpen(false)}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-brand-900">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] p-3 rounded-lg text-sm leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-brand-accent text-white rounded-br-none'
                      : 'bg-brand-800 text-gray-200 rounded-bl-none border border-brand-700'
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-brand-800 border border-brand-700 p-3 rounded-lg rounded-bl-none">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce delay-75"></div>
                    <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce delay-150"></div>
                  </div>
                </div>
              </div>
            )}
            {!chatInstance && (
              <div className="flex justify-center mt-4">
                 <div className="bg-red-900/50 border border-red-500/50 p-2 rounded text-xs text-red-200 flex items-center">
                    <ShieldAlert className="w-3 h-3 mr-2" />
                    AI Service Unavailable (Missing API Key)
                 </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-4 bg-brand-800 border-t border-brand-700">
            <div className="flex items-center space-x-2">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder="Ask about security..."
                className="flex-1 bg-brand-900 text-white text-sm rounded-full px-4 py-2 border border-brand-700 focus:border-brand-accent focus:outline-none transition-colors placeholder-gray-500"
                disabled={!chatInstance || isLoading}
              />
              <button
                onClick={handleSend}
                disabled={!inputValue.trim() || !chatInstance || isLoading}
                className="bg-brand-accent text-white p-2 rounded-full hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
            <p className="text-[10px] text-gray-500 text-center mt-2">
              Sentinel AI provides general advice. For emergencies, call 911.
            </p>
          </div>
        </div>
      )}
    </>
  );
};

export default AIChatbot;