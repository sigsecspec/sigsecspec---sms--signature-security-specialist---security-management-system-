
import React from 'react';
import { Search, Filter, CheckCircle, Clock, Briefcase } from 'lucide-react';

// --- Shared Interfaces ---
export interface PendingItem {
  id: string;
  type: 'management' | 'operations' | 'client' | 'guard';
  name: string;
  date: string;
  status: 'pending';
}

export const TrainingApprovals = ({ items, onApprove, onDeny }: { items: PendingItem[], onApprove: (id: string) => void, onDeny: (id: string) => void }) => (
  <div className="space-y-6 animate-fade-in-up">
     <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
            <h2 className="text-2xl font-bold text-white">Application & Training Approvals</h2>
            <p className="text-gray-500 text-sm">Review applications for Management, Operations, and specialized guard roles.</p>
        </div>
        <div className="flex space-x-2">
           <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input type="text" placeholder="Search applicants..." className="bg-brand-ebony border border-brand-800 rounded pl-10 pr-4 py-2 text-sm text-white focus:border-brand-sage outline-none" />
           </div>
           <button className="p-2 bg-brand-ebony border border-brand-800 rounded text-gray-400 hover:text-white"><Filter className="w-4 h-4" /></button>
        </div>
     </div>

     {items.length === 0 ? (
        <div className="bg-brand-ebony p-12 rounded-xl border border-brand-800 text-center">
           <CheckCircle className="w-16 h-16 text-brand-sage mx-auto mb-4" />
           <h3 className="text-white font-bold text-xl mb-2">All Caught Up</h3>
           <p className="text-gray-500 max-w-md mx-auto">There are no pending applications or training certifications requiring executive review at this time.</p>
        </div>
     ) : (
        <div className="bg-brand-ebony rounded-xl border border-brand-800 overflow-hidden">
           <table className="w-full text-left">
              <thead className="bg-brand-900 border-b border-brand-800">
                 <tr>
                    <th className="p-4 text-xs font-bold text-gray-500 uppercase">Applicant</th>
                    <th className="p-4 text-xs font-bold text-gray-500 uppercase">Role Type</th>
                    <th className="p-4 text-xs font-bold text-gray-500 uppercase">Date Applied</th>
                    <th className="p-4 text-xs font-bold text-gray-500 uppercase">Status</th>
                    <th className="p-4 text-xs font-bold text-gray-500 uppercase text-right">Actions</th>
                 </tr>
              </thead>
              <tbody className="divide-y divide-brand-800">
                 {items.map(item => (
                    <tr key={item.id} className="hover:bg-brand-800/30 transition-colors">
                       <td className="p-4">
                          <div className="font-bold text-white">{item.name}</div>
                          <div className="text-xs text-gray-500">ID: APP-{item.id}</div>
                       </td>
                       <td className="p-4">
                          <span className={`text-xs uppercase font-bold px-2 py-1 rounded ${
                             item.type === 'management' ? 'bg-purple-900/30 text-purple-400' :
                             item.type === 'operations' ? 'bg-blue-900/30 text-blue-400' :
                             item.type === 'client' ? 'bg-green-900/30 text-green-400' :
                             'bg-gray-800 text-gray-400'
                          }`}>
                             {item.type}
                          </span>
                       </td>
                       <td className="p-4 text-gray-400 text-sm">{item.date}</td>
                       <td className="p-4">
                          <span className="flex items-center text-orange-400 text-xs font-bold"><Clock className="w-3 h-3 mr-1" /> Pending Review</span>
                       </td>
                       <td className="p-4 text-right space-x-2">
                          <button onClick={() => onApprove(item.id)} className="text-xs bg-green-900/20 text-green-400 border border-green-500/30 px-3 py-1.5 rounded hover:bg-green-900/40 transition-colors font-bold">Approve</button>
                          <button onClick={() => onDeny(item.id)} className="text-xs bg-red-900/20 text-red-400 border border-red-500/30 px-3 py-1.5 rounded hover:bg-red-900/40 transition-colors font-bold">Deny</button>
                          <button className="text-xs text-gray-400 hover:text-white px-2 underline">View Details</button>
                       </td>
                    </tr>
                 ))}
              </tbody>
           </table>
        </div>
     )}
  </div>
);
