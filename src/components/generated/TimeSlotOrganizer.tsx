"use client";

import React, { useState } from 'react';
import { Clock, Package, Bike, AlertCircle, ChevronDown, ChevronUp, MapPin, User, Phone, CheckCircle, TrendingUp, Filter } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getApiUrl } from '../../../shared/config/api';
interface Order {
  id: string;
  customer: {
    name: string;
    phone: string;
    address: string;
    street: string;
  };
  items: any[];
  status: string;
  total: number;
  slot: string;
  quadrante_id?: number;
  batch_id?: string;
  batchId?: string;
  riderId?: string;
}
interface Batch {
  id: string;
  slot: string;
  quadrante_id: number;
  fattorino_id?: string | null;
  orders: string[];
  status: 'pending' | 'assigned' | 'in_progress' | 'completed';
}
interface Rider {
  id: string;
  name: string;
  status: 'available' | 'en_route' | 'delivering' | 'offline';
}
interface Quadrant {
  id: number;
  nome: string;
  colore?: string;
}
interface TimeSlotData {
  slot: string;
  orders: Order[];
  batches: Batch[];
  assignedRiders: string[];
  capacity: {
    total: number;
    used: number;
    available: number;
  };
}
interface TimeSlotOrganizerProps {
  orders: Order[];
  batches: Batch[];
  riders: Rider[];
  quadrants: Quadrant[];
  onDeleteOrder?: (orderId: string) => void;
  onEditOrder?: (order: Order) => void;
  onAssignRider?: (orderId: string, riderId: string) => void;
}
export const TimeSlotOrganizer: React.FC<TimeSlotOrganizerProps> = ({
  orders,
  batches,
  riders,
  quadrants,
  onDeleteOrder,
  onEditOrder,
  onAssignRider
}) => {
  const [expandedSlots, setExpandedSlots] = useState<Set<string>>(new Set());
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'assigned'>('all');

  // Generate time slots (15-minute intervals from 18:00 to 22:00)
  const generateTimeSlots = (): string[] => {
    const slots: string[] = [];
    for (let hour = 18; hour <= 22; hour++) {
      for (let minute = 0; minute < 60; minute += 15) {
        if (hour === 22 && minute > 0) break;
        const startTime = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        const endMinute = minute + 15;
        const endHour = endMinute >= 60 ? hour + 1 : hour;
        const endTime = `${endHour.toString().padStart(2, '0')}:${(endMinute % 60).toString().padStart(2, '0')}`;
        slots.push(`${startTime}-${endTime}`);
      }
    }
    return slots;
  };
  const timeSlots = generateTimeSlots();

  // Organize data by time slot
  const organizeByTimeSlot = (): TimeSlotData[] => {
    return timeSlots.map(slot => {
      // Match orders by slot - support both "18:00" and "18:00-18:15" formats
      const slotStart = slot.split('-')[0]; // Extract start time from "18:00-18:15"
      const slotOrders = orders.filter(o => {
        if (!o.slot) return false;
        // Match exact slot or slot that starts with the same time
        return o.slot === slot || o.slot === slotStart || o.slot.startsWith(slotStart);
      });
      const slotBatches = batches.filter(b => {
        if (!b.slot) return false;
        return b.slot === slot || b.slot === slotStart || b.slot.startsWith(slotStart);
      });

      // Get unique assigned riders for this slot
      const assignedRiders = [...new Set(slotBatches.filter(b => b.fattorino_id).map(b => b.fattorino_id!))];

      // Calculate capacity (3 orders per rider)
      const totalCapacity = assignedRiders.length * 3;
      const usedCapacity = slotOrders.filter(o => o.batchId).length;
      const availableCapacity = Math.max(0, totalCapacity - usedCapacity);
      return {
        slot,
        orders: slotOrders,
        batches: slotBatches,
        assignedRiders,
        capacity: {
          total: totalCapacity,
          used: usedCapacity,
          available: availableCapacity
        }
      };
    });
  };
  const slotData = organizeByTimeSlot();

  // Filter slots based on status - show all slots, not just those with orders
  const filteredSlotData = slotData.filter(data => {
    if (filterStatus === 'all') return true; // Show all slots
    if (filterStatus === 'pending') return data.orders.some(o => !o.batchId);
    if (filterStatus === 'assigned') return data.orders.length > 0 && data.orders.every(o => o.batchId);
    return true;
  });
  const toggleSlot = (slot: string) => {
    const newExpanded = new Set(expandedSlots);
    if (newExpanded.has(slot)) {
      newExpanded.delete(slot);
    } else {
      newExpanded.add(slot);
    }
    setExpandedSlots(newExpanded);
  };
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'preparing':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'ready':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'out_for_delivery':
        return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      case 'delivered':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };
  const getCapacityColor = (percentage: number) => {
    if (percentage >= 90) return 'bg-red-500';
    if (percentage >= 70) return 'bg-amber-500';
    if (percentage >= 50) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  // Calculate overall statistics
  const totalOrders = orders.length;
  const assignedOrders = orders.filter(o => o.batchId).length;
  const pendingOrders = orders.filter(o => !o.batchId).length;
  const activeSlots = slotData.filter(d => d.orders.length > 0).length;
  return <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Organizzazione per Fasce Orarie</h2>
          <p className="text-sm text-slate-500 mt-1">
            Visualizzazione completa degli ordini, batch e fattorini per ogni fascia oraria
          </p>
        </div>
        
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2 bg-white border border-slate-200 rounded-lg px-3 py-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <select value={filterStatus} onChange={e => setFilterStatus(e.target.value as any)} className="text-sm text-slate-700 outline-none bg-transparent">
              <option value="all">Tutte le Fasce</option>
              <option value="pending">Con Ordini in Attesa</option>
              <option value="assigned">Tutti Assegnati</option>
            </select>
          </div>
        </div>
      </div>

      {/* Statistics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 border border-blue-200">
          <div className="flex items-center space-x-2 mb-2">
            <Clock className="w-5 h-5 text-blue-600" />
            <span className="text-xs font-semibold text-blue-600 uppercase">Fasce Attive</span>
          </div>
          <div className="text-3xl font-bold text-blue-900">{activeSlots}</div>
          <p className="text-xs text-blue-700 mt-1">con ordini</p>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4 border border-purple-200">
          <div className="flex items-center space-x-2 mb-2">
            <Package className="w-5 h-5 text-purple-600" />
            <span className="text-xs font-semibold text-purple-600 uppercase">Ordini Totali</span>
          </div>
          <div className="text-3xl font-bold text-purple-900">{totalOrders}</div>
          <p className="text-xs text-purple-700 mt-1">in tutte le fasce</p>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4 border border-green-200">
          <div className="flex items-center space-x-2 mb-2">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <span className="text-xs font-semibold text-green-600 uppercase">Assegnati</span>
          </div>
          <div className="text-3xl font-bold text-green-900">{assignedOrders}</div>
          <p className="text-xs text-green-700 mt-1">{totalOrders > 0 ? Math.round(assignedOrders / totalOrders * 100) : 0}% del totale</p>
        </div>

        <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-xl p-4 border border-amber-200">
          <div className="flex items-center space-x-2 mb-2">
            <AlertCircle className="w-5 h-5 text-amber-600" />
            <span className="text-xs font-semibold text-amber-600 uppercase">In Attesa</span>
          </div>
          <div className="text-3xl font-bold text-amber-900">{pendingOrders}</div>
          <p className="text-xs text-amber-700 mt-1">da assegnare</p>
        </div>
      </div>

      {/* Time Slot Cards */}
      <div className="space-y-3">
        {filteredSlotData.map(data => {
        const isExpanded = expandedSlots.has(data.slot);
        const capacityPercentage = data.capacity.total > 0 ? data.capacity.used / data.capacity.total * 100 : 0;
        const pendingOrdersCount = data.orders.filter(o => !o.batchId).length;
        return <motion.div key={data.slot} initial={{
          opacity: 0,
          y: 20
        }} animate={{
          opacity: 1,
          y: 0
        }} className="bg-white rounded-xl border-2 border-slate-200 overflow-hidden hover:shadow-lg transition-all">
              {/* Slot Header */}
              <button onClick={() => toggleSlot(data.slot)} className="w-full px-6 py-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-slate-900 text-white">
                    <Clock className="w-6 h-6" />
                  </div>
                  
                  <div className="text-left">
                    <div className="text-lg font-bold text-slate-900">{data.slot}</div>
                    <div className="text-sm text-slate-500">
                      {data.orders.length} ordini • {data.batches.length} batch • {data.assignedRiders.length} fattorini
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-6">
                  {/* Capacity Bar */}
                  <div className="flex items-center space-x-3">
                    <div className="text-right">
                      <div className="text-xs text-slate-500 mb-1">Capacità</div>
                      <div className="text-sm font-bold text-slate-900">
                        {data.capacity.used} / {data.capacity.total}
                      </div>
                    </div>
                    <div className="w-32 h-2 bg-slate-200 rounded-full overflow-hidden">
                      <div className={`h-full ${getCapacityColor(capacityPercentage)} transition-all`} style={{
                    width: `${Math.min(capacityPercentage, 100)}%`
                  }} />
                    </div>
                  </div>

                  {/* Status Indicators */}
                  <div className="flex items-center space-x-2">
                    {pendingOrdersCount > 0 && <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                        {pendingOrdersCount} in attesa
                      </span>}
                    {data.orders.length === data.orders.filter(o => o.batch_id).length && data.orders.length > 0 && <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Completo
                      </span>}
                  </div>

                  {isExpanded ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
                </div>
              </button>

              {/* Expanded Content */}
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
            }} className="border-t border-slate-200">
                    <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
                      {/* Orders Column */}
                      <div className="space-y-3">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="font-semibold text-slate-900 flex items-center">
                            <Package className="w-4 h-4 mr-2 text-blue-600" />
                            Ordini ({data.orders.length})
                          </h4>
                        </div>
                        
                        <div className="space-y-2 max-h-96 overflow-y-auto pr-2">
                          {data.orders.map(order => {
                      const quadrant = quadrants.find(q => q.id === order.quadrante_id);
                      return <div key={order.id} className={`p-3 rounded-lg border-2 ${order.batch_id ? 'border-green-200 bg-green-50' : 'border-amber-200 bg-amber-50'}`}>
                                <div className="flex items-start justify-between mb-2">
                                  <span className="font-mono text-xs font-bold text-slate-700">
                                    {order.id}
                                  </span>
                                  {quadrant && <span className="text-xs px-2 py-0.5 rounded-md text-white font-medium" style={{
                            backgroundColor: quadrant.colore
                          }}>
                                      {quadrant.nome}
                                    </span>}
                                </div>
                                
                                <div className="space-y-1 text-xs text-slate-600">
                                  <div className="flex items-center">
                                    <User className="w-3 h-3 mr-1" />
                                    <span className="font-medium">{order.customer.name}</span>
                                  </div>
                                  <div className="flex items-center">
                                    <MapPin className="w-3 h-3 mr-1" />
                                    <span>{order.customer.address}</span>
                                  </div>
                                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-200">
                                    <span className="font-medium">{order.items.length} prodotti</span>
                                    <span className="font-bold">€{order.total.toFixed(2)}</span>
                                  </div>
                                </div>
                                
                                {order.batch_id && <div className="mt-2 pt-2 border-t border-green-200">
                                    <span className="text-xs text-green-700 font-medium">
                                      Batch: {order.batch_id}
                                    </span>
                                  </div>}
                                
                                {order.riderId && <div className="mt-2 pt-2 border-t border-blue-200">
                                    <div className="flex items-center justify-between">
                                      <span className="text-xs text-blue-700 font-medium flex items-center">
                                        <Bike className="w-3 h-3 mr-1" />
                                        Fattorino: {riders.find(r => r.id === order.riderId)?.name || order.riderId}
                                      </span>
                                    </div>
                                  </div>}
                                
                                {!order.riderId && <div className="mt-2 pt-2 border-t border-amber-200">
                                    <div className="relative">
                                      <select
                                        onChange={async (e) => {
                                          const riderId = e.target.value;
                                          if (riderId && riderId !== '') {
                                            const availableRiders = riders.filter(r => r.status !== 'offline');
                                            if (availableRiders.find(r => r.id === riderId)) {
                                              if (onAssignRider) {
                                                await onAssignRider(order.id, riderId);
                                              } else {
                                                try {
                                                  const response = await fetch(`getApiUrl(`/orders/${order.id}/assign`)`, {
                                                    method: 'PATCH',
                                                    headers: { 'Content-Type': 'application/json' },
                                                    body: JSON.stringify({ riderId })
                                                  });
                                                  if (response.ok) {
                                                    // The WebSocket will update the UI automatically
                                                  }
                                                } catch (error) {
                                                  console.error('Errore nell\'assegnazione:', error);
                                                }
                                              }
                                            }
                                            // Reset select to placeholder
                                            e.target.value = '';
                                          }
                                        }}
                                        className="w-full text-xs text-amber-700 font-medium border border-amber-300 rounded-md px-2 py-1.5 bg-white hover:bg-amber-50 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                                        defaultValue=""
                                      >
                                        <option value="" disabled>Seleziona Fattorino</option>
                                        {riders.filter(r => r.status !== 'offline').map(rider => (
                                          <option key={rider.id} value={rider.id}>
                                            {rider.name}
                                          </option>
                                        ))}
                                      </select>
                                    </div>
                                  </div>}
                                
                                <div className="mt-2 pt-2 border-t border-slate-200 flex items-center justify-between">
                                  <div className="flex items-center space-x-2">
                                    {onEditOrder && (
                                      <button
                                        onClick={() => onEditOrder(order)}
                                        className="text-xs text-blue-700 font-medium hover:text-blue-800 underline flex items-center"
                                        title="Modifica Ordine"
                                      >
                                        <Edit2 className="w-3 h-3 mr-1" />
                                        Modifica
                                      </button>
                                    )}
                                    {onDeleteOrder && (
                                      <button
                                        onClick={() => {
                                          if (confirm('Sei sicuro di voler eliminare questo ordine?')) {
                                            onDeleteOrder(order.id);
                                          }
                                        }}
                                        className="text-xs text-red-700 font-medium hover:text-red-800 underline flex items-center"
                                        title="Elimina Ordine"
                                      >
                                        <Trash2 className="w-3 h-3 mr-1" />
                                        Elimina
                                      </button>
                                    )}
                                  </div>
                                </div>
                              </div>;
                    })}
                          
                          {data.orders.length === 0 && <div className="text-center py-8 text-slate-400 text-sm">
                              Nessun ordine in questa fascia
                            </div>}
                        </div>
                      </div>

                      {/* Batches Column */}
                      <div className="space-y-3">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="font-semibold text-slate-900 flex items-center">
                            <TrendingUp className="w-4 h-4 mr-2 text-purple-600" />
                            Batch ({data.batches.length})
                          </h4>
                        </div>
                        
                        <div className="space-y-2 max-h-96 overflow-y-auto pr-2">
                          {data.batches.map(batch => {
                      const batchOrders = data.orders.filter(o => o.batch_id === batch.id);
                      const quadrant = quadrants.find(q => q.id === batch.quadrante_id);
                      const rider = riders.find(r => r.id === batch.fattorino_id);
                      return <div key={batch.id} className="p-3 rounded-lg border-2 border-purple-200 bg-purple-50">
                                <div className="flex items-start justify-between mb-2">
                                  <span className="font-mono text-xs font-bold text-purple-700">
                                    {batch.id}
                                  </span>
                                  {quadrant && <span className="text-xs px-2 py-0.5 rounded-md text-white font-medium" style={{
                            backgroundColor: quadrant.colore
                          }}>
                                      {quadrant.nome}
                                    </span>}
                                </div>
                                
                                <div className="space-y-2">
                                  <div className="flex items-center justify-between text-xs">
                                    <span className="text-slate-600">Ordini</span>
                                    <span className="font-bold text-purple-900">
                                      {batchOrders.length}/3
                                    </span>
                                  </div>
                                  
                                  <div className="w-full bg-purple-200 rounded-full h-1.5">
                                    <div className="bg-purple-600 h-1.5 rounded-full transition-all" style={{
                              width: `${batchOrders.length / 3 * 100}%`
                            }} />
                                  </div>
                                  
                                  {rider && <div className="mt-2 pt-2 border-t border-purple-200 flex items-center text-xs text-purple-700">
                                      <Bike className="w-3 h-3 mr-1" />
                                      <span className="font-medium">{rider.name}</span>
                                    </div>}
                                  
                                  {!rider && <div className="mt-2 pt-2 border-t border-purple-200 text-xs text-amber-600 font-medium">
                                      <AlertCircle className="w-3 h-3 inline mr-1" />
                                      Fattorino non assegnato
                                    </div>}
                                </div>
                              </div>;
                    })}
                          
                          {data.batches.length === 0 && <div className="text-center py-8 text-slate-400 text-sm">
                              Nessun batch attivo
                            </div>}
                        </div>
                      </div>

                      {/* Riders Column */}
                      <div className="space-y-3">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="font-semibold text-slate-900 flex items-center">
                            <Bike className="w-4 h-4 mr-2 text-orange-600" />
                            Fattorini ({data.assignedRiders.length})
                          </h4>
                        </div>
                        
                        <div className="space-y-2 max-h-96 overflow-y-auto pr-2">
                          {data.assignedRiders.map(riderId => {
                      const rider = riders.find(r => r.id === riderId);
                      if (!rider) return null;
                      const riderBatches = data.batches.filter(b => b.fattorino_id === riderId);
                      const riderOrders = data.orders.filter(o => o.riderId === riderId);
                      return <div key={riderId} className="p-3 rounded-lg border-2 border-orange-200 bg-orange-50">
                                <div className="flex items-center justify-between mb-3">
                                  <div className="flex items-center space-x-2">
                                    <div className="w-8 h-8 rounded-full bg-orange-200 flex items-center justify-center">
                                      <Bike className="w-4 h-4 text-orange-700" />
                                    </div>
                                    <div>
                                      <div className="font-medium text-slate-900">{rider.name}</div>
                                      <div className="text-xs text-slate-500 capitalize">
                                        {rider.status.replace('_', ' ')}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                                
                                <div className="space-y-2 text-xs">
                                  <div className="flex items-center justify-between">
                                    <span className="text-slate-600">Batch assegnati</span>
                                    <span className="font-bold text-orange-900">
                                      {riderBatches.length}
                                    </span>
                                  </div>
                                  
                                  <div className="flex items-center justify-between">
                                    <span className="text-slate-600">Ordini totali</span>
                                    <span className="font-bold text-orange-900">
                                      {riderOrders.length}
                                    </span>
                                  </div>
                                  
                                  {riderBatches.length > 0 && <div className="mt-2 pt-2 border-t border-orange-200">
                                      <div className="text-xs text-orange-700 font-medium mb-1">
                                        Batch:
                                      </div>
                                      <div className="flex flex-wrap gap-1">
                                        {riderBatches.map(batch => <span key={batch.id} className="inline-block px-2 py-0.5 bg-orange-200 text-orange-800 rounded text-xs font-mono">
                                            {batch.id.split('-')[1]?.slice(0, 4)}
                                          </span>)}
                                      </div>
                                    </div>}
                                </div>
                              </div>;
                    })}
                          
                          {data.assignedRiders.length === 0 && <div className="text-center py-8 text-slate-400 text-sm">
                              Nessun fattorino assegnato
                            </div>}
                        </div>
                      </div>
                    </div>
                  </motion.div>}
              </AnimatePresence>
            </motion.div>;
      })}

        {filteredSlotData.length === 0 && <div className="text-center py-20 border-2 border-dashed border-slate-200 rounded-xl">
            <Clock className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-600 mb-2">
              Nessuna fascia oraria con ordini
            </h3>
            <p className="text-sm text-slate-400">
              Gli ordini appariranno qui una volta ricevuti
            </p>
          </div>}
      </div>
    </div>;
};