
import React, { useState, useEffect } from 'react';
import { Shield, Briefcase, ArrowLeft, CheckCircle, BookOpen, AlertTriangle } from 'lucide-react';
import { PageView, ClientStatus } from '../types';
import ClientDashboard from './dashboards/ClientDashboard';
import ClientApplicationForm from './applications/ClientApplicationForm';
import ClientOnboarding from './ClientOnboarding';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../services/supabase';
import { ApplicationAuth, ApplicationIntro, ApplicationStatus } from './common/ApplicationViews';

interface ClientApplicationProps {
  onNavigate: (page: PageView) => void;
}

const ClientApplication: React.FC<ClientApplicationProps> = ({ onNavigate }) => {
  const { user, profile, refreshProfile, signOut } = useAuth();
  const [status, setStatus] = useState<ClientStatus>('incomplete');
  const [view, setView] = useState<'auth' | 'intro' | 'form' | 'status' | 'onboarding' | 'dashboard'>('auth');
  const [formData, setFormData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initializeView = async () => {
      setLoading(true);
      if (user) {
        if (profile) {
          // Check client_applications table
          const { data: appData } = await supabase
            .from('client_applications')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

          if (appData) {
            let appStatus = appData.status as ClientStatus;
            // Fix status type if string comparison issue
            const statusStr = appStatus as string;
            if(statusStr === 'pending_review') appStatus = 'under_review'; 

            setStatus(appStatus);
            setFormData(appData);

            if (profile.status === 'active') {
               setView('dashboard');
            } else if (appStatus === 'approved') {
               setView('onboarding');
            } else if (['under_review', 'denied', 'appealed', 'blocked'].includes(appStatus)) {
               setView('status');
            } else {
               setView('intro'); 
            }
          } else {
            setStatus('incomplete');
            setView('intro');
          }
        } else {
          setView('intro');
        }
      } else {
        setView('auth');
      }
      setLoading(false);
    };

    initializeView();
  }, [user, profile]);

  const handleLogin = async (email: string) => {
    onNavigate('login');
  };

  const handleRegister = async (name: string, email: string, pass: string) => {
    const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password: pass,
        options: {
            data: { full_name: name, role: 'client' }
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
            role: 'client',
            status: 'pending'
        });
        
        await refreshProfile();
        // Create initial entry in client_applications if needed, or wait for form
        setStatus('incomplete');
        setView('intro');
    }
  };

  const handleLogout = async () => {
    await signOut();
    setView('auth');
  };

  const handleSaveProgress = async (data: any) => {
    // Basic local save or insert draft
    setFormData(data);
    alert("Progress saved.");
  };

  const handleSubmitApp = async (data: any) => {
    setFormData(data);
    if (!user) return;
    
    // Form component handles the DB insert to client_applications
    // We just update local state
    await supabase.from('profiles').update({ status: 'pending' }).eq('id', user.id);

    setStatus('under_review');
    setView('status');
    window.scrollTo(0,0);
  };

  const handleAppeal = async () => {
    if (!user) return;
    const reason = prompt("Please state the reason for your appeal:");
    if (!reason) return;

    await supabase.from('client_applications')
        .update({ 
            status: 'appealed', 
            // no generic notes column in client_applications schema provided, reusing existing logic pattern
        })
        .eq('user_id', user.id);
        
    setStatus('appealed');
  };

  const handleFinishOnboarding = async () => {
    if (!user) return;
    
    // 1. Mark Application as Active/Complete
    await supabase.from('client_applications')
        .update({ status: 'active' })
        .eq('user_id', user.id);

    // 2. Create actual Client Record if not exists (should have been done by approval action, but double check)
    const { data: existingClient } = await supabase.from('clients').select('id').eq('id', user.id).single();
    
    if (!existingClient) {
        await supabase.from('clients').insert({
            id: user.id, // Using profile ID as Client ID
            business_name: formData?.business_name || profile?.full_name,
            industry_type: formData?.industry_type || 'Corporate',
            status: 'active'
        });
    }

    // 3. Mark Profile Active
    await supabase.from('profiles').update({ status: 'active' }).eq('id', user.id);
    
    await refreshProfile();
    setStatus('active');
    setView('dashboard');
  };

  if (loading) {
      return <div className="min-h-screen bg-brand-black flex items-center justify-center text-gray-500">Loading Client Portal...</div>;
  }

  if (view === 'auth') {
    return (
        <ApplicationAuth 
            title="Client Portal" 
            subtitle="Partner with Signature Security Specialist."
            icon={<Briefcase className="w-12 h-12 text-brand-sage mx-auto mb-4" />}
            onLogin={handleLogin}
            onRegister={handleRegister}
            onBack={() => onNavigate('home')}
        />
    );
  }

  if (view === 'intro') {
      const onboardingSteps = [
        { label: 'Application', desc: 'Complete the business profile & verification.' },
        { label: 'Verification', desc: 'We verify your license, insurance, and credit.' },
        { label: 'Approval', desc: 'Unlock contract & mission tools.' },
      ];

      return (
        <div className="flex flex-col h-screen bg-brand-black">
            <div className="bg-brand-ebony border-b border-brand-800 p-4 flex justify-between items-center">
                <div className="flex items-center text-white font-bold"><Shield className="w-6 h-6 text-brand-sage mr-2" /> Signature Client Portal</div>
                <button onClick={handleLogout} className="text-sm text-gray-400 hover:text-white">Logout</button>
            </div>
            <div className="flex-1 overflow-y-auto p-8">
                <div className="max-w-5xl mx-auto">
                    <ApplicationIntro 
                        title="Client Application"
                        description="Partner with Signature Security Specialist."
                        icon={<Briefcase className="w-10 h-10 text-brand-sage" />}
                        steps={onboardingSteps}
                        status={status === 'incomplete' ? 'incomplete' : 'draft'}
                        onStart={() => setView('form')}
                    />
                </div>
            </div>
        </div>
      );
  }

  if (view === 'form') {
      return (
        <div className="h-screen bg-brand-black overflow-y-auto">
            <div className="max-w-7xl mx-auto py-8 px-4">
                <ClientApplicationForm 
                    data={formData} 
                    onSave={handleSaveProgress} 
                    onSubmit={handleSubmitApp} 
                    onBack={() => setView('intro')} 
                />
            </div>
        </div>
      );
  }

  if (view === 'status') {
      return (
        <div className="flex flex-col h-screen bg-brand-black">
            <div className="bg-brand-ebony border-b border-brand-800 p-4 flex justify-between items-center">
                <div className="flex items-center text-white font-bold"><Shield className="w-6 h-6 text-brand-sage mr-2" /> Application Status</div>
                <button onClick={handleLogout} className="text-sm text-gray-400 hover:text-white">Logout</button>
            </div>
            <div className="flex-1 flex items-center justify-center p-4">
                <div className="max-w-3xl w-full">
                    <ApplicationStatus 
                        status={(status as string) === 'pending_review' ? 'under_review' : status} 
                        onStartOnboarding={() => setView('onboarding')} 
                        onAppeal={handleAppeal} 
                    />
                </div>
            </div>
        </div>
      );
  }

  if (view === 'onboarding') {
      return (
        <ClientOnboarding 
            onComplete={handleFinishOnboarding}
            onNavigateToTraining={() => onNavigate('client-training')}
        />
      );
  }

  if (view === 'dashboard') {
      return (
        <ClientDashboard user={profile} onNavigate={onNavigate} onLogout={handleLogout} />
      );
  }

  return <div>Loading...</div>;
};

export default ClientApplication;