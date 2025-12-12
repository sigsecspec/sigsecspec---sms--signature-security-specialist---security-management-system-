
import React, { useState, useEffect, useRef } from 'react';
import { 
  Menu, Bell, MessageSquare, AlertTriangle, Calendar, Search, 
  User, LogOut, X, CheckCircle, ArrowRight, Shield, Info, MapPin, Clock, Settings
} from 'lucide-react';
import { PageView } from '../types';
import { supabase } from '../services/supabase';
import ThemeToggle from './common/ThemeToggle';

interface PortalHeaderProps {
  user: { name: string; role: string; photo?: string; email?: string } | null;
  title: string;
  subtitle?: string;
  onLogout: () => void;
  onNavigate: (page: PageView) => void;
  onMenuClick?: () => void;
  hideMenuButton?: boolean;
  onProfileClick?: () => void;
  onSettingsClick?: () => void;
}

type PopupType = 'missions' | 'alerts' | 'messages' | 'notifications' | 'profile' | null;

const PortalHeader: React.FC<PortalHeaderProps> = ({ 
  user, 
  title, 
  subtitle, 
  onLogout, 
  onNavigate, 
  onMenuClick,
  hideMenuButton = false,
  onProfileClick,
  onSettingsClick
}) => {
  const [activePopup, setActivePopup] = useState<PopupType>(null);
  const [notificationCount, setNotificationCount] = useState(0);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Data States
  const [activeMissions, setActiveMissions] = useState<any[]>([]);
  const [recentMessages, setRecentMessages] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);

  // Close popups on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setActivePopup(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Fetch Data on Mount
  useEffect(() => {
    const fetchData = async () => {
        try {
            const { data: { user: authUser } } = await supabase.auth.getUser();
            if (!authUser) return;

            // 1. Fetch Notifications
            const { data: notifs } = await supabase
                .from('notifications')
                .select('*')
                .eq('user_id', authUser.id)
                .eq('is_read', false)
                .order('created_at', { ascending: false })
                .limit(5);
            setNotifications(notifs || []);
            setNotificationCount(notifs?.length || 0);

            // 2. Fetch Active Missions
            const { data: assignments } = await supabase
                .from('mission_assignments')
                .select(`
                    mission:missions (
                        id, type, start_time,
                        site:sites ( name, address )
                    )
                `)
                .eq('guard_id', authUser.id)
                .or('status.eq.Scheduled,status.eq.On Site')
                .limit(3);
            
            if (assignments) {
                const formatted = assignments.map((a: any) => ({
                    id: a.mission.id,
                    title: a.mission.site?.name || 'Mission',
                    time: new Date(a.mission.start_time).toLocaleString(),
                    loc: a.mission.site?.address,
                    status: 'Active'
                }));
                setActiveMissions(formatted);
            }

            // 3. Fetch Recent Messages
            const { data: msgs } = await supabase
                .from('messages')
                .select('*, sender:profiles!messages_sender_id_fkey(full_name)')
                .eq('recipient_id', authUser.id)
                .order('created_at', { ascending: false })
                .limit(5);
            
            if (msgs) {
                setRecentMessages(msgs.map((m: any) => ({
                    id: m.id,
                    from: m.sender?.full_name || 'System',
                    msg: m.body,
                    time: new Date(m.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
                    unread: !m.is_read
                })));
            }

            // 4. Fetch System Alerts (Incidents)
            const { data: incs } = await supabase
                .from('incident_reports')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(3);
            
            if (incs) {
                setAlerts(incs.map((i: any) => ({
                    id: i.id,
                    title: i.type || 'Incident',
                    level: i.status === 'open' ? 'high' : 'low',
                    msg: i.description,
                    time: new Date(i.created_at).toLocaleTimeString()
                })));
            }

        } catch(e) {
            console.error("Header Fetch Error", e);
        }
    };
    fetchData();
  }, []);

  const togglePopup = (type: PopupType) => {
    setActivePopup(activePopup === type ? null : type);
  };

  const handleProfileNav = () => {
      setActivePopup(null);
      if (onProfileClick) onProfileClick();
      else onNavigate('profile' as PageView);
  };

  const handleSettingsNav = () => {
      setActivePopup(null);
      if (onSettingsClick) onSettingsClick();
      else onNavigate('settings' as PageView);
  };

  // --- Sub Components ---

  const MissionsPopup = () => (
    <div className="absolute top-full right-0 mt-2 w-80 sm:w-96 bg-theme-bg-secondary border border-theme-border rounded-xl shadow-2xl z-50 overflow-hidden animate-fade-in-up">
      <div className="p-4 border-b border-theme-border flex justify-between items-center bg-theme-bg-tertiary/50">
        <h3 className="font-bold text-theme-text-primary text-sm">Your Missions</h3>
        <button onClick={() => onNavigate('guard-missions')} className="text-xs text-brand-sage hover:text-theme-text-primary transition-colors">View All</button>
      </div>
      <div className="max-h-80 overflow-y-auto">
        {activeMissions.length === 0 ? (
            <p className="p-6 text-center text-theme-text-secondary text-sm">No active assignments.</p>
        ) : activeMissions.map((m, i) => (
          <div key={i} className="p-4 border-b border-theme-border hover:bg-theme-bg-tertiary cursor-pointer transition-colors group">
            <div className="flex justify-between items-start mb-1">
              <span className="font-bold text-theme-text-primary group-hover:text-brand-sage transition-colors">{m.title}</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full font-bold uppercase bg-green-900/30 text-green-400">
                {m.status}
              </span>
            </div>
            <div className="flex items-center text-xs text-theme-text-secondary mb-1">
              <Clock className="w-3 h-3 mr-1" /> {m.time}
            </div>
            <div className="flex items-center text-xs text-theme-text-muted">
              <MapPin className="w-3 h-3 mr-1" /> {m.loc}
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const AlertsPopup = () => (
    <div className="absolute top-full right-0 mt-2 w-80 sm:w-96 bg-theme-bg-secondary border border-theme-border rounded-xl shadow-2xl z-50 overflow-hidden animate-fade-in-up">
      <div className="p-4 border-b border-theme-border flex justify-between items-center bg-theme-bg-tertiary/50">
        <h3 className="font-bold text-theme-text-primary text-sm">System Alerts / Incidents</h3>
      </div>
      <div className="max-h-80 overflow-y-auto">
        {alerts.length === 0 ? (
            <p className="p-6 text-center text-theme-text-secondary text-sm">No active alerts.</p>
        ) : alerts.map((a, i) => (
          <div key={i} className="p-4 border-b border-theme-border hover:bg-theme-bg-tertiary cursor-pointer transition-colors flex items-start">
            <div className={`mt-1 mr-3 w-2 h-2 rounded-full flex-shrink-0 ${a.level === 'high' ? 'bg-red-500' : 'bg-orange-500'}`}></div>
            <div className="flex-1">
              <div className="flex justify-between items-center mb-1">
                <span className="font-bold text-theme-text-primary text-sm">{a.title}</span>
                <span className="text-[10px] text-theme-text-muted">{a.time}</span>
              </div>
              <p className="text-xs text-theme-text-secondary leading-relaxed truncate">{a.msg}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const MessagesPopup = () => (
    <div className="absolute top-full right-0 mt-2 w-80 sm:w-96 bg-theme-bg-secondary border border-theme-border rounded-xl shadow-2xl z-50 overflow-hidden animate-fade-in-up">
      <div className="p-4 border-b border-theme-border flex justify-between items-center bg-theme-bg-tertiary/50">
        <h3 className="font-bold text-theme-text-primary text-sm">Messages</h3>
        <button onClick={() => onNavigate('messages')} className="text-xs text-brand-sage hover:text-theme-text-primary transition-colors">Go to Inbox</button>
      </div>
      <div className="max-h-80 overflow-y-auto">
        {recentMessages.length === 0 ? (
            <p className="p-6 text-center text-theme-text-secondary text-sm">No new messages.</p>
        ) : recentMessages.map((m, i) => (
          <div key={i} className={`p-4 border-b border-theme-border hover:bg-theme-bg-tertiary cursor-pointer transition-colors flex items-start ${m.unread ? 'bg-theme-bg-tertiary/50' : ''}`}>
            <div className="w-8 h-8 rounded-full bg-brand-sage/20 flex items-center justify-center text-brand-sage font-bold text-xs mr-3 border border-brand-sage/30">
              {m.from.charAt(0)}
            </div>
            <div className="flex-1">
              <div className="flex justify-between items-center mb-1">
                <span className={`text-sm ${m.unread ? 'font-bold text-theme-text-primary' : 'font-medium text-theme-text-secondary'}`}>{m.from}</span>
                <span className="text-[10px] text-theme-text-muted">{m.time}</span>
              </div>
              <p className="text-xs text-theme-text-secondary truncate">{m.msg}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const NotificationsPopup = () => (
    <div className="absolute top-full right-0 mt-2 w-80 bg-theme-bg-secondary border border-theme-border rounded-xl shadow-2xl z-50 overflow-hidden animate-fade-in-up">
      <div className="p-4 border-b border-theme-border flex justify-between items-center bg-theme-bg-tertiary/50">
        <h3 className="font-bold text-theme-text-primary text-sm">Notifications</h3>
      </div>
      <div className="max-h-80 overflow-y-auto">
         {notifications.length === 0 ? (
             <p className="p-6 text-center text-theme-text-secondary text-sm">No new notifications.</p>
         ) : notifications.map((n, i) => (
             <div key={i} className="p-4 border-b border-theme-border hover:bg-theme-bg-tertiary transition-colors">
                <div className="flex items-start">
                   <div className="mt-0.5 mr-3 text-blue-500"><Info size={16} /></div>
                   <div>
                      <p className="text-sm text-theme-text-primary">{n.title}</p>
                      <p className="text-xs text-theme-text-secondary mt-1">{n.message}</p>
                   </div>
                </div>
             </div>
         ))}
      </div>
    </div>
  );

  const ProfilePopup = () => (
    <div className="absolute top-full right-0 mt-2 w-64 bg-theme-bg-secondary border border-theme-border rounded-xl shadow-2xl z-50 overflow-hidden animate-fade-in-up">
      <div className="p-4 border-b border-theme-border bg-theme-bg-tertiary/50">
        <div className="flex items-center">
          <div className="w-10 h-10 rounded-full bg-brand-sage flex items-center justify-center text-brand-black font-bold text-lg mr-3 shadow-lg">
            {user?.name?.charAt(0) || 'U'}
          </div>
          <div className="overflow-hidden">
            <p className="text-theme-text-primary font-bold text-sm truncate">{user?.name || 'User'}</p>
            <p className="text-brand-sage text-xs font-medium truncate">{user?.role || 'Member'}</p>
          </div>
        </div>
      </div>
      <div className="py-2">
        <button onClick={handleProfileNav} className="w-full px-4 py-2 text-left text-sm text-theme-text-secondary hover:bg-theme-bg-tertiary hover:text-theme-text-primary flex items-center transition-colors">
          <User className="w-4 h-4 mr-3" /> My Profile
        </button>
        <button onClick={handleSettingsNav} className="w-full px-4 py-2 text-left text-sm text-theme-text-secondary hover:bg-theme-bg-tertiary hover:text-theme-text-primary flex items-center transition-colors">
          <Settings className="w-4 h-4 mr-3" /> Settings
        </button>
        <div className="border-t border-theme-border my-2"></div>
        <button onClick={onLogout} className="w-full px-4 py-2 text-left text-sm text-red-400 hover:bg-theme-bg-tertiary hover:text-red-300 flex items-center transition-colors">
          <LogOut className="w-4 h-4 mr-3" /> Sign Out
        </button>
      </div>
    </div>
  );

  return (
    <div className="bg-theme-bg-secondary border-b border-theme-border sticky top-0 z-40 h-16 flex items-center justify-between px-4 sm:px-6 shadow-md" ref={wrapperRef}>
      
      {/* Left Section */}
      <div className="flex items-center flex-1 min-w-0">
        {!hideMenuButton && (
          <button 
            onClick={onMenuClick} 
            className="mr-3 md:hidden text-theme-text-secondary hover:text-theme-text-primary transition-colors p-1 rounded hover:bg-theme-bg-tertiary"
          >
            <Menu className="w-6 h-6" />
          </button>
        )}
        
        <div className="flex items-center cursor-pointer min-w-0" onClick={() => onNavigate('home')}>
          <Shield className="w-8 h-8 text-brand-sage mr-2 flex-shrink-0" />
          <div className="flex flex-col justify-center">
            <span className="font-display font-bold text-theme-text-primary tracking-wider block leading-none text-sm sm:text-base truncate">{title.toUpperCase()}</span>
            {subtitle && <span className="hidden sm:block text-[10px] text-theme-text-muted tracking-[0.2em] uppercase">{subtitle}</span>}
          </div>
        </div>
      </div>

      {/* Right Section */}
      <div className="flex items-center space-x-1 sm:space-x-3">
        <div className="hidden md:flex items-center space-x-2 mr-2 border-r border-theme-border pr-4">
          <ThemeToggle />
          
          <div className="h-6 w-px bg-theme-border mx-1"></div>

          <div className="relative">
            <button onClick={() => togglePopup('missions')} className={`p-2 rounded-lg transition-all ${activePopup === 'missions' ? 'bg-brand-sage/20 text-brand-sage' : 'text-theme-text-muted hover:text-theme-text-primary hover:bg-theme-bg-tertiary'}`}>
              <Calendar size={20} />
            </button>
            {activePopup === 'missions' && <MissionsPopup />}
          </div>

          <div className="h-6 w-px bg-theme-border mx-1"></div>

          <div className="flex items-center space-x-1">
            <div className="relative">
              <button onClick={() => togglePopup('messages')} className={`p-2 rounded-lg transition-all ${activePopup === 'messages' ? 'bg-brand-sage/20 text-brand-sage' : 'text-theme-text-muted hover:text-theme-text-primary hover:bg-theme-bg-tertiary'}`}>
                <MessageSquare size={20} />
              </button>
              {activePopup === 'messages' && <MessagesPopup />}
            </div>
            
            <div className="relative">
              <button onClick={() => togglePopup('alerts')} className={`p-2 rounded-lg transition-all ${activePopup === 'alerts' ? 'bg-brand-sage/20 text-brand-sage' : 'text-theme-text-muted hover:text-theme-text-primary hover:bg-theme-bg-tertiary'}`}>
                <AlertTriangle size={20} />
              </button>
              {activePopup === 'alerts' && <AlertsPopup />}
            </div>

            <div className="relative">
              <button onClick={() => togglePopup('notifications')} className={`p-2 rounded-lg transition-all ${activePopup === 'notifications' ? 'bg-brand-sage/20 text-brand-sage' : 'text-theme-text-muted hover:text-theme-text-primary hover:bg-theme-bg-tertiary'} relative`}>
                <Bell size={20} />
                {notificationCount > 0 && <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>}
              </button>
              {activePopup === 'notifications' && <NotificationsPopup />}
            </div>
          </div>
        </div>

        {/* Profile */}
        <div className="relative pl-2 sm:pl-0">
          <button onClick={() => togglePopup('profile')} className="flex items-center space-x-3 rounded-full border border-transparent p-1 hover:bg-theme-bg-tertiary transition-colors">
            <div className="hidden lg:block text-right pr-1 max-w-[120px]">
              <p className="text-theme-text-primary text-sm font-bold leading-none truncate">{user?.name || 'User'}</p>
              <p className="text-[10px] text-brand-sage uppercase font-bold mt-0.5 truncate">{user?.role || 'Member'}</p>
            </div>
            <div className="w-8 h-8 bg-brand-sage rounded-full flex items-center justify-center text-brand-black font-bold shadow-lg ring-2 ring-brand-sage/20">
              {user?.name?.charAt(0) || 'U'}
            </div>
          </button>
          {activePopup === 'profile' && <ProfilePopup />}
        </div>
      </div>
    </div>
  );
};

export default PortalHeader;
