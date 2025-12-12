
import React, { useState } from 'react';
import { ArrowLeft, CheckCircle, Clock, Ban, Lock, FileText, Briefcase, ShieldCheck, PlayCircle, AlertCircle, XCircle } from 'lucide-react';
import { InputLabel, InputField } from '../forms/FormElements';

// --- Auth View ---
interface AuthViewProps {
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  onLogin: (email: string) => void;
  onRegister: (name: string, email: string, pass: string) => void;
  onBack: () => void;
}

export const ApplicationAuth: React.FC<AuthViewProps> = ({ title, subtitle, icon, onLogin, onRegister, onBack }) => {
  const [isLogin, setIsLogin] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isLogin) onLogin(email);
    else onRegister(name, email, password);
  };

  return (
    <div className="min-h-screen bg-brand-black flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md bg-brand-ebony p-8 rounded-xl border border-brand-800 shadow-2xl animate-fade-in-up">
        <button onClick={onBack} className="flex items-center text-gray-500 hover:text-brand-sage mb-6 text-sm transition-colors">
          <ArrowLeft className="w-4 h-4 mr-1" /> Back to Home
        </button>
        
        <div className="text-center mb-8">
          <div className="mx-auto mb-4 flex justify-center">{icon}</div>
          <h2 className="text-2xl font-display font-bold text-white">{isLogin ? `${title} Login` : `Create ${title} Account`}</h2>
          <p className="text-gray-400 text-sm mt-2">
            {isLogin ? 'Access your dashboard.' : subtitle}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <div>
              <InputLabel>Full Name</InputLabel>
              <InputField type="text" required value={name} onChange={e => setName(e.target.value)} placeholder="Full Name" />
            </div>
          )}
          <div>
            <InputLabel>Email Address</InputLabel>
            <InputField type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="email@example.com" />
          </div>
          <div>
            <InputLabel>Password</InputLabel>
            <InputField type="password" required value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" />
          </div>
          
          <button type="submit" className="w-full bg-brand-sage text-white font-bold py-3 rounded hover:bg-brand-sage/90 transition-all mt-4">
            {isLogin ? 'Log In' : 'Create Account'}
          </button>
        </form>

        <div className="mt-6 text-center text-sm">
          <button onClick={() => setIsLogin(!isLogin)} className="text-brand-silver hover:text-white underline">
            {isLogin ? "Don't have an account? Create one" : "Already have an account? Log In"}
          </button>
        </div>
      </div>
    </div>
  );
};

// --- Intro View ---
interface IntroViewProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  steps: { label: string, desc: string }[];
  status: string;
  onStart: () => void;
}

