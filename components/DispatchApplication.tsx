
import React, { useState } from 'react';
import { 
  LayoutDashboard, User, MessageSquare, Send, FileText, MapPin, 
  Users, Briefcase, ShieldCheck, Truck, Award, Target, Shirt, 
  FileBarChart, BadgeCheck, Clock, BookOpen
} from 'lucide-react';
import { PageView } from '../types';
import PortalLayout, { NavGroup } from './layout/PortalLayout';
import { PlaceholderView } from './common/DashboardWidgets';
import DispatchSummary from './modules/dispatch/DispatchSummary';
import ContractManagement from './modules/shared/ContractManagement';
import SiteManagement from './modules/shared/SiteManagement';
import TeamManagement from './modules/shared/TeamManagement';
import ClientManagement from './modules/shared/ClientManagement';
import GuardManagement from './modules/shared/GuardManagement';
import VehicleManagement from './modules/shared/VehicleManagement';
import ApplicationManagement from './modules/shared/ApplicationTrainingManagement';
import TrainingManagement from './modules/shared/TrainingManagement';
import MissionManagement from './modules/shared/MissionManagement';
import UniformManagement from './modules/shared/UniformManagement';
import ProfileManagement from './modules/shared/ProfileManagement';
import CertificationManagement from './modules/shared/CertificationManagement';
import NotificationManagement from './modules/shared/NotificationManagement';
import Communications from './modules/communications/Communications';
import LiveScheduling from './modules/dispatch/LiveScheduling';
import { useAuth } from '../contexts/AuthContext';

interface DispatchApplicationProps {
  onNavigate: (page: PageView) => void;
}

type ViewID = 
  | 'dashboard' | 'scheduling' | 'profile' | 'messages' | 'notifications'
  | 'contracts' | 'site-management' | 'team-management' | 'clients' 
  | 'team' | 'shop' | 'applications' | 'training' | 'missions' 
  | 'uniforms' | 'reports' | 'certifications';

const DispatchApplication: React.FC<DispatchApplicationProps> = ({ onNavigate }) => {
  const [activeView, setActiveView] = useState<ViewID>('dashboard');
  const { user, profile, signOut } = useAuth();

  const handleLogout = async () => {
    await signOut();
    onNavigate('login');
  };

  if (!user) return <div className="p-8 text-center text-white">Please log in to access Dispatch.</div>;

  const displayUser = profile ? {
      name: profile.full_name || user.email || 'Dispatch',
      email: user.email || '',
      role: 'Dispatch / Scheduling'
  } : { name: 'Loading...', role: 'Dispatch', email: '' };

  const navigation: NavGroup[] = [
    {
      title: 'Main Views',
      items: [
        { id: 'dashboard', label: 'Dispatch Console', icon: <LayoutDashboard size={18} /> },
        { id: 'scheduling', label: 'Live Scheduling', icon: <Clock size={18} /> },
        { id: 'profile', label: 'My Profile', icon: <User size={18} /> },
        { id: 'messages', label: 'Communications', icon: <MessageSquare size={18} /> },
        { id: 'notifications', label: 'Notifications', icon: <Send size={18} /> },
      ]
    },
    {
      title: 'Management Views',
      items: [
        { id: 'contracts', label: 'Contracts', icon: <FileText size={18} /> },
        { id: 'site-management', label: 'Sites', icon: <MapPin size={18} /> },
        { id: 'team-management', label: 'Team Structure', icon: <Users size={18} /> },
        { id: 'clients', label: 'Clients', icon: <Briefcase size={18} /> },
        { id: 'team', label: 'Guard Personnel', icon: <ShieldCheck size={18} /> },
        { id: 'shop', label: 'Vehicles', icon: <Truck size={18} /> },
        { id: 'applications', label: 'Applications', icon: <Award size={18} /> },
        { id: 'training', label: 'Training Mgmt', icon: <BookOpen size={18} /> },
        { id: 'certifications', label: 'Certifications', icon: <BadgeCheck size={18} /> },
      ]
    },
    {
      title: 'Operations Views',
      items: [
        { id: 'missions', label: 'Missions & Sched', icon: <Target size={18} /> },
        { id: 'uniforms', label: 'Uniforms', icon: <Shirt size={18} /> },
        { id: 'reports', label: 'Reports', icon: <FileBarChart size={18} /> },
      ]
    }
  ];

  const renderContent = () => {
    switch (activeView) {
      case 'dashboard':
        return <DispatchSummary onNavigate={setActiveView} />;
      case 'scheduling':
        return <LiveScheduling />;
      case 'profile':
        return <ProfileManagement user={user} />;
      case 'messages':
        return <Communications user={profile || user} />;
      case 'notifications':
        return <NotificationManagement currentUserRole="Dispatch" />;
      case 'contracts':
        return <ContractManagement currentUserRole="Dispatch" />;
      case 'site-management':
        return <SiteManagement currentUserRole="Dispatch" />;
      case 'team-management':
        return <TeamManagement currentUserRole="Dispatch" />;
      case 'clients':
        return <ClientManagement currentUserRole="Dispatch" />;
      case 'team': // Guard Personnel
        return <GuardManagement currentUserRole="Dispatch" />;
      case 'shop': // Vehicles
        return <VehicleManagement currentUserRole="Dispatch" />;
      case 'applications':
        return <ApplicationManagement currentUserRole="Dispatch" />;
      case 'training':
        return <TrainingManagement currentUserRole="Dispatch" />;
      case 'certifications':
        return <CertificationManagement currentUserRole="Dispatch" />;
      case 'missions':
        return <MissionManagement currentUserRole="Dispatch" />;
      case 'uniforms':
        return <UniformManagement currentUserRole="Dispatch" />;
      default:
        return <PlaceholderView title={activeView.split('-').map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(' ')} />;
    }
  };

  return (
    <PortalLayout
      user={displayUser}
      title="DISPATCH"
      subtitle="Scheduling Hub"
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

export default DispatchApplication;
