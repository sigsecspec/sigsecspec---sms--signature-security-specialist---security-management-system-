
import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, Search, Filter, Calendar, MapPin, 
  Briefcase, Clock, Shield, AlertTriangle
} from 'lucide-react';
import { PageView } from '../../types';
import PortalHeader from '../PortalHeader';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../services/supabase';

interface MissionBoardProps {
  onNavigate: (page: PageView) => void;
}

interface Mission {
  id: string;
  title: string;
  client: string;
  location: string;
  date: string;
  time: string;
  rate: number;
  requiredTraining: string[]; // Logic would check training_modules
  slots: { filled: number, total: number };
  status: 'available' | 'needs_training';
  type: string;
  leadGuard: string | null;
  instructions: string;
}

const MissionBoard: React.FC<MissionBoardProps> = ({ onNavigate }) => {
  const { user, profile, signOut } = useAuth();
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [missions, setMissions] = useState<Mission[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
      fetchAvailableMissions();
  }, []);

  const fetchAvailableMissions = async () => {
      setLoading(true);
      try {
          // Fetch missions that are pending/active and not fully staffed
          // Note: Logic simplified for demo. Real app would check assignments count vs required.
          const { data, error } = await supabase
              .from('missions')
              .select(`
                  id, type, start_time, end_time, required_guards, notes,
                  site:sites(name, address),
                  client:clients!missions_client_id_fkey(business_name),
                  assignments:mission_assignments(id)
              `)
              .eq('status', 'pending'); // Assuming 'pending' missions are available to claim

          if (error) throw error;

          if (data) {
              const formatted: Mission[] = data.map((m: any) => {
                  const assignmentCount = m.assignments?.length || 0;
                  const isFull = assignmentCount >= (m.required_guards || 1);
                  if (isFull) return null; // Don't show full missions

                  return {
                      id: m.id,
                      title: m.site?.name || 'Mission',
                      client: m.client?.business_name || 'Client',
                      location: m.site?.address || '',
                      date: new Date(m.start_time).toLocaleDateString(),
                      time: `${new Date(m.start_time).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})} - ${new Date(m.end_time).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}`,
                      rate: 0, // Rate removed from DB selection as per error report, defaulted to 0
                      requiredTraining: [], // Would fetch from join table in real app
                      slots: { filled: assignmentCount, total: m.required_guards || 1 },
                      status: 'available', // Logic for training check would go here
                      type: m.type || 'General',
                      leadGuard: null, // Logic to check if lead assigned
                      instructions: m.notes || ''
                  };
              }).filter(Boolean) as Mission[];
              
              setMissions(formatted);
          }
      } catch (err) {
          console.error("Error fetching missions", err);
      } finally {
          setLoading(false);
      }
  };

  const handleClaim = async (missionId: string) => {
    if (!user) return;
    if(window.confirm("Are you sure you want to claim this mission?")) {
        try {
            const { error } = await supabase.from('mission_assignments').insert({
                mission_id: missionId,
                guard_id: user.id,
                status: 'Scheduled',
                role: 'Guard'
            });

            if (error) throw error;

            alert("Mission Claimed!");
            fetchAvailableMissions(); // Refresh list
            onNavigate('guard-missions');
        } catch (e: any) {
            alert("Error claiming mission: " + e.message);
        }
    }
  };

  const filteredMissions = missions.filter(m => {
      const matchesSearch = m.title.toLowerCase().includes(search.toLowerCase()) || m.location.toLowerCase().includes(search.toLowerCase());
      // Logic for training filter would leverage user's profile metadata
      const matchesFilter = filter === 'all' || filter === m.status; 
      return matchesSearch && matchesFilter;
  });

  return (
    <div className="min-h-screen bg-brand-black text-gray-200 flex flex-col">
      <PortalHeader 
        user={profile ? { name: profile.full_name, role: profile.role, email: profile.email } : null}
        title="MISSION BOARD"
        subtitle="Available Opportunities"
        onLogout={signOut}
        onNavigate={onNavigate}
        hideMenuButton={true}
      />

      <div className="flex-1 max-w-5xl mx-auto w-full p-4 md:p-6 space-y-6">
        <button onClick={() => onNavigate('guard-application')} className="flex items-center text-gray-400 hover:text-white transition-colors mb-2">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Dashboard
        </button>

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-brand-ebony p-4 rounded-xl border border-brand-800">
            <div className="relative w-full md:w-96">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input 
                    type="text" 
                    placeholder="Search location, client, or type..." 
                    className="w-full bg-brand-black border border-brand-700 rounded-lg pl-10 pr-4 py-2 text-sm focus:border-brand-sage outline-none text-white"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
            </div>
            <div className="flex gap-2 w-full md:w-auto">
                <button onClick={() => setFilter('all')} className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors ${filter === 'all' ? 'bg-brand-sage text-black' : 'bg-brand-black text-gray-400 border border-brand-700'}`}>All</button>
                <button onClick={() => setFilter('available')} className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors ${filter === 'available' ? 'bg-green-600 text-white' : 'bg-brand-black text-gray-400 border border-brand-700'}`}>Available</button>
            </div>
        </div>

        {/* Mission Grid */}
        {loading ? <div className="text-center p-12 text-gray-500">Loading opportunities...</div> : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {filteredMissions.length === 0 ? (
                    <div className="col-span-2 text-center p-12 text-gray-500 border border-brand-800 rounded-xl">No missions available matching your criteria.</div>
                ) : filteredMissions.map(mission => (
                    <div key={mission.id} className="bg-brand-ebony rounded-xl border border-brand-800 hover:border-brand-sage/50 transition-all p-6">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <div className="flex items-center gap-2 mb-1">
                                    <h3 className="text-xl font-bold text-white">{mission.title}</h3>
                                    <span className="text-[10px] bg-brand-black border border-brand-700 px-2 py-0.5 rounded text-gray-400 uppercase">{mission.type}</span>
                                </div>
                                <p className="text-sm text-brand-silver flex items-center"><Briefcase className="w-3 h-3 mr-1" /> {mission.client}</p>
                            </div>
                            <div className="text-right">
                                <span className="block text-2xl font-mono font-bold text-brand-sage">${mission.rate}<span className="text-xs text-gray-500">/hr</span></span>
                            </div>
                        </div>

                        <div className="space-y-3 mb-6 bg-brand-black/30 p-4 rounded-lg border border-brand-800/50">
                            <div className="flex items-center text-sm text-gray-300">
                                <Calendar className="w-4 h-4 mr-3 text-brand-sage" /> {mission.date}
                            </div>
                            <div className="flex items-center text-sm text-gray-300">
                                <Clock className="w-4 h-4 mr-3 text-brand-sage" /> {mission.time}
                            </div>
                            <div className="flex items-center text-sm text-gray-300">
                                <MapPin className="w-4 h-4 mr-3 text-brand-sage" /> {mission.location}
                            </div>
                        </div>
                        
                        <div className="flex justify-between items-center pt-4 border-t border-brand-800">
                            <div className="text-xs">
                                <span className="text-gray-500 block mb-1">Staffing</span>
                                <span className={`font-bold ${mission.slots.filled < mission.slots.total ? 'text-green-400' : 'text-red-400'}`}>
                                    {mission.slots.filled} / {mission.slots.total} Guards
                                </span>
                            </div>
                            <button 
                                onClick={() => handleClaim(mission.id)}
                                className="bg-brand-sage hover:bg-brand-sage/90 text-black px-6 py-2 rounded font-bold shadow-lg transition-transform transform hover:-translate-y-1"
                            >
                                Claim Mission
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        )}
      </div>
    </div>
  );
};

export default MissionBoard;
