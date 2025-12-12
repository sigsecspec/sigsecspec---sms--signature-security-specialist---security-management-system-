
import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, User, MessageSquare, Send, FileText, MapPin, 
  Users, Briefcase, ShieldCheck, Award, Target, Shirt, Bell, BadgeCheck,
  LifeBuoy, UserPlus, BookOpen
} from 'lucide-react';
import { PageView } from '../types';
import PortalLayout, { NavGroup } from './layout/PortalLayout';
import { PlaceholderView } from './common/DashboardWidgets';
import SecretarySummary from './modules/secretary/SecretarySummary';
import ContractManagement from './modules/shared/ContractManagement';
import SiteManagement from './modules/shared/SiteManagement';
import TeamManagement from './modules/shared/TeamManagement';
import ClientManagement from './modules/shared/ClientManagement';
import GuardManagement from './modules/shared/GuardManagement';
import ApplicationManagement from './modules/shared/ApplicationTrainingManagement';
import TrainingManagement from './modules/shared/TrainingManagement';
import MissionManagement from './modules/shared/MissionManagement';
import UniformManagement from './modules/shared/UniformManagement';
import ProfileManagement from './modules/shared/ProfileManagement';
import CertificationManagement from './modules/shared/CertificationManagement';
import NotificationManagement from './modules/shared/NotificationManagement';
import SupportTicketCenter from './modules/secretary/SupportTicketCenter';
import Communications from './modules/communications/Communications';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../services/supabase';

interface SecretaryApplicationProps {
  onNavigate: (page: PageView) => void;
}

type ViewID = 
  | 'dashboard' | 'profile' | 'messages' | 'send-notification'
  | 'contracts' | 'site-management' | 'team-management' | 'clients' 
  | 'team' | 'applications' | 'training' | 'missions' | 'uniforms' 
  | 'alerts' | 'certifications' | 'support';

const SecretaryApplication: React.FC<SecretaryApplicationProps> = ({ onNavigate }) => {
  const [activeView, setActiveView] = useState<ViewID>('dashboard');
  const [counts, setCounts] = useState({ pendingApps: 0, pendingUniforms: 0, pendingContracts: 0, pendingCerts: 0 });
  const { user, profile, signOut } = useAuth();

  useEffect(() => {
    const fetchCounts = async () => {
      const { count: guardApps } = await supabase.from('guard_applications').select('*', { count: 'exact', head: true }).eq('status', 'pending_review');
      const { count: clientApps } = await supabase.from('client_applications').select('*', { count: 'exact', head: true }).eq('status', 'pending_review');
      const { count: staffApps } = await supabase.from('staff_applications').select('*', { count: 'exact', head: true }).eq('status', 'pending_review');
        
      const totalPending = (guardApps || 0) + (clientApps || 0) + (staffApps || 0);

      const { count: uniformsCount } = await supabase
        .from('uniform_distributions')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending');

      const { count: contractsCount } = await supabase
        .from('contracts')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending_approval');

      const { count: certsCount } = await supabase
        .from('user_certifications')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending_verification');

      setCounts({
        pendingApps: totalPending,
        pendingUniforms: uniformsCount || 0,
        pendingContracts: contractsCount || 0,
        pendingCerts: certsCount || 0
      });
    };

    fetchCounts();
  }, []);

  const handleLogout = async () => {
    await signOut();
    onNavigate('login');
  };

  if (!user) return <div className="p-8 text-center text-white">Please log in to access Secretary Portal.</div>;

  const displayUser = profile ? {
      name: profile.full_name || user.email || 'Secretary',
      email: user.email || '',
      role: 'Secretary / Admin Support'
  } : { name: 'Loading...', role: 'Secretary', email: '' };

  const navigation: NavGroup[] = [
    {
      title: 'Main Views',
      items: [
        { id: 'dashboard', label: 'Admin Dashboard', icon: <LayoutDashboard size={18} /> },
        { id: 'support', label: 'Support Center', icon: <LifeBuoy size={18} /> },
        { id: 'profile', label: 'My Profile', icon: <User size={18} /> },
        { id: 'messages', label: 'Communications', icon: <MessageSquare size={18} /> },
        { id: 'send-notification', label: 'Notifications', icon: <Send size={18} /> },
      ]
    },
    {
      title: 'Management Views',
      items: [
        { id: 'applications', label: 'Applications', icon: <UserPlus size={18} />, badge: counts.pendingApps > 0 ? counts.pendingApps : undefined },
        { id: 'training', label: 'Training Mgmt', icon: <BookOpen size={18} /> },
        { id: 'uniforms', label: 'Uniforms', icon: <Shirt size={18} />, badge: counts.pendingUniforms > 0 ? counts.pendingUniforms : undefined },
        { id: 'certifications', label: 'Certifications', icon: <BadgeCheck size={18} />, badge: counts.pendingCerts > 0 ? counts.pendingCerts : undefined },
        { id: 'contracts', label: 'Contracts', icon: <FileText size={18} />, badge: counts.pendingContracts > 0 ? counts.pendingContracts : undefined },
        { id: 'site-management', label: 'Sites', icon: <MapPin size={18} /> },
        { id: 'clients', label: 'Clients', icon: <Briefcase size={18} /> },
        { id: 'team', label: 'Guard Personnel', icon: <ShieldCheck size={18} /> },
        { id: 'team-management', label: 'Team Structure', icon: <Users size={18} /> },
        { id: 'missions', label: 'Mission Overview', icon: <Target size={18} /> },
      ]
    },
    {
      title: 'Oversight Views',
      items: [
        { id: 'alerts', label: 'Alerts', icon: <Bell size={18} /> },
      ]
    }
  ];

  const renderContent = () => {
    switch (activeView) {
      case 'dashboard':
        return <SecretarySummary onNavigate={setActiveView} />;
      case 'support':
        return <SupportTicketCenter />;
      case 'profile':
        return <ProfileManagement user={user} />;
      case 'messages':
        return <Communications user={profile || user} />;
      case 'send-notification':
        return <NotificationManagement currentUserRole="Secretary" />;
      case 'contracts':
        return <ContractManagement currentUserRole="Secretary" />;
      case 'site-management':
        return <SiteManagement currentUserRole="Secretary" />;
      case 'team-management':
        return <TeamManagement currentUserRole="Secretary" />;
      case 'clients':
        return <ClientManagement currentUserRole="Secretary" />;
      case 'team': // Guard Personnel
        return <GuardManagement currentUserRole="Secretary" />;
      case 'applications':
        return <ApplicationManagement currentUserRole="Secretary" />;
      case 'training':
        return <TrainingManagement currentUserRole="Secretary" />;
      case 'certifications':
        return <CertificationManagement currentUserRole="Secretary" />;
      case 'missions':
        return <MissionManagement currentUserRole="Secretary" />;
      case 'uniforms':
        return <UniformManagement currentUserRole="Secretary" />;
      default:
        return <PlaceholderView title={activeView.split('-').map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(' ')} />;
    }
  };

  return (
    <PortalLayout
      user={displayUser}
      title="SECRETARY"
      subtitle="Admin Support"
      onLogout={handleLogout}
      onNavigate={onNavigate}
      navigation={navigation}
      activeView={activeView}
      onViewChange={(id) => setActiveView(id as ViewID)}
    >
      {renderContent()}
    </PortalLayout>
  );
};

export default SecretaryApplication;
