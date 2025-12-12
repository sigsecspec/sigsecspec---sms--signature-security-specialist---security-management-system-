
import React, { useState, useEffect } from 'react';
import { Menu, X, ShieldCheck, ChevronRight, Calculator, User, LayoutDashboard } from 'lucide-react';
import { PageView } from '../types';
import { useAuth } from '../contexts/AuthContext';

interface NavbarProps {
  currentPage: PageView;
  onNavigate: (page: PageView) => void;
}

const Navbar: React.FC<NavbarProps> = ({ currentPage, onNavigate }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { user, profile } = useAuth();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navItems: { label: string; value: PageView }[] = [
    { label: 'Home', value: 'home' },
    { label: 'Services', value: 'services' },
    { label: 'How It Works', value: 'how-it-works' },
    { label: 'About', value: 'about' },
    { label: 'Contact', value: 'contact' },
  ];

  const handleNav = (page: PageView) => {
    onNavigate(page);
    setIsOpen(false);
  };

  const getDashboardPage = (): PageView => {
      if (!profile) return 'login';
      switch(profile.role) {
          case 'guard': return 'guard-application';
          case 'client': return 'client-application';
          case 'owner': return 'owner-application';
          case 'operations': return 'operations-application';
          case 'dispatch': return 'dispatch-application';
          case 'secretary': return 'secretary-application';
          case 'supervisor': return 'supervisor-application';
          case 'management': return 'management-application';
          default: return 'guard-application';
      }
  };

  return (
    <nav 
      className={`fixed w-full z-50 transition-all duration-500 border-b ${
        scrolled 
          ? 'bg-brand-black/90 backdrop-blur-xl border-white/10 py-3 shadow-lg' 
          : 'bg-transparent border-transparent py-6'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center cursor-pointer group" onClick={() => handleNav('home')}>
            <div className={`p-2 rounded-xl mr-3 transition-all duration-300 ${scrolled ? 'bg-brand-sage text-brand-black' : 'bg-white/10 text-brand-sage backdrop-blur-md border border-white/10 group-hover:bg-brand-sage group-hover:text-black'}`}>
                <ShieldCheck className="h-6 w-6 md:h-8 md:w-8" />
            </div>
            <div className="flex flex-col">
              <span className="font-display font-bold text-lg md:text-xl tracking-wider text-white group-hover:text-brand-sage transition-colors">SIGNATURE</span>
              <span className="text-[9px] md:text-[10px] tracking-[0.3em] uppercase font-medium text-brand-sage group-hover:text-white transition-colors">Security Specialist</span>
            </div>
          </div>
          
          {/* Desktop Nav */}
          <div className="hidden md:flex items-center space-x-1">
            {navItems.map((item) => (
              <button
                key={item.value}
                onClick={() => handleNav(item.value)}
                className={`px-4 py-2 rounded-lg text-sm font-bold uppercase tracking-wide transition-all duration-300 ${
                  currentPage === item.value
                    ? 'text-brand-sage bg-white/5 border border-white/10'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                {item.label}
              </button>
            ))}
            
            <div className="flex items-center pl-4 ml-4 border-l border-white/10 gap-3">
                <button
                    onClick={() => handleNav('contact')}
                    className="hidden lg:flex items-center px-4 py-2 rounded-lg border border-brand-sage/30 text-brand-sage hover:bg-brand-sage hover:text-black transition-all text-xs font-bold uppercase tracking-wider"
                >
                    <Calculator className="w-4 h-4 mr-2" /> Get Quote
                </button>
                
                {user ? (
                    <button
                        onClick={() => handleNav(getDashboardPage())}
                        className="bg-brand-sage hover:bg-white text-brand-black px-5 py-2.5 rounded-lg text-sm font-bold shadow-[0_0_20px_rgba(124,154,146,0.2)] hover:shadow-[0_0_30px_rgba(255,255,255,0.3)] transition-all transform hover:-translate-y-0.5 uppercase tracking-wide flex items-center"
                    >
                        <LayoutDashboard className="w-4 h-4 mr-2" /> Dashboard
                    </button>
                ) : (
                    <button
                        onClick={() => handleNav('login')}
                        className="bg-brand-ebony border border-white/10 hover:border-brand-sage text-white px-6 py-2.5 rounded-lg text-sm font-bold transition-all transform hover:-translate-y-0.5 uppercase tracking-wide flex items-center hover:text-brand-sage"
                    >
                        <User className="w-4 h-4 mr-2" /> Portal
                    </button>
                )}
            </div>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="p-2 rounded-lg text-white hover:bg-white/10 transition-colors"
            >
              {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-50 bg-brand-black/95 backdrop-blur-2xl md:hidden flex flex-col animate-fade-in-up">
          <div className="p-6 flex justify-between items-center border-b border-white/10">
             <div className="flex items-center">
                <ShieldCheck className="h-6 w-6 text-brand-sage mr-3" />
                <span className="font-display font-bold text-lg text-white tracking-wider">MENU</span>
             </div>
             <button onClick={() => setIsOpen(false)} className="p-2 text-gray-400 hover:text-white rounded-full hover:bg-white/10">
                <X className="h-6 w-6" />
             </button>
          </div>
          
          <div className="flex-1 flex flex-col justify-center px-8 space-y-4">
            {navItems.map((item) => (
              <button
                key={item.value}
                onClick={() => handleNav(item.value)}
                className={`w-full text-left py-4 text-2xl font-display font-bold border-b border-white/5 flex justify-between items-center group transition-colors ${
                  currentPage === item.value ? 'text-brand-sage' : 'text-white hover:text-brand-sage'
                }`}
              >
                {item.label}
                <ChevronRight className={`w-5 h-5 transition-transform group-hover:translate-x-2 ${currentPage === item.value ? 'opacity-100' : 'opacity-30'}`} />
              </button>
            ))}
            
            <div className="pt-8 grid grid-cols-2 gap-4">
                <button
                  onClick={() => handleNav('contact')}
                  className="w-full bg-brand-ebony border border-brand-sage/30 text-brand-sage py-4 rounded-xl text-sm font-bold uppercase tracking-wider flex justify-center items-center hover:bg-brand-sage hover:text-black transition-colors"
                >
                  <Calculator className="mr-2 w-4 h-4" /> Quote
                </button>
                
                {user ? (
                   <button
                      onClick={() => handleNav(getDashboardPage())}
                      className="w-full bg-brand-sage text-brand-black py-4 rounded-xl text-sm font-bold uppercase tracking-wider shadow-lg active:scale-95 transition-transform flex justify-center items-center"
                    >
                      <LayoutDashboard className="mr-2 w-4 h-4" /> Dashboard
                    </button>
                ) : (
                    <button
                      onClick={() => handleNav('login')}
                      className="w-full bg-brand-ebony border border-white/20 text-white py-4 rounded-xl text-sm font-bold uppercase tracking-wider shadow-lg active:scale-95 transition-transform flex justify-center items-center hover:bg-white/10"
                    >
                      <User className="mr-2 w-4 h-4" /> Login
                    </button>
                )}
            </div>
          </div>
          
          <div className="p-8 text-center border-t border-white/5">
             <p className="text-gray-600 text-[10px] uppercase tracking-widest font-bold">&copy; Signature Security Specialist</p>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
