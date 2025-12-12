
import React, { useState, useEffect } from 'react';
import { 
  Truck, Search, Filter, Plus, CheckCircle, AlertTriangle, 
  Clock, BarChart2, ChevronRight, X, History, User, 
  FileText, Shield, Briefcase, Lock, Eye, Edit, Trash2, 
  MoreVertical, Upload, Download, Key, Layout, Layers, 
  PieChart, Activity, MapPin, Wrench, Calendar, DollarSign,
  Fuel, Navigation, AlertCircle
} from 'lucide-react';
import { KPIMeter, SimpleBarChart } from '../../common/DashboardWidgets';
import { supabase } from '../../../services/supabase';

// --- Types ---

type VehicleStatus = 
  | 'available' 
  | 'assigned' 
  | 'maintenance' 
  | 'out_of_service' 
  | 'retired';

type VehicleType = 'Patrol Sedan' | 'SUV' | 'Golf Cart' | 'Van' | 'Motorcycle';

interface VehicleHistory {
  date: string;
  action: string;
  user: string;
  role: string;
  note?: string;
}

interface MaintenanceRecord {
  id: string;
  date: string;
  type: string;
  cost: number;
  provider: string;
  description: string;
  status: 'completed' | 'scheduled' | 'overdue';
}

interface Assignment {
  id: string;
  assignedTo: string;
  mission: string;
  startDate: string;
  expectedReturn?: string;
  status: 'active' | 'completed';
}

interface Vehicle {
  id: string;
  name: string;
  makeModel: string;
  year: string;
  licensePlate: string;
  vin: string;
  type: VehicleType;
  status: VehicleStatus;
  team: string; 
  mileage: number;
  fuelLevel: number; 
  lastMaintenance: string;
  nextMaintenanceDue: string;
  currentAssignment?: Assignment;
  maintenanceHistory: MaintenanceRecord[];
  history: VehicleHistory[];
  fees: {
    rentalRate: number; 
    gpsFee: number;
  };
}