export const ApplicationIntro: React.FC<IntroViewProps> = ({ title, description, icon, steps, status, onStart }) => {
  return (
    <div className="bg-brand-ebony p-8 rounded-xl border border-white/5 text-center animate-fade-in-up">
      <div className="w-20 h-20 bg-brand-800 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg border border-brand-700">
        {icon}
      </div>
      
      <h2 className="text-3xl font-display font-bold text-white mb-4">{title}</h2>
      
      {status === 'draft' || status === 'incomplete' ? (
        <div className="bg-yellow-900/20 border border-yellow-700/50 p-4 rounded-lg mb-8 max-w-lg mx-auto">
          <p className="text-yellow-500 font-bold flex items-center justify-center mb-1">
            <AlertCircle className="w-5 h-5 mr-2" />
            Inactive - Please Finish Application
          </p>
          <p className="text-gray-400 text-sm">Your progress has been saved. Please resume to complete the process.</p>
        </div>
      ) : (
        <p className="text-gray-400 max-w-2xl mx-auto mb-8 text-lg leading-relaxed">
          {description}
        </p>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto mb-12 text-left">
         {steps.map((step, idx) => (
           <div key={idx} className="bg-brand-black p-5 rounded-lg border border-brand-800 hover:border-brand-700 transition-colors">
              <div className="font-bold text-white mb-2 flex items-center">
                <span className="w-6 h-6 rounded-full bg-brand-sage text-black flex items-center justify-center text-xs font-bold mr-3 shadow">{idx + 1}</span> {step.label}
              </div>
              <p className="text-xs text-gray-500 ml-9">{step.desc}</p>
           </div>
         ))}
      </div>

      <button onClick={onStart} className="px-8 py-4 bg-brand-sage text-white font-bold rounded-lg hover:bg-brand-sage/90 shadow-lg shadow-brand-sage/20 transition-all transform hover:-translate-y-1">
        {status === 'draft' || status === 'incomplete' ? 'Finish Application' : 'Start Application'}
      </button>
    </div>
  );
};

// --- Status View ---
interface StatusViewProps {
  status: string;
  role?: string;
  onStartOnboarding?: () => void;
  onAppeal?: () => void;
}

export const ApplicationStatus: React.FC<StatusViewProps> = ({ status, onStartOnboarding, onAppeal, role }) => {
  const isGuard = role === 'guard';

  const config = {
    under_review: {
      icon: <Clock className="w-16 h-16 text-brand-black" />,
      color: 'bg-brand-sage',
      title: 'Application Under Review',
      desc: 'Your application has been successfully submitted and is currently being reviewed by our Operations Team. We are verifying your information. Standard processing time is 3-7 business days.',
      action: null
    },
    approved: {
      icon: isGuard ? <ShieldCheck className="w-16 h-16 text-brand-black" /> : <CheckCircle className="w-16 h-16 text-brand-black" />,
      color: 'bg-green-500',
      title: 'Application Approved',
      desc: isGuard 
        ? 'Congratulations! Your application has been approved. You are now ready to begin your training. You must complete the required modules to activate your account.'
        : 'Congratulations! Your application has been approved. You are now ready to begin the onboarding process to set up your profile and billing.',
      action: <button onClick={onStartOnboarding} className="mt-8 px-8 py-4 bg-green-600 text-white font-bold rounded-lg hover:bg-green-500 shadow-lg transition-all flex items-center justify-center mx-auto transform hover:-translate-y-1"><PlayCircle className="w-5 h-5 mr-2" /> {isGuard ? 'Go to Training Center' : 'Begin Onboarding'}</button>
    },
    denied: {
      icon: <XCircle className="w-16 h-16 text-white" />,
      color: 'bg-red-600',
      title: 'Application Denied',
      desc: 'After a thorough review, we are unable to approve your application at this time. If you believe this is an error, you may file an appeal.',
      action: onAppeal ? <button onClick={onAppeal} className="mt-8 px-6 py-3 border border-red-500 text-red-400 font-bold rounded-lg hover:bg-red-900/30 transition-all">File an Appeal</button> : null
    },
    appealed: {
      icon: <FileText className="w-16 h-16 text-brand-black" />,
      color: 'bg-yellow-500',
      title: 'Appeal Under Review',
      desc: 'Your appeal has been received and escalated to the Owner for a final decision. You will be notified via email of the outcome.',
      action: null
    },
    blocked: {
      icon: <Ban className="w-16 h-16 text-white" />,
      color: 'bg-gray-700',
      title: 'Account Deactivated',
      desc: 'We apologize. Your application and any appeals have been blocked. As a result, your account has been deactivated. We wish you the best in your future endeavors.',
      action: null
    }
  };

  const current = config[status as keyof typeof config] || config.under_review;

  return (
    <div className="bg-brand-ebony p-12 rounded-xl border border-white/5 text-center flex flex-col items-center shadow-2xl animate-fade-in-up">
      <div className={`w-32 h-32 rounded-full ${current.color} flex items-center justify-center mb-8 shadow-xl border-4 border-brand-black`}>
        {current.icon}
      </div>
      <h2 className="text-4xl font-display font-bold text-white mb-6 tracking-wide">{current.title}</h2>
      <p className="text-gray-400 max-w-2xl mx-auto text-lg leading-relaxed mb-4">
        {current.desc}
      </p>
      {current.action}
    </div>
  );
};

// --- Simple Onboarding View ---
export const OnboardingSimple: React.FC<{ title: string, onComplete: () => void }> = ({ title, onComplete }) => (
    <div className="bg-brand-ebony p-8 rounded-xl border border-white/5 max-w-3xl mx-auto text-center animate-fade-in-up">
        <h3 className="text-2xl font-bold text-white mb-4">{title}</h3>
        <p className="text-gray-400 mb-8">You have been approved. Please complete the mandatory onboarding setup to activate your dashboard.</p>
        <button onClick={onComplete} className="px-6 py-3 bg-brand-sage text-black font-bold rounded shadow-lg hover:bg-brand-sage/90">Complete Onboarding</button>
    </div>
);
