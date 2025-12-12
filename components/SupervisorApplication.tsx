
import React, { useState, useEffect } from 'react';
import { ArrowLeft, CheckCircle } from 'lucide-react';
import { PageView } from '../types';
import SupervisorDashboard from './dashboards/SupervisorDashboard';
import SupervisorApplicationForm from './applications/SupervisorApplicationForm';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../services/supabase';

interface SupervisorApplicationProps {
  onNavigate: (page: PageView) => void;
}

type AppStatus = 'incomplete' | 'pending' | 'submitted' | 'approved' | 'active' | 'pending_review';

const SupervisorApplication: React.FC<SupervisorApplicationProps> = ({ onNavigate }) => {
  const { user, profile, refreshProfile, signOut } = useAuth();
  const [status, setStatus] = useState<AppStatus>('incomplete');

  useEffect(() => {
    if (user) {
        if (profile?.role === 'supervisor' && profile.status === 'active') {
            setStatus('active');
        } else {
            checkApplicationStatus(user.id);
        }
    }
  }, [user, profile]);

  const checkApplicationStatus = async (userId: string) => {
      // Query staff_applications for Supervisor position
      const { data } = await supabase
        .from('staff_applications')
        .select('*')
        .eq('user_id', userId)
        .eq('position_type', 'Supervisor')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
      
      if (data) {
          if (data.status === 'approved' || data.status === 'active') setStatus('active');
          else if (data.status === 'pending_review' || data.status === 'under_review') setStatus('submitted');
          else if (data.status === 'incomplete') setStatus('incomplete');
      }
  };

  const handleSubmit = async (formData: any) => {
    // Form submission logic is handled inside SupervisorApplicationForm which inserts into staff_applications
    // We just update local state here
    setStatus('submitted');
    window.scrollTo(0, 0);
  };

  const handleLogout = async () => {
    await signOut();
    onNavigate('login');
  };

  if (status === 'active') {
      return <SupervisorDashboard user={profile} onNavigate={onNavigate} onLogout={handleLogout} />;
  }

  if (status === 'submitted') {
    return (
      <div className="min-h-screen bg-brand-black flex flex-col items-center justify-center p-4 py-24">
        <div className="max-w-3xl w-full bg-brand-ebony rounded-xl p-8 border border-brand-sage/20 shadow-2xl text-center">
            <CheckCircle className="w-20 h-20 text-green-500 mx-auto mb-6" />
            <h2 className="text-3xl font-bold text-white mb-4">Application Submitted</h2>
            <p className="text-gray-400 mb-8">Your supervisor application is under review. You will receive an email once your status changes.</p>
            <button onClick={() => onNavigate('home')} className="text-brand-sage hover:underline">Return Home</button>
        </div>
      </div>
    );
  }

  if (!user) {
      return (
          <div className="min-h-screen bg-brand-black flex flex-col items-center justify-center p-8">
              <p className="text-white mb-4">You must be logged in to apply for a Supervisor position.</p>
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
          <h1 className="text-3xl md:text-4xl font-display font-bold text-white mb-4">
            Supervisor Application
          </h1>
          <p className="text-brand-silver max-w-2xl mx-auto">
            Take the next step in your career. We are looking for leaders who exemplify professionalism, discipline, and operational excellence.
          </p>
        </div>

        <SupervisorApplicationForm user={user} onSubmit={handleSubmit} />
      </div>
    </div>
  );
};

export default SupervisorApplication;