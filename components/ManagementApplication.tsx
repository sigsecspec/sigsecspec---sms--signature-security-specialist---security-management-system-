
import React, { useState, useEffect } from 'react';
import { ArrowLeft, CheckCircle, Briefcase, Award, LayoutDashboard, Settings, FileText, BarChart2, MapPin, Target, Users, Send, MessageSquare, User, DollarSign, Shirt, BadgeCheck, Bell, UserPlus, BookOpen } from 'lucide-react';
import { PageView } from '../types';
import PortalLayout, { NavGroup } from './layout/PortalLayout';
import ManagementSummary from './modules/management/ManagementSummary';
import ApplicationManagement from './modules/shared/ApplicationTrainingManagement';
import TrainingManagement from './modules/shared/TrainingManagement';
import ContractManagement from './modules/shared/ContractManagement';
import SiteManagement from './modules/shared/SiteManagement';
import MissionManagement from './modules/shared/MissionManagement';
import TeamManagement from './modules/shared/TeamManagement';
import GuardManagement from './modules/shared/GuardManagement';
import VehicleManagement from './modules/shared/VehicleManagement';
import ClientManagement from './modules/shared/ClientManagement';
import PayrollManagement from './modules/shared/PayrollManagement';
import UniformManagement from './modules/shared/UniformManagement';
import ProfileManagement from './modules/shared/ProfileManagement';
import CertificationManagement from './modules/shared/CertificationManagement';
import NotificationManagement from './modules/shared/NotificationManagement';
import ManagementApplicationForm from './applications/ManagementApplicationForm';
import { PlaceholderView } from './common/DashboardWidgets';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../services/supabase';

interface ManagementApplicationProps {
  onNavigate: (page: PageView) => void;
}

type AppStatus = 'incomplete' | 'pending' | 'approved' | 'denied' | 'active';
type ViewID = 
  | 'dashboard' | 'profile' | 'messages' | 'notifications'
  | 'missions' | 'contracts' | 'site-management' | 'clients' | 'team' | 'guards' | 'shop' | 'applications' | 'training' | 'payroll' | 'uniforms'
  | 'reports' | 'settings' | 'certifications' | 'alerts';

const ManagementApplication: React.FC<ManagementApplicationProps> = ({ onNavigate }) => {
  const { user, profile, signOut } = useAuth();
  const [status, setStatus] = useState<AppStatus>('incomplete');
  const [counts, setCounts] = useState({ pendingApps: 0, pendingUniforms: 0, pendingCerts: 0 });
  
  useEffect(() => {
    if (user) {
        if (profile?.role === 'management' && profile.status === 'active') {
            setStatus('active');
            fetchCounts();
        } else {
            checkApplicationStatus(user.id);
        }
    }
  }, [user, profile]);

  const fetchCounts = async () => {
      const { count: guardApps } = await supabase.from('guard_applications').select('*', { count: 'exact', head: true }).eq('status', 'pending_review');
      const { count: clientApps } = await supabase.from('client_applications').select('*', { count: 'exact', head: true }).eq('status', 'pending_review');
      const { count: staffApps } = await supabase.from('staff_applications').select('*', { count: 'exact', head: true }).eq('status', 'pending_review');
      const { count: uniforms } = await supabase.from('uniform_distributions').select('*', { count: 'exact', head: true }).eq('status', 'pending');
      const { count: certs } = await supabase.from('user_certifications').select('*', { count: 'exact', head: true }).eq('status', 'pending_verification');

      setCounts({
          pendingApps: (guardApps || 0) + (clientApps || 0) + (staffApps || 0),
          pendingUniforms: uniforms || 0,
          pendingCerts: certs || 0
      });
  };

  const checkApplicationStatus = async (userId: string) => {
      const { data } = await supabase
        .from('staff_applications')
        .select('*')
        .eq('user_id', userId)
        .eq('position_type', 'Management')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
      
      if (data) {
          if (data.status === 'approved' || data.status === 'active') setStatus('active');
          else if (data.status === 'pending_review' || data.status === 'under_review') setStatus('pending');
          else setStatus('incomplete');
      }
  };

  const handleSubmit = async (formData: any) => {
    setStatus('pending');
    window.scrollTo(0, 0);
  };

  const handleLogout = async () => {
    await signOut();
    onNavigate('login');
  };

  if (status === 'approved' || status === 'active') {
    return <ActiveDashboardView user={profile} onNavigate={onNavigate} onLogout={handleLogout} counts={counts} />;
  }

  if (status === 'pending') {
    return <PendingView onNavigate={onNavigate} />;
  }

  if (!user) {
      return (
          <div className="min-h-screen bg-brand-black flex flex-col items-center justify-center p-8">
              <p className="text-white mb-4">Login required for Executive Application.</p>
              <button onClick={() => onNavigate('login')} className="bg-brand-sage text-black px-6 py-2 rounded font-bold">Log In</button>
          </div>
      );
  }

  return (
    <div className="min-h-screen bg-brand-black py-24 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <button
          onClick={() => onNavigate('home')}
          className="flex items-center text-brand-silver hover:text-brand-sage mb-8 transition-colors group"
        >
          <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
          Back to Home
        </button>

        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center p-3 bg-brand-sage/10 rounded-full mb-4">
             <Briefcase className="w-8 h-8 text-brand-sage" />
          </div>
          <h1 className="text-3xl md:text-4xl font-display font-bold text-white mb-4">
            Management Application
          </h1>
          <p className="text-brand-silver max-w-2xl mx-auto">
            Executive & Senior Leadership positions. These roles require extensive experience, strategic vision, and Owner/Co-Owner approval.
          </p>
        </div>

        <ManagementApplicationForm user={user} onSubmit={handleSubmit} />
      </div>
    </div>
  );
};

