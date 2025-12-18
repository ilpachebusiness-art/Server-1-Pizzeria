"use client";

import React, { useState } from 'react';
import { Map, Plus, Edit2, Trash2, X, Save, MapPin, Link2, Palette } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Quadrant } from './QuadrantTypes';
import { getApiUrl } from '../../../shared/config/api';
interface Location {
  paese: string;
  vie: string[];
}

interface QuadrantManagementProps {
  quadrants: Quadrant[];
  onUpdateQuadrants: (quadrants: Quadrant[]) => void;
  locations?: Location[];
  slotCapacity?: any;
}
const QUADRANT_COLORS = ['#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'];
// Default slots fallback
const DEFAULT_AVAILABLE_SLOTS = ['18:00-18:15', '18:15-18:30', '18:30-18:45', '18:45-19:00', '19:00-19:15', '19:15-19:30', '19:30-19:45', '19:45-20:00', '20:00-20:15', '20:15-20:30', '20:30-20:45', '20:45-21:00', '21:00-21:15', '21:15-21:30', '21:30-21:45'];
export const QuadrantManagement: React.FC<QuadrantManagementProps> = ({
  quadrants,
  onUpdateQuadrants,
  locations = [],
  slotCapacity
}) => {
  // Extract all streets from locations
  const allStreets = locations.flatMap(loc => loc.vie || []);
  
  // Extract available slots from slotCapacity, or use default
  const availableSlots = slotCapacity?.slots && Array.isArray(slotCapacity.slots) && slotCapacity.slots.length > 0
    ? slotCapacity.slots.map((slot: any) => slot.time).filter((time: string) => time)
    : DEFAULT_AVAILABLE_SLOTS;
  const [showModal, setShowModal] = useState(false);
  const [editingQuadrant, setEditingQuadrant] = useState<Quadrant | null>(null);
  const [showAdjacencyModal, setShowAdjacencyModal] = useState(false);
  const [selectedQuadrantForAdjacency, setSelectedQuadrantForAdjacency] = useState<Quadrant | null>(null);
  const handleAddQuadrant = () => {
    setEditingQuadrant({
      id: Date.now(),
      nome: '',
      tipo_definizione: 'via_list',
      vie: [],
      geo_polygon: null,
      adiacenti: [],
      colore: QUADRANT_COLORS[quadrants.length % QUADRANT_COLORS.length],
      priority: 2,
      preferredSlots: []
    });
    setShowModal(true);
  };
  const handleEditQuadrant = (quadrant: Quadrant) => {
    setEditingQuadrant({
      ...quadrant
    });
    setShowModal(true);
  };
  const handleSaveQuadrant = async () => {
    if (!editingQuadrant || !editingQuadrant.nome) {
      alert('Inserisci un nome per il quadrante');
      return;
    }
    const existingIndex = quadrants.findIndex(q => q.id === editingQuadrant.id);
    let newQuadrants: Quadrant[];
    if (existingIndex >= 0) {
      newQuadrants = [...quadrants];
      newQuadrants[existingIndex] = editingQuadrant;
    } else {
      newQuadrants = [...quadrants, editingQuadrant];
    }
    
    // Save to server
    try {
      await fetch('getApiUrl('/quadrants')', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newQuadrants)
      });
    } catch (error) {
      console.error('Errore nel salvataggio dei quadranti:', error);
    }
    
    onUpdateQuadrants(newQuadrants);
    setShowModal(false);
    setEditingQuadrant(null);
  };
  const handleDeleteQuadrant = async (id: number) => {
    if (confirm('Sei sicuro di voler eliminare questo quadrante?')) {
      // Remove quadrant and clean up adjacency references
      const newQuadrants = quadrants.filter(q => q.id !== id).map(q => ({
        ...q,
        adiacenti: q.adiacenti ? q.adiacenti.filter(adjId => adjId !== id) : []
      }));
      
      // Save to server
      try {
        await fetch(`getApiUrl('/quadrants')/${id}`, {
          method: 'DELETE'
        });
      } catch (error) {
        console.error('Errore nell\'eliminazione del quadrante:', error);
      }
      
      onUpdateQuadrants(newQuadrants);
    }
  };
  const handleToggleStreet = (street: string) => {
    if (!editingQuadrant) return;
    const isSelected = editingQuadrant.vie.includes(street);
    const newVie = isSelected ? editingQuadrant.vie.filter(v => v !== street) : [...editingQuadrant.vie, street];
    setEditingQuadrant({
      ...editingQuadrant,
      vie: newVie
    });
  };
  const handleTogglePreferredSlot = (slot: string) => {
    if (!editingQuadrant) return;
    const currentSlots = editingQuadrant.preferredSlots || [];
    const isSelected = currentSlots.includes(slot);
    const newSlots = isSelected ? currentSlots.filter(s => s !== slot) : [...currentSlots, slot];
    setEditingQuadrant({
      ...editingQuadrant,
      preferredSlots: newSlots
    });
  };
  const handleManageAdjacency = (quadrant: Quadrant) => {
    setSelectedQuadrantForAdjacency({
      ...quadrant
    });
    setShowAdjacencyModal(true);
  };
  const handleToggleAdjacency = (adjacentId: number) => {
    if (!selectedQuadrantForAdjacency) return;
    const isAdjacent = selectedQuadrantForAdjacency.adiacenti.includes(adjacentId);
    const newAdiacenti = isAdjacent ? selectedQuadrantForAdjacency.adiacenti.filter(id => id !== adjacentId) : [...selectedQuadrantForAdjacency.adiacenti, adjacentId];
    setSelectedQuadrantForAdjacency({
      ...selectedQuadrantForAdjacency,
      adiacenti: newAdiacenti
    });
  };
  const handleSaveAdjacency = async () => {
    if (!selectedQuadrantForAdjacency) return;
    const newQuadrants = quadrants.map(q => q.id === selectedQuadrantForAdjacency.id ? selectedQuadrantForAdjacency : q);
    
    // Save to server
    try {
      await fetch('getApiUrl('/quadrants')', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newQuadrants)
      });
    } catch (error) {
      console.error('Errore nel salvataggio delle adiacenze:', error);
    }
    
    onUpdateQuadrants(newQuadrants);
    setShowAdjacencyModal(false);
    setSelectedQuadrantForAdjacency(null);
  };
  return <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Gestione Quadranti</h2>
          <p className="text-sm text-slate-500 mt-1">
            Suddividi il territorio in zone per ottimizzare le consegne
          </p>
        </div>
        <button onClick={handleAddQuadrant} className="flex items-center space-x-2 bg-orange-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-orange-700 shadow-sm shadow-orange-200">
          <Plus className="w-4 h-4" />
          <span>Nuovo Quadrante</span>
        </button>
      </div>

      {/* Info Card */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start space-x-3">
        <MapPin className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <h4 className="font-semibold text-blue-900 mb-1">Come funzionano i Quadranti</h4>
          <p className="text-sm text-blue-700 mb-2">
            I quadranti definiscono aree operative per ottimizzare le consegne. Ogni ordine
            viene automaticamente assegnato a un quadrante in base alla via.
          </p>
          <ul className="text-xs text-blue-600 space-y-1 list-disc list-inside">
            <li>Quadranti adiacenti condividono la capacità di consegna</li>
            <li>Massimo 3 ordini per fattorino per slot da 15 minuti</li>
            <li>Ogni fattorino gestisce 1 giro per slot</li>
          </ul>
        </div>
      </div>

      {/* Quadrants Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {quadrants.map(quadrant => <div key={quadrant.id} className="bg-white rounded-xl border-2 border-slate-200 overflow-hidden hover:shadow-lg transition-all" style={{
        borderTopColor: quadrant.colore || '#94a3b8',
        borderTopWidth: '4px'
      }}>
            {/* Header */}
            <div className="p-4 bg-slate-50 border-b border-slate-200">
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-bold text-slate-900 text-lg">{quadrant.nome}</h3>
                <div className="w-6 h-6 rounded-full border-2 border-white shadow-sm" style={{
              backgroundColor: quadrant.colore || '#94a3b8'
            }} />
              </div>
              <div className="flex items-center space-x-2 text-xs text-slate-500">
                <MapPin className="w-3 h-3" />
                <span>{quadrant.vie.length} vie assegnate</span>
              </div>
            </div>

            {/* Content */}
            <div className="p-4 space-y-3">
              {/* Streets Preview */}
              <div>
                <div className="text-xs font-semibold text-slate-500 uppercase mb-2">Vie</div>
                {quadrant.vie.length > 0 ? <div className="flex flex-wrap gap-1">
                    {quadrant.vie.slice(0, 3).map(via => <span key={via} className="inline-flex items-center px-2 py-0.5 rounded-md text-xs bg-slate-100 text-slate-700">
                        {via}
                      </span>)}
                    {quadrant.vie.length > 3 && <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs bg-slate-200 text-slate-600 font-medium">
                        +{quadrant.vie.length - 3} altre
                      </span>}
                  </div> : <p className="text-xs text-slate-400 italic">Nessuna via assegnata</p>}
              </div>

              {/* Adjacency Preview */}
              <div>
                <div className="text-xs font-semibold text-slate-500 uppercase mb-2">Adiacenze</div>
                {quadrant.adiacenti.length > 0 ? <div className="flex flex-wrap gap-1">
                    {quadrant.adiacenti.map(adjId => {
                const adjQuadrant = quadrants.find(q => q.id === adjId);
                return adjQuadrant ? <span key={adjId} className="inline-flex items-center px-2 py-0.5 rounded-md text-xs text-white" style={{
                  backgroundColor: adjQuadrant.colore || '#94a3b8'
                }}>
                          {adjQuadrant.nome}
                        </span> : null;
              })}
                  </div> : <p className="text-xs text-slate-400 italic">Nessuna adiacenza definita</p>}
              </div>
            </div>

            {/* Actions */}
            <div className="p-3 bg-slate-50 border-t border-slate-200 flex space-x-2">
              <button onClick={() => handleManageAdjacency(quadrant)} className="flex-1 flex items-center justify-center space-x-1 py-2 text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors">
                <Link2 className="w-3 h-3" />
                <span>Adiacenze</span>
              </button>
              <button onClick={() => handleEditQuadrant(quadrant)} className="flex-1 flex items-center justify-center space-x-1 py-2 text-xs font-medium text-slate-600 bg-white hover:bg-slate-100 rounded-lg transition-colors border border-slate-200">
                <Edit2 className="w-3 h-3" />
                <span>Modifica</span>
              </button>
              <button onClick={() => handleDeleteQuadrant(quadrant.id)} className="px-3 py-2 text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors">
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          </div>)}

        {/* Empty State */}
        {quadrants.length === 0 && <div className="col-span-full border-2 border-dashed border-slate-200 rounded-xl p-12 flex flex-col items-center justify-center text-center">
            <Map className="w-16 h-16 text-slate-300 mb-4" />
            <h3 className="text-lg font-semibold text-slate-600 mb-2">Nessun Quadrante Configurato</h3>
            <p className="text-sm text-slate-500 mb-4 max-w-md">
              Inizia creando il tuo primo quadrante per suddividere il territorio di consegna
            </p>
            <button onClick={handleAddQuadrant} className="flex items-center space-x-2 bg-orange-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-orange-700">
              <Plus className="w-4 h-4" />
              <span>Crea Primo Quadrante</span>
            </button>
          </div>}
      </div>

      {/* Edit Quadrant Modal */}
      <AnimatePresence>
        {showModal && editingQuadrant && <motion.div initial={{
        opacity: 0
      }} animate={{
        opacity: 1
      }} exit={{
        opacity: 0
      }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <motion.div initial={{
          scale: 0.95,
          opacity: 0
        }} animate={{
          scale: 1,
          opacity: 1
        }} exit={{
          scale: 0.95,
          opacity: 0
        }} className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
              {/* Modal Header */}
              <div className="flex justify-between items-center px-6 py-4 border-b border-slate-100 bg-slate-50/50">
                <h3 className="text-lg font-bold text-slate-900">
                  {editingQuadrant.id > 1000000 ? 'Nuovo Quadrante' : 'Modifica Quadrante'}
                </h3>
                <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Content */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {/* Name */}
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase mb-2">
                    Nome Quadrante *
                  </label>
                  <input type="text" value={editingQuadrant.nome} onChange={e => setEditingQuadrant({
                ...editingQuadrant,
                nome: e.target.value
              })} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none" placeholder="es. Centro Storico" />
                </div>

                {/* Priority */}
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase mb-2">
                    Priorità (1 = Principale)
                  </label>
                  <input type="number" min="1" max="10" value={editingQuadrant.priority || 2} onChange={e => setEditingQuadrant({
                ...editingQuadrant,
                priority: parseInt(e.target.value) || 2
              })} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none" />
                  <p className="text-[10px] text-slate-400 mt-1">
                    I quadranti con priorità 1 sono considerati principali.
                  </p>
                </div>

                {/* Preferred Slots */}
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase mb-2">
                    Fasce Orarie Preferite
                  </label>
                  <div className="border border-slate-200 rounded-lg p-3 max-h-40 overflow-y-auto space-y-1">
                    {availableSlots.map(slot => {
                  const isSelected = (editingQuadrant.preferredSlots || []).includes(slot);
                  return <button key={slot} onClick={() => handleTogglePreferredSlot(slot)} className={`w-full flex items-center justify-between p-2 rounded-lg text-xs transition-all ${isSelected ? 'bg-blue-50 border border-blue-500 text-blue-700' : 'bg-white border border-slate-100 text-slate-600 hover:bg-slate-50'}`}>
                          <span>{slot}</span>
                          {isSelected && <div className="w-2 h-2 rounded-full bg-blue-500" />}
                        </button>;
                })}
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1">
                    Seleziona gli orari ottimali per le consegne in questo quadrante.
                  </p>
                </div>

                {/* Color */}
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase mb-2">
                    Colore
                  </label>
                  <div className="flex space-x-2">
                    {QUADRANT_COLORS.map(color => <button key={color} onClick={() => setEditingQuadrant({
                  ...editingQuadrant,
                  colore: color
                })} className={`w-10 h-10 rounded-lg transition-all ${editingQuadrant.colore === color ? 'ring-2 ring-orange-500 ring-offset-2 scale-110' : 'hover:scale-105'}`} style={{
                  backgroundColor: color
                }} />)}
                  </div>
                </div>

                {/* Streets */}
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase mb-2">
                    Vie Assegnate ({editingQuadrant.vie.length})
                  </label>
                  <div className="border border-slate-200 rounded-lg p-3 max-h-64 overflow-y-auto space-y-2">
                    {allStreets.length === 0 ? <div className="text-center py-4 text-slate-400 text-sm">
                        Nessuna via disponibile. Aggiungi paesi e vie dalla sezione "Gestione Paesi e Vie".
                      </div> : allStreets.map(street => {
                  const isSelected = editingQuadrant.vie.includes(street);
                  const isUsedByOther = quadrants.some(q => q.id !== editingQuadrant.id && q.vie.includes(street));
                  return <button key={street} onClick={() => !isUsedByOther && handleToggleStreet(street)} disabled={isUsedByOther} className={`w-full flex items-center justify-between p-2 rounded-lg text-sm transition-all ${isSelected ? 'bg-orange-50 border-2 border-orange-500' : isUsedByOther ? 'bg-slate-50 border border-slate-200 opacity-50 cursor-not-allowed' : 'bg-white border border-slate-200 hover:border-slate-300'}`}>
                          <span className={isSelected ? 'font-medium text-orange-600' : isUsedByOther ? 'text-slate-400' : 'text-slate-700'}>
                            {street}
                          </span>
                          {isUsedByOther && <span className="text-xs text-slate-400 italic">Già assegnata</span>}
                          {isSelected && <div className="w-5 h-5 rounded-md bg-orange-500 flex items-center justify-center">
                              <svg className="w-3 h-3 text-white" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                                <path d="M5 13l4 4L19 7" />
                              </svg>
                            </div>}
                        </button>;
                })}
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end space-x-3">
                <button onClick={() => setShowModal(false)} className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 hover:bg-white rounded-lg transition-colors border border-transparent hover:border-slate-200">
                  Annulla
                </button>
                <button onClick={handleSaveQuadrant} className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-white bg-orange-600 hover:bg-orange-700 rounded-lg shadow-sm">
                  <Save className="w-4 h-4" />
                  <span>Salva</span>
                </button>
              </div>
            </motion.div>
          </motion.div>}
      </AnimatePresence>

      {/* Adjacency Modal */}
      <AnimatePresence>
        {showAdjacencyModal && selectedQuadrantForAdjacency && <motion.div initial={{
        opacity: 0
      }} animate={{
        opacity: 1
      }} exit={{
        opacity: 0
      }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <motion.div initial={{
          scale: 0.95,
          opacity: 0
        }} animate={{
          scale: 1,
          opacity: 1
        }} exit={{
          scale: 0.95,
          opacity: 0
        }} className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden">
              {/* Modal Header */}
              <div className="flex justify-between items-center px-6 py-4 border-b border-slate-100 bg-slate-50/50">
                <h3 className="text-lg font-bold text-slate-900">
                  Adiacenze: {selectedQuadrantForAdjacency.nome}
                </h3>
                <button onClick={() => setShowAdjacencyModal(false)} className="text-slate-400 hover:text-slate-600">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Content */}
              <div className="p-6 space-y-4">
                <p className="text-sm text-slate-600">
                  Seleziona i quadranti adiacenti a "{selectedQuadrantForAdjacency.nome}". Gli ordini
                  possono essere raggruppati tra quadranti adiacenti per ottimizzare le consegne.
                </p>

                <div className="space-y-2">
                  {quadrants.filter(q => q.id !== selectedQuadrantForAdjacency.id).map(quadrant => {
                const isAdjacent = selectedQuadrantForAdjacency.adiacenti.includes(quadrant.id);
                return <button key={quadrant.id} onClick={() => handleToggleAdjacency(quadrant.id)} className={`w-full flex items-center justify-between p-3 rounded-lg transition-all ${isAdjacent ? 'bg-orange-50 border-2 border-orange-500' : 'bg-white border-2 border-slate-200 hover:border-slate-300'}`}>
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 rounded-lg" style={{
                      backgroundColor: quadrant.colore || '#94a3b8'
                    }} />
                            <div className="text-left">
                              <div className={`font-medium ${isAdjacent ? 'text-orange-600' : 'text-slate-900'}`}>
                                {quadrant.nome}
                              </div>
                              <div className="text-xs text-slate-500">
                                {quadrant.vie.length} vie
                              </div>
                            </div>
                          </div>
                          {isAdjacent && <div className="w-6 h-6 rounded-md bg-orange-500 flex items-center justify-center">
                              <svg className="w-4 h-4 text-white" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                                <path d="M5 13l4 4L19 7" />
                              </svg>
                            </div>}
                        </button>;
              })}
                </div>
              </div>

              {/* Modal Footer */}
              <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end space-x-3">
                <button onClick={() => setShowAdjacencyModal(false)} className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 hover:bg-white rounded-lg transition-colors border border-transparent hover:border-slate-200">
                  Annulla
                </button>
                <button onClick={handleSaveAdjacency} className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-white bg-orange-600 hover:bg-orange-700 rounded-lg shadow-sm">
                  <Save className="w-4 h-4" />
                  <span>Salva Adiacenze</span>
                </button>
              </div>
            </motion.div>
          </motion.div>}
      </AnimatePresence>
    </div>;
};