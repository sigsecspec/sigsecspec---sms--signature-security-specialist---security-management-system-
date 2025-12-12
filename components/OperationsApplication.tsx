
import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, CheckCircle, Briefcase, Award, 
  Users, FileText, LayoutDashboard, Settings, 
  MapPin, Target, Send, MessageSquare, User,
  Truck, DollarSign, Shirt, FileBarChart, Gavel, Activity,
  Box, BadgeCheck, UserPlus, BookOpen
} from 'lucide-react';
import { PageView } from '../types';
import PortalLayout, { NavGroup } from './layout/PortalLayout';
import { PlaceholderView } from './common/DashboardWidgets';
import OperationsSummary from './modules/operations/OperationsSummary';
import ApplicationManagement from './modules/shared/ApplicationTrainingManagement';
import TrainingManagement from './modules/shared/TrainingManagement';
import ContractManagement from './modules/shared/ContractManagement';
import SiteManagement from './modules/shared/SiteManagement';
import MissionManagement from './modules/shared/MissionManagement';
import TeamManagement from './modules/shared/TeamManagement';
import GuardManagement from './modules/shared/GuardManagement';
import VehicleManagement from './modules/shared/VehicleManagement';
import ClientManagement from './modules/shared/ClientManagement';
import UniformManagement from './modules/shared/UniformManagement';
import PayrollManagement from './modules/shared/PayrollManagement';
import LiveControlPanel from './modules/shared/LiveControlPanel';
import ProfileManagement from './modules/shared/ProfileManagement';
import InventoryManagement from './modules/operations/InventoryManagement';
import CertificationManagement from './modules/shared/CertificationManagement';
import NotificationManagement from './modules/shared/NotificationManagement';
import OperationsApplicationForm from './applications/OperationsApplicationForm';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../services/supabase';

interface OperationsApplicationProps {
  onNavigate: (page: PageView) => void;
}

type AppStatus = 'incomplete' | 'pending' | 'approved' | 'active';
type ViewID = 
  | 'dashboard' | 'profile' | 'messages' | 'notifications'
  | 'contracts' | 'site-management' | 'clients' | 'team' | 'guards' | 'shop' | 'applications' | 'training' | 'payroll' | 'uniforms' | 'missions'
  | 'reports' | 'appeals' | 'live-control' | 'settings' | 'inventory' | 'certifications';

