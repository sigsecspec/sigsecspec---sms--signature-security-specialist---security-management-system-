
import React, { useState, useEffect } from 'react';
import Navbar from '../shared/components/layout/Navbar';
import Hero from '../features/public-website/components/Hero';
import Services from '../features/public-website/components/Services';
import Features from '../features/public-website/components/Features';
import About from '../features/public-website/components/About';
import Contact from '../features/public-website/components/Contact';
import Testimonials from '../features/public-website/components/Testimonials';
import AIChatbot from '../features/public-website/components/AIChatbot';
import HowItWorks from '../features/public-website/components/HowItWorks';
import ClientApplication from '../features/applications/components/ClientApplicationPage';
import GuardApplication from '../features/applications/components/GuardApplicationPage';
import SupervisorApplication from '../features/applications/components/SupervisorApplicationPage';
import OperationsApplication from '../features/applications/components/OperationsApplicationPage';
import ManagementApplication from '../features/applications/components/ManagementApplicationPage';
import OwnerApplication from '../features/owner/components/OwnerDashboardPage';
import DispatchApplication from '../features/dispatch/components/DispatchDashboardPage';
import SecretaryApplication from '../features/secretary/components/SecretaryDashboardPage';
import ClientTraining from '../features/training/components/ClientTrainingPage';
import GuardTraining from '../features/training/components/GuardTrainingPage';
import MyMissions from '../features/missions/components/MyMissions';
import MissionBoard from '../features/missions/components/MissionBoard';
import ActiveMissionDashboard from '../features/missions/components/ActiveMissionDashboard';
import ActiveLeadMissionDashboard from '../features/missions/components/ActiveLeadMissionDashboard';
import SpotCheckDashboard from '../features/supervisor/components/SpotCheckDashboard';
import ManagementTraining from '../features/training/components/ManagementTrainingPage';
import OperationsTraining from '../features/training/components/OperationsTrainingPage';
import SupervisorTraining from '../features/training/components/SupervisorTrainingPage';
import Login from '../features/authentication/components/Login';
import LeadGuardDashboard from '../features/guards/components/LeadGuardDashboard';
import ClientDashboard from '../features/clients/components/ClientDashboardPage';
import Settings from '../features/settings/components/Settings';
import Footer from '../shared/components/layout/Footer';
import PortalHeader from '../shared/components/layout/PortalHeader';
import ProfileManagement from '../features/settings/components/ProfileManagement';
import { PageView } from '../shared/types/index';
import { AuthProvider, useAuth } from '../shared/contexts/AuthContext';
import { ThemeProvider } from '../shared/contexts/ThemeContext';

