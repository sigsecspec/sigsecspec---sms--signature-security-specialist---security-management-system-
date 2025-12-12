
import React from 'react';
import { Activity, Globe } from 'lucide-react';

const LiveControlPanel = () => (
    <div className="space-y-6 animate-fade-in-up h-full flex flex-col">
       <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-white flex items-center"><Activity className="w-6 h-6 text-red-500 mr-2 animate-pulse" /> Live Control Panel</h2>
            <p className="text-gray-500 text-sm">Real-time operational oversight.</p>
          </div>
          <div className="flex space-x-2">
              <span className="px-3 py-1 bg-green-900/30 text-green-500 border border-green-500/30 rounded text-xs font-bold flex items-center shadow-[0_0_10px_rgba(34,197,94,0.3)]">
                 <span className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></span> Online
              </span>
          </div>
       </div>

       <div className="flex-1 bg-brand-ebony rounded-xl border border-brand-800 relative overflow-hidden flex items-center justify-center min-h-[400px]">
           <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1524661135-423995f22d0b?q=80&w=2074&auto=format&fit=crop')] bg-cover opacity-20"></div>
           <div className="text-center z-10 p-8 bg-brand-black/80 backdrop-blur-md rounded-xl border border-brand-700 shadow-2xl">
               <Globe className="w-16 h-16 text-brand-silver mx-auto mb-4 animate-pulse" />
               <h3 className="text-xl font-bold text-white mb-2">Map System Offline</h3>
               <p className="text-gray-400 text-sm max-w-xs mx-auto">Real-time GPS tracking requires a live API connection. Mock data is currently displayed in list view.</p>
               <button className="mt-6 px-6 py-2 bg-brand-sage text-black font-bold rounded hover:bg-brand-sage/90 shadow-lg transition-all">Switch to List View</button>
           </div>
       </div>
    </div>
);

export default LiveControlPanel;