const OperationsApplication: React.FC<OperationsApplicationProps> = ({ onNavigate }) => {
  const { user, profile, signOut } = useAuth();
  const [status, setStatus] = useState<AppStatus>('incomplete');
  const [pendingCerts, setPendingCerts] = useState(0);

  useEffect(() => {
    if (user) {
        if (profile?.role === 'operations' && profile.status === 'active') {
            setStatus('active');
            fetchPendingCerts();
        } else {
            checkApplicationStatus(user.id);
        }
    }
  }, [user, profile]);

  const fetchPendingCerts = async () => {
      const { count } = await supabase.from('user_certifications').select('*', { count: 'exact', head: true }).eq('status', 'pending_verification');
      setPendingCerts(count || 0);
  };

  const checkApplicationStatus = async (userId: string) => {
      const { data } = await supabase
        .from('staff_applications')
        .select('*')
        .eq('user_id', userId)
        .eq('position_type', 'Operations')
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

  if (status === 'active' || status === 'approved') {
      return <ActiveDashboardView user={profile} onNavigate={onNavigate} onLogout={handleLogout} pendingCerts={pendingCerts} />;
  }

  if (status === 'pending') {
    return <PendingView onNavigate={onNavigate} />;
  }

  if (!user) {
      return (
          <div className="min-h-screen bg-brand-black flex flex-col items-center justify-center p-8">
              <p className="text-white mb-4">Login required for Operations Application.</p>
              <button onClick={() => onNavigate('login')} className="bg-brand-sage text-black px-6 py-2 rounded font-bold">Log In</button>
          </div>
      );
  }

  return (
    <div className="min-h-screen bg-brand-black py-24 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <button
          onClick={() => onNavigate('home')}
          className="flex items-center text-brand-silver hover:text-brand-sage mb-8 transition-colors group"
        >
          <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
          Back to Home
        </button>

        <OperationsApplicationForm user={user} onSubmit={handleSubmit} />
      </div>
    </div>
  );
};

const PendingView = ({ onNavigate }: { onNavigate: (p: PageView) => void }) => (
  <div className="min-h-screen bg-brand-black flex flex-col items-center justify-center p-4 py-24">
    <div className="max-w-3xl w-full bg-brand-ebony rounded-xl p-12 border border-brand-sage/20 shadow-2xl text-center">
        <div className="w-20 h-20 bg-brand-sage/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-brand-sage" />
        </div>
        <h2 className="text-3xl font-bold text-white mb-4">Application Submitted</h2>
        <div className="text-gray-400 mb-8 max-w-lg mx-auto text-lg space-y-4">
            <p>Your detailed operations application has been received.</p>
            <p className="text-brand-silver font-medium">Next Steps:</p>
            <ul className="list-disc text-left pl-8 text-sm space-y-2">
                <li>Applicant awaits email response from Owner/Co-Owner.</li>
                <li>Applications are reviewed by Owner/Co-Owner only.</li>
                <li>There is no automatic account creation for this role.</li>
                <li>Response is via email only.</li>
            </ul>
        </div>
        <button onClick={() => onNavigate('home')} className="px-8 py-3 bg-brand-black border border-brand-700 text-white rounded font-bold hover:bg-brand-800 transition-colors">Return Home</button>
    </div>
  </div>
);

const ActiveDashboardView = ({ user, onNavigate, onLogout, pendingCerts }: any) => {
  const [activeView, setActiveView] = useState<ViewID>('dashboard');

  const navigation: NavGroup[] = [
    {
      title: 'Main Views',
      items: [
        { id: 'dashboard', label: 'Ops Dashboard', icon: <LayoutDashboard size={18} /> },
        { id: 'profile', label: 'My Profile', icon: <User size={18} /> },
        { id: 'messages', label: 'Communications', icon: <MessageSquare size={18} /> },
        { id: 'notifications', label: 'Notifications', icon: <Send size={18} /> },
      ]
    },
    {
      title: 'Management Views',
      items: [
        { id: 'missions', label: 'Missions', icon: <Target size={18} /> },
        { id: 'contracts', label: 'Contracts', icon: <FileText size={18} /> },
        { id: 'site-management', label: 'Sites', icon: <MapPin size={18} /> },
        { id: 'clients', label: 'Client Management', icon: <Briefcase size={18} /> },
        { id: 'team', label: 'Team Management', icon: <Users size={18} /> },
        { id: 'guards', label: 'Personnel', icon: <Users size={18} /> },
        { id: 'shop', label: 'Fleet / Shop', icon: <Truck size={18} /> },
        { id: 'inventory', label: 'Inventory & Armory', icon: <Box size={18} /> },
        { id: 'applications', label: 'Applications', icon: <UserPlus size={18} /> },
        { id: 'training', label: 'Training Mgmt', icon: <BookOpen size={18} /> },
        { id: 'certifications', label: 'Certifications', icon: <BadgeCheck size={18} />, badge: pendingCerts > 0 ? pendingCerts : undefined },
        { id: 'payroll', label: 'Payroll', icon: <DollarSign size={18} /> },
        { id: 'uniforms', label: 'Uniforms', icon: <Shirt size={18} /> },
      ]
    },
    {
      title: 'Oversight Views',
      items: [
        { id: 'reports', label: 'Reports', icon: <FileBarChart size={18} /> },
        { id: 'appeals', label: 'Appeals', icon: <Gavel size={18} /> },
        { id: 'live-control', label: 'Live Monitor', icon: <Activity size={18} /> },
        { id: 'settings', label: 'Settings', icon: <Settings size={18} /> },
      ]
    }
  ];

  const renderContent = () => {
    switch (activeView) {
      case 'dashboard':
        return <OperationsSummary onNavigate={setActiveView} />;
      case 'profile':
        return <ProfileManagement user={user} />;
      case 'notifications':
        return <NotificationManagement currentUserRole="Operations" />;
      case 'missions':
        return <MissionManagement currentUserRole="Operations" />;
      case 'contracts':
        return <ContractManagement currentUserRole="Operations" />;
      case 'site-management':
        return <SiteManagement currentUserRole="Operations" />;
      case 'clients':
        return <ClientManagement currentUserRole="Operations" />;
      case 'team':
        return <TeamManagement currentUserRole="Operations" />;
      case 'guards':
        return <GuardManagement currentUserRole="Operations" />;
      case 'shop':
        return <VehicleManagement currentUserRole="Operations" />;
      case 'inventory':
        return <InventoryManagement />;
      case 'applications':
        return <ApplicationManagement currentUserRole="Operations" />;
      case 'training':
        return <TrainingManagement currentUserRole="Operations" />;
      case 'certifications':
        return <CertificationManagement currentUserRole="Operations" />;
      case 'payroll':
        return <PayrollManagement currentUserRole="Operations" />;
      case 'uniforms':
        return <UniformManagement currentUserRole="Operations" />;
      case 'live-control':
        return <LiveControlPanel />;
      default:
        return <PlaceholderView title={activeView.replace('-', ' ').toUpperCase()} />;
    }
  };

  return (
    <PortalLayout
      user={user}
      title="OPERATIONS"
      subtitle="Command Center"
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

export default OperationsApplication;
