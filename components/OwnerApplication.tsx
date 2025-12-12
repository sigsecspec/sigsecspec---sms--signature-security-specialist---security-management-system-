
import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, Users, Settings, Bell, DollarSign,
  LayoutDashboard, Briefcase, FileText, Activity, User, MessageSquare, MapPin, Truck, Award, TrendingUp, 
  Trophy, Globe, Scroll, Server, Target, GitPullRequest, UserPlus, Gavel, BadgeCheck, Shirt, FileBarChart, Send,
  BookOpen
} from 'lucide-react';
import { PageView } from '../types';
import PortalLayout, { NavGroup } from './layout/PortalLayout';
import { PlaceholderView } from './common/DashboardWidgets';
import LiveControlPanel from './modules/shared/LiveControlPanel';
import OwnerSummary from './modules/owner/OwnerSummary';
import ApplicationManagement from './modules/shared/ApplicationTrainingManagement';
import TrainingManagement from './modules/shared/TrainingManagement';
import ContractManagement from './modules/shared/ContractManagement';
import SiteManagement from './modules/shared/SiteManagement';
import TeamManagement from './modules/shared/TeamManagement';
import GuardManagement from './modules/shared/GuardManagement';
import VehicleManagement from './modules/shared/VehicleManagement';
import UniformManagement from './modules/shared/UniformManagement';
import PayrollManagement from './modules/shared/PayrollManagement';
import ClientManagement from './modules/shared/ClientManagement';
import MissionManagement from './modules/shared/MissionManagement';
import ProfileManagement from './modules/shared/ProfileManagement';
import CertificationManagement from './modules/shared/CertificationManagement';
import NotificationManagement from './modules/shared/NotificationManagement';
import Communications from './modules/communications/Communications';
import SystemSettings from './modules/owner/SystemSettings';
import AppealsManagement from './modules/owner/AppealsManagement';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../services/supabase';

interface OwnerApplicationProps {
  onNavigate: (page: PageView) => void;
}

type ViewID = 
  // Main Views
  | 'dashboard' | 'profile' | 'messages' | 'notifications'
  // Management Views
  | 'contracts' | 'site-management' | 'team-management' | 'clients' | 'guards' 
  | 'shop' | 'applications' | 'training' | 'payroll' | 'uniforms' | 'missions' 
  | 'guard-requests' | 'certifications'
  // Oversight Views
  | 'alerts' | 'reports' | 'analytics' | 'hall-of-fame' | 'change-requests' 
  | 'appeals' | 'live-control'
  // System Views
  | 'site-content' | 'audit-log' | 'system-maintenance' | 'system-settings' | 'settings';

