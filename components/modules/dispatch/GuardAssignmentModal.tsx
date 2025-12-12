
import React, { useState, useEffect } from 'react';
import { Search, MapPin, Star, Shield, CheckCircle, X, User, AlertTriangle, Clock } from 'lucide-react';
import { supabase } from '../../../services/supabase';

interface GuardAssignmentModalProps {
  mission: any;
  onClose: () => void;
  onAssign: () => void;
}

const GuardAssignmentModal: React.FC<GuardAssignmentModalProps> = ({ mission, onClose, onAssign }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [guards, setGuards] = useState<any[]>([]);
  const [selectedGuards, setSelectedGuards] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<'all' | 'available' | 'nearby'>('all');

  useEffect(() => {
    const fetchGuards = async () => {
      setLoading(true);
      try {
        // Fetch active guards
        const { data, error } = await supabase
          .from('guards')
          .select(`
            id,
            rank,
            guard_level,
            profile:profiles!guards_id_fkey(full_name, status, address_city)
          `)
          .eq('profile.status', 'active');

        if (data) {
          // Mocking distance and schedule availability for demo purposes
          // In a real app, this would query geospatial data and the schedule table
          const formatted = data.map((g: any) => ({
            id: g.id,
            name: g.profile?.full_name || 'Unknown Guard',
            rank: g.rank,
            level: g.guard_level,
            location: g.profile?.address_city || 'Unknown',
            status: g.profile?.status,
            distance: Math.floor(Math.random() * 20) + 1, // Mock distance
            rating: (4 + Math.random()).toFixed(1), // Mock rating
            isAvailable: Math.random() > 0.2 // Mock availability
          }));
          setGuards(formatted);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchGuards();
  }, []);

  const handleAssign = async () => {
    if (selectedGuards.length === 0) return;
    
    try {
      const inserts = selectedGuards.map(guardId => ({
        mission_id: mission.id,
        guard_id: guardId,
        status: 'Scheduled',
        role: 'Guard'
      }));

      const { error } = await supabase.from('mission_assignments').insert(inserts);
      if (error) throw error;
      
      onAssign();
      onClose();
    } catch (err: any) {
      alert('Failed to assign guards: ' + err.message);
    }
  };

  const toggleSelection = (id: string) => {
    setSelectedGuards(prev => 
      prev.includes(id) ? prev.filter(g => g !== id) : [...prev, id]
    );
  };

  const filteredGuards = guards.filter(g => {
    const matchesSearch = g.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = 
      filterType === 'all' ? true :
      filterType === 'available' ? g.isAvailable :
      filterType === 'nearby' ? g.distance < 10 : true;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 p-4 backdrop-blur-sm animate-fade-in-up">
      <div className="bg-brand-ebony border border-brand-700 rounded-xl w-full max-w-2xl shadow-2xl flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-6 border-b border-brand-800 bg-brand-900/50 flex justify-between items-start">
          <div>
            <h3 className="text-xl font-bold text-white">Assign Guards</h3>
            <p className="text-sm text-gray-400 mt-1 flex items-center">
              <Shield className="w-3 h-3 mr-1 text-brand-sage" />
              {mission.title} • {new Date(mission.start).toLocaleDateString()}
            </p>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-white"><X size={24} /></button>
        </div>

        {/* Filters */}
        <div className="p-4 border-b border-brand-800 bg-brand-black/20 flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input 
              type="text" 
              placeholder="Search guards..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-brand-ebony border border-brand-700 rounded-lg pl-10 pr-4 py-2 text-sm text-white focus:border-brand-sage outline-none"
            />
          </div>
          <div className="flex bg-brand-black rounded-lg p-1 border border-brand-800">
            {['all', 'available', 'nearby'].map((t) => (
              <button
                key={t}
                onClick={() => setFilterType(t as any)}
                className={`px-3 py-1.5 text-xs font-bold rounded capitalize transition-all ${
                  filterType === t ? 'bg-brand-sage text-black' : 'text-gray-400 hover:text-white'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-brand-black/40">
          {loading ? (
            <div className="text-center p-8 text-gray-500">Loading availability...</div>
          ) : filteredGuards.length === 0 ? (
            <div className="text-center p-8 text-gray-500">No guards found matching criteria.</div>
          ) : (
            filteredGuards.map(guard => (
              <div 
                key={guard.id}
                onClick={() => toggleSelection(guard.id)}
                className={`p-4 rounded-xl border cursor-pointer transition-all flex items-center justify-between group ${
                  selectedGuards.includes(guard.id) 
                    ? 'bg-brand-sage/10 border-brand-sage' 
                    : 'bg-brand-ebony border-brand-800 hover:border-brand-700'
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${
                    selectedGuards.includes(guard.id) ? 'bg-brand-sage text-black' : 'bg-brand-black text-gray-400'
                  }`}>
                    {selectedGuards.includes(guard.id) ? <CheckCircle size={18} /> : guard.name.charAt(0)}
                  </div>
                  <div>
                    <h4 className={`font-bold text-sm ${selectedGuards.includes(guard.id) ? 'text-brand-sage' : 'text-white'}`}>
                      {guard.name} <span className="text-xs font-normal text-gray-500">({guard.rank})</span>
                    </h4>
                    <div className="flex items-center text-xs text-gray-400 mt-1 gap-3">
                      <span className="flex items-center"><Star className="w-3 h-3 text-yellow-500 mr-1" /> {guard.rating}</span>
                      <span className="flex items-center"><MapPin className="w-3 h-3 text-blue-400 mr-1" /> {guard.distance} mi away</span>
                      <span className="flex items-center text-brand-silver">Lvl {guard.level}</span>
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  {guard.isAvailable ? (
                    <span className="inline-flex items-center px-2 py-1 rounded text-[10px] font-bold uppercase bg-green-900/20 text-green-400 border border-green-500/30">
                      Available
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2 py-1 rounded text-[10px] font-bold uppercase bg-red-900/20 text-red-400 border border-red-500/30">
                      <Clock className="w-3 h-3 mr-1" /> Busy
                    </span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-brand-800 bg-brand-ebony rounded-b-xl flex justify-between items-center">
          <div className="text-sm text-gray-400">
            <span className="text-brand-sage font-bold">{selectedGuards.length}</span> guards selected
          </div>
          <div className="flex gap-3">
            <button onClick={onClose} className="px-4 py-2 text-gray-400 hover:text-white text-sm font-bold">Cancel</button>
            <button 
              onClick={handleAssign}
              disabled={selectedGuards.length === 0}
              className="bg-brand-sage text-black px-6 py-2 rounded-lg font-bold text-sm hover:bg-brand-sage/90 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
            >
              Confirm Assignment
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default GuardAssignmentModal;
