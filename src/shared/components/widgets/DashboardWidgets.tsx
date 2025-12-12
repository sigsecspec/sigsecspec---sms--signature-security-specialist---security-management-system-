
import React, { useState } from 'react';
import { ChevronDown, ChevronRight, Lock, ArrowUpRight, ArrowDownRight } from 'lucide-react';

export interface KPIMeterProps {
  label: string;
  value: string;
  trend: 'up' | 'down';
  trendValue: string;
  color: string;
  icon: React.ReactElement;
}

export interface QuickActionCardProps {
  icon: React.ReactElement;
  label: string;
  badge?: number;
  color: string;
  onClick: () => void;
}

export const QuickActionCard: React.FC<QuickActionCardProps> = ({ icon, label, badge, color, onClick }) => {
  const getColorClasses = (c: string) => {
    switch(c) {
      case 'blue': return 'from-blue-500/10 to-blue-600/5 border-blue-500/20 text-blue-400 group-hover:border-blue-500/50';
      case 'green': return 'from-green-500/10 to-green-600/5 border-green-500/20 text-green-400 group-hover:border-green-500/50';
      case 'red': return 'from-red-500/10 to-red-600/5 border-red-500/20 text-red-400 group-hover:border-red-500/50';
      case 'orange': return 'from-orange-500/10 to-orange-600/5 border-orange-500/20 text-orange-400 group-hover:border-orange-500/50';
      case 'purple': return 'from-purple-500/10 to-purple-600/5 border-purple-500/20 text-purple-400 group-hover:border-purple-500/50';
      default: return 'from-brand-sage/10 to-brand-sage/5 border-brand-sage/20 text-brand-sage group-hover:border-brand-sage/50';
    }
  };

  const style = getColorClasses(color);

  return (
    <button 
      onClick={onClick}
      className={`glass-panel flex flex-col items-center justify-center p-4 rounded-2xl bg-gradient-to-br transition-all duration-300 group min-w-[100px] flex-1 hover:-translate-y-1 hover:shadow-lg relative overflow-hidden backdrop-blur-md ${style}`}
    >
      <div className={`p-3 rounded-xl mb-3 relative transition-transform group-hover:scale-110 bg-brand-black/40 shadow-inner`}>
        {React.cloneElement(icon as React.ReactElement<any>, { size: 24 })}
        {(badge || 0) > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-brand-ebony shadow-md animate-pulse">
            {badge}
          </span>
        )}
      </div>
      <span className="text-xs font-bold text-gray-400 group-hover:text-white text-center uppercase tracking-wide">{label}</span>
    </button>
  );
};

export const KPIMeter: React.FC<KPIMeterProps> = ({ label, value, trend, trendValue, color, icon }) => {
  const getColorHex = (c: string) => {
      const colors: any = { blue: '#3b82f6', green: '#22c55e', red: '#ef4444', orange: '#f97316', purple: '#a855f7' };
      return colors[c] || '#7C9A92';
  };

  const hex = getColorHex(color);

  return (
    <div className="glass-panel p-5 rounded-2xl relative overflow-hidden group hover:border-white/10 transition-all shadow-lg hover:shadow-xl bg-brand-ebony/60">
      {/* Background Icon Watermark */}
      <div className="absolute -bottom-4 -right-4 opacity-[0.05] group-hover:opacity-[0.1] transition-opacity transform group-hover:scale-110 duration-500 pointer-events-none">
        {React.cloneElement(icon as React.ReactElement<any>, { size: 90, color: hex })}
      </div>
      
      <div className="relative z-10">
        <div className="flex justify-between items-start mb-3">
           <div className={`p-2 rounded-lg bg-${color}-500/10 border border-${color}-500/20`}>
             {React.cloneElement(icon as React.ReactElement<any>, { size: 18, className: `text-${color}-500` })}
           </div>
           <div className={`flex items-center text-[10px] font-bold px-2 py-1 rounded-full bg-${color}-500/10 text-${color}-500 border border-${color}-500/20`}>
              {trend === 'up' ? <ArrowUpRight size={10} className="mr-1" /> : <ArrowDownRight size={10} className="mr-1" />}
              {trendValue}
           </div>
        </div>
        
        <div>
           <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-1">{label}</p>
           <h3 className="text-2xl md:text-3xl font-display font-bold text-white tracking-tight">{value}</h3>
        </div>
      </div>
    </div>
  );
};

export const CollapsibleSection = ({ title, icon, children, defaultOpen = true }: any) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  return (
    <div className="glass-panel rounded-xl overflow-hidden mb-6 shadow-lg border border-white/5 bg-brand-ebony/40">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-4 bg-white/5 hover:bg-white/10 transition-colors"
      >
        <div className="flex items-center space-x-3">
          <div className="p-1.5 bg-brand-black rounded border border-white/10 text-gray-300">
             {icon}
          </div>
          <h3 className="text-sm font-bold text-white uppercase tracking-wide">{title}</h3>
        </div>
        {isOpen ? <ChevronDown size={18} className="text-gray-500" /> : <ChevronRight size={18} className="text-gray-500" />}
      </button>
      {isOpen && (
        <div className="p-5 border-t border-white/5 animate-fade-in-down">
          {children}
        </div>
      )}
    </div>
  );
};

export const SimpleBarChart = ({ data, color, height = 24 }: any) => (
  <div className={`flex items-end space-x-1.5 h-${height}`}>
    {data.map((val: number, i: number) => (
      <div key={i} className="flex-1 flex flex-col justify-end group cursor-default">
        <div 
          className={`w-full bg-${color}-500/20 rounded-t-sm border-t border-l border-r border-${color}-500/30 group-hover:bg-${color}-500/50 transition-all relative`} 
          style={{ height: `${val}%` }}
        >
          <div className="opacity-0 group-hover:opacity-100 absolute -top-8 left-1/2 -translate-x-1/2 bg-black text-white text-[10px] font-bold px-2 py-1 rounded border border-white/20 whitespace-nowrap z-10 shadow-xl pointer-events-none transform transition-all -translate-y-1 group-hover:translate-y-0">
            {val}%
          </div>
        </div>
      </div>
    ))}
  </div>
);

export const StatCard = ({ label, value, subtext }: { label: string, value: string, subtext?: string }) => (
  <div className="bg-white/5 border border-white/10 p-4 rounded-xl flex flex-col items-center justify-center text-center shadow-inner">
    <span className="text-[10px] text-gray-500 uppercase font-bold tracking-wider mb-1">{label}</span>
    <span className="text-2xl font-bold text-white">{value}</span>
    {subtext && <span className="text-[10px] text-brand-sage mt-1">{subtext}</span>}
  </div>
);

export const PlaceholderView = ({ title }: { title: string }) => (
   <div className="space-y-6 animate-fade-in-up flex flex-col items-center justify-center min-h-[60vh] glass-panel rounded-2xl p-8 text-center border-white/5">
      <div className="w-24 h-24 bg-brand-black rounded-full flex items-center justify-center mb-6 border border-white/10 shadow-lg">
         <Lock className="w-10 h-10 text-brand-sage/50" />
      </div>
      <h2 className="text-3xl font-display font-bold text-white mb-2 tracking-wide uppercase">{title}</h2>
      <p className="text-gray-400 max-w-md text-center leading-relaxed text-sm">
         This premium module is part of the Signature Security Executive Suite. <br/>
         <span className="text-brand-sage font-bold text-xs uppercase tracking-wider mt-4 block border-t border-white/10 pt-4">Secure Access Verified</span>
      </p>
   </div>
);