const OwnerApplication: React.FC<OwnerApplicationProps> = ({ onNavigate }) => {
  const [activeView, setActiveView] = useState<ViewID>('dashboard');
  const [counts, setCounts] = useState({ pendingApps: 0, appeals: 0, pendingCerts: 0 });
  const { user, profile, signOut } = useAuth();

  useEffect(() => {
    const fetchCounts = async () => {
      try {
        const { count: guardApps } = await supabase.from('guard_applications').select('*', { count: 'exact', head: true }).eq('status', 'pending_review');
        const { count: clientApps } = await supabase.from('client_applications').select('*', { count: 'exact', head: true }).eq('status', 'pending_review');
        const { count: staffApps } = await supabase.from('staff_applications').select('*', { count: 'exact', head: true }).eq('status', 'pending_review');
        const { count: certs } = await supabase.from('user_certifications').select('*', { count: 'exact', head: true }).eq('status', 'pending_verification');
        // Mock appeal count as schema might not be ready, or query actual table if exists
        const appeals = 3; 
        
        const totalPending = (guardApps || 0) + (clientApps || 0) + (staffApps || 0);
        
        setCounts({ pendingApps: totalPending, appeals: appeals, pendingCerts: certs || 0 });
      } catch (error) {
        console.error("Error fetching counts", error);
      }
    };

    fetchCounts();
  }, []);

  const handleLogout = async () => {
    await signOut();
    onNavigate('login');
  };

  if (!user) return <div className="p-8 text-center text-white">Please log in to access the Owner Portal.</div>;

  const displayUser = profile ? {
      name: profile.full_name || user.email || 'Owner',
      email: user.email || '',
      role: 'Owner / Chief of Staff'
  } : { name: 'Loading...', role: 'Owner', email: '' };

  const navigation: NavGroup[] = [
    {
      title: 'Main Views',
      items: [
        { id: 'dashboard', label: 'Dashboard Mgmt', icon: <LayoutDashboard size={18} /> },
        { id: 'profile', label: 'Profile Mgmt', icon: <User size={18} /> },
        { id: 'messages', label: 'Communications Mgmt', icon: <MessageSquare size={18} /> },
        { id: 'notifications', label: 'Notification Mgmt', icon: <Send size={18} /> },
      ]
    },
    {
      title: 'Management Views',
      items: [
        { id: 'contracts', label: 'Contract Mgmt', icon: <FileText size={18} /> },
        { id: 'site-management', label: 'Site Management', icon: <MapPin size={18} /> },
        { id: 'team-management', label: 'Team Structure Mgmt', icon: <Users size={18} /> },
        { id: 'clients', label: 'Client Management', icon: <Briefcase size={18} /> },
        { id: 'guards', label: 'Guard Personnel Mgmt', icon: <ShieldCheck size={18} /> },
        { id: 'shop', label: 'Vehicle Management', icon: <Truck size={18} /> },
        { id: 'applications', label: 'Applications', icon: <UserPlus size={18} />, badge: counts.pendingApps > 0 ? counts.pendingApps : undefined },
        { id: 'training', label: 'Training Mgmt', icon: <BookOpen size={18} /> },
        { id: 'certifications', label: 'Certification Mgmt', icon: <BadgeCheck size={18} />, badge: counts.pendingCerts > 0 ? counts.pendingCerts : undefined },
        { id: 'payroll', label: 'Payroll Management', icon: <DollarSign size={18} /> },
        { id: 'uniforms', label: 'Uniform Management', icon: <Shirt size={18} /> },
        { id: 'missions', label: 'Mission Management', icon: <Target size={18} /> },
        { id: 'guard-requests', label: 'Guard Requests Mgmt', icon: <UserPlus size={18} /> },
      ]
    },
    {
      title: 'Oversight Views',
      items: [
        { id: 'alerts', label: 'Alerts & Notifs Mgmt', icon: <Bell size={18} /> },
        { id: 'reports', label: 'Reports Management', icon: <FileBarChart size={18} /> },
        { id: 'analytics', label: 'Analytics Management', icon: <TrendingUp size={18} /> },
        { id: 'hall-of-fame', label: 'Hall of Fame Mgmt', icon: <Trophy size={18} /> },
        { id: 'change-requests', label: 'Change Requests Mgmt', icon: <GitPullRequest size={18} /> },
        { id: 'appeals', label: 'Appeals Management', icon: <Gavel size={18} />, badge: counts.appeals > 0 ? counts.appeals : undefined },
        { id: 'live-control', label: 'Live Control Mgmt', icon: <Activity size={18} /> },
      ]
    },
    {
      title: 'System Views',
      items: [
        { id: 'site-content', label: 'Site Content Mgmt', icon: <Globe size={18} /> },
        { id: 'audit-log', label: 'Audit Log Management', icon: <Scroll size={18} /> },
        { id: 'system-settings', label: 'System Config', icon: <Server size={18} /> },
        { id: 'settings', label: 'Personal Settings', icon: <Settings size={18} /> },
      ]
    }
  ];

  const renderContent = () => {
    switch (activeView) {
      case 'dashboard':
        return <OwnerSummary pendingCount={counts.pendingApps} onNavigate={setActiveView} />;
      case 'profile':
        return <ProfileManagement user={user} />;
      case 'messages':
        return <Communications user={profile || user} />;
      case 'notifications':
        return <NotificationManagement currentUserRole="Owner" />;
      case 'contracts':
        return <ContractManagement currentUserRole="Owner" />;
      case 'site-management':
        return <SiteManagement currentUserRole="Owner" />;
      case 'applications':
        return <ApplicationManagement currentUserRole="Owner" />;
      case 'training':
        return <TrainingManagement currentUserRole="Owner" />;
      case 'certifications':
        return <CertificationManagement currentUserRole="Owner" />;
      case 'team-management':
        return <TeamManagement currentUserRole="Owner" />;
      case 'payroll':
        return <PayrollManagement currentUserRole="Owner" />;
      case 'guards':
        return <GuardManagement currentUserRole="Owner" />;
      case 'clients':
        return <ClientManagement currentUserRole="Owner" />;
      case 'live-control':
        return <LiveControlPanel />;
      case 'shop':
        return <VehicleManagement currentUserRole="Owner" />;
      case 'uniforms':
        return <UniformManagement currentUserRole="Owner" />;
      case 'missions':
        return <MissionManagement currentUserRole="Owner" />;
      case 'system-settings':
        return <SystemSettings />;
      case 'appeals':
        return <AppealsManagement />;
      default:
        return <PlaceholderView title={activeView.split('-').map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(' ')} />;
    }
  };

  return (
    <PortalLayout
      user={displayUser}
      title="SIGNATURE"
      subtitle="Executive Command"
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

export default OwnerApplication;
