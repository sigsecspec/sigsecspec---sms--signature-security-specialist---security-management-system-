
import React, { useState } from 'react';
import { ArrowLeft, Lock, Mail, Phone, Eye, EyeOff, ShieldCheck, AlertCircle, ArrowRight, Zap, ChevronRight, LayoutDashboard } from 'lucide-react';
import { PageView } from '../types';
import { supabase } from '../services/supabase';
import { useAuth } from '../contexts/AuthContext';

interface LoginProps {
  onNavigate: (page: PageView) => void;
}

const Login: React.FC<LoginProps> = ({ onNavigate }) => {
  const [method, setMethod] = useState<'email' | 'phone'>('email');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [forgotPassword, setForgotPassword] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const { refreshProfile, loginWithDemo } = useAuth();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      // 1. Attempt Supabase Login
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email: identifier,
        password: password,
      });

      if (authError) throw authError;

      if (data.user) {
        // 2. Fetch Profile to determine redirect
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('role, status')
          .eq('id', data.user.id)
          .single();

        if (profileError && profileError.code !== 'PGRST116') {
           console.error("Profile fetch error", profileError);
        }

        const role = profile?.role;
        await refreshProfile(); 
        redirectBasedOnRole(role || 'guard');
      }

    } catch (err: any) {
      console.error(err);
      if (err.message === 'Failed to fetch') {
        setError('Unable to connect to server. Please check your internet or use Demo Mode below.');
      } else {
        setError(err.message || 'Invalid credentials.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoLogin = (role: string) => {
      loginWithDemo(role);
      redirectBasedOnRole(role);
  };

  const redirectBasedOnRole = (role: string) => {
      switch(role) {
          case 'guard': onNavigate('guard-application'); break;
          case 'client': onNavigate('client-application'); break;
          case 'owner': onNavigate('owner-application'); break;
          case 'operations': onNavigate('operations-application'); break;
          case 'dispatch': onNavigate('dispatch-application'); break;
          case 'secretary': onNavigate('secretary-application'); break;
          case 'supervisor': onNavigate('supervisor-application'); break;
          case 'management': onNavigate('management-application'); break;
          default: onNavigate('guard-application');
      }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(identifier, {
        redirectTo: window.location.origin + '/update-password',
      });
      if (error) throw error;
      setResetSent(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  if (forgotPassword) {
    return (
      <div className="min-h-screen bg-brand-black flex items-center justify-center p-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-brand-900 via-brand-black to-brand-black z-0"></div>
        
        <div className="w-full max-w-md bg-brand-ebony border border-brand-800 rounded-2xl p-8 shadow-2xl animate-fade-in-up relative z-10">
           <button onClick={() => { setForgotPassword(false); setResetSent(false); }} className="flex items-center text-gray-400 hover:text-brand-sage mb-6 text-sm transition-colors">
            <ArrowLeft className="w-4 h-4 mr-1" /> Back to Login
           </button>
           
           <div className="text-center mb-8">
             <div className="w-16 h-16 bg-brand-800/50 rounded-full flex items-center justify-center mx-auto mb-4 border border-brand-700 shadow-inner">
               <Lock className="w-8 h-8 text-brand-sage" />
             </div>
             <h2 className="text-2xl font-display font-bold text-white tracking-wide">Account Recovery</h2>
             <p className="text-gray-400 text-sm mt-2">Enter your registered email to receive a password reset link.</p>
           </div>

           {error && (
             <div className="bg-red-900/20 border border-red-500/50 p-3 rounded-lg flex items-center text-red-400 text-sm mb-6">
                <AlertCircle className="w-4 h-4 mr-2 flex-shrink-0" />
                {error}
             </div>
           )}

           {resetSent ? (
             <div className="bg-green-900/20 border border-green-500/30 p-6 rounded-xl text-center">
               <div className="w-12 h-12 bg-green-900/50 rounded-full flex items-center justify-center mx-auto mb-3">
                 <Zap className="w-6 h-6 text-green-400" />
               </div>
               <p className="text-green-400 font-bold mb-2">Check your inbox</p>
               <p className="text-gray-400 text-sm">We've sent a password reset link to <span className="text-white font-medium">{identifier}</span></p>
             </div>
           ) : (
             <form onSubmit={handleForgotPassword} className="space-y-5">
               <div>
                 <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5 ml-1">Email Address</label>
                 <div className="relative">
                   <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                   <input
                     type="email"
                     className="w-full bg-brand-black/50 border border-brand-800 rounded-lg p-3 pl-10 text-white focus:border-brand-sage focus:ring-1 focus:ring-brand-sage outline-none transition-all placeholder-gray-600"
                     placeholder="name@example.com"
                     value={identifier}
                     onChange={(e) => setIdentifier(e.target.value)}
                     required
                   />
                 </div>
               </div>
               <button
                 type="submit"
                 disabled={isLoading}
                 className="w-full bg-brand-sage text-black font-bold py-3.5 rounded-lg hover:bg-brand-sage/90 transition-all flex items-center justify-center shadow-[0_0_15px_rgba(124,154,146,0.3)] hover:shadow-[0_0_20px_rgba(124,154,146,0.5)] transform hover:-translate-y-0.5"
               >
                 {isLoading ? 'Sending...' : 'Send Reset Link'}
               </button>
             </form>
           )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brand-black flex">
      {/* Left Side - Image/Info */}
      <div className="hidden lg:flex w-1/2 relative bg-brand-900 overflow-hidden flex-col justify-between p-12">
        <div className="absolute inset-0 z-0">
          <img 
            src="https://images.unsplash.com/photo-1555431189-0fabf2667795?q=80&w=1974&auto=format&fit=crop" 
            alt="Security Background" 
            className="w-full h-full object-cover opacity-20 grayscale"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-brand-black via-brand-black/90 to-brand-black/40"></div>
          {/* Subtle Grid Overlay */}
          <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10"></div>
        </div>
        
        <div className="relative z-10 animate-fade-in-down">
          <div className="flex items-center mb-6 cursor-pointer group" onClick={() => onNavigate('home')}>
            <div className="bg-brand-sage/10 p-2 rounded-lg border border-brand-sage/20 group-hover:border-brand-sage/50 transition-colors mr-3">
               <ShieldCheck className="w-8 h-8 text-brand-sage" />
            </div>
            <div>
               <span className="font-display font-bold text-2xl text-white tracking-wider block">SIGNATURE</span>
               <span className="text-[10px] text-brand-sage uppercase tracking-[0.3em]">Security Specialist</span>
            </div>
          </div>
        </div>

        <div className="relative z-10 max-w-lg animate-fade-in-up">
          <h2 className="text-5xl font-display font-bold text-white mb-6 leading-tight">
            Elite Security <br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-sage to-white">Management System</span>
          </h2>
          <p className="text-gray-400 text-lg leading-relaxed mb-8 border-l-4 border-brand-sage pl-6">
            Access the command center for real-time mission control, personnel management, and operational analytics. Secure. Reliable. Professional.
          </p>
          <div className="flex items-center text-xs text-brand-silver font-mono space-x-4">
            <span className="flex items-center"><ShieldCheck className="w-3 h-3 mr-1.5" /> 256-bit Encryption</span>
            <span className="w-1 h-1 bg-brand-700 rounded-full"></span>
            <span>v2.4.0 (Stable)</span>
          </div>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center p-6 sm:p-12 lg:p-24 bg-brand-black relative">
        {/* Background ambient glow */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-brand-sage/5 rounded-full blur-3xl pointer-events-none -translate-y-1/2 translate-x-1/2"></div>

        <div className="max-w-md w-full mx-auto relative z-10">
          <button onClick={() => onNavigate('home')} className="flex items-center text-gray-500 hover:text-brand-sage mb-8 text-sm lg:hidden">
            <ArrowLeft className="w-4 h-4 mr-1" /> Return Home
          </button>

          <div className="mb-8">
            <h2 className="text-3xl font-display font-bold text-white mb-2">Welcome Back</h2>
            <p className="text-gray-400">Please sign in to access your portal.</p>
          </div>

          {error && (
             <div className="bg-red-900/20 border border-red-500/50 p-4 rounded-xl flex flex-col items-start text-red-400 text-sm mb-6 animate-fade-in-up shadow-lg">
                <div className="flex items-center mb-2 font-bold">
                    <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0" />
                    Authentication Error
                </div>
                <p className="mb-3 ml-7 opacity-90">{error}</p>
                {error.includes('Unable to connect') && (
                    <button 
                        onClick={() => handleDemoLogin('owner')}
                        className="ml-7 bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/50 px-4 py-2 rounded-md font-bold text-xs transition-colors flex items-center"
                    >
                        <Zap className="w-3 h-3 mr-2" /> Use Demo Mode (Owner)
                    </button>
                )}
             </div>
           )}

          <form onSubmit={handleLogin} className="space-y-5">
            
            {/* Input Type Toggle */}
            <div className="flex bg-brand-ebony p-1 rounded-lg border border-brand-800 mb-6">
              <button
                type="button"
                onClick={() => setMethod('email')}
                className={`flex-1 py-2 text-xs font-bold uppercase rounded-md transition-all ${method === 'email' ? 'bg-brand-sage text-black shadow-md' : 'text-gray-500 hover:text-white hover:bg-brand-800'}`}
              >
                Email
              </button>
              <button
                type="button"
                onClick={() => setMethod('phone')}
                className={`flex-1 py-2 text-xs font-bold uppercase rounded-md transition-all ${method === 'phone' ? 'bg-brand-sage text-black shadow-md' : 'text-gray-500 hover:text-white hover:bg-brand-800'}`}
              >
                Phone
              </button>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5 ml-1">
                {method === 'email' ? 'Email Address' : 'Phone Number'}
              </label>
              <div className="relative group">
                {method === 'email' ? (
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 group-focus-within:text-brand-sage transition-colors" />
                ) : (
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 group-focus-within:text-brand-sage transition-colors" />
                )}
                <input
                  type={method === 'email' ? 'email' : 'tel'}
                  className="w-full bg-brand-ebony border border-brand-800 rounded-xl p-4 pl-12 text-white focus:border-brand-sage focus:ring-1 focus:ring-brand-sage outline-none transition-all placeholder-gray-600"
                  placeholder={method === 'email' ? 'name@company.com' : '(555) 000-0000'}
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  required
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1.5 ml-1">
                <label className="block text-xs font-bold text-gray-500 uppercase">Password</label>
                <button type="button" onClick={() => setForgotPassword(true)} className="text-xs text-brand-sage hover:text-white transition-colors">
                  Forgot Password?
                </button>
              </div>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 group-focus-within:text-brand-sage transition-colors" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="w-full bg-brand-ebony border border-brand-800 rounded-xl p-4 pl-12 pr-12 text-white focus:border-brand-sage focus:ring-1 focus:ring-brand-sage outline-none transition-all placeholder-gray-600"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button 
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-brand-sage text-black font-bold py-4 rounded-xl hover:bg-brand-sage/90 transition-all flex items-center justify-center shadow-[0_0_20px_rgba(124,154,146,0.3)] hover:shadow-[0_0_30px_rgba(124,154,146,0.5)] transform hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {isLoading ? (
                <span className="flex items-center">
                  <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin mr-2"></div>
                  Authenticating...
                </span>
              ) : (
                <span className="flex items-center">Sign In <ArrowRight className="w-5 h-5 ml-2" /></span>
              )}
            </button>
          </form>

          {/* Demo Login Section */}
          <div className="mt-10 pt-8 border-t border-brand-800">
            <p className="text-gray-500 text-xs uppercase font-bold text-center mb-6 tracking-wider">Demo Access (No Password Required)</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {[
                { label: 'Guard', role: 'guard', icon: <ShieldCheck size={14} /> },
                { label: 'Client', role: 'client', icon: <LayoutDashboard size={14} /> },
                { label: 'Supervisor', role: 'supervisor', icon: <Eye size={14} /> },
                { label: 'Operations', role: 'operations', icon: <Zap size={14} /> },
                { label: 'Dispatch', role: 'dispatch', icon: <Phone size={14} /> },
                { label: 'Owner', role: 'owner', icon: <Lock size={14} /> },
              ].map((demo) => (
                <button
                  key={demo.role}
                  onClick={() => handleDemoLogin(demo.role)}
                  className="flex items-center justify-center gap-2 text-xs py-2.5 px-3 bg-brand-ebony border border-brand-800 hover:border-brand-sage text-gray-400 hover:text-white rounded-lg transition-all hover:shadow-lg hover:-translate-y-0.5"
                >
                  {demo.icon}
                  {demo.label}
                </button>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Login;
