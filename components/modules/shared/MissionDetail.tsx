
import React, { useState, useEffect } from 'react';
import { supabase } from '../../../services/supabase';

interface MissionDetailProps {
  missionId: string;
  onClose: () => void;
  currentUserRole: string; 
  onUpdate?: () => void;
}

const MissionDetail: React.FC<MissionDetailProps> = ({ missionId, onClose, currentUserRole, onUpdate }) => {
  const [mission, setMission] = useState<any>(null);
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
        const { data: m } = await supabase.from('missions').select('*, site:sites(*), client:clients(*)').eq('id', missionId).single();
        const { data: l } = await supabase.from('mission_logs').select('*').eq('mission_id', missionId).order('timestamp', { ascending: false });
        setMission(m);
        setLogs(l || []);
        setLoading(false);
    };
    fetch();
  }, [missionId]);

  if (loading) return <div>Loading...</div>;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/90">
       <div className="w-full max-w-4xl h-full bg-brand-ebony p-6 border-l border-brand-800 overflow-y-auto">
           <button onClick={onClose} className="mb-4 text-gray-400 hover:text-white">Close</button>
           <h2 className="text-3xl font-bold text-white mb-2">{mission.title || 'Mission Detail'}</h2>
           <p className="text-brand-sage mb-6">{mission.site?.name}</p>
           
           <h3 className="text-xl font-bold text-white mt-8 mb-4">Audit Logs</h3>
           <div className="space-y-4">
               {logs.map(log => (
                   <div key={log.id} className="bg-brand-black p-4 rounded border border-brand-800">
                       <p className="text-white font-bold">{log.action}</p>
                       <p className="text-gray-500 text-xs">{new Date(log.timestamp).toLocaleString()}</p>
                       <p className="text-gray-300 text-sm mt-1">{log.details}</p>
                   </div>
               ))}
               {logs.length === 0 && <p className="text-gray-500">No logs found.</p>}
           </div>
       </div>
    </div>
  );
};

export default MissionDetail;
