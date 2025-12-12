
import React from 'react';
import { ShieldCheck, UserPlus, ChevronDown, Star, ArrowRight, Bot } from 'lucide-react';
import { PageView } from '../types';

interface HeroProps {
  onNavigate: (page: PageView) => void;
}

const Hero: React.FC<HeroProps> = ({ onNavigate }) => {
  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-brand-black">
      {/* Background with advanced overlay */}
      <div className="absolute inset-0 z-0">
        <img
          src="https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=2070&auto=format&fit=crop"
          alt="Signature Security HQ"
          className="w-full h-full object-cover opacity-40 scale-105 animate-pulse-slow"
        />
        {/* Cinematic Gradients */}
        <div className="absolute inset-0 bg-gradient-to-t from-brand-black via-brand-black/50 to-brand-black/40"></div>
        <div className="absolute inset-0 bg-gradient-to-r from-brand-black via-transparent to-brand-black"></div>
        
        {/* Texture Overlay */}
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay"></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col items-center text-center pt-20">
        
        {/* Animated Badge */}
        <div className="inline-flex items-center px-4 py-2 rounded-full bg-brand-sage/10 border border-brand-sage/30 backdrop-blur-md mb-8 animate-fade-in-down shadow-[0_0_20px_rgba(124,154,146,0.2)] hover:border-brand-sage/50 transition-colors cursor-default select-none">
          <Star className="w-3 h-3 text-brand-sage fill-brand-sage mr-2 animate-pulse" />
          <span className="text-brand-sage text-[10px] md:text-xs font-bold tracking-[0.3em] uppercase">Executive Security Solutions</span>
        </div>
        
        {/* Main Headline */}
        <h1 className="text-5xl md:text-7xl lg:text-9xl font-display font-bold text-white mb-6 tracking-tighter leading-none animate-fade-in-up">
          SIGNATURE <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-sage via-white to-brand-sage drop-shadow-[0_0_35px_rgba(124,154,146,0.3)]">
            STANDARD
          </span>
        </h1>
        
        {/* Subheadline */}
        <p className="mt-6 text-lg md:text-2xl text-gray-300 max-w-3xl mx-auto font-light leading-relaxed animate-fade-in-up delay-100">
          We redefine safety with precision, professionalism, and advanced <span className="text-brand-sage font-medium">Sentinel AI</span> technology. 
          <span className="hidden md:inline"> Protecting your assets, people, and peace of mind with executive-level discipline.</span>
        </p>
        
        {/* Call to Actions */}
        <div className="flex flex-col sm:flex-row gap-6 w-full max-w-xl mt-12 animate-fade-in-up delay-200">
          <button
            onClick={() => onNavigate('client-application')}
            className="flex-1 group relative px-8 py-4 bg-brand-sage text-black font-bold rounded-xl overflow-hidden transition-all hover:shadow-[0_0_40px_rgba(124,154,146,0.5)] hover:scale-[1.02]"
          >
            <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
            <span className="relative flex items-center justify-center text-sm md:text-base uppercase tracking-wider">
               <ShieldCheck className="mr-3 w-5 h-5" /> Hire Security
            </span>
          </button>
          
          <button
            onClick={() => onNavigate('guard-application')}
            className="flex-1 group px-8 py-4 bg-white/5 border border-white/10 text-white font-bold rounded-xl transition-all hover:bg-white/10 hover:border-brand-sage/50 backdrop-blur-sm"
          >
            <span className="flex items-center justify-center text-sm md:text-base uppercase tracking-wider group-hover:text-brand-sage transition-colors">
               <UserPlus className="mr-3 w-5 h-5" /> Join The Team
            </span>
          </button>
        </div>

        {/* Stats / Trust Indicators */}
        <div className="mt-24 w-full max-w-6xl border-t border-white/10 pt-10 grid grid-cols-2 md:grid-cols-4 gap-8 animate-fade-in-up delay-300">
           <div className="text-center group cursor-default">
              <span className="block text-3xl md:text-5xl font-display font-bold text-white mb-1 group-hover:text-brand-sage transition-colors duration-300">500+</span>
              <span className="text-[10px] text-gray-500 uppercase tracking-widest font-bold group-hover:text-gray-300 transition-colors">Elite Personnel</span>
           </div>
           <div className="text-center group cursor-default">
              <span className="block text-3xl md:text-5xl font-display font-bold text-white mb-1 group-hover:text-brand-sage transition-colors duration-300">24/7</span>
              <span className="text-[10px] text-gray-500 uppercase tracking-widest font-bold group-hover:text-gray-300 transition-colors flex items-center justify-center"><Bot className="w-3 h-3 mr-1 text-brand-sage" /> AI Command</span>
           </div>
           <div className="text-center group cursor-default">
              <span className="block text-3xl md:text-5xl font-display font-bold text-white mb-1 group-hover:text-brand-sage transition-colors duration-300">100%</span>
              <span className="text-[10px] text-gray-500 uppercase tracking-widest font-bold group-hover:text-gray-300 transition-colors">Client Retention</span>
           </div>
           <div className="text-center group cursor-default">
              <span className="block text-3xl md:text-5xl font-display font-bold text-white mb-1 group-hover:text-brand-sage transition-colors duration-300">CA</span>
              <span className="text-[10px] text-gray-500 uppercase tracking-widest font-bold group-hover:text-gray-300 transition-colors">Licensed & Insured</span>
           </div>
        </div>
        
        {/* Scroll Indicator */}
        <button 
            onClick={() => window.scrollTo({ top: window.innerHeight, behavior: 'smooth' })}
            className="absolute bottom-8 animate-bounce text-gray-600 hidden md:flex flex-col items-center cursor-pointer hover:text-brand-sage transition-colors"
        >
            <span className="text-[10px] uppercase tracking-widest mb-2">Explore</span>
            <ChevronDown size={20} />
        </button>
      </div>
    </div>
  );
};

export default Hero;