function AppContent() {
  const [currentPage, setCurrentPage] = useState<PageView>('home');
  const { user, profile, loading, signOut } = useAuth();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [currentPage]);

  // Redirect to dashboard if logged in and on login/home page
  useEffect(() => {
    if (!loading && user && profile && (currentPage === 'login' || currentPage === 'home')) {
        // Redirect based on role
        switch(profile.role) {
            case 'guard': setCurrentPage('guard-application'); break; // Using app page as dash container for now
            case 'client': setCurrentPage('client-application'); break;
            case 'owner': setCurrentPage('owner-application'); break;
            case 'operations': setCurrentPage('operations-application'); break;
            case 'dispatch': setCurrentPage('dispatch-application'); break;
            case 'secretary': setCurrentPage('secretary-application'); break;
            case 'supervisor': setCurrentPage('supervisor-application'); break;
            case 'management': setCurrentPage('management-application'); break;
            default: break;
        }
    }
  }, [user, profile, loading, currentPage]);

  const isPortalPage = [
    'login',
    'client-application',
    'guard-application',
    'supervisor-application',
    'operations-application',
    'management-application',
    'owner-application',
    'dispatch-application',
    'secretary-application',
    'lead-guard-dashboard',
    'client-training',
    'guard-training',
    'guard-missions',
    'guard-mission-board',
    'guard-active-mission',
    'guard-active-lead-mission',
    'supervisor-spot-check',
    'management-training',
    'operations-training',
    'supervisor-training',
    'settings',
    'profile'
  ].includes(currentPage);

  // List of pages that require authentication
  const protectedPages: PageView[] = [
    'profile', 
    'settings', 
    'guard-missions', 
    'guard-mission-board', 
    'guard-active-mission',
    'guard-active-lead-mission',
    'supervisor-spot-check',
    'client-training',
    'guard-training',
    'management-training',
    'operations-training',
    'supervisor-training'
  ];

  const renderPage = () => {
    // If loading auth state, show a simple spinner or splash
    if (loading) return (
      <div className="min-h-screen bg-theme-bg-primary flex flex-col items-center justify-center">
        <div className="w-12 h-12 border-4 border-brand-sage border-t-transparent rounded-full animate-spin mb-4"></div>
        <div className="text-brand-sage font-display tracking-widest text-sm">SIGNATURE SECURITY</div>
      </div>
    );

    // Guard Clause for Protected Routes
    if (!user && protectedPages.includes(currentPage)) {
       return <Login onNavigate={setCurrentPage} />;
    }

    switch (currentPage) {
      case 'home':
        return (
          <>
            <Hero onNavigate={setCurrentPage} />
            <Features />
            <Services />
            <Testimonials />
            <About />
            <Contact />
          </>
        );
      case 'services':
        return <Services />;
      case 'about':
        return <About />;
      case 'contact':
        return <Contact />;
      case 'how-it-works':
        return <HowItWorks />;
      case 'client-application':
        return <ClientApplication onNavigate={setCurrentPage} />;
      case 'guard-application':
        return <GuardApplication onNavigate={setCurrentPage} />;
      case 'supervisor-application':
        return <SupervisorApplication onNavigate={setCurrentPage} />;
      case 'operations-application':
        return <OperationsApplication onNavigate={setCurrentPage} />;
      case 'management-application':
        return <ManagementApplication onNavigate={setCurrentPage} />;
      case 'owner-application':
        return <OwnerApplication onNavigate={setCurrentPage} />;
      case 'dispatch-application':
        return <DispatchApplication onNavigate={setCurrentPage} />;
      case 'secretary-application':
        return <SecretaryApplication onNavigate={setCurrentPage} />;
      case 'lead-guard-dashboard':
        return <LeadGuardDashboard onNavigate={setCurrentPage} />;
      case 'client-training':
        return <ClientTraining onNavigate={setCurrentPage} />;
      case 'guard-training':
        return <GuardTraining onNavigate={setCurrentPage} />;
      case 'guard-missions':
        return <MyMissions onNavigate={setCurrentPage} />;
      case 'guard-mission-board':
        return <MissionBoard onNavigate={setCurrentPage} />;
      case 'guard-active-mission':
        return <ActiveMissionDashboard onNavigate={setCurrentPage} />;
      case 'guard-active-lead-mission':
        return <ActiveLeadMissionDashboard onNavigate={setCurrentPage} />;
      case 'supervisor-spot-check':
        return <SpotCheckDashboard onNavigate={setCurrentPage} />;
      case 'management-training':
        return <ManagementTraining onNavigate={setCurrentPage} />;
      case 'operations-training':
        return <OperationsTraining onNavigate={setCurrentPage} />;
      case 'supervisor-training':
        return <SupervisorTraining onNavigate={setCurrentPage} />;
      case 'settings':
        return <Settings onNavigate={setCurrentPage} user={profile} />;
      case 'profile':
        return (
            <div className="min-h-screen bg-brand-black flex flex-col">
                <PortalHeader 
                    user={profile ? { name: profile.full_name, role: profile.role, email: profile.email } : null}
                    title="PROFILE"
                    subtitle="Management"
                    onLogout={signOut}
                    onNavigate={setCurrentPage}
                />
                <div className="flex-1 max-w-7xl mx-auto w-full p-4 md:p-8">
                    <ProfileManagement user={profile} />
                </div>
            </div>
        );
      case 'login':
        return <Login onNavigate={setCurrentPage} />;
      default:
        return <Hero onNavigate={setCurrentPage} />;
    }
  };

  return (
    <div className="min-h-screen bg-theme-bg-primary text-theme-text-primary font-sans selection:bg-brand-sage selection:text-white transition-colors duration-300">
      {!isPortalPage && <Navbar currentPage={currentPage} onNavigate={setCurrentPage} />}
      
      <main>
        {renderPage()}
      </main>

      {!isPortalPage && <Footer onNavigate={setCurrentPage} />}
      <AIChatbot />
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <AppContent />
      </ThemeProvider>
    </AuthProvider>
  );
}

export default App;