const PendingView = ({ onNavigate }: { onNavigate: (p: PageView) => void }) => (
  <div className="min-h-screen bg-brand-black flex flex-col items-center justify-center p-4 py-24">
    <div className="max-w-3xl w-full bg-brand-ebony rounded-xl p-8 border border-brand-sage/20 shadow-2xl text-center">
        <CheckCircle className="w-20 h-20 text-green-500 mx-auto mb-6" />
        <h2 className="text-3xl font-bold text-white mb-4">Application Submitted</h2>
        <p className="text-gray-400 mb-8">Your application for a management position has been received and is under executive review.</p>
        <button onClick={() => onNavigate('home')} className="text-brand-sage hover:underline">Return Home</button>
    </div>
  </div>
);

const ActiveDashboardView = ({ user, onNavigate, onLogout, counts }: any) => {
  const [activeView, setActiveView] = useState<ViewID>('dashboard');

  const navigation: NavGroup[] = [
    {
      title: 'Main Views',
      items: [
        { id: 'dashboard', label: 'Management Console', icon: <LayoutDashboard size={18} /> },
        { id: 'profile', label: 'My Profile', icon: <User size={18} /> },
        { id: 'messages', label: 'Communications', icon: <MessageSquare size={18} /> },
        { id: 'notifications', label: 'Notifications', icon: <Send size={18} /> },
      ]
    },
    {
      title: 'Administration',
      items: [
        { id: 'applications', label: 'Applications', icon: <UserPlus size={18} />, badge: counts.pendingApps > 0 ? counts.pendingApps : undefined },
        { id: 'training', label: 'Training Mgmt', icon: <BookOpen size={18} /> },
        { id: 'uniforms', label: 'Uniform Dist.', icon: <Shirt size={18} />, badge: counts.pendingUniforms > 0 ? counts.pendingUniforms : undefined },
        { id: 'certifications', label: 'Certifications', icon: <BadgeCheck size={18} />, badge: counts.pendingCerts > 0 ? counts.pendingCerts : undefined },
        { id: 'contracts', label: 'Contract Mgmt', icon: <FileText size={18} /> },
        { id: 'payroll', label: 'Payroll', icon: <DollarSign size={18} /> },
      ]
    },
    {
      title: 'Operations Oversight',
      items: [
        { id: 'site-management', label: 'Sites', icon: <MapPin size={18} /> },
        { id: 'clients', label: 'Client Relations', icon: <Briefcase size={18} /> },
        { id: 'team', label: 'Guard Teams', icon: <Users size={18} /> },
        { id: 'guards', label: 'Personnel', icon: <Users size={18} /> },
        { id: 'shop', label: 'Vehicles', icon: <BadgeCheck size={18} /> },
        { id: 'missions', label: 'Missions', icon: <Target size={18} /> },
      ]
    },
    {
      title: 'System',
      items: [
        { id: 'alerts', label: 'System Alerts', icon: <Bell size={18} /> },
        { id: 'reports', label: 'Analytics & Reports', icon: <BarChart2 size={18} /> },
        { id: 'settings', label: 'System Settings', icon: <Settings size={18} /> },
      ]
    }
  ];

  const renderContent = () => {
    switch (activeView) {
      case 'dashboard':
        return <ManagementSummary onNavigate={setActiveView} />;
      case 'profile':
        return <ProfileManagement user={user} />;
      case 'notifications':
        return <NotificationManagement currentUserRole="Management" />;
      case 'contracts':
        return <ContractManagement currentUserRole="Management" />;
      case 'site-management':
        return <SiteManagement currentUserRole="Management" />;
      case 'clients':
        return <ClientManagement currentUserRole="Management" />;
      case 'team':
        return <TeamManagement currentUserRole="Management" />;
      case 'guards':
        return <GuardManagement currentUserRole="Management" />;
      case 'shop':
        return <VehicleManagement currentUserRole="Management" />;
      case 'applications':
        return <ApplicationManagement currentUserRole="Management" />;
      case 'training':
        return <TrainingManagement currentUserRole="Management" />;
      case 'certifications':
        return <CertificationManagement currentUserRole="Management" />;
      case 'missions':
        return <MissionManagement currentUserRole="Management" />;
      case 'payroll':
        return <PayrollManagement currentUserRole="Management" />;
      case 'uniforms':
        return <UniformManagement currentUserRole="Management" />;
      default:
        return <PlaceholderView title={activeView.replace('-', ' ').toUpperCase()} />;
    }
  };

  return (
    <PortalLayout
      user={user}
      title="MANAGEMENT"
      subtitle="Deputy Chief"
      onLogout={onLogout}
      onNavigate={onNavigate}
      navigation={navigation}
      activeView={activeView}
      onViewChange={(id) => setActiveView(id as ViewID)}
    >
      {renderContent()}
    </PortalLayout>
  );
};

export default ManagementApplication;
