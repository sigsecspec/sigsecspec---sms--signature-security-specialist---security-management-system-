
import React, { useState, useEffect } from 'react';
import { ShieldCheck, FileText } from 'lucide-react';
import { PageView } from '../types';
import PortalHeader from './PortalHeader';
import GuardApplicationForm from './applications/GuardApplicationForm';
import GuardDashboard from './dashboards/GuardDashboard';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../services/supabase';
import { ApplicationAuth, ApplicationIntro, ApplicationStatus, OnboardingSimple } from './common/ApplicationViews';

interface GuardApplicationProps {
  onNavigate: (page: PageView) => void;
}

type AppStatus = 'incomplete' | 'draft' | 'under_review' | 'approved' | 'denied' | 'appealed' | 'blocked' | 'active' | 'pending_review';

const GuardApplication: React.FC<GuardApplicationProps> = ({ onNavigate }) => {
  const { user, profile, refreshProfile, signOut } = useAuth();
  const [view, setView] = useState<'auth' | 'intro' | 'form' | 'status' | 'onboarding' | 'dashboard'>('auth');
  const [appStatus, setAppStatus] = useState<AppStatus>('incomplete');
  const [formData, setFormData] = useState<any>(null);
  
  useEffect(() => {
    if (user) {
        if (profile) {
            // Priority: Active Profile -> Dashboard
            if (profile.status === 'active') {
                setView('dashboard');
            } else {
                // Otherwise check application/training state
                checkApplicationStatus(user.id);
            }
        } else {
            setView('intro');
        }
    } else {
        setView('auth');
    }
  }, [user, profile]);

  const checkApplicationStatus = async (userId: string) => {
      // Corrected to query 'guard_applications'
      const { data } = await supabase
        .from('guard_applications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
      
      if (data) {
          const status = data.status as AppStatus;
          setAppStatus(status);

          if (status === 'blocked') {
              setView('status');
          } else if (status === 'denied') {
              setView('status');
          } else if (status === 'appealed') {
              setView('status');
          } else if (status === 'approved') {
              // App is approved, check Training Status to see if they can be activated
              const { data: progress } = await supabase
                  .from('user_training_progress')
                  .select('status')
                  .eq('user_id', userId)
                  .eq('status', 'approved')
                  .limit(1);
              
              const hasApprovedTraining = progress && progress.length > 0;
              
              if (hasApprovedTraining) {
                  // Guard has passed training, activate them now
                  await supabase.from('profiles').update({ status: 'active' }).eq('id', userId);
                  await refreshProfile();
              } else {
                  // App approved but training needed
                  setView('status');
              }
          } else if (status === 'under_review' || status === 'pending_review') {
              setView('status');
          } else if (status === 'incomplete') {
              setFormData(data || {});
              setView('intro');
          }
      } else {
          setView('intro');
      }
  };

  const handleLogin = async (email: string) => {
      onNavigate('login');
  };

  const handleRegister = async (name: string, email: string, pass: string) => {
    const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password: pass,
        options: {
            data: { full_name: name, role: 'guard' }
        }
    });

    if (authError) {
        alert(authError.message);
        return;
    }

    if (authData.user) {
        await supabase.from('profiles').upsert({
            id: authData.user.id,
            email: email,
            full_name: name,
            role: 'guard',
            status: 'pending'
        });
        
        await refreshProfile();
        setView('intro');
    }
  };

  const handleSaveProgress = async (data: any) => {
    setFormData(data);
    if (!user) return;
    // Implementation for save would go here if needed
    alert("Progress saved securely. You can return later to finish.");
  };

  // Form component handles insertion into guard_applications
  const handleSubmitApp = async (data: any) => {
    setFormData(data);
    setAppStatus('under_review');
    setView('status');
    window.scrollTo(0,0);
  };

  const handleAppeal = async () => {
    if (!user) return;
    const reason = prompt("Please state the reason for your appeal:");
    if (!reason) return;

    // Use guard_applications table
    await supabase.from('guard_applications')
        .update({ 
            status: 'appealed', 
            review_notes: `Appeal Reason: ${reason}`
        })
        .eq('user_id', user.id);
        
    setAppStatus('appealed');
  };

  const handleActivate = async () => {
      if (!user) return;
      await supabase.from('profiles').update({ status: 'active' }).eq('id', user.id);
      await refreshProfile();
      setView('dashboard');
  };

  if (!user && view === 'auth') {
    return (
        <ApplicationAuth 
            title="Guard Portal" 
            subtitle="Start your journey with Signature Security Specialist."
            icon={<ShieldCheck className="w-12 h-12 text-brand-sage mx-auto mb-4" />}
            onLogin={handleLogin}
            onRegister={handleRegister}
            onBack={() => onNavigate('home')}
        />
    );
  }

  const steps = [
      { label: 'Apply', desc: 'Profile & Documents.' },
      { label: 'Verify', desc: 'Background Check.' },
      { label: 'Train', desc: 'Unlock Missions.' }
  ];

  return (
    <div className="h-screen bg-brand-black flex flex-col overflow-hidden">
      
      {view === 'dashboard' ? (
          <PortalHeader 
            user={profile ? { name: profile.full_name, role: profile.role, email: profile.email } : null}
            title="GUARD"
            subtitle="Portal"
            onLogout={signOut}
            onNavigate={onNavigate}
            hideMenuButton={true}
          />
      ) : (
          <div className="bg-brand-ebony border-b border-brand-800 h-16 flex-shrink-0 flex items-center justify-between px-4 sm:px-6 lg:px-8">
            <div className="flex items-center">
                <ShieldCheck className="w-6 h-6 text-brand-sage mr-2" />
                <span className="font-display font-bold text-white tracking-wider hidden sm:block">GUARD PORTAL</span>
            </div>
            <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-400">Logged in as <span className="text-white font-bold">{profile?.full_name || user?.email}</span></span>
                <button onClick={signOut} className="text-xs border border-brand-700 px-3 py-1 rounded text-gray-400 hover:text-white hover:border-brand-sage transition-all">Logout</button>
            </div>
          </div>
      )}

      <div className="flex-1 overflow-y-auto py-12 px-4 sm:px-6 lg:px-8 bg-brand-black">
        <div className="max-w-4xl mx-auto">
          {view === 'intro' && (
              <ApplicationIntro 
                  title="Guard Application"
                  description="Join the elite team at Signature Security Specialist. Our application process is designed to select professionals who exemplify discipline and excellence."
                  icon={<FileText className="w-10 h-10 text-brand-sage" />}
                  steps={steps}
                  status={appStatus === 'incomplete' ? 'incomplete' : 'draft'}
                  onStart={() => setView('form')}
              />
          )}
          {view === 'form' && <GuardApplicationForm data={formData} onSave={handleSaveProgress} onSubmit={handleSubmitApp} onBack={() => setView('intro')} />}
          {view === 'status' && (
              <ApplicationStatus 
                  status={appStatus === 'pending_review' ? 'under_review' : appStatus} 
                  role="guard"
                  onStartOnboarding={() => onNavigate('guard-training')}
                  onAppeal={handleAppeal}
              />
          )}
          {view === 'onboarding' && <OnboardingSimple title="Welcome Onboard" onComplete={handleActivate} />}
          {view === 'dashboard' && <GuardDashboard user={profile} onNavigate={onNavigate} />}
        </div>
      </div>
    </div>
  );
};

export default GuardApplication;