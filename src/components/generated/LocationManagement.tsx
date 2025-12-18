"use client";

import React, { useState } from 'react';
import { MapPin, Plus, Edit2, Trash2, Save, X, Search } from 'lucide-react';

// --- Types ---

export interface Location {
  paese: string; // Town/Village name
  vie: string[]; // Streets in this town
}
interface LocationManagementProps {
  locations: Location[];
  onUpdateLocations: (locations: Location[]) => void;
}

// @component: LocationManagement
export const LocationManagement = ({
  locations,
  onUpdateLocations
}: LocationManagementProps) => {
  const [selectedLocation, setSelectedLocation] = useState<string | null>(null);
  const [showAddLocationModal, setShowAddLocationModal] = useState(false);
  const [showEditLocationModal, setShowEditLocationModal] = useState(false);
  const [showAddStreetModal, setShowAddStreetModal] = useState(false);
  const [newLocationName, setNewLocationName] = useState('');
  const [editingLocationName, setEditingLocationName] = useState('');
  const [newStreetName, setNewStreetName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Handlers
  const handleAddLocation = () => {
    if (!newLocationName.trim()) return;
    const newLocation: Location = {
      paese: newLocationName.trim(),
      vie: []
    };
    onUpdateLocations([...locations, newLocation]);
    setNewLocationName('');
    setShowAddLocationModal(false);
  };
  const handleDeleteLocation = (paese: string) => {
    if (confirm(`Sei sicuro di voler eliminare "${paese}" e tutte le sue vie?`)) {
      onUpdateLocations(locations.filter(loc => loc.paese !== paese));
      if (selectedLocation === paese) {
        setSelectedLocation(null);
      }
    }
  };
  const handleEditLocationName = () => {
    if (!selectedLocation || !editingLocationName.trim()) return;
    onUpdateLocations(locations.map(loc => loc.paese === selectedLocation ? {
      ...loc,
      paese: editingLocationName.trim()
    } : loc));
    setSelectedLocation(editingLocationName.trim());
    setShowEditLocationModal(false);
  };
  const handleAddStreet = () => {
    if (!selectedLocation || !newStreetName.trim()) return;
    onUpdateLocations(locations.map(loc => loc.paese === selectedLocation ? {
      ...loc,
      vie: [...loc.vie, newStreetName.trim()]
    } : loc));
    setNewStreetName('');
    setShowAddStreetModal(false);
  };
  const handleDeleteStreet = (paese: string, via: string) => {
    if (confirm(`Sei sicuro di voler eliminare "${via}"?`)) {
      onUpdateLocations(locations.map(loc => loc.paese === paese ? {
        ...loc,
        vie: loc.vie.filter(v => v !== via)
      } : loc));
    }
  };
  const filteredLocations = locations.filter(loc => loc.paese.toLowerCase().includes(searchQuery.toLowerCase()));
  const selectedLocationData = locations.find(loc => loc.paese === selectedLocation);
  return <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Gestione Paesi e Vie</h2>
          <p className="text-sm text-slate-500 mt-1">
            Configura i paesini serviti e le vie disponibili per ogni località
          </p>
        </div>
        <button onClick={() => setShowAddLocationModal(true)} className="flex items-center space-x-2 bg-orange-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-orange-700 shadow-sm shadow-orange-200">
          <Plus className="w-4 h-4" />
          <span>Aggiungi Paese</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Locations List */}
        <div className="lg:col-span-1 bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="p-4 border-b border-slate-200 bg-slate-50">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input type="text" placeholder="Cerca paese..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} autoComplete="off" className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500" />
            </div>
          </div>

          <div className="divide-y divide-slate-100 max-h-[600px] overflow-y-auto">
            {filteredLocations.map(location => <div key={location.paese} className={`p-4 cursor-pointer transition-colors ${selectedLocation === location.paese ? 'bg-orange-50 border-l-4 border-orange-600' : 'hover:bg-slate-50'}`} onClick={() => setSelectedLocation(location.paese)}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                      <MapPin className="w-4 h-4 text-orange-600" />
                    </div>
                    <div>
                      <div className="font-medium text-slate-900">{location.paese}</div>
                      <div className="text-xs text-slate-500">{location.vie.length} vie</div>
                    </div>
                  </div>
                  <button onClick={e => {
                e.stopPropagation();
                handleDeleteLocation(location.paese);
              }} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>)}

            {filteredLocations.length === 0 && <div className="p-8 text-center text-slate-400">
                <MapPin className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p className="text-sm">Nessun paese trovato</p>
              </div>}
          </div>
        </div>

        {/* Streets Management */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
          {selectedLocationData ? <>
              <div className="p-6 border-b border-slate-200 bg-gradient-to-r from-orange-50 to-orange-100">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">{selectedLocationData.paese}</h3>
                    <p className="text-sm text-slate-600 mt-1">
                      {selectedLocationData.vie.length} vie configurate
                    </p>
                  </div>
                  <div className="flex space-x-2">
                    <button onClick={() => {
                  setEditingLocationName(selectedLocationData.paese);
                  setShowEditLocationModal(true);
                }} className="flex items-center space-x-2 px-3 py-2 bg-white text-slate-600 rounded-lg text-sm font-medium hover:bg-slate-50 border border-slate-200">
                      <Edit2 className="w-4 h-4" />
                      <span>Rinomina</span>
                    </button>
                    <button onClick={() => setShowAddStreetModal(true)} className="flex items-center space-x-2 bg-orange-600 text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-orange-700">
                      <Plus className="w-4 h-4" />
                      <span>Aggiungi Via</span>
                    </button>
                  </div>
                </div>
              </div>

              <div className="p-6">
                {selectedLocationData.vie.length > 0 ? <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {selectedLocationData.vie.map(via => <div key={via} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200 hover:border-orange-200 transition-colors">
                        <span className="text-sm font-medium text-slate-900">{via}</span>
                        <button onClick={() => handleDeleteStreet(selectedLocationData.paese, via)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>)}
                  </div> : <div className="text-center py-12 text-slate-400">
                    <MapPin className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p className="text-sm">Nessuna via configurata</p>
                    <button onClick={() => setShowAddStreetModal(true)} className="mt-4 text-sm text-orange-600 hover:text-orange-700 font-medium">
                      Aggiungi la prima via
                    </button>
                  </div>}
              </div>
            </> : <div className="flex items-center justify-center h-full min-h-[400px] text-slate-400">
              <div className="text-center">
                <MapPin className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p className="text-sm">Seleziona un paese per gestire le vie</p>
              </div>
            </div>}
        </div>
      </div>

      {/* Add Location Modal */}
      {showAddLocationModal && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden">
            <div className="flex justify-between items-center px-6 py-4 border-b border-slate-100 bg-slate-50/50">
              <h3 className="text-lg font-bold text-slate-900">Aggiungi Nuovo Paese</h3>
              <button onClick={() => setShowAddLocationModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6">
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Nome Paese *
              </label>
              <input type="text" value={newLocationName} onChange={e => setNewLocationName(e.target.value)} autoComplete="off" placeholder="es. Castelfranco" className="w-full px-4 py-3 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none" onKeyDown={e => e.key === 'Enter' && handleAddLocation()} />
            </div>

            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end space-x-3">
              <button onClick={() => setShowAddLocationModal(false)} className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 hover:bg-white rounded-lg transition-colors border border-transparent hover:border-slate-200">
                Annulla
              </button>
              <button onClick={handleAddLocation} className="px-4 py-2 text-sm font-medium text-white bg-orange-600 hover:bg-orange-700 rounded-lg shadow-sm">
                Aggiungi
              </button>
            </div>
          </div>
        </div>}

      {/* Edit Location Modal */}
      {showEditLocationModal && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden">
            <div className="flex justify-between items-center px-6 py-4 border-b border-slate-100 bg-slate-50/50">
              <h3 className="text-lg font-bold text-slate-900">Rinomina Paese</h3>
              <button onClick={() => setShowEditLocationModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6">
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Nuovo Nome *
              </label>
              <input type="text" value={editingLocationName} onChange={e => setEditingLocationName(e.target.value)} autoComplete="off" className="w-full px-4 py-3 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none" onKeyDown={e => e.key === 'Enter' && handleEditLocationName()} />
            </div>

            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end space-x-3">
              <button onClick={() => setShowEditLocationModal(false)} className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 hover:bg-white rounded-lg transition-colors border border-transparent hover:border-slate-200">
                Annulla
              </button>
              <button onClick={handleEditLocationName} className="px-4 py-2 text-sm font-medium text-white bg-orange-600 hover:bg-orange-700 rounded-lg shadow-sm">
                Salva
              </button>
            </div>
          </div>
        </div>}

      {/* Add Street Modal */}
      {showAddStreetModal && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden">
            <div className="flex justify-between items-center px-6 py-4 border-b border-slate-100 bg-slate-50/50">
              <h3 className="text-lg font-bold text-slate-900">
                Aggiungi Via a {selectedLocationData?.paese}
              </h3>
              <button onClick={() => setShowAddStreetModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6">
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Nome Via *
              </label>
              <input type="text" value={newStreetName} onChange={e => setNewStreetName(e.target.value)} autoComplete="off" placeholder="es. Via Roma" className="w-full px-4 py-3 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none" onKeyDown={e => e.key === 'Enter' && handleAddStreet()} />
            </div>

            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end space-x-3">
              <button onClick={() => setShowAddStreetModal(false)} className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 hover:bg-white rounded-lg transition-colors border border-transparent hover:border-slate-200">
                Annulla
              </button>
              <button onClick={handleAddStreet} className="px-4 py-2 text-sm font-medium text-white bg-orange-600 hover:bg-orange-700 rounded-lg shadow-sm">
                Aggiungi
              </button>
            </div>
          </div>
        </div>}
    </div>;
};