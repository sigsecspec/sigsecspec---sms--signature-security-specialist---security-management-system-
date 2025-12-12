
import React, { useState, useEffect } from 'react';
import { Calendar, Clock, MapPin, Users, AlertTriangle, ChevronLeft, ChevronRight, Filter, RefreshCw, CheckCircle, Plus } from 'lucide-react';
import { supabase } from '../../../services/supabase';
import GuardAssignmentModal from './GuardAssignmentModal';

const LiveScheduling: React.FC = () => {
  const [missions, setMissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewDate, setViewDate] = useState(new Date());
  const [selectedMission, setSelectedMission] = useState<any | null>(null);
  const [showAssignModal, setShowAssignModal] = useState(false);

  useEffect(() => {
    fetchSchedule();
  }, [viewDate]);

  const fetchSchedule = async () => {
    setLoading(true);
    try {
      // Mocking a date range query
      const { data, error } = await supabase
        .from('missions')
        .select(`
          id, type, status, start_time, end_time, required_guards,
          site:sites(name, address),
          client:clients!missions_client_id_fkey(business_name),
          assignments:mission_assignments(id, status)
        `)
        .order('start_time', { ascending: true });

      if (data) {
        const formatted = data.map((m: any) => ({
          id: m.id,
          title: m.site?.name || 'Mission',
          client: m.client?.business_name || 'Client',
          location: m.site?.address || '',
          start: new Date(m.start_time),
          end: new Date(m.end_time),
          required: m.required_guards || 1,
          assigned: m.assignments?.length || 0,
          status: m.status,
          type: m.type
        }));
        setMissions(formatted);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getCoverageStatus = (m: any) => {
    if (m.assigned === 0) return 'uncovered';
    if (m.assigned < m.required) return 'partial';
    return 'covered';
  };

  const handleAssignmentComplete = () => {
    fetchSchedule();
    setShowAssignModal(false);
  };

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-brand-ebony p-4 rounded-xl border border-brand-800">
        <div className="flex items-center gap-4">
          <div className="flex items-center bg-brand-black rounded-lg border border-brand-800 p-1">
            <button className="p-1 hover:bg-brand-800 rounded text-gray-400 hover:text-white"><ChevronLeft size={18} /></button>
            <span className="px-4 text-sm font-bold text-white min-w-[100px] text-center">{viewDate.toLocaleDateString()}</span>
            <button className="p-1 hover:bg-brand-800 rounded text-gray-400 hover:text-white"><ChevronRight size={18} /></button>
          </div>
          <button onClick={() => setViewDate(new Date())} className="text-xs text-brand-sage hover:underline">Today</button>
        </div>

        <div className="flex items-center gap-3">
          <button onClick={fetchSchedule} className="p-2 text-gray-400 hover:text-white hover:bg-brand-800 rounded-lg"><RefreshCw size={18} /></button>
          <div className="h-6 w-px bg-brand-800"></div>
          <button className="flex items-center gap-2 px-3 py-1.5 bg-brand-black border border-brand-700 rounded text-xs text-gray-300 hover:text-white">
            <Filter size={14} /> Filter
          </button>
          <button className="flex items-center gap-2 px-3 py-1.5 bg-brand-sage text-black font-bold rounded text-xs hover:bg-brand-sage/90 shadow-lg">
            <Plus size={14} /> Add Shift
          </button>
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
        {loading ? (
          <div className="col-span-3 py-12 text-center text-gray-500">Loading schedule...</div>
        ) : missions.length === 0 ? (
          <div className="col-span-3 py-12 text-center text-gray-500">No missions scheduled for this period.</div>
        ) : (
          missions.map((m) => {
            const coverage = getCoverageStatus(m);
            return (
              <div 
                key={m.id} 
                className={`bg-brand-ebony border rounded-xl p-5 relative group transition-all hover:-translate-y-1 hover:shadow-xl ${
                  coverage === 'uncovered' ? 'border-red-900/50 shadow-[0_0_15px_rgba(239,68,68,0.1)]' :
                  coverage === 'partial' ? 'border-yellow-900/50' :
                  'border-brand-800 hover:border-brand-700'
                }`}
              >
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h4 className="text-white font-bold text-lg">{m.title}</h4>
                    <p className="text-xs text-gray-400 flex items-center mt-1"><MapPin size={12} className="mr-1" /> {m.location}</p>
                  </div>
                  <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase border ${
                    coverage === 'uncovered' ? 'bg-red-900/20 text-red-400 border-red-500/30' :
                    coverage === 'partial' ? 'bg-yellow-900/20 text-yellow-400 border-yellow-500/30' :
                    'bg-green-900/20 text-green-400 border-green-500/30'
                  }`}>
                    {coverage === 'uncovered' ? 'Unassigned' : coverage === 'partial' ? 'Partial' : 'Covered'}
                  </span>
                </div>

                <div className="flex items-center gap-4 text-xs text-gray-300 mb-4">
                  <div className="flex items-center"><Clock size={14} className="mr-1 text-brand-sage" /> {m.start.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})} - {m.end.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</div>
                  <div className="flex items-center"><Users size={14} className="mr-1 text-blue-400" /> {m.assigned}/{m.required} Guards</div>
                </div>

                <div className="flex gap-2 mt-auto pt-3 border-t border-brand-800/50">
                  {coverage !== 'covered' && (
                    <button 
                      onClick={() => { setSelectedMission(m); setShowAssignModal(true); }}
                      className="flex-1 bg-green-600 hover:bg-green-500 text-white py-2 rounded font-bold text-xs shadow-lg transition-colors flex items-center justify-center"
                    >
                      <Users size={14} className="mr-1" /> Assign Guards
                    </button>
                  )}
                  <button className="flex-1 bg-brand-black border border-brand-700 text-gray-300 hover:text-white py-2 rounded font-bold text-xs hover:bg-brand-800 transition-colors">
                    Details
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {showAssignModal && selectedMission && (
        <GuardAssignmentModal 
          mission={selectedMission} 
          onClose={() => setShowAssignModal(false)}
          onAssign={handleAssignmentComplete}
        />
      )}
    </div>
  );
};

export default LiveScheduling;
