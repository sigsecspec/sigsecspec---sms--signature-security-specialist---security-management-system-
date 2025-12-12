
import React, { useState } from 'react';
import { ChevronDown, ChevronRight, X, LogOut, Menu, Shield, LayoutGrid } from 'lucide-react';
import PortalHeader from '../PortalHeader';
import { PageView } from '../../types';

export interface NavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  badge?: number;
}

export interface NavGroup {
  title: string;
  items: NavItem[];
}

interface PortalLayoutProps {
  user: { name: string; role: string; email?: string } | null;
  title: string;
  subtitle?: string;
  onLogout: () => void;
  onNavigate: (page: PageView) => void;
  navigation: NavGroup[];
  activeView: string;
  onViewChange: (viewId: string) => void;
  children: React.ReactNode;
}

const NavButton: React.FC<{ item: NavItem; isActive: boolean; onClick: () => void }> = ({ item, isActive, onClick }) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center justify-between px-4 py-3 mb-1 rounded-xl text-sm font-medium transition-all duration-200 group relative overflow-hidden ${
      isActive
        ? 'text-brand-black bg-brand-sage shadow-[0_0_20px_rgba(124,154,146,0.2)] font-bold'
        : 'text-gray-400 hover:bg-white/5 hover:text-white'
    }`}
  >
    <div className="flex items-center truncate relative z-10">
      <span className={`flex-shrink-0 transition-transform duration-200 ${isActive ? 'scale-110' : 'group-hover:scale-110'}`}>
        {item.icon}
      </span>
      <span className="ml-3 truncate">{item.label}</span>
    </div>
    {item.badge ? (
      <span className={`relative z-10 text-[10px] font-bold px-2 py-0.5 rounded-full ${isActive ? 'bg-black text-white' : 'bg-brand-sage text-black'}`}>
        {item.badge}
      </span>
    ) : null}
  </button>
);

const PortalLayout: React.FC<PortalLayoutProps> = ({
  user,
  title,
  subtitle,
  onLogout,
  onNavigate,
  navigation,
  activeView,
  onViewChange,
  children
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<string[]>(navigation.map(g => g.title));

  const toggleGroup = (group: string) => {
    setExpandedGroups(prev => 
      prev.includes(group) ? prev.filter(g => g !== group) : [...prev, group]
    );
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-brand-ebony border-r border-white/5 relative">
      {/* Mobile Header inside drawer */}
      <div className="md:hidden p-6 border-b border-white/5 flex items-center justify-between">
         <div className="flex items-center">
            <div className="p-2 bg-brand-sage/10 rounded-lg mr-3 border border-brand-sage/20">
                <Shield className="w-6 h-6 text-brand-sage" />
            </div>
            <div>
               <h1 className="font-display font-bold text-lg text-white tracking-wider leading-none">{title}</h1>
               <p className="text-[10px] text-brand-sage uppercase tracking-[0.2em]">{subtitle}</p>
            </div>
         </div>
         <button onClick={() => setIsMobileMenuOpen(false)} className="p-2 rounded-full hover:bg-white/5 text-gray-400 hover:text-white transition-colors">
            <X size={24} />
         </button>
      </div>

      {/* Branding for Desktop */}
      <div className="hidden md:flex p-6 items-center mb-2">
          <div className="w-10 h-10 bg-gradient-to-br from-brand-sage to-emerald-800 rounded-xl flex items-center justify-center shadow-lg shadow-brand-sage/10 mr-3 border border-white/10">
             <LayoutGrid className="text-white" size={20} />
          </div>
          <div>
             <h2 className="font-bold text-white leading-tight">Signature</h2>
             <p className="text-xs text-gray-500 font-mono">Console v2.4</p>
          </div>
      </div>

      {/* Nav Items */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6 scrollbar-hide">
        {navigation.map((group) => (
          <div key={group.title}>
            <button 
              onClick={() => toggleGroup(group.title)}
              className="flex items-center justify-between w-full text-[10px] font-bold text-gray-500 uppercase tracking-[0.15em] mb-2 px-3 hover:text-brand-sage transition-colors"
            >
              {group.title}
              {expandedGroups.includes(group.title) ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
            </button>
            
            <div className={`space-y-1 overflow-hidden transition-all duration-300 ${expandedGroups.includes(group.title) ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0'}`}>
              {group.items.map(item => (
                <NavButton 
                  key={item.id} 
                  item={item} 
                  isActive={activeView === item.id}
                  onClick={() => { 
                    onViewChange(item.id); 
                    setIsMobileMenuOpen(false); 
                  }} 
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Footer User Profile */}
      <div className="p-4 border-t border-white/5 bg-white/[0.02]">
         <div className="flex items-center gap-3 mb-4 px-2">
            <div className="w-10 h-10 rounded-full bg-brand-sage flex items-center justify-center text-brand-black font-bold shadow-lg ring-2 ring-brand-black">
                {user?.name?.charAt(0) || 'U'}
            </div>
            <div className="overflow-hidden">
                <p className="text-white font-bold text-sm truncate">{user?.name}</p>
                <p className="text-xs text-gray-500 truncate">{user?.role}</p>
            </div>
         </div>
         <button onClick={onLogout} className="w-full flex items-center justify-center text-red-400 hover:text-red-300 hover:bg-red-900/10 p-3 rounded-xl transition-colors text-sm font-bold border border-transparent hover:border-red-900/30">
            <LogOut className="w-4 h-4 mr-2" /> Sign Out
         </button>
      </div>
    </div>
  );

  return (
    <div className="h-screen bg-brand-black flex flex-col overflow-hidden font-sans text-gray-200">
      
      {/* Header */}
      <PortalHeader 
        user={user}
        title={title}
        subtitle={subtitle}
        onLogout={onLogout}
        onNavigate={onNavigate}
        onMenuClick={() => setIsMobileMenuOpen(true)}
        onProfileClick={() => onViewChange('profile')}
        onSettingsClick={() => onViewChange('settings')}
      />

      <div className="flex flex-1 overflow-hidden relative">
        {/* Desktop Sidebar */}
        <div className="w-72 hidden md:flex flex-col flex-shrink-0 z-20 h-full relative shadow-[4px_0_24px_rgba(0,0,0,0.4)]">
           <SidebarContent />
        </div>

        {/* Mobile Sidebar Overlay */}
        <div className={`fixed inset-0 z-50 md:hidden transition-opacity duration-300 ${isMobileMenuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
             <div 
               className="absolute inset-0 bg-black/80 backdrop-blur-sm" 
               onClick={() => setIsMobileMenuOpen(false)}
             ></div>
             
             <div className={`absolute inset-y-0 left-0 w-80 shadow-2xl transform transition-transform duration-300 ease-out flex flex-col bg-brand-ebony border-r border-white/10 ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                <SidebarContent />
             </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto bg-brand-black w-full relative">
           {/* Decorative Elements */}
           <div className="absolute top-0 left-0 w-full h-96 bg-brand-sage/5 rounded-b-[50%] blur-3xl pointer-events-none"></div>
           
           <div className="p-4 md:p-8 pb-24 md:pb-8 mx-auto relative z-10 min-h-full">
              {children}
           </div>
        </div>
      </div>
    </div>
  );
};

export default PortalLayout;