const VehicleManagement = ({ currentUserRole = 'Owner' }: { currentUserRole?: string }) => {
  const [activeTab, setActiveTab] = useState<'inventory' | 'assignments' | 'gps' | 'maintenance' | 'analytics'>('inventory');
  const [searchQuery, setSearchQuery] = useState('');
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [detailTab, setDetailTab] = useState<'overview' | 'history' | 'maintenance' | 'docs'>('overview');
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchVehicles = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('vehicles')
                .select(`
                    *,
                    team:teams(name)
                `);

            if (error) throw error;

            if (data) {
                const formatted: Vehicle[] = data.map((v: any) => ({
                    id: v.id,
                    name: v.name,
                    makeModel: v.make_model || 'Unknown',
                    year: v.year || '',
                    licensePlate: v.license_plate || 'N/A',
                    vin: v.vin || '',
                    type: (v.type as VehicleType) || 'SUV',
                    status: (v.status as VehicleStatus) || 'available',
                    team: v.team?.name || 'Unassigned',
                    mileage: v.mileage || 0,
                    fuelLevel: v.fuel_level || 100,
                    lastMaintenance: v.last_maintenance,
                    nextMaintenanceDue: v.next_maintenance_due,
                    maintenanceHistory: v.maintenance_history || [],
                    history: v.history || [],
                    fees: v.fees || { rentalRate: 0, gpsFee: 0 }
                }));
                setVehicles(formatted);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };
    fetchVehicles();
  }, []);

  const getStatusColor = (status: VehicleStatus) => {
    switch (status) {
      case 'available': return 'bg-green-500/20 text-green-400 border-green-500/50';
      case 'assigned': return 'bg-blue-500/20 text-blue-400 border-blue-500/50';
      case 'maintenance': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50';
      case 'out_of_service': return 'bg-red-500/20 text-red-400 border-red-500/50';
      case 'retired': return 'bg-gray-500/20 text-gray-400 border-gray-500/50';
      default: return 'bg-gray-800 text-white';
    }
  };

  const getStatusLabel = (status: string) => {
    return status.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  const filteredVehicles = vehicles.filter(v => {
    const matchesSearch = v.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          v.licensePlate.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          v.id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = statusFilter === 'all' || v.status === statusFilter;
    return matchesSearch && matchesFilter;
  });

  const handleAction = async (action: string, note: string) => {
    if (!selectedVehicle) return;
    
    let newStatus: VehicleStatus = selectedVehicle.status;
    if (action === 'Assign') newStatus = 'assigned';
    if (action === 'Release') newStatus = 'available';
    if (action === 'Schedule Maintenance') newStatus = 'maintenance';
    if (action === 'Return to Service') newStatus = 'available';
    if (action === 'Retire') newStatus = 'retired';

    const newHistoryEntry = {
        date: new Date().toLocaleString(),
        action: action,
        user: 'Current User', 
        role: currentUserRole,
        note: note
    };

    const updatedHistory = [newHistoryEntry, ...selectedVehicle.history];

    const { error } = await supabase
        .from('vehicles')
        .update({
            status: newStatus,
            history: updatedHistory
        })
        .eq('id', selectedVehicle.id);

    if (error) {
        alert("Error updating vehicle: " + error.message);
        return;
    }

    const updatedVehicle = { ...selectedVehicle, status: newStatus, history: updatedHistory };
    setVehicles(prev => prev.map(v => v.id === selectedVehicle.id ? updatedVehicle : v));
    setSelectedVehicle(updatedVehicle);
  };

  const RenderInventory = () => (
    <div className="bg-brand-ebony rounded-xl border border-brand-800 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
            <thead className="bg-brand-900 border-b border-brand-800">
            <tr>
                <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Vehicle / ID</th>
                <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Type & Details</th>
                <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Stats</th>
                <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Actions</th>
            </tr>
            </thead>
            <tbody className="divide-y divide-brand-800">
            {filteredVehicles.map(vehicle => (
                <tr 
                key={vehicle.id} 
                onClick={() => setSelectedVehicle(vehicle)}
                className="hover:bg-brand-800/40 transition-colors cursor-pointer group"
                >
                <td className="p-4">
                    <div className="font-bold text-white text-sm group-hover:text-brand-sage transition-colors">{vehicle.name}</div>
                    <div className="text-xs text-gray-500 font-mono mt-1">{vehicle.id.substring(0,8)}...</div>
                </td>
                <td className="p-4">
                    <div className="text-sm text-gray-300">{vehicle.year} {vehicle.makeModel}</div>
                    <div className="text-xs text-gray-500 mt-1 flex items-center"><MapPin className="w-3 h-3 mr-1" /> {vehicle.team}</div>
                </td>
                <td className="p-4 text-xs">
                    <div className="flex items-center text-gray-300 mb-1"><Activity className="w-3 h-3 mr-1" /> {vehicle.mileage.toLocaleString()} mi</div>
                    <div className="flex items-center">
                        <Fuel className={`w-3 h-3 mr-1 ${vehicle.fuelLevel < 20 ? 'text-red-500' : 'text-green-500'}`} /> 
                        <span className={`${vehicle.fuelLevel < 20 ? 'text-red-500 font-bold' : 'text-gray-400'}`}>{vehicle.fuelLevel}% Fuel</span>
                    </div>
                </td>
                <td className="p-4">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded text-[10px] font-bold uppercase tracking-wide border ${getStatusColor(vehicle.status)}`}>
                    {getStatusLabel(vehicle.status)}
                    </span>
                </td>
                <td className="p-4 text-right">
                    <button className="p-2 hover:bg-brand-900 rounded-full text-gray-400 hover:text-white transition-colors">
                    <ChevronRight size={16} />
                    </button>
                </td>
                </tr>
            ))}
            </tbody>
        </table>
        </div>
    </div>
  );

  return (
    <div className="flex flex-col bg-brand-black text-gray-200 animate-fade-in-up w-full">
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-display font-bold text-white flex items-center">
            <Truck className="w-6 h-6 mr-3 text-brand-sage" />
            Vehicle Management
          </h2>
          <p className="text-sm text-gray-500 mt-1 ml-9">Fleet inventory, assignments, and maintenance tracking.</p>
        </div>
        
        <div className="flex space-x-3 w-full xl:w-auto">
           <div className="relative flex-grow xl:flex-grow-0 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input 
                type="text" 
                placeholder="Search fleet..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-brand-ebony border border-brand-800 rounded pl-10 pr-4 py-2 text-sm text-white focus:border-brand-sage outline-none" 
              />
           </div>
           
           <div className="relative min-w-[150px]">
             <select 
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full bg-brand-ebony border border-brand-800 rounded px-4 py-2 text-sm text-white focus:border-brand-sage outline-none appearance-none cursor-pointer"
             >
                <option value="all">All Statuses</option>
                <option value="available">Available</option>
                <option value="assigned">Assigned</option>
                <option value="maintenance">Maintenance</option>
                <option value="out_of_service">Out of Service</option>
             </select>
           </div>

           <button className="bg-brand-sage text-black px-4 py-2 rounded font-bold text-sm hover:bg-brand-sage/90 flex items-center whitespace-nowrap shadow-lg">
             <Plus className="w-4 h-4 mr-2" /> Add Vehicle
           </button>
        </div>
      </div>

      <div className="flex overflow-x-auto border-b border-brand-800 mb-6 scrollbar-hide">
        {[
          { id: 'inventory', label: 'Inventory', icon: <Layers size={16} /> },
          { id: 'maintenance', label: 'Maintenance', icon: <Wrench size={16} /> },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center px-6 py-4 border-b-2 font-medium text-sm whitespace-nowrap transition-colors ${
              activeTab === tab.id 
                ? 'border-brand-sage text-brand-sage bg-brand-sage/5' 
                : 'border-transparent text-gray-400 hover:text-white hover:bg-brand-ebony'
            }`}
          >
            <span className="mr-2">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? <div className="p-8 text-center text-gray-500">Loading Fleet Data...</div> : (
          <>
            {activeTab === 'inventory' && <RenderInventory /> }
            {activeTab === 'maintenance' && <div className="p-8 text-center text-gray-500">Maintenance module active. Select vehicle for history.</div>}
          </>
      )}

      {selectedVehicle && (
        <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/80 backdrop-blur-sm transition-opacity duration-300">
          <div className="absolute inset-0" onClick={() => setSelectedVehicle(null)}></div>
          
          <div className="relative w-full max-w-4xl h-full bg-brand-ebony border-l border-brand-800 shadow-2xl flex flex-col transform transition-transform duration-300 translate-x-0">
            
            <div className="p-6 border-b border-brand-800 bg-brand-900/90 flex justify-between items-start">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-2xl font-display font-bold text-white">{selectedVehicle.name}</h3>
                  <span className={`inline-flex items-center px-3 py-1 rounded text-xs font-bold uppercase tracking-wide border ${getStatusColor(selectedVehicle.status)}`}>
                    {getStatusLabel(selectedVehicle.status)}
                  </span>
                </div>
                <div className="flex items-center text-sm text-gray-400 space-x-4">
                   <span className="flex items-center"><Truck className="w-3 h-3 mr-1" /> {selectedVehicle.makeModel} ({selectedVehicle.year})</span>
                   <span className="flex items-center"><FileText className="w-3 h-3 mr-1" /> Plate: {selectedVehicle.licensePlate}</span>
                </div>
              </div>
              <button onClick={() => setSelectedVehicle(null)} className="text-gray-500 hover:text-white transition-colors bg-brand-black p-2 rounded-full hover:bg-brand-800">
                <X size={20} />
              </button>
            </div>

            <div className="flex border-b border-brand-800 px-6 bg-brand-900/50">
               {['overview', 'history', 'maintenance'].map((tab) => (
                  <button 
                    key={tab}
                    onClick={() => setDetailTab(tab as any)}
                    className={`px-4 py-3 text-sm font-bold border-b-2 transition-colors capitalize ${detailTab === tab ? 'border-brand-sage text-brand-sage' : 'border-transparent text-gray-400 hover:text-white'}`}
                  >
                    {tab}
                  </button>
               ))}
            </div>

            <div className="flex-1 overflow-y-auto p-6 bg-brand-black/20 relative">
               
               {detailTab === 'overview' && (
                  <div className="space-y-6">
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-brand-black/30 p-5 rounded-lg border border-brand-800">
                            <h4 className="text-brand-sage font-bold text-xs uppercase tracking-wider mb-4 border-b border-brand-800 pb-2">Vehicle Specification</h4>
                            <div className="space-y-3 text-sm">
                                <div className="flex justify-between"><span className="text-gray-500">VIN</span> <span className="text-white font-mono">{selectedVehicle.vin}</span></div>
                                <div className="flex justify-between"><span className="text-gray-500">Type</span> <span className="text-white">{selectedVehicle.type}</span></div>
                                <div className="flex justify-between"><span className="text-gray-500">License Plate</span> <span className="text-white">{selectedVehicle.licensePlate}</span></div>
                                <div className="flex justify-between"><span className="text-gray-500">Mileage</span> <span className="text-white">{selectedVehicle.mileage.toLocaleString()} mi</span></div>
                                <div className="flex justify-between"><span className="text-gray-500">Team</span> <span className="text-brand-sage">{selectedVehicle.team}</span></div>
                            </div>
                        </div>

                        <div className="bg-brand-black/30 p-5 rounded-lg border border-brand-800">
                            <h4 className="text-brand-sage font-bold text-xs uppercase tracking-wider mb-4 border-b border-brand-800 pb-2">Operational Status</h4>
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-gray-500">Fuel Level</span>
                                    <span className="text-sm font-bold text-white">{selectedVehicle.fuelLevel}%</span>
                                </div>
                                <div className="w-full bg-brand-900 h-2 rounded-full overflow-hidden">
                                    <div className={`h-full rounded-full ${selectedVehicle.fuelLevel < 20 ? 'bg-red-500' : 'bg-green-500'}`} style={{ width: `${selectedVehicle.fuelLevel}%` }}></div>
                                </div>
                            </div>
                        </div>
                     </div>

                     <div className="bg-brand-800/20 p-4 rounded-lg border border-brand-800">
                        <h4 className="text-brand-sage font-bold text-sm uppercase tracking-wider mb-4 border-b border-brand-800 pb-2">Vehicle Actions</h4>
                        <div className="flex flex-wrap gap-3">
                           {selectedVehicle.status === 'assigned' ? (
                               <button onClick={() => handleAction('Release', 'Manual release.')} className="flex-1 bg-blue-600/20 border border-blue-600 text-blue-400 hover:bg-blue-600/30 py-2 rounded font-bold text-sm transition-all">Release Vehicle</button>
                           ) : (
                               <button onClick={() => handleAction('Assign', 'Opened assignment dialog.')} className="flex-1 bg-green-600 hover:bg-green-500 text-white py-2 rounded font-bold text-sm transition-all">Assign Vehicle</button>
                           )}
                           
                           {selectedVehicle.status !== 'maintenance' ? (
                               <button onClick={() => handleAction('Schedule Maintenance', 'Marked for service.')} className="flex-1 bg-yellow-600/20 border border-yellow-600 text-yellow-500 hover:bg-yellow-600/30 py-2 rounded font-bold text-sm transition-all">Maintenance</button>
                           ) : (
                               <button onClick={() => handleAction('Return to Service', 'Maintenance complete.')} className="flex-1 bg-green-600/20 border border-green-600 text-green-500 hover:bg-green-600/30 py-2 rounded font-bold text-sm transition-all">Finish Service</button>
                           )}

                           <button onClick={() => handleAction('Retire', 'Vehicle retired from fleet.')} className="flex-1 bg-red-600/20 border border-red-600 text-red-500 hover:bg-red-600/30 py-2 rounded font-bold text-sm transition-all">Retire Vehicle</button>
                        </div>
                     </div>
                  </div>
               )}

               {detailTab === 'history' && (
                  <div>
                     <h4 className="text-brand-sage font-bold text-sm uppercase tracking-wider mb-4 flex items-center border-b border-brand-800 pb-2">
                        <History className="w-4 h-4 mr-2" /> Audit Trail
                     </h4>
                     <div className="space-y-4 pl-4 border-l border-brand-800 ml-2">
                        {selectedVehicle.history.length === 0 ? (
                           <p className="text-sm text-gray-500 italic">No history available.</p>
                        ) : (
                           selectedVehicle.history.map((entry, idx) => (
                              <div key={idx} className="relative">
                                 <div className="absolute -left-[21px] top-1 w-3 h-3 rounded-full bg-brand-black border-2 border-brand-600"></div>
                                 <div className="bg-brand-900/40 p-3 rounded border border-brand-800/50">
                                    <div className="flex justify-between items-start mb-1">
                                       <span className="font-bold text-white text-sm">{entry.action}</span>
                                       <span className="text-[10px] text-gray-500 font-mono">{entry.date}</span>
                                    </div>
                                    <p className="text-xs text-brand-sage mb-1">{entry.user} <span className="text-gray-600">•</span> {entry.role}</p>
                                    {entry.note && <p className="text-xs text-gray-400 italic">"{entry.note}"</p>}
                                 </div>
                              </div>
                           ))
                        )}
                     </div>
                  </div>
               )}

            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default VehicleManagement;
