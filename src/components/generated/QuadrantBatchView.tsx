"use client";

import React, { useState } from 'react';
import { Clock, MapPin, Bike, Package, AlertCircle, CheckCircle, Info, Plus, Trash2, Edit2, X, Users, ChevronDown, ChevronUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Quadrant } from './QuadrantTypes';
interface Order {
  id: string;
  customer: {
    name: string;
    address: string;
    street: string;
  };
  items: any[];
  slot: string;
  quadrante_id?: number;
  batch_id?: string;
  status: string;
  total: number;
}
interface Batch {
  id: string;
  slot: string;
  quadrante_id: number;
  fattorino_id?: string | null;
  orders: string[];
  status: 'pending' | 'assigned' | 'in_progress' | 'completed';
}
interface Fattorino {
  id: string;
  name: string;
  status: 'available' | 'en_route' | 'delivering' | 'offline';
}
interface QuadrantBatchViewProps {
  quadrants: Quadrant[];
  orders: Order[];
  batches: Batch[];
  fattorini: Fattorino[];
  selectedSlot: string;
  onSlotChange: (slot: string) => void;
  onUpdateBatch?: (batchId: string, updates: Partial<Batch>) => void;
  onCreateBatch?: (batch: Omit<Batch, 'id'>) => void;
  onDeleteBatch?: (batchId: string) => void;
  onAssignOrderToBatch?: (orderId: string, batchId: string) => void;
  onRemoveOrderFromBatch?: (orderId: string) => void;
}
export const QuadrantBatchView: React.FC<QuadrantBatchViewProps> = ({
  quadrants,
  orders,
  batches,
  fattorini,
  selectedSlot,
  onSlotChange,
  onUpdateBatch,
  onCreateBatch,
  onDeleteBatch,
  onAssignOrderToBatch,
  onRemoveOrderFromBatch
}) => {
  const [expandedBatches, setExpandedBatches] = useState<Set<string>>(new Set());
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedBatch, setSelectedBatch] = useState<Batch | null>(null);
  const [showCreateBatchModal, setShowCreateBatchModal] = useState(false);
  const [newBatchQuadrant, setNewBatchQuadrant] = useState<number | null>(null);

  // Filter data for selected slot
  const ordersInSlot = orders.filter(o => o.slot === selectedSlot);
  const batchesInSlot = batches.filter(b => b.slot === selectedSlot);

  // Unassigned orders
  const unassignedOrders = ordersInSlot.filter(o => !o.batch_id);

  // Toggle batch expansion
  const toggleBatch = (batchId: string) => {
    const newExpanded = new Set(expandedBatches);
    if (newExpanded.has(batchId)) {
      newExpanded.delete(batchId);
    } else {
      newExpanded.add(batchId);
    }
    setExpandedBatches(newExpanded);
  };

  // Handle rider assignment
  const handleAssignRider = (batchId: string, riderId: string) => {
    onUpdateBatch?.(batchId, {
      fattorino_id: riderId,
      status: 'assigned'
    });
    setShowAssignModal(false);
    setSelectedBatch(null);
  };

  // Statistics
  const totalOrders = ordersInSlot.length;
  const assignedOrders = ordersInSlot.filter(o => o.batch_id).length;
  const activeBatches = batchesInSlot.filter(b => b.status !== 'completed').length;
  const availableRiders = fattorini.filter(f => f.status === 'available');
  return <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header with Slot Selector */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200 p-6">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Gestione Batch e Fattorini</h2>
            <p className="text-sm text-slate-600">
              Organizza gli ordini in batch e assegna i fattorini per una consegna efficiente
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <Clock className="w-5 h-5 text-blue-600" />
            <select value={selectedSlot} onChange={e => onSlotChange(e.target.value)} className="bg-white border-2 border-blue-300 text-slate-700 font-medium rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 px-4 py-2">
              <option value="18:00-18:15">18:00-18:15</option>
              <option value="18:15-18:30">18:15-18:30</option>
              <option value="18:30-18:45">18:30-18:45</option>
              <option value="18:45-19:00">18:45-19:00</option>
              <option value="19:00-19:15">19:00-19:15</option>
              <option value="19:15-19:30">19:15-19:30</option>
              <option value="19:30-19:45">19:30-19:45</option>
              <option value="19:45-20:00">19:45-20:00</option>
              <option value="20:00-20:15">20:00-20:15</option>
              <option value="20:15-20:30">20:15-20:30</option>
              <option value="20:30-20:45">20:30-20:45</option>
              <option value="20:45-21:00">20:45-21:00</option>
              <option value="21:00-21:15">21:00-21:15</option>
              <option value="21:15-21:30">21:15-21:30</option>
              <option value="21:30-21:45">21:30-21:45</option>
            </select>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <div className="flex items-center space-x-2 mb-2">
              <Package className="w-4 h-4 text-blue-600" />
              <span className="text-xs font-semibold text-slate-500 uppercase">Ordini</span>
            </div>
            <div className="text-2xl font-bold text-slate-900">{totalOrders}</div>
          </div>

          <div className="bg-white rounded-lg p-4 shadow-sm">
            <div className="flex items-center space-x-2 mb-2">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <span className="text-xs font-semibold text-slate-500 uppercase">Assegnati</span>
            </div>
            <div className="text-2xl font-bold text-green-600">{assignedOrders}</div>
          </div>

          <div className="bg-white rounded-lg p-4 shadow-sm">
            <div className="flex items-center space-x-2 mb-2">
              <AlertCircle className="w-4 h-4 text-amber-600" />
              <span className="text-xs font-semibold text-slate-500 uppercase">In Attesa</span>
            </div>
            <div className="text-2xl font-bold text-amber-600">{unassignedOrders.length}</div>
          </div>

          <div className="bg-white rounded-lg p-4 shadow-sm">
            <div className="flex items-center space-x-2 mb-2">
              <Bike className="w-4 h-4 text-orange-600" />
              <span className="text-xs font-semibold text-slate-500 uppercase">Fattorini</span>
            </div>
            <div className="text-2xl font-bold text-orange-600">
              {availableRiders.length}/{fattorini.length}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left Column - Unassigned Orders */}
        <div className="lg:col-span-1 bg-white rounded-xl border-2 border-dashed border-slate-300 p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-slate-900 flex items-center">
              <AlertCircle className="w-5 h-5 mr-2 text-amber-600" />
              Non Assegnati
            </h3>
            <span className="bg-amber-100 text-amber-800 px-2 py-1 rounded-full text-xs font-bold">
              {unassignedOrders.length}
            </span>
          </div>

          <div className="space-y-2 max-h-[calc(100vh-24rem)] overflow-y-auto pr-2">
            {unassignedOrders.length === 0 ? <div className="text-center py-12 text-slate-400">
                <Package className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p className="text-sm">Tutti gli ordini sono assegnati!</p>
              </div> : unassignedOrders.map(order => {
            const quadrant = quadrants.find(q => q.id === order.quadrante_id);
            return <motion.div key={order.id} initial={{
              opacity: 0,
              scale: 0.95
            }} animate={{
              opacity: 1,
              scale: 1
            }} className="bg-slate-50 border border-slate-200 rounded-lg p-3 hover:shadow-md transition-all cursor-grab active:cursor-grabbing">
                    <div className="flex justify-between items-start mb-2">
                      <span className="font-mono text-xs text-slate-500 font-medium">{order.id}</span>
                      {quadrant && <span className="text-xs px-2 py-0.5 rounded text-white font-medium" style={{
                  backgroundColor: quadrant.colore
                }}>
                          {quadrant.nome}
                        </span>}
                    </div>
                    <div className="text-sm font-medium text-slate-900 mb-1">{order.customer.name}</div>
                    <div className="text-xs text-slate-600 mb-2 truncate">{order.customer.address}</div>
                    <div className="flex justify-between items-center text-xs text-slate-500">
                      <span>{order.items.length} prodotti</span>
                      <span className="font-medium text-slate-900">€{order.total.toFixed(2)}</span>
                    </div>
                  </motion.div>;
          })}
          </div>
        </div>

        {/* Middle/Right Columns - Batches by Quadrant */}
        <div className="lg:col-span-3">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {quadrants.map(quadrant => {
            const quadrantBatches = batchesInSlot.filter(b => b.quadrante_id === quadrant.id);
            const quadrantOrders = ordersInSlot.filter(o => o.quadrante_id === quadrant.id);
            return <div key={quadrant.id} className="bg-white rounded-xl border-2 overflow-hidden" style={{
              borderTopColor: quadrant.colore,
              borderTopWidth: '4px'
            }}>
                  {/* Quadrant Header */}
                  <div className="p-4 bg-slate-50 border-b border-slate-200">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="text-lg font-bold text-slate-900">{quadrant.nome}</h4>
                        <div className="flex items-center space-x-2 text-xs text-slate-500 mt-1">
                          <MapPin className="w-3 h-3" />
                          <span>{quadrantOrders.length} ordini</span>
                        </div>
                      </div>
                      <div className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold shadow-md" style={{
                    backgroundColor: quadrant.colore
                  }}>
                        {quadrantBatches.length}
                      </div>
                    </div>
                  </div>

                  {/* Batches List */}
                  <div className="p-4 space-y-3 max-h-[calc(100vh-28rem)] overflow-y-auto">
                    {quadrantBatches.length === 0 ? <div className="text-center py-8 text-slate-400">
                        <Package className="w-8 h-8 mx-auto mb-2 opacity-50" />
                        <p className="text-xs">Nessun batch</p>
                      </div> : quadrantBatches.map(batch => {
                  const batchOrders = ordersInSlot.filter(o => o.batch_id === batch.id);
                  const rider = fattorini.find(f => f.id === batch.fattorino_id);
                  const isExpanded = expandedBatches.has(batch.id);
                  const totalAmount = batchOrders.reduce((sum, o) => sum + o.total, 0);
                  return <motion.div key={batch.id} layout className="bg-slate-50 border-2 border-slate-200 rounded-xl overflow-hidden hover:shadow-lg transition-all">
                            {/* Batch Header */}
                            <div className="p-3 bg-white border-b border-slate-200">
                              <div className="flex justify-between items-center mb-2">
                                <div className="flex items-center space-x-2">
                                  <span className="font-mono text-xs text-slate-500 font-medium">
                                    {batch.id}
                                  </span>
                                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${batch.status === 'completed' ? 'bg-green-100 text-green-700' : batch.status === 'in_progress' ? 'bg-blue-100 text-blue-700' : batch.status === 'assigned' ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-700'}`}>
                                    {batch.status === 'completed' ? 'Completato' : batch.status === 'in_progress' ? 'In corso' : batch.status === 'assigned' ? 'Assegnato' : 'Pending'}
                                  </span>
                                </div>
                                <button onClick={() => toggleBatch(batch.id)} className="p-1 hover:bg-slate-100 rounded-md transition-colors">
                                  {isExpanded ? <ChevronUp className="w-4 h-4 text-slate-600" /> : <ChevronDown className="w-4 h-4 text-slate-600" />}
                                </button>
                              </div>

                              {/* Rider Assignment */}
                              <div className="flex items-center justify-between">
                                {rider ? <div className="flex items-center space-x-2 flex-1">
                                    <Bike className="w-4 h-4 text-green-600" />
                                    <span className="text-sm font-medium text-green-700">{rider.name}</span>
                                  </div> : <button onClick={() => {
                          setSelectedBatch(batch);
                          setShowAssignModal(true);
                        }} className="flex items-center space-x-1 text-xs text-blue-600 hover:text-blue-700 font-medium">
                                    <Users className="w-3 h-3" />
                                    <span>Assegna Fattorino</span>
                                  </button>}
                                <button onClick={() => {
                          setSelectedBatch(batch);
                          setShowAssignModal(true);
                        }} className="p-1.5 hover:bg-blue-50 rounded-md transition-colors" title="Cambia fattorino">
                                  <Edit2 className="w-3 h-3 text-blue-600" />
                                </button>
                              </div>

                              {/* Quick Stats */}
                              <div className="mt-2 flex items-center justify-between text-xs text-slate-600">
                                <span>{batchOrders.length}/3 ordini</span>
                                <span className="font-medium">€{totalAmount.toFixed(2)}</span>
                              </div>
                              
                              {/* Progress Bar */}
                              <div className="mt-2 w-full bg-slate-200 rounded-full h-1.5">
                                <div className={`h-1.5 rounded-full transition-all ${batchOrders.length >= 3 ? 'bg-green-500' : 'bg-blue-500'}`} style={{
                          width: `${batchOrders.length / 3 * 100}%`
                        }} />
                              </div>
                            </div>

                            {/* Expanded Content - Orders List */}
                            <AnimatePresence>
                              {isExpanded && <motion.div initial={{
                        height: 0,
                        opacity: 0
                      }} animate={{
                        height: 'auto',
                        opacity: 1
                      }} exit={{
                        height: 0,
                        opacity: 0
                      }} transition={{
                        duration: 0.2
                      }} className="overflow-hidden">
                                  <div className="p-3 space-y-2 bg-slate-50">
                                    {batchOrders.length === 0 ? <p className="text-xs text-slate-400 text-center py-2">
                                        Nessun ordine assegnato
                                      </p> : batchOrders.map(order => <div key={order.id} className="bg-white border border-slate-200 rounded-lg p-2 hover:shadow-sm transition-all">
                                          <div className="flex justify-between items-start mb-1">
                                            <span className="font-mono text-xs text-slate-500 font-medium">
                                              {order.id}
                                            </span>
                                            <button onClick={() => onRemoveOrderFromBatch?.(order.id)} className="p-1 hover:bg-red-50 rounded-md transition-colors" title="Rimuovi dal batch">
                                              <X className="w-3 h-3 text-red-500" />
                                            </button>
                                          </div>
                                          <div className="text-sm font-medium text-slate-900">
                                            {order.customer.name}
                                          </div>
                                          <div className="text-xs text-slate-600 truncate">
                                            {order.customer.address}
                                          </div>
                                          <div className="flex justify-between items-center mt-1 text-xs text-slate-500">
                                            <span>{order.items.length} prodotti</span>
                                            <span className="font-medium text-slate-900">
                                              €{order.total.toFixed(2)}
                                            </span>
                                          </div>
                                        </div>)}

                                    {/* Add Order Button */}
                                    {batchOrders.length < 3 && <button className="w-full py-2 border-2 border-dashed border-slate-300 rounded-lg text-xs text-slate-500 hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50 transition-all">
                                        <Plus className="w-3 h-3 inline mr-1" />
                                        Aggiungi Ordine
                                      </button>}
                                  </div>

                                  {/* Batch Actions */}
                                  <div className="p-3 bg-white border-t border-slate-200 flex space-x-2">
                                    <button onClick={() => onDeleteBatch?.(batch.id)} className="flex-1 py-1.5 text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors">
                                      <Trash2 className="w-3 h-3 inline mr-1" />
                                      Elimina Batch
                                    </button>
                                  </div>
                                </motion.div>}
                            </AnimatePresence>
                          </motion.div>;
                })}

                    {/* Create Batch Button */}
                    <button onClick={() => {
                  setNewBatchQuadrant(quadrant.id);
                  setShowCreateBatchModal(true);
                }} className="w-full py-4 border-2 border-dashed border-slate-300 rounded-xl text-sm text-slate-500 hover:border-orange-400 hover:text-orange-600 hover:bg-orange-50 transition-all font-medium">
                      <Plus className="w-4 h-4 inline mr-2" />
                      Crea Nuovo Batch
                    </button>
                  </div>
                </div>;
          })}
          </div>
        </div>
      </div>

      {/* Create Batch Modal */}
      {showCreateBatchModal && newBatchQuadrant !== null && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <motion.div initial={{
        opacity: 0,
        scale: 0.95
      }} animate={{
        opacity: 1,
        scale: 1
      }} className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden">
            <div className="flex justify-between items-center px-6 py-4 border-b border-slate-100 bg-slate-50">
              <h3 className="text-lg font-bold text-slate-900">Crea Nuovo Batch</h3>
              <button onClick={() => {
            setShowCreateBatchModal(false);
            setNewBatchQuadrant(null);
          }} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-2">
                  Quadrante
                </label>
                <div className="px-4 py-3 bg-slate-50 rounded-lg border border-slate-200">
                  <span className="font-medium text-slate-900">
                    {quadrants.find(q => q.id === newBatchQuadrant)?.nome || 'Quadrante'}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-2">
                  Slot
                </label>
                <div className="px-4 py-3 bg-slate-50 rounded-lg border border-slate-200">
                  <span className="font-medium text-slate-900">{selectedSlot}</span>
                </div>
              </div>

              <div className="flex space-x-3 pt-4">
                <button onClick={() => {
              setShowCreateBatchModal(false);
              setNewBatchQuadrant(null);
            }} className="flex-1 px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-50 rounded-lg transition-colors border border-slate-200">
                  Annulla
                </button>
                <button onClick={() => {
              if (onCreateBatch && newBatchQuadrant !== null) {
                onCreateBatch({
                  slot: selectedSlot,
                  quadrante_id: newBatchQuadrant,
                  orders: [],
                  status: 'pending'
                });
                setShowCreateBatchModal(false);
                setNewBatchQuadrant(null);
              }
            }} className="flex-1 px-4 py-2 text-sm font-medium text-white bg-orange-600 hover:bg-orange-700 rounded-lg shadow-sm">
                  Crea Batch
                </button>
              </div>
            </div>
          </motion.div>
        </div>}

      {/* Rider Assignment Modal */}
      {showAssignModal && selectedBatch && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <motion.div initial={{
        opacity: 0,
        scale: 0.95
      }} animate={{
        opacity: 1,
        scale: 1
      }} className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden">
            <div className="flex justify-between items-center px-6 py-4 border-b border-slate-100 bg-slate-50">
              <h3 className="text-lg font-bold text-slate-900">Assegna Fattorino</h3>
              <button onClick={() => {
            setShowAssignModal(false);
            setSelectedBatch(null);
          }} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-3 max-h-[60vh] overflow-y-auto">
              {fattorini.map(rider => {
            const isAssigned = selectedBatch.fattorino_id === rider.id;
            const riderBatches = batchesInSlot.filter(b => b.fattorino_id === rider.id && b.id !== selectedBatch.id);
            return <button key={rider.id} onClick={() => handleAssignRider(selectedBatch.id, rider.id)} className={`w-full p-4 rounded-xl border-2 transition-all text-left ${isAssigned ? 'border-orange-600 bg-orange-50' : 'border-slate-200 bg-white hover:border-orange-300'}`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="relative">
                          <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center">
                            <Bike className="w-5 h-5 text-slate-600" />
                          </div>
                          <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${rider.status === 'available' ? 'bg-green-500' : rider.status === 'en_route' ? 'bg-blue-500' : 'bg-slate-400'}`} />
                        </div>
                        <div>
                          <div className={`font-medium ${isAssigned ? 'text-orange-600' : 'text-slate-900'}`}>
                            {rider.name}
                          </div>
                          <div className="text-xs text-slate-500">
                            {riderBatches.length} batch assegnati
                          </div>
                        </div>
                      </div>
                      {isAssigned && <div className="w-6 h-6 bg-orange-600 rounded-full flex items-center justify-center">
                          <CheckCircle className="w-4 h-4 text-white" />
                        </div>}
                    </div>
                  </button>;
          })}
            </div>
          </motion.div>
        </div>}
    </div>;
};